define([
    "./adapt-carousel-menuItemView",
    "core/js/adapt"
], function(CarouselMenuItemView, Adapt) {

    var CarouselMenuItemIndicatorView = CarouselMenuItemView.extend({

        attributes: function() {
            var models = this.model.getParent().getAvailableChildModels();

            return _.extend(CarouselMenuItemView.prototype.attributes.call(this), {
                "data-item-index": parseInt(models.indexOf(this.model)+1)
            });
        },

        className: function() {
            var classes = CarouselMenuItemView.prototype.className.call(this);

            return classes += " carousel-menu-item-indicator";
        },

        events: {
            "click .carousel-menu-item-indicator-button": "onClick"
        },

        postRender: function() {},

        onClick: function() {
            var index = this.$el.data("item-index");

            console.log("index is this:" + index);

            Adapt.trigger("carouselMenu:setItem", this.model.get("_id"), index);
        }

    }, { template: "carouselMenuItemIndicator" });

    return CarouselMenuItemIndicatorView;

});
