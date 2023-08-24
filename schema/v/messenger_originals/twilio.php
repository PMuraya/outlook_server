<?php

namespace mutall;
//
//
//Resolve the reference to the Twilio php autoloader
//include_once './vendor/autoload.php';
include_once dirname(__FILE__).'/vendor/autoload.php';
//
//Resolve ther reference to the dotenv loader
include_once dirname(__FILE__) . '/../dotenv/vendor/autoload.php';
//
//The twilio class that supports sending of messages and emails to the clients.
//This class works with the dotenv to control access to the environment variables
//designed for usage within the application but have restricted access due
//Auth privacy. The environment variables are:- the account sid, the authtoken,
//and the twilio phone number. Using the above variables, a twilio client is created
//using the account sid and auth token which is used to send short mobile messages.
//The client provides the recipient's phone number, the subject of the message,
//and the body of the message itself.
//
class twilio extends \Twilio\Rest\Client {
    //
    // Obtain the account ssid, the account token, and the account phone number 
    // from the twilio console. You must have a twilio account to have access to these
    // The twilio ACCOUNT_SID
    public $sid;
    //
    // The twilio account AUTH_TOKEN
    public $token;
    //
    //The twilio account PHONE_NUMBER
    public $acc_phone;
    //
    //The function's constructor that permits usage of methods
    function __construct() {
        //
        //Load the environment variables
        $this->load_variables();
        //
        //Call the twilio client with the account credentials
        parent::__construct($this->sid, $this->token);
    }
    //
    //This is a private function that permists loading of environment variables
    //such as the twilio :- account_sid, auth_token, and the twilio_phone_number
    private function load_variables(): void {
        //
        //The variables should not change once they are set
        $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
        //
        //Load the environment variables
        $dotenv->load();
        //
        //Explicit validation of environment variables
        $dotenv->required('TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', '');
        //
        //Twilio account_SID
        $this->sid = $_ENV['TWILIO_ACCOUNT_SID'];
        //
        //The twilio account AUTH TOKEN
        $this->token = $_ENV['TWILIO_AUTH_TOKEN'];
        //
        //The twilio PHONE NUMBER
        $this->acc_phone = $_ENV['TWILIO_PHONE_NUMBER'];
    }
    //
    //This function is used to send phone messages to a specific user where the user provides the
    //phone number, the subject of the message, and the body of the message.
    public function send_message(string $to, string $subject, string $body): string /*'ok'|error*/ {
        //
        //Combine the body and the subject of the message
        $text = "$subject::\n $body\n";
        //
        //Prepare to trap exceptions for cases when the phone number is incorrect
        try {
            //
            //Send the message
            $this->messages->create(
                //
                //The phone address to send the message to
                $to,
                //
                //The structure of the message
                [
                    //
                    //The body of the message
                    "body" => $text,
                    //
                    //The twilio phone number sending the message
                    "from" => $this->acc_phone
                ]
            );
            return 'ok';
        } catch (\Exception $ex) {
            //
            //Return the error message generated
            return $ex->getMessage();
        }
    }
}
