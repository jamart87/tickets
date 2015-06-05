<?php
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

#Home
/**
* Funcion principal para recoleccion de datos de facebook
*
* @var array, instancia de la app
* @var object, instancia BUSI
* @var object, facebook
* @var object, instancia directa para consumo de variables del archivo .INI
* @var mix resto de instancias a utilizar
* @return null
*/
$app->match('/', function () use ($app, $busi, $analytics, $models,$prefix) {
    $result = $models->login( $_POST['name'], $_POST['password'] );

    if ( !empty($result) ){
        $models->setDateSession($result['usuario_id']);
        $models->log( "Login", $result['usuario_id'] );
	    $token = $models->setToken($result['usuario_id']);
        $ans = array('result' => true, 'id' => $result['usuario_id'], "token" => $token ); 
	} else {
       $ans = array('result' => false ); 
	}
    
    return json_encode($ans);

})->method('GET|POST');

$app->match('/logout', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user = $models->decryptAndSanitize( $_POST['user']);
    $models->destroyToken( $user );
    $models->log( "Logout", $user );
    
    $ans = array('result' => true ); 
    
    return json_encode($ans);

})->method('GET|POST');

$app->match('/eventos', function () use ($app, $busi, $analytics, $models,$prefix) {
    #GET EVENTOS
    $user  = $_POST['user'];
    $token = $_POST['token'];
    if($models->checkToken($user, $token)) {
    $query = 'SELECT B.*, A.usuario_usuario_id FROM detalle_usuario AS A inner join  evento AS B ON A.evento_evento_id = B.evento_id AND A.usuario_usuario_id = '.$models->decryptAndSanitize( $user );
	$result['data'] = $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }
    
    return json_encode($result);

})->method('GET|POST');

$app->match('/localidadByEvento', function () use ($app, $busi, $analytics, $models,$prefix) {
    #GET EVENTOS
    $user  = $_POST['user'];
    $token = $_POST['token'];
    
    if($models->checkToken($user, $token)) {
    $query = 'SELECT A.localidad_id as detalle_localidad_id, A.nombre, A.descripcion, A.filas, A.columnas,';
	$query .= ' A.capacidad, A.mesas, A.precio, A.existencia, A.estado  FROM localidad AS A';  
	$query .= ' where A.evento_evento_id ='.$_POST['evento_id'];
    
    $result['data'] = $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');

$app->match('/boletos', function () use ($app, $busi, $analytics, $models,$prefix) {
    #GET BOLETOS
    $user  = $_POST['user'];
    $token = $_POST['token'];
    if($models->checkToken($user, $token)) {

    $query = 'SELECT A.boleto_id, A.numero, A.qr, A.estado, C.localidad_id as detalle_localidad_id, C.descripcion, C.filas, 
				C.columnas, C.capacidad, C.mesas, C.precio, mesa.mesa_id, mesa.capacidad as mesa_capacidad, mesa.disponibles, A.numeroMesa, A.posicion 
				FROM boleto AS A
				INNER JOIN 	localidad AS C ON A.localidad_localidad_id = C.localidad_id
				LEFT JOIN mesa ON A.mesa_mesa_id = mesa.mesa_id 
				WHERE C.evento_evento_id ='. $_POST['evento_id'];
       
    $result['data'] = $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else{
        $result['response'] = false;
    }
    return json_encode($result);

})->method('GET|POST');


$app->match('/boletosByUser', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user  = $_POST['user'];
    $token = $_POST['token'];

    if($models->checkToken($user, $token)) {
    #GET BOLETOS
    $query =   'SELECT A.boleto_id, A.numero, A.qr, A.estado, C.evento_evento_id, C.localidad_id as detalle_localidad_id, C.descripcion, C.filas, 
				C.columnas, C.capacidad, C.mesas, C.precio, mesa.mesa_id, mesa.capacidad as mesa_capacidad, mesa.disponibles, A.numeroMesa, A.posicion  
				FROM boleto AS A
				INNER JOIN  localidad AS C ON A.localidad_localidad_id = C.localidad_id
				LEFT JOIN mesa ON A.mesa_mesa_id = mesa.mesa_id 
				INNER JOIN  detalle_usuario AS D ON  C.evento_evento_id = D.evento_evento_id AND D.usuario_usuario_id = '.$models->decryptAndSanitize( $_POST['user'] );
			
    $result['data'] 	= $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');

$app->match('/invitacionesByUser', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user  = $_POST['user'];
    $token = $_POST['token'];

    if($models->checkToken($user, $token)) {
    #GET BOLETOS
    $query =   'SELECT A.*, C.nombres, C.apellidos, C.qr FROM invitacion AS A
                inner join detalle_usuario AS B ON A.evento_evento_id = B.evento_evento_id
                inner join cliente AS C ON C.cliente_id = A.cliente_cliente_id
                WHERE B.usuario_usuario_id ='.$models->decryptAndSanitize( $_POST['user'] );
            
    $result['data']     = $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');

$app->match('/insertLog', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user  = $_POST['user'];
    $token = $_POST['token'];

    if($models->checkToken($user, $token)) {
    $app['dbs']['mysql_silex']->insert("log",array('fecha_hora' => date("Y-m-d H:i:s"),
        'accion'=>$_POST['accion'], 
        'detalle_usuario_detalle_usuario_id'=> $models->decryptAndSanitize( $_POST['user'] )));
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');


$app->match('/updateBoletoQr', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user  = $_POST['user'];
    $token = $_POST['token'];
    //$_POST['boleto_id'] = 33460;
    if($models->checkToken($user, $token)) {
    $query2 = "SELECT A.qr, B.existencia, B.localidad_id, A.estado, C.evento_id, C.tipo_evento_tipo_evento_id AS tipo_evento FROM boleto AS A 
                  INNER JOIN 
                  localidad as B ON A.localidad_localidad_id = B.localidad_id
                  LEFT JOIN evento AS C ON C.evento_id = B.evento_evento_id
                  where A.boleto_id = ".$_POST['boleto_id'];

    $r2 = $app['dbs']['mysql_silex']->fetchAssoc($query2);
 
    #UPDATE STATUS QR
    $query = 'UPDATE boleto set estado = '.$_POST['estado'].' where boleto_id = '.$_POST['boleto_id'];
    $r = $app['dbs']['mysql_silex']->executeQuery($query);

    if ($r)
    {
    	if ($r2["existencia"] > 0) 
      		$nuevaExistencia = $r2["existencia"] - 1;
      	else 
      		$nuevaExistencia = 0;

        if ($r2["estado"] == "0" ) {
       	
        $query3 = 'UPDATE localidad set existencia = '.$nuevaExistencia.' where localidad_id = '.$r2["localidad_id"];
        $r3 = $app['dbs']['mysql_silex']->executeQuery($query3);
        $result['response'] = true;

        }
    
    }

    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');

// METODO PARA ACTUALIZAR INVITACION
$app->match('/updateInvitacionQr', function () use ($app, $busi, $analytics, $models,$prefix) {
    $user  = $_POST['user'];
    $token = $_POST['token'];
    if($models->checkToken($user, $token)) {

    // ENCONTRAR CLIENTE POR QR EN LA TABLA CLIENTES
    $query4 = "SELECT * FROM cliente where qr = '". $_POST['qr'] ."'";
    $r4 = $app['dbs']['mysql_silex']->fetchAssoc($query4);
    
    #UPDATE STATUS QR
    $query5 = 'UPDATE invitacion SET estado = '.$_POST['estado'].' WHERE cliente_cliente_id = '.$r4['cliente_id'].' and evento_evento_id = '.$_POST['evento'];
    $r5 = $app['dbs']['mysql_silex']->executeQuery($query5);

    $result['cliente'] = $r4['cliente_id'];
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');


$app->match('/localidadByUser', function () use ($app, $busi, $analytics, $models,$prefix) {
    
    #GET EVENTOS
    $user  = $_POST['user'];
    $token = $_POST['token'];
    
    if($models->checkToken($user, $token)) {
    $query = 'SELECT A.localidad_id as detalle_localidad_id, A.nombre, A.descripcion, A.filas, A.columnas,
			  A.capacidad, A.mesas, A.precio, A.existencia, A.estado, A.evento_evento_id  FROM localidad AS A 
			  INNER JOIN detalle_usuario AS B ON B.evento_evento_id = A.evento_evento_id 
			  where B.usuario_usuario_id = '.$models->decryptAndSanitize( $_POST['user'] );
				    

    $result['data'] = $app['dbs']['mysql_silex']->fetchAll($query);
    $result['response'] = true;
    } else {
        $result['response'] = false;
    }

    return json_encode($result);

})->method('GET|POST');


$app->match('/cargarBoletos', function () use ($app, $busi, $analytics, $models,$prefix) {
    #GET BOLETOS
    $user  = $_POST['user'];
    $token = $_POST['token'];

    if($models->checkToken($user, $token)) {
    
    $boletos = $_POST['data'];
    $invitaciones = $_POST['inv'];
    
    foreach ($boletos as $id) {
        $query2 = "SELECT A.qr, B.existencia, B.localidad_id, A.estado, C.evento_id, C.tipo_evento_tipo_evento_id AS tipo_evento FROM boleto AS A 
                  INNER JOIN 
                  localidad as B ON A.localidad_localidad_id = B.localidad_id
                  LEFT JOIN evento AS C ON C.evento_id = B.evento_evento_id
                  where A.boleto_id = ".$id[0];

        $r2 = $app['dbs']['mysql_silex']->fetchAssoc($query2); 

    	$query = 'UPDATE boleto set estado = '.$id[1].' where boleto_id = '.$id[0].' AND estado=0';
    	$resp = $app['dbs']['mysql_silex']->executeQuery($query);

    	if ($resp)
	    {
	    	if ($r2["existencia"] > 0) 
	      		$nuevaExistencia = $r2["existencia"] - 1;
	      	else 
	      		$nuevaExistencia = 0;

	      	if ($r2["estado"] == "0" ) {
	      	    $query3 = 'UPDATE localidad set existencia = '.$nuevaExistencia.' where localidad_id = '.$r2["localidad_id"];
	            $r = $app['dbs']['mysql_silex']->executeQuery($query3);
            } 

	    }
    }
     
     // CARGAR INVITACIONES
     foreach ($invitaciones as $inv) {
        #UPDATE STATUS QR
        $query5 = 'UPDATE invitacion SET estado = '.$inv[1].' WHERE invitacion_id = '.$inv[0];
        $r5 = $app['dbs']['mysql_silex']->executeQuery($query5);   
     }

    if (isset($_POST['log']))
    {
        $log = $_POST['log'];
        foreach ($log as $l) {
        $app['dbs']['mysql_silex']->insert("log",array('fecha_hora' => $l[1],
        'accion'=>$l[0], 
        'detalle_usuario_detalle_usuario_id'=> $models->decryptAndSanitize( $_POST['user'] )));
        }
    }
    
    return  json_encode(array('result' => true)); 
    } else {
        return  json_encode(array('result' => false));
    }
})->method('GET|POST');
