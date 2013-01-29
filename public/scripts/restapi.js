/**
 *
 * Implementa los metodos HTTP para RESTful
 * con Payload JSON-RPC
 *
 */
var RestData = {
    host    : 'http://api.development/payload/jsonrpc20/restful',
    recurso : 'taxi' ,
    version : '2.0',
    id      : '1' ,
    getRecurso : function() {
        if( this.recurso )
            return this.host + '/' + this.recurso ;
            else return this.host + '/index' ;
    }
}

var RestJsonRpc = {
    /* extiende jquery ajax function */
    _jsonRpcAjax : function(method,resource,params,notify,success)
    {
        var self = this ;
        var header = self._header(method,params,notify) ;

        $.ajax({
            type        : method.toUpperCase(),
            url         : resource,
            data        : JSON.stringify(header),
            dataType    : "json",
            contentType : "application/json; charset=utf-8",
            headers     : {"X-Requested-With":"XmlHttpRequest"},
            success     : function(response){ if(success) success(response); },
            failure     : function(error){ }
        });
    },
    _header : function(method,params,notify)
    {
        var self = this ;
        var header = {} ;
        header.jsonrpc = RestData.version ;
        header.method  = method ;
        header.params  = params ;

        if( notify ) header.id = RestData.id ;

        return header ;
    },
    methods : {
        get    : "get",
        put    : "put",
        post   : "post",
        delete : "delete",
        head   : "head"
    } ,
    methodCall : function(fargs) {
        var self = this ;

        DBug.log( fargs );

        if( ! self.methods[ fargs.method ] )
            throw 'exception : invalid method' ;

        this._jsonRpcAjax (
            fargs.method,
            fargs.resource,
            fargs.params,
            fargs.notify,
            fargs.success
        );
    }
}

function test_get()
{
    RestJsonRpc.methodCall({
        method:"get",
        resource: RestData.getRecurso() + '/id/' + RestData.id ,
        params:{animal:'gato'},
        notify:true,
        success:function(response){ console.log(response); }
    });
}

function test_put()
{
    RestJsonRpc.methodCall({
        method:"put",
        resource: RestData.getRecurso() ,
        params:{id:RestData.id},
        notify:true,
        success:function(response){ console.log(response); }
    });
}

function test_post()
{
    RestJsonRpc.methodCall({
        method:"post",
        resource: RestData.getRecurso() ,
        params:{id:RestData.id},
        notify:true,
        success:function(response){ console.log(response); },
        failure  : function(response){ console.log(response); }
    });
}

function test_delete()
{
    RestJsonRpc.methodCall({
        method   : "delete",
        resource : RestData.getRecurso() ,
        params   : {id:RestData.id},
        notify   : true,
        success  : function(response){ console.log(response); },
        failure  : function(response){ console.log(response); }
    });
}
