
var ServicioComun = {
    ////SOLICITUD DE SERVICIOS ////
    autocompletecallesorigedestinoservice : function (calleOrigen, calleDestino)
    {
        $.ajax({
            type: 'GET',
            url: baseUrl + '/adminempresa/callesservicejson',
            dataType: 'json' ,
            success: function(calles)
            {
                if (calles)
                {
                    $(calleOrigen).autocomplete({
                        "data":calles,
                        "matchContains":true,
                        "scroll":false
                    }) ;

                    $(calleDestino).autocomplete({
                        "data":calles,
                        "matchContains":true,
                        "scroll":false
                    }) ;
                }
            }
        });
    } ,
    autocompletecallesservice : function (elem)
    {
        $.ajax({
            type: "GET",
            url: baseUrl + '/adminempresa/callesservicejson',
            dataType: "json",
            success: function(calles)
            {
                if (calles)
                {
                    $(elem).autocomplete({
                        "data":calles,
                        "matchContains":true,
                        "scroll":false
                    }) ;
                }
            }
        });
    } ,
    selectprovinciasservice : function (elem)
    {
        $.ajax({
            url: baseUrl + "/adminempresa/provinciasservicejson",
            dataType: "json",
            success: function( provincias ){
                $.each(provincias, function(key, value) {
                    $(elem)
                    .append($("<option></option>")
                    .attr("value",key)
                    .text(value));
                });
            }
        });
    } ,
    selectlocalidadesservice : function (elem,prov,callback)
    {
        var selected = $(prov + ' option:selected').val(); 
        $(elem).empty();

        $.ajax({
            type: "GET",
            url: baseUrl + '/adminempresa/localidadesprovinciaservicejson', 
            data: {provincia: selected},
            dataType: "json",
            success: function(localidades)
            {
                if (localidades)
                {
                    $.each(localidades, function() {
                        $(elem)
                        .append($("<option></option>")
                        .attr("value",this.id)
                        .text(this.name));
                    });

                    if(selected == 6) // SI ELIGIO CAP FED AUTOASIGNO LA LOCALIDAD
                    {
                        $(elem).attr('selectedIndex', 1);
                        $(elem).attr('disabled', 'disabled');
                    }
                    else
                        $(elem).removeAttr('disabled');
                }

                if ( callback ) callback ();
            }
        });
    } ,
    selectsitesservice : function (params)
    {
        if ( !params ) params = {} ;

        $.ajax({
            type: 'GET',
            url: baseUrl + '/adminempresa/sitesservicejson',
            data: params,
            dataType: 'json' ,
            success: function(sitesgrp)
            {
                if (sitesgrp)
                {
                    $.each(sitesgrp, function(grplabel, values)
                    {
                        var dselect = $('#desdesite') ;
                        var hselect = $('#hastasite') ;

                        if ( typeof values === "string" )
                        {
                            var opth = $("<option></option>").attr("value",grplabel).text(values);
                            var optd = opth.clone();

                            optd.appendTo(dselect);
                            opth.appendTo(hselect);
                        }
                        else if ( typeof values === "object" )
                        {
                            var grph = $("<optgroup></optgroup>").attr("label", grplabel) ;

                            $.each(values, function(value, label)
                            {
                                grph.append(
                                    $("<option></option>")
                                    .attr("value",value)
                                    .text(label)
                                );
                            });

                            var grpd = grph.clone() ;
                            dselect.append(grpd);
                            hselect.append(grph);
                        }
                    });
                }
            }
        });
    },
    selectprovinciasorigendestinoservice : function (provinciaOrigen, provinciaDestino)
    {
        $.ajax({
            type: 'GET',
            url: baseUrl + '/adminempresa/provinciasservicejson',
            dataType: 'json',
            success: function(provincias)
            {
                if (provincias)
                {
                    $.each(provincias, function(key, value) {
                        $(provinciaOrigen)
                        .append($("<option></option>")
                        .attr("value",key)
                        .text(value));
                    });

                    $.each(provincias, function(key, value) {
                        $(provinciaDestino)
                        .append($("<option></option>")
                        .attr("value",key)
                        .text(value));
                    });
                }
            }
        });
    },
    pacientesautocompletar : function(elem)
    {
        $.ajax({
            type:'GET',
            url: baseUrl + '/pacientes/pacientesjson',
            data:{format:'autocomplete'},
            dataType: 'json',
            success: function(pacientes)
            {
                if (pacientes.data)
                {
                    $(elem).autocomplete({
                        "data":pacientes.data,
                        "matchContains":true,
                        "scroll":false
                    }) ;
                }
            }
        });
    }
}
