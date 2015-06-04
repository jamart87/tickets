var eventoGlobal = 0;
var localidadGlobal = 0;
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        //app.showLoading('show');
         
        app.initApp();
    },
    /*********
    INICIAR DATABASE
    **********/ 
    initApp: function() {
        database.initDatabase(function(isOk) {
        });
    },
    /*********
    FUNCION PARA INICIAR ESCANEO DE BOLETO
    **********/
    startScan: function(){
    cordova.plugins.barcodeScanner.scan(
        function (result) {
            var tipo_evento = window.localStorage.getItem('tipo_evento');

            console.log("Tipo Evento "+tipo_evento);
            if (tipo_evento != 1) {
                app.getBoletoQr( result.text );
            } else {
                app.updateStatusInvitacionEventoPrivado( result.text );
            }
        }, 
        function (error) {
            alert("Scanning failed: " + error);
        }
        );
    },
    /*********
    FUNCION QUE ACTUALIZA EL ESTADO DEL BOLETO POR QR
    **********/
    getBoletoQr: function(qr) {
        database.selectBoletoByQr([qr, localidadGlobal],function(results) {
                    if (results !== null && results.rows.length != 0) {
                        var len = results.rows.length;
                        var estado = "";
                        var boleto = "";
                        var ev = "";
                        for (var i = 0; i < len; i++) {
                            var row= results.rows.item(i);
                            estado = row['estado'];
                            boleto = row['boleto_id'];
                            numero = row['numero'];
                            mesa     = row['mesa_numero'];
                            posicion = row['posicion'];
                        }

                        if (estado == "0") {
                            database.updateBoletoEstado([ 1, boleto], function(isOk) {
                                        if (app.checkConectionState()) {
                                        app.updateBoletoWS( 1, boleto,function(){
                                             app.showAlert("Entrada Valida", "KLIKTICKET");
                                             app.addBoletoScan(numero, boleto, mesa, posicion, 1);
                                        }); } else {
                                            app.showAlert("Entrada Valida", "KLIKTICKET");
                                            app.addBoletoScan(numero, boleto, mesa, posicion, 1);
                                        }
                                       
                            });     
	                    } else if ( estado == "1" || estado == "3" ) {
                              
                              database.updateBoletoEstado([ 2, boleto], function(isOk) {
                                        if (app.checkConectionState()) {
                                        app.updateBoletoWS( 2, boleto,function(){
                                             app.showAlert("ENTRE", "KLIKTICKET");
                                             app.changeBoletoStatusScan(boleto, "ADENTRO DE VIP");
                                        }); } else {
                                            app.showAlert("ENTRE", "KLIKTICKET");
                                            app.changeBoletoStatusScan(boleto, "ADENTRO DE VIP");
                                        }
                                       
                              });  


                        } else if ( estado == "2" ) {
                              
                              database.updateBoletoEstado([ 3, boleto], function(isOk) {
                                        if (app.checkConectionState()) {
                                        app.updateBoletoWS( 3, boleto,function(){
                                             app.showAlert("SALGA", "KLIKTICKET");
                                             app.changeBoletoStatusScan(boleto, "AFUERA DE VIP");
                                        }); } else {
                                            app.showAlert("SALGA", "KLIKTICKET");
                                            app.changeBoletoStatusScan(boleto, "AFUERA DE VIP");
                                        }
                                       
                              });  
                        } 
                        
                    }
                    else {
                        console.log("ENTRADA INVALIDA");
                        navigator.notification.vibrate(1000);
                        if (app.checkConectionState()) {
                                  app.insertLogWS("ENTRADA INVALIDA Qr:"+qr);
                        } else { 
                            database.insertLog([app.getUserData("user"), "ENTRADA INVALIDA qr: "+qr, app.getNowDate() ],function(){
                                console.log("log inserted");
                            }); 
                        }
                        app.showAlert("ENTRADA INVALIDA", "KLIKTICKET");
                    }
        });
    },


    // ACTUALIZAR INVITACION CON WS

    updateStatusInvitacionEventoPrivado: function(qr) {
                 var evento_id   = window.localStorage.getItem('evento_id');
                 app.showLoading("show");

                 database.selectInvitacionByQr([qr, evento_id],function(results) {      
                       app.showLoading("show");
                       if (results !== null && results.rows.length != 0) {
                        var len = results.rows.length;
                        var estado = "";
                        var cliente = "";
                        var vip = "";
                       
                        for (var i = 0; i < len; i++) {
                            var row= results.rows.item(i);
                            estado = row['estado'];
                            cliente = row['cliente_id'];
                            vip = row['vip'];
                        }
                       
                       var st = 0;
                       var alertMsg = "";
                       switch (estado) {
                          case 0:
                            st = 1;
                            alertMsg = "ENTRADA VALIDA";
                          break;
                          case 1:
                            st = 2;
                            alertMsg = "ADENTRO";
                          break;
                          case 2:
                            st = 3;
                            alertMsg = "AFUERA";
                          break;
                          case 3:
                            st = 2;
                            alertMsg = "ADENTRO";
                          break;
                       }
                        
                       if ( vip == "1" || estado == "0") { 
	                       if (app.checkConectionState()) {
	                       app.updateInvitacionWS( st, qr,function(result){
	                                 app.showLoading("hide");
	                                 if (result) {
	                                    app.showAlert( alertMsg, "KLIKTICKET");
	                                 }
	                       }); 
	                       } else {
	                            database.updateInvitacionEstado([ st , cliente, evento_id], function(isOk) {
	                                app.showAlert( alertMsg , "KLIKTICKET");
	                                app.getInvitacionesDB(evento_id);
	                            });
	                       }
                   	   } else if (vip == "0" && estado >= 1){
                   		 app.showLoading("hide");
                   		 app.showAlert("ENTRADA INVALIDA", "KLIKTICKET");
                   	   }
                       
                    } else {
                         app.showLoading("hide");  
                         app.showAlert("ENTRADA INVALIDA", "KLIKTICKET");
                    }
                   
                });
    },

    /*********
    ACTUALIZA EL ESTADO DE LA INVITACION SI EL EVENTO ES PRIVADO
    **********/
    updateInvitacionWS: function(estado, qr, callback) {
        app.showLoading("show");

        var conexion_type = window.localStorage.getItem('conexion_type');
        var evento_id   = window.localStorage.getItem('evento_id');
        
        console.log("Evento id: "+evento_id);

        var status = navigator.network.connection.type;
        if (conexion_type == 1 && navigator.network && status != "none") {
        
        $.ajax({
            type: 'post',
            url: webServices.updateInvitacionQr,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user") ), "token": app.encrypt( app.getUserData("token") ), "qr": qr, "evento": evento_id, "estado": estado },
            async: false,
            success: function (r) {
                   if(r.response && r.cliente > 0) {
                        database.updateInvitacionEstado([ estado, r.cliente, evento_id], function(isOk) {
                                app.getInvitacionesDB(evento_id);
                        });
                        callback(true);
                        app.showLoading("hide");
                   } else {
                        callback(true);
                        app.showLoading("hide");
                   }
                   
            },
            error: function() {
                   callback(false);
                   app.showLoading("hide");
                   app.showAlert("Problema de conexión", "KLIKTICKET");
            }
        });
        
        } else {
            callback(false);   
        }
        
    },
    /*********
    HACE PRUEBAS PARA VER SI HAY CONEXION A INTERNET
    **********/
    checkConectionState: function(){
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        if (conexion_type == 1 && navigator.network && status != "none") {
            return true;
        } else return false;
    },
    /*********
    OBTIENE LA FECHA ACTUAL
    **********/
    getNowDate: function() {
        var fecha = new Date(); 
        var finalDate = fecha.getFullYear() + '-' + (fecha.getMonth() + 1) + '-' + fecha.getDate()+' '+fecha.getHours()+':'+fecha.getMinutes()+':'+fecha.getSeconds();
        return finalDate;

    },
    /*********
    HACE INSERT DEL LOG
    **********/

    insertLogWS: function(accion) {
        app.showLoading("show");

        $.ajax({
            type: 'post',
            url: webServices.insertLog,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user") ), "token": app.encrypt( app.getUserData("token") ), "accion": accion},
            async: false,
            success: function (r) {
                   if(r.response) {
                   app.showLoading("hide");
                   } 
            },
            error: function() {
                   app.showLoading("hide");
            }
        });
        
        
    },
    /*********
    ACTUALIZA EL ESTADO DEL BOLETO
    **********/
    updateBoletoWS: function(estado, idBoleto, callback) {
        app.showLoading("show");

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        if (conexion_type == 1 && navigator.network && status != "none") {
        
        $.ajax({
            type: 'post',
            url: webServices.updateBoletoQr,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user") ), "token": app.encrypt( app.getUserData("token") ), "boleto_id": idBoleto, "estado": estado},
            async: false,
            success: function (r) {
                   if(r.response) {
                   app.showLoading("hide");
                   callback(true);
                   } 
            },
            error: function() {
                   callback(true);
                   app.showLoading("hide");
                   app.showAlert("Error de conexión update boleto", "KLIKTICKET");
            }
        });
        
        } else {
            callback(true);   
        }
        
    },

    /*********
    FUNCION QUE HACE EL LOGIN DE USUARIO
    **********/

    login: function()
    {
        var name = $('input#username').val();
        var password = $('input#password').val();
        app.showLoading("show");
        if (name != "" && password != "") {
            app.showLoading("show");
            $.ajax({
                type: 'post',
                url: webServices.login,
                dataType: 'json',
                data: { "name": app.encrypt(name), "password": app.encrypt(password) },
                async: false,
                success: function (data) {
                    if (data.result) {
                        window.localStorage.setItem('session_token', data.token);
                        window.localStorage.setItem('session_user', data.id);
                        window.localStorage.setItem('conexion_type', 1);
                        
                        app.showLoading("show");
                        app.getEventosDB();
                        app.getMode();
                        
                        /*app.showLoading("show");
                        app.cargarBoletos(function(){
                            database.initDatabaseClearAll(function(isOk) {
                                if(isOk){
                                    app.showLoading("show");
                                    app.getBoletosByUser();
                                    app.getLocalidadesByUser();
                                    app.getEventos();
                                    app.getMode();
                                }
                            });
                        });*/
                         $('input#username').val('');
                         $('input#password').val('');
        
                         $.mobile.changePage("#home");
                    } else {
                        app.showLoading("hide");
                        app.showAlert("Usuario o Password incorrecto!", "KLIKTICKET");
                    }        
                },
                error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
                }
            });
        } else {
            app.showLoading("hide");
            app.showAlert("Ingrese usuario y password", "KLIKTICKET");
        }
        
    },
    /*********
    FUNCION PARA MOSTAR ALERTA
    **********/
    showAlert: function(msg, title){
        function alertDismissed() {
        }

        navigator.notification.alert(
            msg,  // message
            alertDismissed,         // callback
            title,            // title
            'OK'                  // buttonName
        );
    },
    /*********
    HACE LOGOUT
    **********/
    logout: function()
    {       
             app.showLoading("show");
                   
             $.ajax({
                type: 'post',
                url: webServices.logout,
                dataType: 'json',
                data: { "user" : app.encrypt( app.getUserData("user") ) },
                async: false,
                success: function (data) {
                    if (data.result) {
                        window.localStorage.setItem('session_user', null);
                        window.localStorage.setItem('session_token', null);
                        app.showLoading("hide");
                        $.mobile.changePage("#login"); 
            
                    }        
                },
                error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
                }
            });
    },
    /*********
    SINCRONIZA LOS DATOS DEL TELEFONO CON LA BASE DE DATOS
    **********/
    sync: function(type,callback) {
        status = navigator.network.connection.type;
        app.showLoading('show');
        if (navigator.network && status != "none") {          
            if ( type == "all" ) {
                app.getEventos();
                app.getMode();
                app.getBoletosByUser();
                app.getLocalidadesByUser();
            }
            callback(true);
        }

        else {
            alert("Tiene Problemas de Conexión");
            callback(false);
        }
    },
    /*********
    ACTUALIZA EL MODO DE MANEJO DE LA APP ( ONLINE / OFFLINE)
    **********/
    setMode: function(mode) {
        if (mode == "ON") {
            mode = 1;    
        } else {
            mode = 0;
        }
        database.selectMode( [ 1 ], function(results) {
           
            /*if (results !== null) {
                if (results.rows.length == 0) {
                   app.syncAll2(function(isok){
                
                    database.insertMode([mode], function(isOk) {
                            window.localStorage.setItem('conexion_type', mode);
                    });
                    
                    });    
                } else {
                 
                 database.updateMode([mode, 1], function(isOk) {
                    if (mode == 0) {
                    app.syncAll2(function(isok){
                        window.localStorage.setItem('conexion_type', mode);
                    });
                    } else {
                       window.localStorage.setItem('conexion_type', mode);
                    }
                 });      
                }
            } */

            if (results !== null) {
                if (results.rows.length == 0) {
                 //  app.syncAll2(function(isok){
                
                    database.insertMode([mode], function(isOk) {
                            window.localStorage.setItem('conexion_type', mode);
                    });
                    
                   // });    
                } else {
                 
                 database.updateMode([mode, 1], function(isOk) {
                    if (mode == 0) {
                   // app.syncAll2(function(isok){
                        window.localStorage.setItem('conexion_type', mode);
                    // });
                    } else {
                       window.localStorage.setItem('conexion_type', mode);
                    }
                 });      
                }
            }
                            
        });
    },
    /*********
    OBTIENE EL MODO DE LA APP
    **********/
    getMode:function(){
        database.selectMode([1],function(results) {
                        if (results !== null) {
                                var row= results.rows.item(0);
                                mode = row['status'];
                                window.localStorage.setItem('conexion_type', mode);
                                if (mode == 1) {
                                    $("#mode").slider();
                                    $("#mode").val("ON").flipswitch("refresh");
                                }
                                else {
                                    $("#mode").slider();
                                    $("#mode").val("OFF").flipswitch("refresh");
                                }
                            
                        }
         });
    },
    /*********
    MOSTRAR CARGADOR
    **********/
    showLoading: function(showOrHide) {
        try
        {
            player.pauseVideo();
            playerArtista.pauseVideo();

        }
        catch(ex)
        {}
        $.mobile.loading( showOrHide, {
            text: 'Por favor espere Actualizando...',
            textVisible: true,
            theme: 'b',
        });
    },
    /*********
    OBTIENE EL ID Y EL TOKEN DE SESION
    **********/  
    getUserData: function(Type){
        if (Type == "user")
            return window.localStorage.getItem('session_user');
        else if (Type == "token")
                 return window.localStorage.getItem('session_token');
    },
    /*********
    OBTENER EVENTOS
    **********/
    getEventos: function() {
        app.showLoading("show");

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.eventos,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user") ), "token": app.encrypt( app.getUserData("token") )},
            async: false,
            success: function (r) {
                   if(r.response) {
                   var eventos = r.data;
                   var count = 0;
                   var target = eventos.length; 

                   if (target == 0)
                       app.showLoading("hide");

                   eventos.forEach(function(ob) {
                        database.selectEvento([ob.evento_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {
                                    database.insertEvento([ob.evento_id, ob.nombre,ob.descripcion,ob.imagen, ob.video, ob.fecha,ob.hora,ob.lugar,ob.comision,ob.boletaje,ob.existencia, ob.tipo_evento_tipo_evento_id,ob.pais_pais_id,ob.organizacion_organizacion_id], function(isOk) {
                                        count++;
                                        if(count == target)
                                        app.getEventosDB();
                                    });    
                                }
                                
                            }
                            
                            
                        });

                         
                    });
                    app.getEventosDB();
                    } 
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } else {
            //WHEN THERE IS NO INTERNET
            app.getEventosDB();
        }
        
    },
    /*********
    OBTENER EVENTOS DEL TELEFONO
    **********/
 
    getEventosDB: function(tx) {
             console.log("printing eventos");
             database.selectEventos(function(results) {
                if (results !== null) {
                    var eventosContainer = $("#eventos_list");
                    eventosContainer.empty();                    

                    var len = results.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        var row= results.rows.item(i);
                        
                        
                        var nombre = row['nombre'];
                        
                        var htmlData = '';
                        htmlData += '<li id="evento-'+row["evento_id"]+'">';
                            htmlData += '<a onclick="app.verLocalidades('+row["evento_id"]+', '+row["tipo_evento_tipo_evento_id"]+')" href="#">';
                            htmlData += nombre;
                            htmlData += '</a>';
                        htmlData += '</li>';
                        eventosContainer.append(htmlData);                                              
                    }
                    eventosContainer.listview( "refresh" );  
                    //app.showLoading("hide");
            
                }

                else {
                    console.log("No hay eventos que mostrar");
                }
            });
    },
    /*********
    OBTENER BOLETOS
    **********/

    getBoletos: function(id, loc, callback) {
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        app.showLoading("show");
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.boletos,
            dataType: 'json',
            data: { "evento_id": id , "user": app.encrypt( app.getUserData("user") ) , "token": app.encrypt( app.getUserData("token") )},
            async: false,
            success: function (r) {
                   if(r.response) {
                   boletos = r.data;
                   var count = 0;
                   var target = boletos.length; 
                   boletos.forEach(function(ob) {
                        database.selectBoleto([ob.boleto_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {
                                   database.insertBoleto([ob.boleto_id, ob.numero,ob.qr,ob.estado, ob.evento_evento_id, ob.detalle_localidad_id, ob.mesa_id, ob.capacidad, ob.disponibles, ob.numeroMesa, ob.posicion ], function(isOk) {
                                        console.log("boleto: "+ob.evento_evento_id+", loc:"+ ob.detalle_localidad_id );
                                        count++;
                                        if(count == target) {
                                            app.getBoletosDB(id, loc);
                                            ////app.showLoading("hide");
                                        }
                                    });    
                                }
                            }
                        });
                    });
                   callback(true);
                  }
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } else {
            app.getBoletosDB(id, loc);
            callback(true);
        }
    },
    /*********
    OBTENER BOLETOS POR USUARIO
    **********/

    getBoletosByUser: function() {
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        app.showLoading("show");
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.boletosByUser,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user")) , "token": app.encrypt( app.getUserData("token") ) },
            async: false,
            success: function (r) {
                if(r.response) {
                   app.showLoading("show"); 
                   boletos = r.data;
                   var count = 0;
                   var target = boletos.length; 
                   
                   if (target == 0)
                       app.showLoading("hide"); 
                   boletos.forEach(function(ob) {
                        database.selectBoleto([ob.boleto_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {
                                   database.insertBoleto([ob.boleto_id, ob.numero,ob.qr,ob.estado, ob.evento_evento_id, ob.detalle_localidad_id, ob.mesa_id, ob.capacidad, ob.disponibles, ob.numeroMesa, ob.posicion ], function(isOk) {
                                        console.log("boleto insertado "+ob.boleto_id+" evento:"+ ob.evento_evento_id);
                                        count++;
                                        if(count == target) {
                                           app.showLoading("hide");
                                        }
                                   });    
                                }
                            }
                        });
                    });
               }
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } 
     },
     /*********
    OBTENER INVITACIONES POR USUARIO
    **********/

    getInvitacionesByUser: function() {
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        app.showLoading("show");
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.invitacionesByUser,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user")) , "token": app.encrypt( app.getUserData("token") ) },
            async: false,
            success: function (r) {
                if(r.response) {
                   app.showLoading("show"); 
                   invitaciones = r.data;

                   var count = 0;
                   var target = invitaciones.length; 

                   if (target == 0)
                       app.showLoading("hide");
                   
                   invitaciones.forEach(function(ob) {
                        database.selectInvitacion([ob.invitacion_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {
                                   database.insertInvitacion([ob.invitacion_id, ob.cliente_cliente_id, ob.evento_evento_id ,ob.qr , ob.estado, ob.nombres, ob.apellidos, ob.vip], function(isOk) {
                                        console.log("invitacion insertada "+ob.invitacion_id+" evento:"+ ob.evento_evento_id);
                                        count++;
                                        if(count == target) {
                                           app.showLoading("hide");
                                        }
                                   });    
                                }
                            }
                        });
                    });
               }
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } 
     },

     /*********
    OBTENER LOCALIDADES POR USUARIO
    **********/

     getLocalidadesByUser: function() {
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.localidadByUser,
            dataType: 'json',
            data: {"user": app.encrypt( app.getUserData("user")) , "token": app.encrypt( app.getUserData("token") ) },
            async: false,
            success: function (r) {
                if(r.response) {
                   localidad = r.data;
                   var count = 0;
                   var target = localidad.length; 

                   if (target == 0)
                       app.showLoading("hide");

                   localidad.forEach(function(ob) {
                       database.selectLocalidad([ob.detalle_localidad_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {;
                                   inspar = [ob.detalle_localidad_id, ob.nombre,ob.descripcion,ob.filas, ob.columnas, ob.capacidad, ob.mesas, ob.precio, ob.existencia, ob.estado, ob.evento_evento_id ];
                                   console.log( JSON.stringify( inspar));
                                   database.insertLocalidad(inspar, function(isOk) {
                                       console.log("LOCALIDAD INSERTADA "+ob.nombre);
                                       count++;
                                        if(count == target) {
                                             ////app.showLoading("hide");
                                        }
                                   });    
                                }
                            }
                        });
                    });
                   
               }
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } 
    },
    /*********
    OBTENER LOCALIDADES DE BASE DE DATOS
    **********/

    getLocalidades: function(id, callback) {
        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        if (conexion_type == 1 && navigator.network && status != "none") {
        $.ajax({
            type: 'post',
            url: webServices.localidadByEvento,
            dataType: 'json',
            data: { "evento_id": id, "user": app.encrypt( app.getUserData("user") ) , "token": app.encrypt( app.getUserData("token") )},
            async: false,
            success: function (r) {
                   if(r.response) {
                   localidad = r.data;
                   var count = 0;
                   var target = localidad.length;
                   localidad.forEach(function(ob) {
                        database.selectLocalidad([ob.detalle_localidad_id], function(results) {
                            if (results !== null) {
                                if (results.rows.length == 0) {;
                                   inspar = [ob.detalle_localidad_id, ob.nombre,ob.descripcion,ob.filas, ob.columnas, ob.capacidad, ob.mesas, ob.precio, ob.existencia, ob.estado, id ];
                                   database.insertLocalidad(inspar, function(isOk) {
                                        count++;
                                        if(count == target)
                                            app.getLocalidadDB(id);
                                    });    
                                }
                            }
                        });
                    });
                   callback(true);
                  }
            },
            error: function() {
                   app.showLoading("hide");
                   app.showAlert("Error de conexión", "KLIKTICKET");
            }
        });
        } else {
            app.getLocalidadDB(id);
            callback(true);
        }
        
    },
    verBoletos: function(id, loc) {
        localidadGlobal = loc;
        eventoGlobal    = id;

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        /*if (conexion_type == 1 && navigator.network && status != "none") {
        
        app.getBoletos(id, loc, function(){
            app.getBoletosDB(id, loc);
            $.mobile.changePage("#boletos");    
        });
        } else{*/
            app.getBoletosDB(id, loc);
            $.mobile.changePage("#boletos");    
        //}     
          
    },

    verLocalidades: function(id, tipo_evento) {
        
        // SET Tipo Evento
        window.localStorage.setItem('tipo_evento', tipo_evento);
        
        window.localStorage.setItem('evento_id', id);

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        if (conexion_type == 1 && navigator.network && status != "none") {
        
        // SI EL EVENTO NO ES PRIVADO
        if (tipo_evento != 1) {
            app.getLocalidades(id, function(){
               app.getLocalidadDB(id);
                $.mobile.changePage("#localidades");    
            });
        } else {
           // SI EL EVENTO ES PRIVADO
           app.getInvitacionesDB( id );
           $.mobile.changePage("#invitaciones");   

        }
        } else{
            if (tipo_evento != 1) {
            app.getLocalidadDB(id);
            $.mobile.changePage("#localidades");
            } else {
               // SI EL EVENTO ES PRIVADO
               app.getInvitacionesDB( id );
               $.mobile.changePage("#invitaciones");   
           }   
        }     
          
    },
    addBoletoScan: function(numero, id, mesa, posicion, status){
       var boletosContainer = $("#boletos_list");
       var img = "";
       if (status == 0)
            img = "<p id='boleto-"+ id  +"' class='ui-li-aside'>No escaneado</p>";
       else if (status == 1) 
             img = "<p id='boleto-"+ id  +"' class='ui-li-aside escaneado'>Escaneado</p>";
       else if (status == 2) 
             img = "<p id='boleto-"+ id  +"' class='ui-li-aside escaneado'>Afuera</p>";
       else if (status == 3) 
             img = "<p id='boleto-"+ id  +"' class='ui-li-aside escaneado'>Reingreso</p>";
  
       var htmlData = '';

       if (mesa == null)
            mesa = 0;
       
       htmlData += '<li id="evento-'+id+'">';
       htmlData += '<a onclick="app.verBoletoDetalle('+id+')" href="#">';
       htmlData += '<h2 class="ui-li-heading"><strong> Boleto No: </strong>'+numero+'</h2>'+img;
       htmlData += '<p class="ui-li-desc"> <strong> Mesa: </strong>'+ mesa +' Posición: </strong>'+ posicion +'</p>';
       htmlData += '</a>';
       htmlData += '</li>';

       boletosContainer.append(htmlData);
       boletosContainer.listview( "refresh" ); 
        
    },

    changeBoletoStatusScan: function( id, text ){
        $("#boleto-"+id).html(text);
        console.log(text);
    },

    getBoletosDB: function(id, loc) {
             app.showLoading("show");
             console.log("get boletos loc");
             database.selectBoletos([id, loc],function(results) {
                if (results !== null) {
                    app.showLoading("show");
                    var boletosContainer = $("#boletos_list");
                    boletosContainer.empty();                    

                    var len = results.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        var row= results.rows.item(i);
                        
                        console.log("Estado boleto " +row['estado']);
                        var numero = row['numero'];
                        var img = "";
                        if (row['estado'] == 0)
                            img = "<p id='boleto-"+ row["boleto_id"]  +"' class='ui-li-aside'>VALIDO</p>";
                        else if (row['estado'] == 1) 
                             img = "<p id='boleto-"+ row["boleto_id"]  +"' class='ui-li-aside escaneado'>YA VALIDADO</p>";
                        else if (row['estado'] == 2) 
                             img = "<p id='boleto-"+ row["boleto_id"]  +"' class='ui-li-aside afuera'>AFUERA</p>";
                        else if (row['estado'] == 3) 
                             img = "<p id='boleto-"+ row["boleto_id"]  +"' class='ui-li-aside reingreso'>REINGRESO</p>";
                        
                         var m = "";
                         if (row["mesa_numero"] == null)
                             m = 0;
                         else 
                             m = row["mesa_numero"];
          
                        var htmlData = '';
                        htmlData += '<li id="evento-'+row["boleto_id"]+'">';
                            htmlData += '<a onclick="app.verBoletoDetalle('+row["boleto_id"]+')" href="#">';
                            //htmlData += img;
                            htmlData += '<h2 class="ui-li-heading"><strong> Boleto No: </strong>'+numero+'</h2>'+img;
                            htmlData += '<p class="ui-li-desc"> <strong> Mesa: </strong>'+ m +' Posición: </strong>'+ row["posicion"] +'</p>';
                            htmlData += '</a>';
                        htmlData += '</li>';
                        boletosContainer.append(htmlData);                                              
                    }

                    boletosContainer.listview( "refresh" );

                    database.selectLocalidad([loc], function(results) {
                            if (results !== null) {
                                if (results.rows.length != 0) {
                                   var row2= results.rows.item(0);
                                   $("#locNombre").html(row2["nombre"]);
                                   $("#locDescripcion").html(row2["descripcion"]);
                                   $("#locFilas").html(row2["filas"]);
                                   $("#locColumnas").html(row2["columnas"]);
                                   $("#locCapacidad").html(row2["capacidad"]);
                                   $("#locMesas").html(row2["mesas"]);
                                   $("#locPrecio").html(row2["precio"].toFixed(2));
                                   $("#locExistencia").html(row2["existencia"]);
                                   $("#headerLocalidad").html(row2["nombre"]);    
                                }
                            }
                    });
                    app.showLoading("hide");  
                }

                else {
                    console.log("No hay eventos que mostrar");
                }
            });
    },

    getInvitacionesDB: function(id) {
             app.showLoading("show");
             console.log("get invitaciones");
             database.selectInvitaciones([id],function(results) {
                if (results !== null) {
                    app.showLoading("show");
                    var InvContainer = $("#invitaciones_list");
                    InvContainer.empty();                    

                    var len = results.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        var row= results.rows.item(i);
                         
                        var estado = row["estado"]; 

                        switch (estado) {
                          case 0:
                            img = "<p id='invitacion-"+ row["invitacion_id"]  +"' class='ui-li-aside escaneado'>VALIDO</p>";
                          break;
                          case 1:
                            img = "<p id='invitacion-"+ row["invitacion_id"]  +"' class='ui-li-aside escaneado'>YA VALIDADO</p>";
                          break;
                          case 2:
                            img = "<p id='invitacion-"+ row["invitacion_id"]  +"' class='ui-li-aside reingreso'>ADENTRO VIP</p>";
                          break;
                          case 3:
                            img = "<p id='invitacion-"+ row["invitacion_id"]  +"' class='ui-li-aside afuera'>AFUERA VIP</p>";
                          break;
                       }
                        
                       
                        var htmlData = '';
                        htmlData += '<li>';
                            htmlData += '<a href="#">';
                            htmlData += '<h2 class="ui-li-heading"><strong> Invitacion No: </strong>'+ row["invitacion_id"] +'</h2>'+img;
                            htmlData += '<p class="ui-li-desc"> <strong> Nombre: </strong>'+ row["nombres"] +' '+row["apellidos"]+'</p>';
                            if (row['vip'] == "1")
                            	 htmlData += '<h2 class="ui-li-heading">VIP</h2>';
                            htmlData += '</a>';
                        htmlData += '</li>';
                        InvContainer.append(htmlData);                                              
                    }

                    InvContainer.listview( "refresh" );

                    app.showLoading("hide");  
                }

                else {
                    console.log("No hay Invitaciones que mostrar");
                }
            });
    },


    getLocalidadDB: function(id) {
             app.showLoading("show");
             database.selectLocalidades([id],function(results) {
                if (results !== null) {
                    var localidadContainer = $("#localidades_list");
                    localidadContainer.empty();                    

                    var len = results.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        var row= results.rows.item(i);
                        
                        
                        var nombre = row['nombre'];
                        
                        var htmlData = '';
                        htmlData += '<li id="localidad-'+row["localidad_id"]+'">';
                            htmlData += '<a onclick="app.verBoletos('+row["evento_id"]+','+row["localidad_id"]+')" href="#">';
                            htmlData += nombre;
                            htmlData += '</a>';
                        htmlData += '</li>';
                        localidadContainer.append(htmlData);                                              
                    }
                    localidadContainer.listview( "refresh" );  
                    //app.showLoading("hide");  
                }

                else {
                    console.log("No hay localidades que mostrar");
                }
            });
    },
    verBoletoDetalle:function(){
        $( "#detalle_boleto" ).popup( "open");
    },

    /*********
    SINCRONIZAR BOLETOS CON BASE DATOS
    **********/

    syncAll:function(){

        function onConfirm(buttonIndex) {
         if (buttonIndex == 1){
            app.showLoading("show");
            app.cargarBoletos(function(){

                database.initDatabaseClearAll(function(isOk) {
                    if(isOk){
                        app.getEventos();
                        app.getBoletosByUser();
                        app.getLocalidadesByUser();
                        app.getInvitacionesByUser();
                    }
                });
            });    
         }
        }

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        if (conexion_type == 1 && navigator.network && status != "none") {
        
        navigator.notification.confirm(
                '¿ESTA SEGURO DE ACTUALIZAR?', 
                 onConfirm,            
                'KLIKTICKET',           
                ['ACTUALIZAR','CANCELAR']         
        );

        } else{
            app.showAlert("Necesita conectarse a la red para actualizar", "KLIKTICKET");
        }
        
        
        
    },
     syncAll2:function(callback){

        function onConfirm(buttonIndex) {
         if (buttonIndex == 1){
            app.showLoading("show");
            app.cargarBoletos(function(){

                database.initDatabaseClearAll(function(isOk) {
                    if(isOk){
                        app.getEventos();
                        app.getBoletosByUser();
                        app.getLocalidadesByUser();
                        callback(true);
                    }
                });
            });    
         }
        }

        var conexion_type = window.localStorage.getItem('conexion_type');
        var status = navigator.network.connection.type;
        
        if (navigator.network && status != "none") {
        
        navigator.notification.confirm(
                '¿DESEA ACTUALIZAR SU BASE DE DATOS?', 
                 onConfirm,            
                'KLIKTICKET',           
                ['ACTUALIZAR','CANCELAR']         
        );

        } else{
            app.showAlert("Necesita conectarse a la red para actualizar", "KLIKTICKET");
        }
        //callback(true);
        
        
    },
    /*********
    FUNCION PARA ENCRIPTAR
    **********/

    encrypt: function(data){
        var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
          var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
            ac = 0,
            enc = '',
            tmp_arr = [];

          if (!data) {
            return data;
          }

          do { // pack three octets into four hexets
            o1 = data.charCodeAt(i++);
            o2 = data.charCodeAt(i++);
            o3 = data.charCodeAt(i++);

            bits = o1 << 16 | o2 << 8 | o3;

            h1 = bits >> 18 & 0x3f;
            h2 = bits >> 12 & 0x3f;
            h3 = bits >> 6 & 0x3f;
            h4 = bits & 0x3f;

            // use hexets to index into b64, and append result to encoded string
            tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
          } while (i < data.length);

          enc = tmp_arr.join('');

          var r = data.length % 3;

          return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
    },
    /*********
    CARGA BOLETOS ESCANEADOS A BASE DE DATOS
    **********/

    cargarBoletos: function(callback) {
           var boletos = [];
           var inv     = [];
           var log     = [];
           database.selectBoletosAll(function(results) {
                if (results !== null) {
                    
                    var len = results.rows.length;
                    
                    for (var i = 0; i < len; i++) {
                        var row= results.rows.item(i);
                        
                        if (row['estado'] == 1 || row['estado'] == 2 || row['estado'] == 3 )
                            boletos.push( [ row['boleto_id'], row['estado'] ] );
                    }

                    database.selectLog(function(r){
                         if (r !== null) {
                    
                        var len2 = r.rows.length;
                        
                        for (var i = 0; i < len2; i++) {
                            var row2 = r.rows.item(i);
                            
                            log.push( [ row2['accion'],row2['fecha'] ] );
                        } 
                        }

                        database.selectInvitacionesAll(function(results2) {
                            
                            if (results2 !== null) {
                                
                                var len = results2.rows.length;
                                
                                for (var i = 0; i < len; i++) {
                                    var row= results2.rows.item(i);
                                    
                                    if (row['estado'] == 1 || row['estado'] == 2 || row['estado'] == 3 )
                                        inv.push( [ row['invitacion_id'], row['estado'] ] );
                                }
                            }


                            if (boletos.length > 0 || log.length > 0 || inv.length > 0) {
                            
                            if (boletos.length == 0)
                               boletos.push( [ 0, 0 ] );

                            if (inv.length == 0)
                               inv.push( [ 0, 0 ] );

                                     
                            $.ajax({
                            type: 'post',
                            url: webServices.cargarBoletos,
                            dataType: 'json',
                            data: { "user": app.encrypt(app.getUserData("user")) , "data": boletos,"log":log ,"inv": inv ,"token": app.encrypt( app.getUserData("token") ) },
                            async: false,
                            success: function (r) {
                                   console.log("cargando boletos");
                                   callback(true);
                            },
                            error: function() {
                                   app.showAlert("Error de conexión Cargar", "KLIKTICKET");
                            }
                            });

                            } else {
                                 callback(true);
                            } 

                        });

                    });

                    
                   
                } else {
                    console.log("No hay boletos que mostrar");
                }
        });
    },
};