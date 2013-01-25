/*
 * ESTRUCTURAS {
 * objeto instanciable
 */
function CalculosTraslado (traslado) {
    this.traslado       = traslado ;
    this.nuevadistancia = null ;
    this.nuevotiempo    = null ;
    this.tratamientos   = new Array() ;
}
CalculosTraslado.prototype = {
    generarEstadisticasTratamientoAsignado: function() {
        var tcalculo = this ;
        var estadisticas = {
            distanciaparcial : 0 ,
            tiempoparcial    : 0
        };

        $.each(this.tratamientos, function() {
            if( tcalculo.traslado.sentido == 0 ) { // si es ida
                if( this.orden >= tcalculo.nuevotratamientoorden ) // entonces los legs que tienen orden mayor igual suman a la distancia parcial
                {
                    estadisticas.distanciaparcial += this.distancia_tramo ;
                    estadisticas.tiempoparcial    += this.duracion_tramo ;
                }
            }
            else if( tcalculo.traslado.sentido == 1 ) { // si es la vuelta
                if( this.orden <= tcalculo.nuevotratamientoorden ) // los legs con orden menor igual, suman a la parcial
                {
                    estadisticas.distanciaparcial += this.distancia_tramo ;
                    estadisticas.tiempoparcial    += this.duracion_tramo ;
                }
            }
        });
        return estadisticas ;
    },
    getLegCoordOrder: function(orden, wporden, sentido) {
        if ( sentido == 0 ) // ida
        {
            if ( orden == 0 ) // es el origen
                return 0 ;

            orden -= 1 ; // sino , lo transformo en la coordenada dentro del array de waypoints
            arrayIndex = $.inArray( parseInt(orden), wporden ) ;

            return arrayIndex + 1 ; // en el array de legs es el que corresponde al segundo siempre que no sea el origen
        }
        else if ( sentido == 1 ) // vuelta
        {
            if( wporden != undefined && orden >= wporden.length ) // el destino es el ultimo = cantidad waypoints 
                return orden ;

            if(wporden != undefined)
            {
                arrayIndex = $.inArray( parseInt(orden), wporden ) ;
                return arrayIndex ;            	
            }
            else
            {
            	return  0;
            }
        }
    },
    actualizarCalculosTratamientosDirections: function(wporder, legs) {
        var self = this ;
        self.tratamientos = new Array ();

        $.each(self.traslado.tratamientos, function() {
            // no confundir: el this es para el elemento recorrido por el $.each , no para el objeto que tiene el metodo
            leg = self.getLegCoordOrder(this.orden, wporder, self.traslado.sentido);

            var tratamiento = {} ;
            tratamiento.tratamiento     = this.tratamiento ;// el id
            tratamiento.distancia_tramo = legs[leg].distance.value ;
            tratamiento.duracion_tramo  = legs[leg].duration.value ;
            tratamiento.orden           = leg + 1 ;
            tratamiento.nuevo           = this.nuevo_asignado ;

            if( this.nuevo_asignado ) // si es el nuevo guardo el orden
                self.nuevotratamientoorden = tratamiento.orden ;

            // actualizo el orden real. para mostrar en mapa
            this.orden = leg + 1 ;

            self.tratamientos.push( tratamiento );
        });
    }
};

function PacienteAsignacion (data) {
    this.data = data ;
    this.domicilio = null ;
    this.centro = null ;
    this.trasladoactual = null ;
    this.instance = null ;
}
PacienteAsignacion.prototype = {
    setDomicilioTratamiento: function(dt){
        this.domicilio = {}; 
        this.domicilio.historia_clinica = this.data.historia_clinica;
        this.domicilio.nombre           = this.data.nombre ;
        this.domicilio.latitud          = dt.latitud;
        this.domicilio.longitud         = dt.longitud;
        this.domicilio.tratamiento      = this.data.tratamiento;
        this.domicilio.nuevo_asignado   = true ;
        this.domicilio.calle            = dt.Calle;
        this.domicilio.numero           = dt.Numero;
        this.domicilio.provincia        = dt.Provincia;
        this.domicilio.ciudad           = dt.Ciudad;
        this.domicilio.entrecalles      = dt.entrecalles;
        this.domicilio.cp               = dt.CP;
    },
    setCentroTratamiento: function(ct){
        this.centro = ct ;
    },
    mostrarDatosEstadisticas: function() {
        var paciente = this.data ;
        $("div#estadisticas tbody span").html(""); // limpio estadisticas

        $('tbody#paciente_asignado span#nombre').
            attr("class","nametip").
            attr("title",paciente.historia_clinica + ' - ' + paciente.nombre).
            tooltip({
                offset: [25, 170],
                opacity: 0.8,
                predelay:800
            });
        
        var nombre = '';
        if( paciente.nombre.length > 10 )
            nombre = paciente.nombre.substring(0,10) + '...' ;

        $('tbody#paciente_asignado span#nombre').html(paciente.historia_clinica + ' - ' + nombre);
        $('tbody#paciente_asignado span#centro').html(paciente.centro + " / ");
        $('tbody#paciente_asignado span#turno').html(paciente.turno);
        $('tbody#paciente_asignado span#distancia_centro').html(metersToKilometersString(paciente.distancia_centro) + " / ");

        var time = secondsToTimeString( paciente.tiempo_centro );
        $('tbody#paciente_asignado span#tiempo_centro').html(time);
    },
    actualizarEstadisticas: function(tCalculo) {
        var estadisticas = tCalculo.generarEstadisticasTratamientoAsignado();
        $("tbody#paciente_asignado span#distancia_traslado").html(metersToKilometersString(estadisticas.distanciaparcial) + " / ");
        var time = secondsToTimeString(estadisticas.tiempoparcial);
        $("tbody#paciente_asignado span#tiempo_traslado").html(time);
    }
};

var TrasladoCalculo = {
    // atributo estatico
    instance : null ,
    mostrarrutamapa : true ,
    OptimizarRuta : function (traslado) {
        var self = this ;
        Traslado.observable.addOneTimeObserver(self,"obtenerDatos",function(data) {
            var dataTraslado = data[0] ;
            self.ActualizarCalculosRecorrido(dataTraslado, function(){
                mostrarMarkersCentroPacientes (dataTraslado.centro, dataTraslado.tratamientos);
                TrasladoAsignacion.actualizarEstadisticas (self.instance);
                self.MostrarBotonGuardar();
            });
        });
        Traslado.obtenerDatos({traslado:traslado});
    },
    GuardarOptimizacionTraslado : function() {
        var TCRequest = TrasladoCalculo.RequestTrasladoCalculos();
        Traslado.guardarcalculosruta(TCRequest,"/traslados/guardarcalculosservicejson");
    },
    MostrarBotonGuardar : function() {
        var self = this ;
        var btn     = $('div#estadisticas tbody#btns_estadisticas a#btn_guardar');
        var btncage = $('div#estadisticas tbody#btns_estadisticas');

        btn.attr('href',"javascript:TrasladoCalculo.GuardarOptimizacionTraslado();").html("GUARDAR");
        if(self.instance && window.location.pathname.match("pool.ver") )
            btncage.show();
    },
    ActualizarCalculosRecorrido : function (traslado, callback) {
        var self = this ; // referencia a static TrasladoCalculo
        var request = Traslado.buildOptimizedDirectionsRequest ( // solicito la ruta optima a google
            traslado.sentido,
            traslado.tratamientos,
            traslado.centro_latitud,
            traslado.centro_longitud
        );

        directionsService.route(request, function(result, status) 
        {
            if (status == google.maps.DirectionsStatus.OK) 
            {
                directionsResult = result;
                if( self.mostrarrutamapa )
                    directionsDisplay.setDirections (directionsResult);

                // ----------------------------------------------------------------
                var distanciaTiempoRuta = obtDistanciaTiempoCompletaRuta();
                var calculo             = new CalculosTraslado(traslado) ;
                calculo.nuevadistancia  = distanciaTiempoRuta.distancia;
                calculo.nuevotiempo     = distanciaTiempoRuta.tiempo;
                // el orden de los waypoints y los legs
                var wporder = result.routes[0].optimized_waypoint_order ;
                var legs    = obtLegsRuta();
                calculo.actualizarCalculosTratamientosDirections(wporder,legs) ;
                self.instance = calculo ; // variable estatica
                // ----------------------------------------------------------------

                if( callback ) callback() ;
            }
            else {
                //console.log("maps request error "+ status);
                gServicesLoader.reset();
                jAlert("No es posible procesar la asignacion para este traslado","Asignacion Traslado");
            }
        });
    },
    RequestTrasladoCalculos : function () {
        var calcTemp = this.instance ;
        var pacTemp = PacienteAsignacion.instance ;
        var request = {
            'idtraslado' : calcTemp.traslado.id,
            'sent'       : calcTemp.traslado.sentido,
            'nvdist'     : calcTemp.nuevadistancia,
            'nvtim'      : calcTemp.nuevotiempo,
            'trats'      : calcTemp.tratamientos,
            'new'        : ( calcTemp.traslado.nuevo ? 1 : 0 )
        } ;
        if (pacTemp){
            request.idpaciente    = pacTemp.data.id;
            request.idtratamiento = pacTemp.data.tratamiento;
        }
        return request ;
    }
};

var TrasladoAsignacion = {
    reemplazar_traslado_actual: null ,
    observable: new Observable () ,
    // el paciente, el centro y el turno son los mismos para un solo request de asignacion hasta que se recarga la pagina
    silencioso : false , // esto es para que no muestre en el mapa cuando hace los calculos
    guardarCalculos : function(doNext) {
        // los datos para el request JSON
        var TCRequest = TrasladoCalculo.RequestTrasladoCalculos();

        var dURL = null ;
        if( this.pacienteAsignadoMismoSentido() )
        {
            if( this.reemplazar_traslado_actual != null && this.reemplazar_traslado_actual )
                dURL = baseUrl + '/traslados/reemplazartrasladorutinapacientejson' ;
            else window.location.reload(); // si llego aca de esta forma , es porque hubo un error
        }
        else dURL = baseUrl + '/traslados/asignartrasladorutinapacientejson' ;

        Traslado.guardarcalculosruta( TCRequest, dURL, 
            function(request,response) {
                if(response.type == 'ok') {
                    jAlert(response.msg,"Asignacion Traslado",function() { // si esta definido el callback
                        if(doNext) doNext(request,response);
                    });
                }
                else {
                    $.alerts.okButton = '&nbsp;OK&nbsp;' ;
                    if (response.type == 'error') jAlert(response.msg,"Fresenius Error");
                    else jAlert('se produjo un error inesperado',"Fresenius Error");
                }
            }
        ) ;
    } ,
    mostrarCalculosMapsCallback : function (data) { // luego de enviar el request de ruta a google maps
        var self = this ;
        if( ! self.silencioso )
        {
            mostrarMarkersCentroPacientes (data.centro, data.tratamientos);
            // muestro las estadisticas
            PacienteAsignacion.instance.actualizarEstadisticas (TrasladoCalculo.instance);
            self.actualizarEstadisticas (TrasladoCalculo.instance);
            self.mostrarBotonAsignacion ();
        }
    },
    actualizarCalculosAsignacionTraslado : function (traslado) {
        var self = this ;

        Traslado.observable.addOneTimeObserver(self,"obtenerDatos",function(datos){

            var dataTraslado  = datos[0] ; // si espero un solo traslado...debería ser el unico
            var tratamiento   = PacienteAsignacion.instance.domicilio ;
            tratamiento.orden = dataTraslado.tratamientos.length + 1 ;

            dataTraslado.tratamientos.push( tratamiento );
            TrasladoCalculo.ActualizarCalculosRecorrido ( dataTraslado, function(){ 
                self.mostrarCalculosMapsCallback(dataTraslado); 
                self.observable.notifyObservers("actualizarCalculosAsignacionTraslado");
            });

        }) ;
        Traslado.obtenerDatos({traslado:traslado});
    } ,
    asignarPacienteTrasladoAutomatico : function (traslado,pool) {
        var self = this ;
        self.silencioso = true ;

        Traslado.observable.addOneTimeObserver(self,"obtenerDatos",function(data) {
            var dataTraslado  = data[0] ;
            var tratamiento   = PacienteAsignacion.instance.domicilio ;
            tratamiento.orden = dataTraslado.tratamientos.length + 1 ;

            dataTraslado.tratamientos.push( tratamiento );
            TrasladoCalculo.ActualizarCalculosRecorrido(dataTraslado,function(){
                self.verificaAsignacion(function(){
                    self.guardarCalculos(function(req,rsp){
                        self.finalizarProcesoAsignacion(rsp.data.id);
                    }); 
                });
            });
        });
        Traslado.obtenerDatos({traslado:traslado});
    },
    finalizarProcesoAsignacion : function(pool) {
        jConfirm("Desea actualizar el costo del tratamiento ahora?","Asignacion Traslado", function(r){
            if(r) window.location = "/pool/ver/pool/" + pool ;
            else window.location = "/pacientes/verpoolespacientes";
        });
    },
    postAsignacionCallback : function(TCRequest,SrvResponse) {
        var self        = this ;
        var sentOpuesto = null ;
        var sentido     = null ;

        if( parseInt(TCRequest.sent) == 0 ) {
            sentido = 1 ;
            sentOpuesto = 'VUELTA' ;
        }
        else {
            sentido = 0 ;
            sentOpuesto = 'IDA' ;
        }

        var pool     = SrvResponse.data.id ;
        var traslado = SrvResponse.data.traslado2 ;
        var sentido  = SrvResponse.data.sentidot2 ;

        if( sentido != null && traslado != null ) // el opuesto al que asigne
        {
            jConfirm("Desea asignar el traslado de <b>" + sentOpuesto + "</b> del mismo Pool?","Asignacion Traslado", function(r){
                if(r) {
                    self.asignarPacienteTrasladoAutomatico(traslado,pool);
                }
                else self.finalizarProcesoAsignacion(pool);
            });
        }
        else self.finalizarProcesoAsignacion(pool);
    } ,
    pacienteAsignadoMismoSentido : function() {
        var actual       = PacienteAsignacion.instance.trasladoactual ;
        var mismosentido = false ;

        if(actual) {
            $.each(actual,function(){
                if(this.sentido == TrasladoCalculo.instance.traslado.sentido)
                    mismosentido = true ;
            });
        }
        return (actual && mismosentido) ;
    },
    verificaAsignacion : function( doNext ) {
        var self = this ;
        if( self.pacienteAsignadoMismoSentido() )
        {
            jConfirm("El paciente se encuentra asignado a un traslado. Desea reemplazarlo?","Fresenius Confirmacion",function(r) {
                if(r) {
                    self.reemplazar_traslado_actual = true ;
                    if(doNext) doNext();
                }
                else jAlert("Asignaci&oacute;n cancelada","Fresenius",function(){window.location.reload();});
            });
        } else if(doNext) {
            doNext();
        }
    } ,
    init: function (paciente,centro,turno) {
        var self = this ;
        gServicesLoader.incrementCalls(4);

        // obtengo la informacion del paciente
		$.ajax({
			type:"GET",
			url:baseUrl + '/pacientes/datapacientecalculotrasladojson',
			data:{paciente:paciente,centro:centro},
			dataType:'json',
            context: gServicesLoader.ajaxContext ,
			success:function(response) {
				if( response.type == 'ok' )
				{
					PacienteAsignacion.instance = new PacienteAsignacion( response.data ) ;
					PacienteAsignacion.instance.mostrarDatosEstadisticas();

					self.verificarAsignacionTrasladoPaciente(paciente);
					self.initMap(paciente,centro);
				}
                else if ( response.type == 'error' )
                {
                    jAlert(response.msg,'Error de Datos',function(){
                        gServicesLoader.startLoading();
                    });
                }
				else jAlert('Se produjo un error');
			}
		});
    },
    initMap : function (paciente,centro) {
        var self = this ;
        inicializarMapa();

        $.ajax({
            type:"GET",
            url: baseUrl + '/domicilios/ajaxobtenerdomicilio',
            data: { paciente: paciente }, 
            success: function(dataDomicilio)
            {
                PacienteAsignacion.instance.setDomicilioTratamiento( dataDomicilio );
                markerCasitaDomicilio( dataDomicilio, false );
            },
            dataType: 'json'
        });

        $.ajax({
            type:"GET",
            url:baseUrl + '/centros/ajaxobtenercentro', 
            data: { centro: centro }, 
            success: function(dataCentro) 
            {
                PacienteAsignacion.instance.setCentroTratamiento( dataCentro );
                markerPersonalizadoCentro(dataCentro, baseUrl + "/public/images/globitos/hospital2.png", false);
            },
            dataType:'json'
        });
    } ,
    deshabilitarSeleccionTraslados : function (traslados,condicion) {
        var self = this ;

        $.each(traslados, function(){
            var blqSentido = parseInt(this.sentido) == 0 ? '.traslado_ida' : '.traslado_vuelta' ; // clase
            var tdTraslado = $(blqSentido + "#" + this.traslado) ;
            if(tdTraslado)// esta definido en la pagina actual
            {
                tdTraslado.find("span#btnpreasignar").empty().html('<span id="btnpreasignar"><em><a href="javascript:Traslado.ver('+ this.traslado +');"> ASIGNADO </a></em></span>');
                tdTraslado.css('background-color','#CEE0FF') ;
                tdTraslado.find("tr#" + PacienteAsignacion.instance.data.id).css("background-color","#FFFFFF");
            }
        });
    } ,
    verificarAsignacionTrasladoPaciente : function (paciente) {
        var self = this ;
        var request = {};
        request.paciente = paciente;

        $.ajax({
                type: 'GET',
                url: baseUrl + '/pool/verificarasignacionpaciente',
                data: request,
                dataType: 'json',
                context: gServicesLoader.ajaxContext ,
                success: function(response)
                {
                    if(response)
                    {
                        if(response.type == 'aviso')
                        {
                            self.deshabilitarSeleccionTraslados(response.data);

                            PacienteAsignacion.instance.trasladoactual = response.data ;
                        }
                        else if(response.type == 'error')
                        jAlert(response.msg,'Error Asignacion');
                    }
                }
        });
    } ,
    generarTrasladoNuevo : function (sentido,doNext) {
        var self = this ;

        var paciente = PacienteAsignacion.instance ;
        dataTraslado = {} ;
        dataTraslado.sentido         = sentido ;
        dataTraslado.centro          = paciente.centro.id ;
        dataTraslado.centro_nombre   = paciente.centro.nombre ;
        dataTraslado.turno_nombre    = paciente.data.turno ;
        dataTraslado.centro_latitud  = paciente.centro.latitud ;
        dataTraslado.centro_longitud = paciente.centro.longitud ;
        dataTraslado.tratamientos    = new Array () ;

        var tratamiento = paciente.domicilio ;
        tratamiento.orden = 1 ;
        dataTraslado.tratamientos.push( tratamiento );
        dataTraslado.nuevo = true ;
        dataTraslado.id = null ;

        TrasladoCalculo.ActualizarCalculosRecorrido(dataTraslado,function(){
            self.mostrarCalculosMapsCallback(dataTraslado); 
            self.observable.notifyObservers("generarTrasladoNuevo");
            if(doNext) doNext();
        });
    } ,
    limpiar : function () {
        TrasladoCalculo.instance = null ;
        var self = this ;
        self.verificarAsignacionTrasladoPaciente(PacienteAsignacion.instance.data.id);

        $('div#estadisticas tbody#btns_estadisticas a#btn_guardar').html("") ;
        $('div#estadisticas tbody#btns_estadisticas').hide();

        PacienteAsignacion.instance.mostrarDatosEstadisticas();
    } ,
	actualizarEstadisticas : function(tCalculo,action) {
        $("tbody#traslado_asignado span").each(function(){
            $(this).html("");
        });
        
        $("tbody#traslado_asignado span#traslado").html(tCalculo.traslado.id);
        $("tbody#traslado_asignado span#centro").html(tCalculo.traslado.centro_nombre + " / ");
        $("tbody#traslado_asignado span#turno").html(tCalculo.traslado.turno_nombre);

        if( ! tCalculo.traslado.nuevo )
        {
            $("tbody#traslado_asignado span#distancia_anterior").html(metersToKilometersString(tCalculo.traslado.distancia) + " / ");
            $("tbody#traslado_asignado span#tiempo_anterior").html(secondsToTimeString(tCalculo.traslado.tiempo));
        }
        else {
            $("tbody#traslado_asignado span#distancia_anterior").html("NO / ");
            $("tbody#traslado_asignado span#tiempo_anterior").html("NO");
        }

        if( action != "ver" )
        {
            $("tbody#traslado_asignado span#distancia_nueva").html(metersToKilometersString(tCalculo.nuevadistancia) + " / ");
            $("tbody#traslado_asignado span#tiempo_nuevo").html(secondsToTimeString(tCalculo.nuevotiempo));
        }
	} ,
    mostrarBotonAsignacion: function() {
        var self = this ;
        var btn     = $('div#estadisticas tbody#btns_estadisticas a#btn_guardar');
        var btncage = $('div#estadisticas tbody#btns_estadisticas');

        btn.attr('href',"javascript:PoolAsignacion.confirmarAsignacion();").html("GUARDAR");

        if(TrasladoCalculo.instance && window.location.pathname.match("pool.poolescercanospaciente") ) // esta definida la asignacion de traslados
        {
            btncage.show();
        }
    } ,
    confirmarAsignacionPaciente : function (idtraslado) {
        // \todo esta funcionalidad no esta testeada ni migrada
        $.alerts.okButton = '&nbsp;ACEPTAR&nbsp;';
        jConfirm('Confirma la asignacion de este traslado al paciente?' ,'Traslasdos', function(r) {
            if(r) {
                jConfirm('Es un traslado nuevo?','Traslasdos', function(r) {
                    if(r) {
                        $.post(baseUrl + "/traslados/ajaxconfirmartraslado", {idtraslado: idtraslado, creaservicio: 1}, 
                            function(data)
                            {
                                if(data == 'ok') jAlert('Se asign&oacute; el traslado vigente al nuevo paciente', 'Fresenius', function(r) { if(r) {  window.location.reload(); } });
                                else alert("Hubo un error al crear el nuevo traslado");
                            }
                        );
                    }
                    else 
                    {
                        $.post(baseUrl + "/traslados/ajaxconfirmartraslado", {idtraslado: idtraslado, creaservicio: 0},
                            function(data)
                            {
                                if(data == 'ok') jAlert('Se asign&oacute; el traslado vigente al nuevo paciente', 'Fresenius', function(r) { if(r) {  window.location.reload(); } });
                                else alert("Hubo un error al crear el nuevo traslado");
                            }
                        );
                    }
                });
            }
        });
    }
};

var Traslado = {
    actual: null ,
    observable : new Observable () ,
    obtenerDatos : function(request) {
        var self = this ;
		$.ajax({
			type:'GET',
			url: baseUrl + '/traslados/obtenertrasladosjson',
			data: request,
			dataType: 'json',
			context: gServicesLoader.ajaxContext ,
			success: function(response)
			{
				if( response.type == 'ok' && response.data )
				{
                    // retorna un array con los datos del traslado o los traslados consultados
                    self.observable.notifyObservers("obtenerDatos",response.data) ;
				}
			}
		});
    },
    limpiar: function() {
        $('div#estadisticas tbody#btns_estadisticas a#btn_guardar').html("") ;
        $('div#estadisticas tbody#btns_estadisticas').hide();
        limpiarMarkersDomiciliosPacientesTraslado();
    },
    // ejemplo complejo del patron observer
	ver: function(traslado) {
		var self = this ;
        self.limpiar();

        self.observable.addOneTimeObserver(self,"obtenerDatos",function(datos){
            self.actual = datos[0] ; // devuelve un unico traslado
            self.observable.addOneTimeObserver(self,"mostrarRuta",function(){
                self.observable.notifyObservers("ver");
            });
            self.mostrarRuta(datos[0]);
        }) ;
        self.obtenerDatos({traslado:traslado});
	} ,
	mostrarRuta : function (traslado) {
        var self = this ;
        var request = self.buildDirectionsRequest (
            traslado.sentido,
            traslado.tratamientos,
            traslado.centro_latitud,
            traslado.centro_longitud
        );

        directionsService.route(request, function(result, status) 
        {
            if (status == google.maps.DirectionsStatus.OK) 
            {
                directionsResult = result;
                directionsDisplay.setDirections (directionsResult);

				var distanciaTiempoRuta = obtDistanciaTiempoCompletaRuta();

                // ----------------------------------------------------------------
                // obtengo los calculos de tiempos de ruta para tener estadisticas
                var calculo             = new CalculosTraslado(traslado) ;
                calculo.nuevadistancia  = distanciaTiempoRuta.distancia;
                calculo.nuevotiempo     = distanciaTiempoRuta.tiempo;
                self.calculosruta = calculo ;
                // ----------------------------------------------------------------

                mostrarMarkersCentroPacientes (traslado.centro, traslado.tratamientos);

                // muestro la toolbar de estadisticas de ruta
                var calculos = {};
                calculos.traslado = traslado ;
                TrasladoAsignacion.actualizarEstadisticas(calculos,"ver"); // muestro las estadisticas de la ruta

                self.observable.notifyObservers("mostrarRuta");
                // window.scrollTo(0,0);
            }
            else {
                //console.log("maps request error "+ status);
                gServicesLoader.reset();
                jAlert("No es posible mostrar el traslado","Traslado");
            }
		});
	} ,
	// genera un request para directions armado para obtener la ruta optima
	buildOptimizedDirectionsRequest : function (sentido,tratamientos,latCentro,lngCentro) {
		var arrayWaypoints = Array();
		var index = indexCoordenadaMasLejanaPunto (tratamientos, {latitud:latCentro,longitud:lngCentro});
		lejano = tratamientos.splice(index,1)[0];// separo el mas lejano para asignarlo como origen o destino

		// si tiene waypoints creo el array para enviar el request
		if(sentido == 0) // ida
		{
			lejano.orden = 0 ; // es el primero de los waypoints
			origen  = new google.maps.LatLng( lejano.latitud, lejano.longitud );
			destino = new google.maps.LatLng( latCentro, lngCentro );
			if(tratamientos.length > 0)
			{
				for(var i=0; i<tratamientos.length; i++)
				{
					var latLngWaypoint = new google.maps.LatLng( tratamientos[i].latitud, tratamientos[i].longitud );
					arrayWaypoints.push({ location: latLngWaypoint, stopover: true });
					tratamientos[i].orden = i + 1 ; // orden actual
				}
			}
		}
		else if (sentido == 1) // vuelta
		{
			lejano.orden = tratamientos.length ; // es el ultimo
			destino = new google.maps.LatLng( lejano.latitud, lejano.longitud );
			origen  = new google.maps.LatLng( latCentro, lngCentro );
			if(tratamientos.length > 0)
			{
				for(i=0; i<tratamientos.length; i++)
				{
					var latLngWaypoint = new google.maps.LatLng( tratamientos[i].latitud, tratamientos[i].longitud );
					arrayWaypoints.push({ location: latLngWaypoint, stopover: true });
					tratamientos[i].orden = i ; // orden actual
				}
			}
		}
		tratamientos.push( lejano );// lo agrego de nuevo para tenerlo registrado
		return {
			origin            : origen,
			destination       : destino,
			waypoints         : arrayWaypoints,
			optimizeWaypoints : true,// no hace falta que los tratamientos esten ordenados . google optimiza el orden
			travelMode        : google.maps.DirectionsTravelMode.DRIVING
		};
	} ,
	buildDirectionsRequest : function (sentido,tratamientos,latCentro,lngCentro) {
		
		var arrayWaypoints = new Array();
		
		var origen;
		var destino;
		if(sentido == 0)
		{
		// los tratamientos tienen que venir ordenados
			var primero = tratamientos[0] ;
			origen  = new google.maps.LatLng( primero.latitud, primero.longitud );
			destino = new google.maps.LatLng( latCentro, lngCentro );

			for(var i=1; i<tratamientos.length; i++)
			{
				var latLngWaypoint = new google.maps.LatLng( tratamientos[i].latitud, tratamientos[i].longitud );
				arrayWaypoints.push({ location: latLngWaypoint, stopover: true });
			}
		}
		else if(sentido == 1)
		{
			var ultimo = tratamientos[tratamientos.length - 1] ;
			destino = new google.maps.LatLng( ultimo.latitud, ultimo.longitud );
			origen  = new google.maps.LatLng( latCentro, lngCentro );

			for(var i=0; i<tratamientos.length - 1; i++)
			{
				var latLngWaypoint = new google.maps.LatLng( tratamientos[i].latitud, tratamientos[i].longitud );
				arrayWaypoints.push({ location: latLngWaypoint, stopover: true });
			}
		}

		return {
			origin      : origen,
			destination : destino,
			waypoints   : arrayWaypoints,
			travelMode  : google.maps.DirectionsTravelMode.DRIVING
		};
	},
    confirmacionBajaPaciente: function (tratamiento,paciente,traslado) {
        var self = this ;
        jConfirm('Confirma la baja del paciente en el traslado?', 'Ver Traslasdos', function(r) {
            if(r) {
                var request = {} ;
                request.tratamiento = tratamiento;
                request.paciente    = paciente;
                request.traslado    = traslado;

                $.ajax({
                        type:"GET",
                        dataType:'json',
                        url:baseUrl + "/traslados/trasladostratamientojson", 
                        data:request, 
                        success:function(response)
                        {
                            if( response.type == 'ok' && response.data ) // esta seteado el response
                            {
                                var countTraslados = response.data.length ;
                                if(  countTraslados == 2 )
                                {
                                    jConfirm('Desea bajar al paciente de todos los traslados?', 'Baja Paciente', function(r) {
                                        if(r) request.completo = 1 ;
                                        self.procesarBajaPaciente(request);
                                    });
                                }
                                else
                                    if( countTraslados == 1 )
                                        self.procesarBajaPaciente(request);
                                else
                                    if( countTraslados > 2 || countTraslados < 1 )
                                        jAlert('Hay un error de datos en el tratamiento. No se puede continuar con la baja','Error');
                            }
                        }
                });
            }
        }); 	
    },
    recalcularruta : function(traslado){
        var self = this ;

        self.observable.addOneTimeObserver(self,"obtenerDatos",function(dataTraslado) {
            TrasladoCalculo.ActualizarCalculosRecorrido (dataTraslado[0], function() {
                var TCRequest = TrasladoCalculo.RequestTrasladoCalculos();
                self.guardarcalculosruta(TCRequest,"/traslados/guardarcalculosservicejson", 
                    function(request,response){
                        if(response.type == 'ok')
                        {
                            jAlert(response.msg,"Asignacion Traslado",function() {
                                // si esta definido el callback
                                window.location = window.location; 
                            });
                        }
                        else {
                            $.alerts.okButton = '&nbsp;OK&nbsp;' ;
                            if (response.type == 'error')
                                jAlert(response.msg,"Asignacion Traslado");
                            else jAlert('se produjo un error inesperado',"Asignacion Traslado");
                        }
                    }
                );
            });
        });
        self.obtenerDatos({traslado:traslado});
    },
    // guarda los datos generados con maps del traslado seleccionado.
    guardarcalculosruta: function(request,url,doNext) {
        var self = this ;
        // JSON-RPC : post json , a modo solicitud de servicio
        $.ajax({
            type: "POST",
            url: url,
            // The key needs to match your method's input parameter (case-sensitive).
            data: JSON.stringify({ TCalculo: request }),
            dataType: "json",
            contentType: "application/json; charset=utf-8",
            success: function(response) {
                if(doNext) doNext(request,response);
            },
            failure: function(error) { // solo cuando el server detecte falla del protocolo (no implementado)
                //console.log(error);
            }
        });
    },
    procesarBajaPaciente : function(request) {
        TrasladoCalculo.mostrarrutamapa = false ;
        var self = this ;
        $.ajax({
                type:"POST",
                url:baseUrl + "/traslados/bajapacienteservicejson",
                data:request,
                success:function(response)
                {
                    if( response.type == 'ok' )
                    {
                        $.each(response.data, function(traslado,ratio){
                            // Recalculo orden, distancias y tiempo
                            if(ratio > 0) {
                                self.recalcularruta(traslado);
                            }
                            else jAlert('El proceso termin&oacute; existosamente' ,'Ver Traslados', function(r){ if(r) window.location.reload() ; });
                        });
                    } 
                    else alert("Hubo un error al procesar la baja del tratamiento");
                },
                dataType:'json'
        });
    },
    confirmarBajaTraslado : function (traslado) {
        // \todo esta funcionalidad no fue testeada ni migrada
        jConfirm('Confirma la baja de este traslado al paciente?','Traslasdos', function(r) {
            if(r) {
                $.ajax({
                        type:"POST",
                        url: baseUrl + "/traslados/confirmarbajapacienteservicejson",
                        data: {idtraslado:traslado}, 
                        success: function(data) {
                            if(data == 'ok') 
                            {
                                $.alerts.okButton = '&nbsp;ACEPTAR&nbsp;';
                                jAlert('Se elimin&oacute; el traslado vigente al nuevo paciente','Fresenius', function(r) { if(r) {  window.location.reload(); } });
                            } 
                            else alert("Hubo un error al crear el nuevo traslado");
                        },
                        dataType: "json"
                });
            }
        }); 	
    }
};

var Costo = {
    modificarCostoTrasladoModal : function(traslado,pool)
    {
        var modal = $('<div id="costotrasladodialog"></div>');
        modal.appendTo(document);

        modal.dialog({
            title: 'Modificar costo traslado',
            autoOpen: false,
            closeText: "cerrar",
            resizable: true,
            modal: true,
            width: "300px",
            close: function(event, ui) {
                $(this).dialog('destroy').remove();
            }
        });

        var req = {};
        req.traslado = traslado ;
        req.pool = pool ;
        modal.load( baseUrl + '/traslados/modificarcostotrasladomodal/', req );
        modal.dialog('open');

        var scroll = $(window).scrollTop();
        $('div.ui-dialog').css('top',scroll + 90 + 'px');
    },
    submitNuevoCostoTraslado: function()
    {
        var traslado = $('input#trid').val() ;
        var pool = $('input#poolid').val() ;
        var req = {};
        req.traslado = traslado ;
        req.pool     = pool ;
        req.costo    = $('input#trcosto').val() ;

        $.ajax({
            type: 'POST',
            url: baseUrl + '/traslados/modificarcostotrasladoservicejson',
            data: req,
            dataType: 'json',
            success: function(response)
            {
                if(response && response.type != 'ok')
                    jAlert(response.msg, 'Actualizacion traslado');

                else if(response.type == 'ok' && response.data)
                    window.location.reload();
            }
        });
    },
    modificarCostoTratamientoModal : function(tratamiento,traslado,paciente)
    {
        var modal = $('<div id="costotratamientodialog"></div>');
        modal.appendTo(document);

        modal.dialog({
            title: 'Modificar costo tratamiento',
            autoOpen: false,
            closeText: 'cerrar',
            resizable: true,
            modal: true,
            width: '300px',
            close: function(event, ui) {
                $(this).dialog('destroy').remove();
            }
        });

        var req = {};
        req.tratamiento = tratamiento ;
        req.traslado    = traslado ;
        req.paciente    = paciente ;
        modal.load( baseUrl + '/tratamientos/modificarcostomodal', req );
        modal.dialog('open');

        var scroll = $(window).scrollTop();
        $('div.ui-dialog').css('top',scroll + 90 + 'px');
    },
    submitNuevoCostoTratamiento: function()
    {
        var paciente = $('div#costo_tratamiento input#idpaciente').val() ;
        var traslado = $('div#costo_tratamiento input#idtraslado').val() ;

        var req = {};
        req.paciente    = paciente ;
        req.traslado    = traslado ;
        req.tratamiento = $('div#costo_tratamiento input#idtratamiento').val() ;
        req.tipocosto   = $('div#costo_tratamiento input#tipocosto').val() ;
        req.costo       = $('div#costo_tratamiento input#costotratamiento').val() ;

        $.ajax({
            type: 'POST',
            url: baseUrl + '/tratamientos/modificarcostoservicejson',
            data: req,
            dataType: 'json',
            success: function(response)
            {
                if(response && response.type != 'ok')
                    jAlert(response.msg, 'Actualizacion tratamiento');

                else if(response.type == 'ok')
                {
                    if(response.data.cambiotipocosto)
                        window.location.reload();
                    else
                    {
                        var data = response.data ;
                        $.each(data.costotraslados, function(index,elem) {
                            $('div#traslado' + index +' span.costo').html( elem ); 
                        });

                        $('td.pacientes span.costo#paciente' + paciente + 'traslado' + traslado).html( response.data.costotratamiento );

                        jQuery('#costotratamientodialog').dialog('close');
                    }
                }
            }
        });
    },
    modificarCostoPoolModal: function(pool)
    {
        var modal = $('<div id="costotrasladodialog"></div>');
        modal.appendTo(document);

        modal.dialog({
            title: 'Modificar Costo KM',
            autoOpen: false,
            closeText: "cerrar",
            resizable: true,
            modal: true,
            width: "300px",
            close: function(event, ui) { $(this).dialog('destroy').remove(); }
        });

        var req  = {};
        req.pool = pool ;
        modal.load( baseUrl + '/pool/modificarcostomodal/', req );
        modal.dialog('open');

        var scroll = $(window).scrollTop();
        $('div.ui-dialog').css('top',scroll + 90 + 'px');
    },
    submitNuevoCostoPool: function()
    {
        var pool  = $('input#idpoolcosto').val() ;
        var req   = {};
        req.pool  = pool ;
        req.costo = $('input#trcosto').val() ;

        $.ajax({
            type: 'POST',
            url: baseUrl + '/pool/modificarcostoservicejson',
            data: req,
            dataType: 'json',
            success: function(response)
            {
                if(response && response.type != 'ok')
                    jAlert(response.msg, 'Actualizacion Pool');

                else if(response.type == 'ok')
                    window.location.reload();
            }
        });
    }
};
/*
 * } FIN ESTRUCTURAS
 */

$.alerts.okButton = '&nbsp;ACEPTAR&nbsp;';

function inicializarMapaVerTraslados ()
{
    inicializarMapa();
}

//////////////////////////////////////////
// 
// MAPS
//
//////////////////////////////////////////
function inicializarMapa()
{
    var latlng = new google.maps.LatLng(-34.5799079,-58.4900808);
    var myOptions = {
      zoom: 9,
      center: latlng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    mapV3 = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
	var rendererOptions = {
        draggable: false,
        suppressMarkers: true,
        polilyneOptions: {
            strokeColor: "#970E04" ,
            strokeOpacity: 1.0 ,
            strokeWeight: 2 ,
            numLevels: 0
        }
    };
	directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);
	directionsService = new google.maps.DirectionsService();
    directionsDisplay.setMap(mapV3);
	geocoder = new google.maps.Geocoder();

	google.maps.event.addListener(mapV3, 'rightclick', function(event) {
		// alert("Agrego funcionalidad para agregar un nuevo punto?");
	});

	google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {		
		// alert('Hago algo cuando cambia de recorrido la ruta?');
	});	
}

var arrayDomiciliosTraslado = new Array() ;

function limpiarMarkersDomiciliosPacientesTraslado() 
{
	if(arrayDomiciliosTraslado != null && arrayDomiciliosTraslado.length > 0)
	{
		$.each(arrayDomiciliosTraslado,function() {
			this.setMap(null);
		});
	}
}

function markerPersonalizadoCentro(centro,iconUrl,limpiarMapa)
{
    // marker centro
    //if( iconUrl ) var image = baseUrl + iconUrl ;
    //else var image = 
    var image = iconUrl ? iconUrl : baseUrl + "/public/images/globitos/edificio.gif" ;

    var address = 
        '<b>Centro ' + centro.nombre + '</b><br/>' +
        centro.calle + ' ' + centro.numero + '</br>' +
        centro.localidad_nombre + '</br>' +
        centro.provincia_nombre;

    var htmlInfoWindow  = '<div><span>' + address + '</span></div>';
    var locationCentro  = new google.maps.LatLng(centro.latitud, centro.longitud);
    var markerCentro = agregarMarker(image, locationCentro, false, htmlInfoWindow);

    // registro global de markers en mapa
    if( limpiarMapa ) arrayDomiciliosTraslado.push(markerCentro);

    return markerCentro ;
}

function markerCasitaDomicilio(domicilio,limpiarMapa)
{
    var image = baseUrl + "/public/images/globitos/casita.gif";
    var address = 
        '<b>Domicilio</b><br/>' +  domicilio.Calle + ' ' + domicilio.Numero + '</br>' + 
        domicilio.Ciudad + '</br>' + 
        domicilio.Provincia;

    var htmlInfoWindow    = '<div><span>' + address + '</span></div>';
    var locationDomicilio = new google.maps.LatLng(domicilio.latitud,domicilio.longitud);
    var markerDomicilio   = agregarMarker(image, locationDomicilio, false, htmlInfoWindow);
    //markerDomicilio.zIndex = 9999 ;

    // registro global de markers en mapa
    if( limpiarMapa )
        arrayDomiciliosTraslado.push(markerDomicilio);

    return markerDomicilio ;
}

function markerPersonalizadoDomicilio (domicilio, orden, urlParcialGlobitoOrden, limpiarMapa)
{
    var image = urlParcialGlobitoOrden + orden + ".png";
    var htmldomicilio = '<b>Domicilio '+ domicilio.historia_clinica + ' - ' + domicilio.nombre + '</b>' ;

    var address =
        domicilio.calle + ' ' + domicilio.numero + ', (' + domicilio.entrecalles + ') <br/> ' +
        domicilio.ciudad + '<br/>' + 
        domicilio.provincia;

    var htmlInfoWindow    = '<div><span>'  + htmldomicilio +  '</span><br/><span>' + address + '</span></div>';
    var locationDomicilio = new google.maps.LatLng( domicilio.latitud, domicilio.longitud );
    var markerDomicilio   = agregarMarker( image, locationDomicilio, false, htmlInfoWindow );

    // registro global de markers en mapa
    if( limpiarMapa ) arrayDomiciliosTraslado.push(markerDomicilio);

    return markerDomicilio;
}

function mostrarMarkersCentroPacientes (id_centro, pacientes)
{
    limpiarMarkersDomiciliosPacientesTraslado();

    var centro = {} ;
    centro.centro = id_centro ; // por si no quedo claro es el centro

    var bounds = new google.maps.LatLngBounds();

    $.ajax({
        type:'GET',
        url: baseUrl + '/centros/ajaxobtenercentro',
        data: centro,
        dataType: 'json',
        context: gServicesLoader.ajaxContext,
        success: function(dataCentro) 
        {
            var marker = markerPersonalizadoCentro (dataCentro, baseUrl+"/public/images/globitos/hospital2.png", true);
            bounds.extend( marker.getPosition() );
        }
    });

    $.each(pacientes,function() {
        var img = this.nuevo_asignado ? baseUrl + "/public/images/globitos/ordenylw" : baseUrl + "/public/images/globitos/coincidencia" ;
        var marker = markerPersonalizadoDomicilio (this, this.orden, img, true);
        bounds.extend( marker.getPosition() );
    });

    mapV3.fitBounds(bounds);
}

//
// ASIGNACION DE RUTA DE TRASLADOS A PACIENTES
//
// esto se podría no hacer. google maps automaticamente asigna el primero y el ultimo
// para la contruccion de la ruta optima.
//
function indexCoordenadaMasLejanaPunto (coordenadas,punto)
{
    var distancias = new Array() ;

    for(var i=0; i<coordenadas.length; i++)
    {
        var elem = {} ;
        elem.indice = i ;
        elem.distancia  = distanciaEntrePuntos( coordenadas[i].latitud, coordenadas[i].longitud, punto.latitud, punto.longitud ) ;

        distancias.push( elem );
    }

    var lejano = null ;
    for(var i=0; i<distancias.length; i++)
    {
        var elem = distancias[i] ;
        if( lejano )
        {
            if( lejano.distancia < elem.distancia )
                lejano = elem ;
        }
        else lejano = elem ;
    }

    return lejano.indice ;
}
