
/** 
 *
 * DBug por consola. solo funciona con chrome y firefox
 *
 */

var DBug = { };
DBug.log = function(obj) {
    var is_chrome  = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if( is_chrome || is_firefox ) {
        console.log(obj);
    }
} ;

