<?php

namespace mutall;
//
//Fix the references to the php mailer class
use PHPMailer\PHPMailer\PHPMailer;
//
//Fix the reference to the php mailer's SMTP class
use PHPMailer\PHPMailer\SMTP;
//
//Introduce the Exception handler class
use PHPMailer\PHPMailer\Exception;
//
//The PHPMailer Abstract class reference defined through composer
include_once \dirname(__FILE__) . '/vendor/autoload.php';
//
//The mailer class that supports sending of emails to the clients via an SMTP 
//server.
class mutall_mailer extends PHPMailer {
    //
    //The function constructor that supports the development of more and more
    function __construct() {
        //
        //Instantiate the PHPMailer method and passing a value of true allows 
        //for exception handling
        parent::__construct(true);
        //
        //Set up the system configuration
        $this->server_config();
        //
        //Set up the administration addresses
        $this->set_source_addresses();
    }
    //
    //The configuration details to the server that will open a connection to the
    // server to enable us to send emails to our clients
    private function server_config() {
        //
        //Set the SMTP DEBUGGER that allows for verbose(detailed) error messages
        // for better debugging
        $this->SMTPDebug = SMTP::DEBUG_OFF;
        //
        //Instruct the mailer to only send emails using SMTP
        $this->isSMTP();
        //
        //Set the host the SMTP server will use to send the emails through.
        //Gmail usually uses the ('smtp.gmail.com') as the server default.
        $this->Host = 'smtp.gmail.com';
        //
        //Enable SMTP Authentication
        $this->SMTPAuth = true;
        //
        //Set the server username. When using gmail as the HOST server, 
        //this parameter is usually the google email address.
        $this->Username = "mutalldata@gmail.com";
        //
        //Set the server password.
        $this->Password = 'djjqaghqbsypbeqv';
        //
        //Enable TLS encryption for the server
        $this->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        //
        //Define the server port to use for this connection. Google uses port 
        //587 when SMTP is set to use TLS encryption. 
        //When not using TLS encyrption, the port that is used is 465
        $this->Port = 587;
    }
    //
    //This method allows for the specification of the senders and the recievers 
    //for the email address namely the sender, the reciever, and the CC
    private function set_source_addresses() {
        //Set the email sender. Two paramaters, the email and name to identify 
        //the sender of the email.i.e. ("mutalldata@gmail.com","MUTALL DATA")
        $this->setFrom("mutalldata@gmail.com", "MUTALL DATA");
        //
        //Set the email to reply to. The email and the reply keyword are the two
        // parameters in this section
        $this->addReplyTo("mutalldata@gmail.com", "Reply");
        //
        //The CC to the sent email.
        //$this->addCC("peterkariuki@gmail.com");
        //
        //The BCC to the sent email
        //$this->addBcc(Sg"");
    }
    //
    //Allows a user to add attachments while composing the email.
    public function send_email(
        //
        //Reciever email
        //string $receiver,
        //
        //The subject of the email
        string $subject,
        //
        //The message body
        string $body,
        //
        //user name
        string $name = "",
        //
        //The Attachments
        string $attachment = null,
        //
        //The type of the body
        bool $is_html = false
    ): string/*"ok"|Error*/ {
        //
        //
        //Set the exception handler to identify errors that may arise in while 
        //sending the email
        try {
            //
            //Set the email address to recieve the email. the email and name as the 
            //two paramters.i.e., ("kamaupeter343@gmail.com","Peter Kamau")
            //$this->addAddress($receiver, $name);
            //
            //Set the template to be viewed as a HTML
            $this->isHTML($is_html);
            //
            //Set the subject of the email
            $this->Subject = $subject;
            //
            // The body of the email. This can be styled to look like a normal html 
            // template
            $this->Body = $body;
            //
            //The alternative to the html.i.e., incase the mailviewer doesnot support html views
            $this->AltBody = "";
            //
            //This is the path to attachment. Set it to be conditional since we are unsure
            //of whether an attachment is provided or not
            if (!(is_null($attachment))) {
                $this->addAttachment($attachment);
            }
            //
            //Send the email to the user(s)
            //$ok = $this->send();
            //
            //If the email wasnt sent successfully, return the error message
            //if(!$ok) return $this->ErrorInfo;
            //
            return "ok";
        } catch (Exception $e) {
            //
            //Get the exception
            return "Error sending mail:" . $e->getMessage();
        }
    }
}
