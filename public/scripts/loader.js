
/// Service Loader Namespace

function ServicesLoader () {
    this.serviceCallsCounter = 0 ;
    this.ajaxContext         = undefined ;
    this.ajaxElemMapper      = undefined ;
}

ServicesLoader.prototype = {
    incrementCalls: function (times) {
        this.serviceCallsCounter += times ;
    },
    countCalls: function () {
        if (this.serviceCallsCounter > 0) 
            this.serviceCallsCounter-- ;

        if (this.serviceCallsCounter == 0)
            this.finishLoading();
    },
    finishLoading: function () {
        $('#mainAreaLoading').hide();
    },
    startLoading: function () {
        $('#mainAreaLoading').show();
    },
    makeglobal: function() {
        var loader = this ;

        this.ajaxElemMapper.ajaxStart(function(){
            loader.startLoading();
        });

        this.ajaxElemMapper.ajaxSuccess(function(e, xhr, settings){
            loader.countCalls();
        });
    },
    setup: function() {
        var gElem = 
            $('<div id="services-loader-mapper"></div>')
                .hide()
                .appendTo( $('body') );

        this.ajaxElemMapper = gElem ;
        this.ajaxContext    = gElem[0] ; // get the element context

        this.makeglobal() ;
    },
    reset: function() {
        this.serviceCallsCounter = 0 ;
        this.finishLoading();
    }
} ;
// instanciacion global
$(document).ready(function(){
    gServicesLoader = new ServicesLoader () ;
    gServicesLoader.setup();
});

