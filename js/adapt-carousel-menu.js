define([
    "core/js/views/menuView",
    "core/js/adapt",
    "./adapt-carousel-menuItemView",
    "./adapt-carousel-menuItemIndicatorView"
], function(MenuView, Adapt, CarouselMenuItemView, CarouselMenuItemIndicatorView) {

    var CarouselMenuView = MenuView.extend({

        attributes: function() {
            return _.extend(MenuView.prototype.attributes.call(this), {
                "data-item-count": this.model.getAvailableChildModels().length+1
            });
        },

        className: function() {
            return MenuView.prototype.className.call(this) + " carousel-menu";
        },

        events: {
            "click .carousel-menu-item-control": "onControlClick",
            "click .numspothome": "onHome",
            "mouseover .numspothome": "homeOver",
            "mouseout .numspothome": "homeOut",
            "click .tooltips6 .skipme": "toolTip",
            'mousemove .firsttileview .carousel-menu-item' : 'firstPGlaunch',
            "mousemove .carousel-menu-item" : "accessibilityOn",
            "keyup *:focus" : "accessibilityOn",
            'click .carousel-course-intro' : 'menunotifyPopup'
        },

        postRender: function() {

            var item = this.getNextIncompleteItem();

            this.listenTo(Adapt, {
                "carouselMenu:setItem": this.setItem,
                "menuView:ready": this.onReady,
                "popup:closed": this.onPopupClosed,
                "notify:closed": this.notifyClosed
            });

            this.setBackgroundImage();
            this.setUpItems();
            this.setItem(item.id, item.index);
            
            // Checks if you are on Main Menu or Sub Menu
            if ($('.navigation-back-button').hasClass('display-none')) {
                //Do Nothing on Main Menu

                //BELOW PULLS TITLE
                var navtitle2 = $( '.carousel-menu-item[data-adapt-id="home"] .carousel-menu-item-title' ).text();
                Adapt.offlineStorage.set('mycourseTitle', navtitle2);
                var courseholder = Adapt.offlineStorage.get("mycourseTitle");
            } else {
                $('.location-menu .carousel-menu').addClass('submenu-carousel');
                //BELOW PULLS TITLE
                var navtitle2 = $( '.carousel-menu-item[data-adapt-id="home"] .carousel-menu-item-title' ).text();
                Adapt.offlineStorage.set('mycourseTitle', navtitle2);
                var courseholder = Adapt.offlineStorage.get("mycourseTitle");
            }

            var getUrlParameter = function getUrlParameter(sParam) { 
                var sPageURL = decodeURIComponent(window.location.search.substring(1)),
                sURLVariables = sPageURL.split('&'),
                sParameterName,
                i;
                for (i = 0; i < sURLVariables.length; i++) { 
                    sParameterName = sURLVariables[i].split('='); 
                    if (sParameterName[0] === sParam) {
                        return sParameterName[1] === undefined ? true : sParameterName[1];
                    }
                };
            };
            var menulaunch = getUrlParameter('menulaunch');
            
            if(menulaunch == 'on'){
                $('html#adapt').addClass('menulaunch');
            } else {
                //Don't launch to menu respect page 1 launch
            }

            // Triggers Page 1 when Accessibility button is pressed
            if ($('.location-menu').hasClass('accessibility')) {
                // Checks if you are on Main Menu or Sub Menu
                if ($('.navigation-back-button').hasClass('display-none')) {
                    window.setTimeout(function(){
                        $( '.carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
                    }, 250);
                } else {
                    window.setTimeout(function(){
                        $( '.carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
                        window.setTimeout(function(){
                            $('head').prepend("<style>.accessibility .audio-controls .audio-inner button {display:none;}</style>");
                            $( '.carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
                        }, 250);
                    }, 250);
                }
            } else if ($('html#adapt').hasClass('menulaunch')) {
                //Don't launch to menu respect page 1 launch
            }

            // Triggers Page 1 when Accessibility button is pressed
            var config = this.model.get("_carouselMenu");
            var launchPGone = config && config._gotoPageone;

            if (launchPGone == true) {
                console.log("CAROUSEL MENU PAGE 1 LAUNCH IS OFF.");
                this.listenToOnce(Adapt, "menuView:postRender pageView:postRender", this.onLaunchVideo);
            } else if ($('html#adapt').hasClass('menulaunch')) {
                console.log("MENU LAUNCH URL PARAMETER USED");
            } else if (launchPGone == false || $('.location-menu').hasClass('accessibility')) {
                this.listenToOnce(Adapt, "menuView:postRender pageView:postRender", this.navigateTo);
                window.setTimeout(function(){
                    $(".tooltips6").remove(); 
                }, 15000);
            }
        },

        setItem: function(id, index) {
            this.model.set("_coverId", id);
            Adapt.offlineStorage.set("coverId", id);
            this.$el.attr("data-item-index", index);
        },

        onReady: function() {
            if (Adapt.device.screenSize !== "large") this.scroll();

            this.$(".carousel-menu-item-container").removeClass("no-transition");

            if ( $(".visited.carousel-menu-item-indicator .carousel-menu-item-indicator-button-inner div").hasClass("page-level-progress-menu-item") ) {
                $( ".carousel-menu-item-indicator .page-level-progress-menu-item-indicator-bar" ).each(function( percent ) {
                    $('.visited.carousel-menu-item-indicator').addClass('pgpercent');
                    //console.log( parseInt(percent+1) + ": " + $( this ).css("width") );
                    $( ".pgpercent" ).each(function( pgcount ) {
                        $( this ).addClass('pgcount' + parseInt(pgcount+1));
                        $('.carousel-menu-item-indicator-container .pgpercent.pgcount' + parseInt(pgcount+1) + ' .carousel-menu-item-indicator-button-inner').css('width', $( '.pgcount' + parseInt(pgcount+1) + ' .page-level-progress-menu-item-indicator-bar' ).css("width"));
                    });
                });
            }
        },

        onLaunchVideo: function() {
            if ( !$('.carousel-menu-item-indicator-container .carousel-menu-item').hasClass('visited') ) {
                this.menunotifyPopup();
            }
        },

        onPopupClosed: function() {
            //on popup closed show tooltip
            $(".tooltips6").show();
            window.setTimeout(function(){
                $(".tooltips6").remove(); 
            }, 15000);
        },

        onControlClick: function(event) {
            var index = $(event.currentTarget).hasClass("back") ?
                parseInt(this.$el.attr("data-item-index"), 10) - 1 :
                parseInt(this.$el.attr("data-item-index"), 10) + 1;

            var models = this.model.getAvailableChildModels();

            if (index > -1 && index < models.length) {
                this.setItem(models[index].get("_id"), index);
            }
            if ( $(event.currentTarget).hasClass("next")) {
                if (index == models.length) {
                    $(".carousel-menu").attr("data-item-index",models.length);
                }
            }
        },

        onHome: function() {
            $(".carousel-menu").attr("data-item-index","0");
        },

        homeOver: function() {
            $('.carousel-menu-item[data-adapt-id="home"] .menu-tooltip').css({'opacity':'1','-webkit-animation-name': 'fadeInUp','animation-name': 'fadeInUp'});
        },

        homeOut: function() {
            $('.carousel-menu-item[data-adapt-id="home"] .menu-tooltip').css({'opacity':'0','-webkit-animation-name': 'none','animation-name': 'none'});
        },

        toolTip: function() {
            $(".tooltips6").css({'opacity':'0','display': 'none','z-index': '-1'});
        },

        setBackgroundImage: function() {
            var config = this.model.get("_carouselMenu");
            var src = config && config._backgroundSrc;

            if (src) this.$el.css("background-image", "url(" + src + ")");
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

            for (var i = index, j = models; i < j; i++) {
                var model = models[i];

                if (!model.get("_isComplete")) return { id: model.get("_id"), index: i };
            }

            return { id: id, index: parseInt(index+1)};
        },

        scroll: function() {
            var $item = this.$(".carousel-menu-item")
                .filter("[data-adapt-id='" + this.model.get("_coverId") + "']");

            if (Adapt.device.screenSize == "large") Adapt.scrollTo($item);
        },

        firstPGlaunch: function() {
            if((Adapt.offlineStorage.get("bookmarkPG") === "undefined") || (Adapt.offlineStorage.get("bookmarkPG") === undefined) || (Adapt.offlineStorage.get("bookmarkPG") == "")){
                // Checks if you are on Main Menu or Sub Menu
                 if ($('html#adapt').hasClass('menulaunch')) {
                    console.log("MENU LAUNCH URL PARAMETER USED");
                } else if ($('.nav__back-btn').hasClass('u-display-none')) {
                    $( '.carousel-menu[data-item-index="1"] .carousel-menu-item-container .carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
                } else {
                    //Do Nothing on SUB Menu
                    $('.carousel-menu-item-container').removeClass('firsttileview');
                }
            } else {
                //Do nothing
            } 
        },

        navigateTo: function() {
            if((Adapt.offlineStorage.get("bookmarkPG") === "undefined") || (Adapt.offlineStorage.get("bookmarkPG") === undefined) || (Adapt.offlineStorage.get("bookmarkPG") == "")){
                if ($('html#adapt').hasClass('menulaunch')) {
                    console.log("MENU LAUNCH URL PARAMETER USED");
                } else if( $('.navpagenum:empty').length ) {
                    window.setTimeout(function(){
                        console.log("1st view of CAROUSEL MENU.");
                        $( '.carousel-menu[data-item-index="1"] .carousel-menu-item-container .carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
                    }, 555);
                } else {
                    $('.carousel-menu-item-container').removeClass('firsttileview');
                    console.log("CAROUSEL MENU has been viewed before.");
                }
            } else {
                //Do nothing
            }  
        },

        accessibilityOn: function(e) {
            if ($('.location-menu').hasClass('accessibility')) {
                console.log("CAROUSEL MENU Accessibility On");
                $( '.carousel-menu[data-item-index="1"] .carousel-menu-item-container .carousel-menu-item:nth-child(2) .carousel-menu-item-button' ).trigger( 'click' );
            } else {
                //DO NOTHING
            }
            
        },

        menunotifyPopup: function () {
            //event.preventDefault();
            var config = this.model.get("_carouselMenu");
            var mediaSettings = config && config._media;
            var transcriptSet = config && config._transcript;
            var transEnable = transcriptSet._inlineTranscript;
            var transOpen = transcriptSet.inlineTranscriptButton;
            var transBody = transcriptSet.inlineTranscriptBody;
            var mediaSource = mediaSettings._source;
            var mediaPoster = mediaSettings._poster;
            var mediaControls = mediaSettings._controls;
            var mediaScrubber = mediaSettings._scrubber;
            var mediaCaption = mediaSettings._captiononauto;
            var mediaFullscreen = mediaSettings._setFullscreen;
            var mediaAutoplay = mediaSettings._autoplay;
            var item = this;

            this.model.set('_active', false);

            var titleText = '<iframe tabindex="0" src="assets/azure2.htm?url=//' + mediaSource + '&amp;autoplay=' + mediaAutoplay + '&amp;fullscreen=' + mediaFullscreen + '&amp;controls=' + mediaControls + '&amp;poster=' + mediaPoster + '&amp;scrubber=' + mediaScrubber + '&amp;caponoff=' + mediaCaption + '" id="introVideo" class="removeazureie" name="azuremediaplayer-introVideo" scrolling="no" frameborder="no" align="center" height="280px" width="500px" allowfullscreen="" style="width: 1242px; height: 698.538px;"></iframe>';

            if ( transEnable == true) {
                var bodyText = '<button class="carouselmenu__transcript-btn carousel-menu-item-button" aria-expanded="false">' + transOpen + '</button><div class="transcriptBody" tabindex="-1" style="display:none">' + transBody + '</div>';
            } else {
                var bodyText = '';
            }

            var popupObject = {
                body: bodyText,
                title: titleText
            };

            if ( mediaSource.length == 0) {
                //no video do nothing!
            } else {
                Adapt.notify.popup(popupObject);
                $(".tooltips6").hide();
            }
            $(".carouselmenu__transcript-btn").click(function() {
               item.menuTranscript();
            });
        },

        notifyClosed: function() {
            this.navigateTo();
            this.listenToOnce(Adapt, {
                'remove': this._onRemove,
                'router:menu router:page': this.navigateTo
            });
        },

        menuTranscript: function () {
            var config = this.model.get("_carouselMenu");
            var transcriptSet = config && config._transcript;
            var transEnable = transcriptSet._inlineTranscript;
            var transOpen = transcriptSet.inlineTranscriptButton;
            var transClose = transcriptSet.inlineTranscriptCloseButton;
            var transBody = transcriptSet.inlineTranscriptBody;

            if ($('.carouselmenu__transcript-btn[aria-expanded="false"]').is( '[aria-expanded="false"]' ) ) {
                $('.carouselmenu__transcript-btn[aria-expanded="false"]').attr("aria-expanded","true").text(transClose);
                $('.transcriptBody').attr('tabindex','0').show();
            } else if ( $('.carouselmenu__transcript-btn[aria-expanded="true"]').is( '[aria-expanded="true"]' ) ) {
                $('.carouselmenu__transcript-btn[aria-expanded="true"]').attr("aria-expanded","false").text(transOpen);
                $('.transcriptBody').attr('tabindex','-1').hide();
            }
        }    

    }, { template: "carouselMenu" });

    Adapt.on("router:menu", function(model) {
        $("#wrapper").append(new CarouselMenuView({ model: model }).$el);
    });

});
