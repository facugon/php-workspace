
function loadDialogPost(file,formName) {
    var options = { 
        target:        '#dialog1',   // target element(s) to be updated with server response 
        url: file,
        type:'post',
        beforeSubmit:  startLoading,  // pre-submit callback 
        success: function(){finishLoading(); closeModal('#dialog1'); afterSubmitModal(file)}  // post-submit callback 
    }; 
    form='#'+formName;
    $(form).ajaxSubmit(options,function() { 
        $(this).ajaxSubmit(options); 
        return false; 
    }); 
}

function loadDialogFromOutsideContent(file, dialog, params) { //invocacion desde afuera del modal, carga el div con el contenido y lo abre.
    if ( arguments.length == 3 && typeof params === "object" )
        $(dialog).load(file, params);
    else $(dialog).load(file);
    openModal(dialog);
}

function loadDialogFromInsideContent(file, dialog) { //invocacion desde el propio modal, ejecuta la operacion en el propio div y lo cierra
    $(dialog).load(file);
    closeModal(dialog);
}

function loadDialogContent(file, dialog) { //oculta el modal, ejecuta en el div y lo vuelve a abrir actualizado.
    closeModal();
    $(dialog).load(file);
    openModal(dialog);
}

function openModal ($dialog){
    $($dialog).dialog('open');
    return false;
}

function closeModal ($dialog){
    $($dialog).dialog('close');
    return false;
}

/// DIALOG FUNCTIONS END //
function MM_preloadImages() { //v3.0
    var d=document; if(d.images){ if(!d.MM_p) d.MM_p=new Array();
        var i,j=d.MM_p.length,a=MM_preloadImages.arguments; for(i=0; i<a.length; i++)
            if (a[i].indexOf("#")!=0){ d.MM_p[j]=new Image; d.MM_p[j++].src=a[i];}
    }
}

function startLoading()
{
    $('#mainAreaLoading').show();
}

function finishLoading()
{
    $('#mainAreaLoading').hide();
}

function sendAlert(pagina) {

    if (http_request.readyState == 4) {
        if (http_request.status == 200) {
            alert(http_request.responseText);
            pageTracker._trackPageview(pagina);
        }
        else {
            alert('Error.');
        }
    }
}

//Memory Leak
(function($) {
    $.fn.disposable = function(cln) {
        return this.each(function() {
            var el = this;
            if (!el.dispose) {
                el.dispose = cleanup;
                $(window).bind("unload", cleanup); 
            }
            function cleanup() {
                if (!el) return;
                $(el).unbind();
                $(window).unbind("unload", cleanup); 
                el.dispose = null;
                el = null;
            };
        });
    };
})(jQuery);

// DEVUELVE LA DISTANCIA ENTRE 2 PUNTOS GEOGRAFICOS EN KILOMETROS
function distanciaEntrePuntos(lati1, long1, lati2, long2) {

    lat1r = lati1 * (Math.PI / 180);
    lat2r = lati2 * (Math.PI / 180);

    var R = 6371; // km
    var dLat = (lati2-lati1) * (Math.PI / 180);
    var dLon = (long2-long1)* (Math.PI / 180);
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1r) * Math.cos(lat2r) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;      

    return d;
}

function secondsToTime(secs)
{
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
}

function secondsToTimeString(secs) {
    var time = secondsToTime(secs) ;
    var str = '';
    if( time.h != 0 )
        str += time.h + ' Hs ';
    str += time.m + ' Min' ;

    return str ;
}

function metersToKilometersString(mts) {
	return new String( mts/1000 ) + " Kms";
}

function mapScroll(bloqueFijo,bloqueMobil)
{
    var fijo  = $(bloqueFijo) ;
    var mobil = $(bloqueMobil) ;

    window.mapScroll = {
        iniTop    : fijo.position().top ,
        elemFijo  : fijo,
        elemMobil : mobil
    } ;

    $(window).scroll(function() {
        if( ($(window).height() * 2/3) > mobil.height() )
        {
            if( $(window).scrollTop() >= fijo.position().top )
            {
                mobil.css("position", "fixed");
                mobil.css("top", "0px");
            }
            else {
                mobil.css("position", "");
                mobil.css("top", window.mapScroll.iniTop + "px");
            }
        }
        else {
            mobil.css("position", "");
            mobil.css("top", window.mapScroll.iniTop + "px");
        }
    });
}
