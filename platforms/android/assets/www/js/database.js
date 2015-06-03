var db = window.openDatabase("Database", "1.0", "Kliktickets", 200000);

var database = {

	initDatabase: function(callback) {
		db.transaction(
			database.populateDB,
			function(error) {
				console.log("Error processing SQL: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
	},

	initDatabaseClearAll: function(callback) {
		db.transaction(
			database.populateDBBlank,
			function(error) {
				console.log("Error processing SQL: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
	},

	populateDB: function(tx) {
        // table eventos
        //tx.executeSql('DROP TABLE IF EXISTS EVENTO');
        tx.executeSql('DROP TABLE IF EXISTS EVENTO');
        tx.executeSql('CREATE TABLE IF NOT EXISTS EVENTO (evento_id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT, imagen TEXT, video TEXT, fecha DATE, hora TEXT, lugar TEXT, comision REAL, boletaje INTEGER, existencia INTEGER, tipo_evento_tipo_evento_id INTEGER, pais_pais_id INTEGER, organizacion_organizacion_id INTEGER )');
    	// CREATE TABLE BOLETOS
    	tx.executeSql('DROP TABLE IF EXISTS BOLETO');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS BOLETO (boleto_id INTEGER PRIMARY KEY, numero TEXT, qr TEXT, estado INTEGER, evento_id INT, localidad_id INTEGER, mesa_id INTEGER, mesa_capacidad INTEGER, mesa_disponibles INTEGER,  mesa_numero INTEGER, posicion INTEGER )');
        
        tx.executeSql('DROP TABLE IF EXISTS INVITACION');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS INVITACION (invitacion_id INTEGER PRIMARY KEY, cliente_id INTEGER, evento_id INTEGER, qr TEXT, estado INTEGER, nombres TEXT, apellidos TEXT)');

    	tx.executeSql('DROP TABLE IF EXISTS LOCALIDAD');
        tx.executeSql('CREATE TABLE IF NOT EXISTS LOCALIDAD (localidad_id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT, filas INTEGER, columnas INTEGER, capacidad INTEGER, mesas INTEGER, precio REAL, existencia INTEGER, estado INTEGER, evento_id INTEGER )');
    
    	// CREATE MODE
    	tx.executeSql('CREATE TABLE IF NOT EXISTS MODE ( mode_id INTEGER PRIMARY KEY, status INTEGER)');
    	tx.executeSql('INSERT INTO MODE (mode_id, status) values(1,0)');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS LOG  ( usuario_id INTEGER , accion TEXT, fecha TEXT)');
    
    },
     populateDBBlank: function(tx) {
        // table eventos
        tx.executeSql('DROP TABLE IF EXISTS EVENTO');
        tx.executeSql('CREATE TABLE IF NOT EXISTS EVENTO (evento_id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT, imagen TEXT, video TEXT, fecha DATE, hora TEXT, lugar TEXT, comision REAL, boletaje INTEGER, existencia INTEGER, tipo_evento_tipo_evento_id INTEGER, pais_pais_id INTEGER, organizacion_organizacion_id INTEGER )');
    	// CREATE TABLE BOLETOS
    	tx.executeSql('DROP TABLE IF EXISTS BOLETO');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS BOLETO (boleto_id INTEGER PRIMARY KEY, numero TEXT, qr TEXT, estado INTEGER, evento_id INT, localidad_id INTEGER, mesa_id INTEGER, mesa_capacidad INTEGER, mesa_disponibles INTEGER ,  mesa_numero INTEGER, posicion INTEGER)');

        tx.executeSql('DROP TABLE IF EXISTS LOCALIDAD');
        tx.executeSql('CREATE TABLE IF NOT EXISTS LOCALIDAD (localidad_id INTEGER PRIMARY KEY, nombre TEXT, descripcion TEXT, filas INTEGER, columnas INTEGER, capacidad INTEGER, mesas INTEGER, precio REAL, existencia INTEGER, estado INTEGER, evento_id INTEGER )');
        
        tx.executeSql('DROP TABLE IF EXISTS INVITACION');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS INVITACION (invitacion_id INTEGER PRIMARY KEY, cliente_id INTEGER, evento_id INTEGER, qr TEXT, estado INTEGER, nombres TEXT, apellidos TEXT)');
    
     	// CREATE MODE
    	tx.executeSql('CREATE TABLE IF NOT EXISTS MODE ( mode_id INTEGER PRIMARY KEY, status INTEGER)');
    	tx.executeSql('DROP TABLE IF EXISTS LOG');
    	tx.executeSql('CREATE TABLE IF NOT EXISTS LOG  ( usuario_id INTEGER , accion TEXT, fecha TEXT)');
    },


    selectEvento: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM EVENTO where evento_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Evento: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},
	selectBoleto: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM BOLETO where boleto_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Boleto: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},
	selectInvitacion: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM INVITACION where invitacion_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Invitacion: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectMode: function(params,callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM MODE WHERE mode_id = ?", params , function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Mode: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	insertMode: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO MODE ( mode_id, status ) values (1,?)", params);
			},
			function(error) {
				console.log("Error processing Mode: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
    },

    updateMode: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("UPDATE MODE SET status = ? WHERE mode_id = ? ", params);
			},
			function(error) {
				console.log("Error processing UPDATE MODE SQL: " + error.message);
        		callback(false);
			},
			function() {
				callback(true);
				console.log("BOLETO UPDATED");
			}
		);
	},
	
	selectLocalidad: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM LOCALIDAD WHERE localidad_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Localidad: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},
	selectBoletoByQr: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM BOLETO where qr = ? and localidad_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},
	selectInvitacionByQr: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM INVITACION where qr = ? and evento_id = ?", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectEventos: function(callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM EVENTO", [], function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Evento: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectBoletos: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM BOLETO WHERE evento_id = ? and localidad_id = ? AND estado IN ( 1, 2, 3 ) ORDER BY mesa_numero , boleto_id", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Boleto: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectInvitaciones: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM INVITACION WHERE evento_id = ? AND estado IN (1,2,3) ORDER BY nombres", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Invitacion: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectLocalidades: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM LOCALIDAD WHERE evento_id = ? ORDER BY nombre", params, function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL LOCALIDAD: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectBoletosAll: function(callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM BOLETO", [], function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Boleto: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectInvitacionesAll: function(callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM INVITACION", [], function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL Invitacion: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},

	selectLog: function(callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("SELECT * FROM LOG", [], function(tx, results) {
					callback(results);
				});
			},
			function(error) {
				console.log("Error processing SQL LOG: " + error.message);
        		callback(null);
			},
			function() {
			}
		);
	},


    insertEvento: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO EVENTO (evento_id,nombre ,descripcion ,imagen ,video ,fecha ,hora ,lugar ,comision ,boletaje ,existencia ,tipo_evento_tipo_evento_id ,pais_pais_id ,organizacion_organizacion_id) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)", params);
			},
			function(error) {
				console.log("Error processing Evento: "+error.message);
        		callback(false);
			},
			function() {
				console.log("Evento Insertado");
				callback(true);
			}
		);
    },

    insertBoleto: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO BOLETO (boleto_id , numero, qr , estado , evento_id, localidad_id, mesa_id, mesa_capacidad, mesa_disponibles,mesa_numero , posicion ) values (?,?,?,?,?,?,?,?,?,?,?)", params);
			},
			function(error) {
				console.log("Error processing Boleto: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
    },
    insertInvitacion: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO INVITACION (invitacion_id, cliente_id, evento_id, qr, estado, nombres, apellidos) values (?,?,?,?,?,?,?)", params);
			},
			function(error) {
				console.log("Error processing Boleto: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
    },

    insertLog: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO LOG ( usuario_id, accion, fecha) values (?,?,?)", params);
			},
			function(error) {
				console.log("Error processing log: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
    },

    insertLocalidad: function(params, callback)
    {
		db.transaction(
			function(tx) {
				tx.executeSql("INSERT INTO LOCALIDAD (localidad_id, nombre, descripcion, filas, columnas, capacidad, mesas, precio, existencia, estado, evento_id ) values (?,?,?,?,?,?,?,?,?,?,?)", params);
			},
			function(error) {
				alert("INSERT "+ error.message);
				console.log("Error processing Localidad: "+error.message);
        		callback(false);
			},
			function() {
				callback(true);
			}
		);
    },

    updateBoletoEstado: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("UPDATE BOLETO SET estado = ? WHERE boleto_id = ? ", params);
			},
			function(error) {
				console.log("Error processing UPDATE BOLETO SQL: " + error.message);
        		callback(false);
			},
			function() {
				callback(true);
				console.log("BOLETO UPDATED");
			}
		);
	},

	updateInvitacionEstado: function(params, callback) {
		db.transaction(
			function(tx) {
				tx.executeSql("UPDATE INVITACION SET estado = ? WHERE cliente_id = ? AND evento_id = ? ", params);
			},
			function(error) {
				console.log("Error processing UPDATE INVITACION SQL: " + error.message);
        		callback(false);
			},
			function() {
				callback(true);
				console.log("INVITACION UPDATED");
			}
		);
	},

    	
};