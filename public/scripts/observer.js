/*
 * Esta clase la cree para cambiar el paradigma de llamadas ajax.
 * Usando un observer , cuando un servicio termina le informa
 * a los subscriptos que termino para no tener que andar
 * pasando tanto callback . Asi es mas limpio y podemos saber que
 * callback se usa en que llamada buscando los subscriptores .
 */
function Observable () {
    this.observers = {
        'any' : [] // undefined type of observer
    };
}

Observable.prototype = {
    addObserver : function (observer,type,callback) {
        type = type || 'any';

        if (typeof this.observers[type] === "undefined") {
            this.observers[type] = [];
        }

        this.observers[type].push({name:observer, update:callback, onetime:false});
    } ,
    // notify one time and then remove the observer
    addOneTimeObserver : function (observer,type,callback) {
        type = type || 'any';

        if (typeof this.observers[type] === "undefined") {
            this.observers[type] = [];
        }

        this.observers[type].push({name:observer, update:callback, onetime:true});
    } ,
    notifyObservers : function (type,data) {
        if (typeof this.observers[type] !== "undefined") {
            for(var i=0; i < this.observers[type].length; i++) {
                var observer = this.observers[type][i] ;
                observer.update(data);

                if( observer.onetime )
                    this.removeObserver(observer.name,type);
            }
        }
    } ,
    removeObserver : function (observer,type) {
        type = type || 'any';

        for(var i=0; i < this.observers[type].length; i++) {
            if( this.observers[type][i].name === observer )
            {
                delete this.observers[type][i];
                this.observers[type].splice(i,1); // remove element
            }
        }
    }
}
