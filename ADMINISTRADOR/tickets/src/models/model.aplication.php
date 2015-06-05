<?php
/**
 * Factory .
 *
 * @author Jcbarreno <jcbarreno.tpp@gmail.com>
 * @version 1.0
 * @package Modelo Maestro
 */
class modelAplication {

	protected $mail;
	protected $app;
	protected $smtp;
	protected $prefix;
	protected $iv; 
   	protected $key;
   	protected $uk;
	
	/**
	* Recibe instancia de phpMailer
	*
	* @var Instancia phpMailer
	* @return null
	*/
	public function __construct( $phpMailer, $app,$smtp,$prefix)
	{
		#instancia phpMailer
		$this->mail = $phpMailer;
		$this->app 	= $app;
		$this->smtp = $smtp;
		$this->prefix = $prefix;
		$this->iv = "iqocamixixebuvaf";
		$this->key = "";
		$this->uk = "iqocamixixebuvafigujovuriyolam86";
	}
    //Function para remover un directorio
    public function decryptAndSanitize($str)
	{
		return $this->_sanitizeVar( base64_decode( $str ));
	}

	//Function generar token de session
    public function generateToken()
	{
		$rand_part = str_shuffle("abcdefghijklmnopqrstuvwxyz0123456789".uniqid());
        return substr($rand_part, 0, 39); 
	}

	public function log($accion, $user)
	{
		$this->app['dbs']['mysql_silex']->insert("log",array('fecha_hora' => date("Y-m-d H:i:s"),'accion'=>$accion, 'detalle_usuario_detalle_usuario_id'=> $user));  
		return true;
	}

	public function setToken($user)
	{
		$tok = $this->generateToken();
		$this->app['dbs']['mysql_silex']->update("usuario",array('token' => $tok  ),  array('usuario_id' => $user));  
		return $tok;
	}

	public function destroyToken($user)
	{
		$this->app['dbs']['mysql_silex']->update("usuario",array('token' => ""),  array('usuario_id' => $user));  
		return true;
	}

	public function setDateSession($user)
	{
		$this->app['dbs']['mysql_silex']->update("usuario",array('ultima_sesion' => date("Y-m-d H:i:s") ),  array('usuario_id' => $user));  
		return true;
	}

	public function login($user, $password)
	{
		$pass =  $this->encrypt( $this->decryptAndSanitize( $password ), $this->uk ); 
		#validar credencieales
		$query 		= 'SELECT usuario_id FROM usuario WHERE `usuario` = "'.$this->decryptAndSanitize( $user ) .'" AND `clave` = "'.$pass.'" AND tipo = 1';
		return $this->app['dbs']['mysql_silex']->fetchAssoc($query);
	}

	public function checkToken($user, $token)
	{
		#validar credencieales
		$query 		= 'SELECT * FROM usuario WHERE `usuario_id` = "'.$this->decryptAndSanitize( $user ) .'" AND `token` = "'.$this->decryptAndSanitize( $token ).'" AND tipo = 1';
		$result = $this->app['dbs']['mysql_silex']->fetchAssoc($query);

		if ( !empty($result) ){
			return true;
		} else return false;
	}


    /**** ENCRYPT FUNCTIONS *****/
	public function encrypt($str, $userkey) {
      $str = base64_encode($str);
      $this->key = $userkey; 
	  $str = $this->pkcs5_pad($str);   
	  $iv = $this->iv; 
	  $td = mcrypt_module_open('rijndael-128', '', 'cbc', $iv); 
	  mcrypt_generic_init($td, $this->key, $iv);
	  $encrypted = mcrypt_generic($td, $str); 
	  mcrypt_generic_deinit($td);
	  mcrypt_module_close($td); 
	  return bin2hex($encrypted);
    }
    public function encryptAdmin($str) {
      $userkey = $this->uk;
      $str = base64_encode($str);
      $this->key = $userkey; 
	  $str = $this->pkcs5_pad($str);   
	  $iv = $this->iv; 
	  $td = mcrypt_module_open('rijndael-128', '', 'cbc', $iv); 
	  mcrypt_generic_init($td, $this->key, $iv);
	  $encrypted = mcrypt_generic($td, $str); 
	  mcrypt_generic_deinit($td);
	  mcrypt_module_close($td); 
	  return bin2hex($encrypted);
    }

    public function decrypt($code) { 
	  $code = $this->hex2bin($code);
	  $iv = $this->iv; 
	  $td = mcrypt_module_open('rijndael-128', '', 'cbc', $iv); 
	  mcrypt_generic_init($td, $this->key, $iv);
	  $decrypted = mdecrypt_generic($td, $code); 
	  mcrypt_generic_deinit($td);
	  mcrypt_module_close($td); 
	  $ut =  utf8_encode(trim($decrypted));
	  return $this->pkcs5_unpad($ut);
    }

    protected function hex2bin($hexdata) {
	  $bindata = ''; 
	  for ($i = 0; $i < strlen($hexdata); $i += 2) {
	      $bindata .= chr(hexdec(substr($hexdata, $i, 2)));
	  } 
	  return $bindata;
    } 

    protected function pkcs5_pad ($text) {
	  $blocksize = 16;
	  $pad = $blocksize - (strlen($text) % $blocksize);
	  return $text . str_repeat(chr($pad), $pad);
    }

    protected function pkcs5_unpad($text) {
	  $pad = ord($text{strlen($text)-1});
	  if ($pad > strlen($text)) {
	      return false;	
	  }
	  if (strspn($text, chr($pad), strlen($text) - $pad) != $pad) {
	      return false;
	  }
	  return substr($text, 0, -1 * $pad);
    }

    /**** END ENCRYT FUNCTIONS ******/
   
    /**
	* Recibe valores para sanitizar
	*
	* @var String || array || Object
	* @var Bool false valor por defecto, true=array,False=string
	* @return retorna valores sanitizados
	*/
	public function _sanitizeVar( $var, $type = false )
	{
		#type = true for array
		$sanitize = new stdClass();
		if ( $type ){

			foreach ($var as $key => $value) {
				$sanitize->$key = $this->_clearString( $value );
			}
			return $sanitize;
		} else {
			return  $this->_clearString( $var );
		}
	}

	
	/**
	* Recibe String para aliminar carcteres especiales
	*
	* @var String
	* @return retorna string libre de caracteres especiales
	*/
	private function _clearString( $string )
	{
		$string = strip_tags($string);
		$string = htmlspecialchars($string);
		$string = addslashes($string);
		#$string = quotemeta($string);
		return $string;
	}



	/**
	* Recibe parametros para armar el correo a enviar
	*
	* @var object
	* @return retorna objeto con estado  y mensaje de envio de mail
	*/
	public function _sendMail( $paramsMail )
	{

		$response = new stdClass();

		$this->mail->SMTPAuth   = false;                  
    	$this->mail->Host       = $this->smtp;    
    	$this->mail->Port       = 25;   
    	$this->mail->IsSMTP();
		$this->mail->From=$paramsMail->setFrom ;
    	$this->mail->FromName=$paramsMail->setFromName;
		$this->mail->AddAddress($paramsMail->addAddress, $paramsMail->nameAddress);
		$this->mail->Subject    = $paramsMail->subject;
		//$this->mail->AltBody    = "To view the message, please use an HTML compatible email viewer!";#optional
		$this->mail->MsgHTML($paramsMail->body);
		
		$response->status 	= $this->mail->Send();
		$response->msnerror = $this->mail->ErrorInfo;
		return $response;
	}

	/**
	* Recibe fecha en cualquier formato
	*
	* @var string date()
	* @return retorna fecha en formato YY-MM-DD
	*/
	public function _dateFormat( $date )
	{
		return date_format( date_create($date), 'Y-m-d');
	}


	/**
	* Obtener datos de administrador
	*
	* @return object
	*/
	public function _getParamsUserAdmin()
	{
		$response 				= new stdClass();
		$query 					= 'SELECT mail, name FROM '.$this->prefix.'admin_users WHERE `id`= 1 AND `usertype`= 0';
		$useradmin       		= $this->app['dbs']['mysql_silex']->fetchAssoc($query);
		$response->mail 		= $useradmin['mail'];
		$response->name 		= $useradmin['name'];
		return $response;
	} 

/**
Funcion que valida la estructura de un numero de telefono
 * @var string
 * @var integer
 * @return boolean
*/
public function _validatephone($phone,$length)
 {
   if (!(boolean)(preg_match('/^[0-9]{'.$length.','.$length.'}$/', $phone)))
       return false;
   else
      return true;    
 } 


/**
Funcion que valida que el correo tenga la estructura valida
 * @var string
 * @return boolean
*/
public function _validatemail($mail)
 {

   if (!(boolean)(preg_match('/^[A-Za-z0-9-_.+%]+@[A-Za-z0-9-.]+\.[A-Za-z]{2,4}$/',$mail)))
      return false;
   else
      return true;    
 } 


 /**
 Funcion que genera el paginador, dependiendo de la cantidad de registros y paginas
 * @var integer
 * @var integer
 * @return string(html)  
 *
 **/
public function get_paginador($pages,$page){

    $pag='<div class="pagination pagination-centered"><ul>';
    $pagesToShow=4;

            // Página anterior.
            if ($page>1) { 
                $pa=$page-1;
                $pag.="<li><a  title='Previous' onClick='paginacion($pa,this.title);'> < < Previous </a>"; 
              }
            
            $start = $page - $pagesToShow;

            if ($start <= 0){
                $start = 1;
            }

            $end = $page + $pagesToShow;

            if ($end >= $pages){
                $end = $pages;
            }

            if ($start > 0) {
                for ($i = 1; $i < 4 && $i < $start; ++$i) {
                    $li='<li>'; 
                    $pag.=$li."<a  title='page $i'  onClick='paginacion($i,this.title);'>$i</a></li>";
                }
            }

            if ($start > 2) { 
                    $pag.="<li><a>...</a></li>";
            }

            for ($i = $start; $i <= $end; ++$i) {
               if($i==$page) 
                  $li='<li class="active">';
               else 
                  $li='<li>'; 
               $pag.=$li."<a  title='page $i'  onClick='paginacion($i,this.title);'>$i</a></li>";
            }

            if ($end < $pages - 3) {
                 $pag.="<li><a>...</a></li>";
            }

            if ($end <= $pages - 1) {
                for ($i = max($pages- 2, $end + 1); $i <= $pages; ++$i) {
                    $li='<li>'; 
                    $pag.=$li."<a  title='page $i'  onClick='paginacion($i,this.title);'>$i</a></li>";
                }
            }
            // Siguiente página
            if ($page<$pages) { 
                $pa=$page+1; 
                $pag.="<li><a  title='Next'  onClick='paginacion($pa,this.title);'> Next >> </a>"; 
            }

        $pag.='</ul></div>';

    return $pag;
}//fin de la funcion get_paginador

}
