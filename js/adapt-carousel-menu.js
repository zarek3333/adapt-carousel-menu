define([
    "core/js/views/menuView",
    "core/js/adapt",
    "./adapt-carousel-menuItemView",
    "./adapt-carousel-menuItemIndicatorView"
], function(MenuView, Adapt, CarouselMenuItemView, CarouselMenuItemIndicatorView) {

    var CarouselMenuView = MenuView.extend({

        attributes: function() {
            return _.extend(MenuView.prototype.attributes.call(this), {
                "data-item-count": this.model.getAvailableChildModels().length
            });
        },

        className: function() {
            return MenuView.prototype.className.call(this) + " carousel-menu";
        },

        events: {
            "click .carousel-menu-item-control": "onControlClick"
        },

        postRender: function() {
            var item = this.getNextIncompleteItem();

            this.listenTo(Adapt, {
                "carouselMenu:setItem": this.setItem,
                "menuView:ready": this.onReady
            });

            this.setUpItems();
            this.setItem(item.id, item.index);
        },

        setItem: function(id, index) {
            this.model.set("_coverId", id);
            Adapt.offlineStorage.set("coverId", id);
            this.$el.attr("data-item-index", index);
        },

        onReady: function() {
            if (Adapt.device.screenSize !== "large") this.scroll();

            this.$(".carousel-menu-item-container").removeClass("no-transition");
        },

        onControlClick: function(event) {
            var index = $(event.currentTarget).hasClass("back") ?
                parseInt(this.$el.attr("data-item-index"), 10) - 1 :
                parseInt(this.$el.attr("data-item-index"), 10) + 1;

            var models = this.model.getAvailableChildModels();

            if (index > -1 && index < models.length) {
                this.setItem(models[index].get("_id"), index);
            }
        },

        setUpItems: function() {
            var items = this.model.getAvailableChildModels();
            var $items = this.$(".carousel-menu-item-container");
            var $indicators = this.$(".carousel-menu-item-indicator-container");

            for (var i = 0, j = items.length; i < j; i++) {
                var options = { model: items[i] };

                $items.append(new CarouselMenuItemView(options).$el);
                $indicators.append(new CarouselMenuItemIndicatorView(options).$el);
            }
        },

        getNextIncompleteItem: function() {
            var models = this.model.getAvailableChildModels();
            var id = this.model.get("_coverId") || Adapt.offlineStorage.get("coverId");

            var index = _.findIndex(models, function(model) {
                return model.get("_id") === id;
            });

            if (index === -1) index = 0;

            for (var i = index, j = models.length; i < j; i++) {
                var model = models[i];

                if (!model.get("_isComplete")) return { id: model.get("_id"), index: i };
            }

            return { id: id, index: index };
        },

        scroll: function() {
            var $item = this.$(".carousel-menu-item")
                .filter("[data-adapt-id='" + this.model.get("_coverId") + "']");

            Adapt.scrollTo($item);
        },

    }, { template: "carouselMenu" });

    Adapt.on("router:menu", function(model) {
        $("#wrapper").append(new CarouselMenuView({ model: model }).$el);
    });

});
