<?php
//
//The mutall namespace
namespace mutall;

use Exception;

//
//Resolve the reference to the twilio class
include_once dirname(__FILE__) . "/../twilio/twilio.php";
//
//Resolve the reference to the mailer class
include_once dirname(__FILE__) . "/../mailer/mutall_mailer.php";
//require_once $_SERVER['DOCUMENT_ROOT']."/schema/v/mailer/mutall_mailer.php";
//
//Resolve the reference to the database
include_once "schema.php";
//
//This is the messenger class that focuses on sending emails and SMS's to 
//multiple users by retrieving the user's email and the user's phone_number from
//the database and sending a message for each user.
class messenger extends component {
    //
    //The twilio class
    protected twilio $twilio;
    //
    //The mailer class
    protected mutall_mailer $mutall_mailer;
    //
    //The database class that supports querying the database
    protected database $dbase;
    //
    //The error handling mechanism for collecting errors reported when an email
    //or sms is not sent for some reason .e.g.,when an email address is invalid
    protected array $errors = [];
    //
    //Instantiate the twilio and mailer classes at this point
    function __construct() {
        //
        //Connect to the database
        $this->dbase = new database("mutall_users");
        //
        //Open the twilio class
        $this->twilio = new \mutall\twilio();
        //
        //Open the mailer class
        $this->mailer = new \mutall\mutall_mailer();
    }
    //
    //Send an email to selected individuals or a group depending on the recipient type
    private function send_emails(\stdClass $recipient, string $subject, string $body) {
        //
        //Test if the recipient is a group
        if ($recipient->type == "group")
            //
            //The recipient is a group:- 
            //Send the email to members of the group
            $addresses = $this->send_group_addresses($recipient->business);
        //
        else
            //
            //The recipient is an individual:-
            //Send an email to the user name
            $addresses = $this->send_individual_addresses($recipient->user);
        //
        //Clear the addresses
        $this->mailer->clearAddresses();
        //
        //Build the addresses
        foreach ($addresses as $address) {
            //
            //Compile the collected address to the address queue
            try {
                //
                //Add the email address to the mailer
                $this->mailer->addAddress($address['email'], $address['name']);
            } catch (\Exception $e) {
                //
                //Compile the errors collected from the messenger and show them
                //to the user.
                array_push($this->errors, $e->getMessage());
            }
        }
        //
        //Collect the subject and text of the email to send
        $this->mailer->send_email($subject, $body);
        //
        //Send the emails
        $this->mailer->send();
    }
    //
    //Send an email to the given user
    private function send_individual_addresses(
        array $users
    ): array {
        //
        //Initialize the process with a simple array
        $addresses = [];
        //
        //Get each individual user and send the message
        foreach ($users as $user_pk) {
            //
            //1.Get the email address for the user
            //
            //Formulate the sql
            $sql = "select
                        user.email,
                        user.name
                    from user
                        where user.user=$user_pk";
            //
            //2. Query the database for the email addresses
            //[{email:'kamau@gmail.com'},{email:'peter@gmail.com'}]
            $emails = $this->dbase->get_sql_data($sql);
            //
            //Check that there is at least one email.It is illegal to send a message
            //without an email
            if (count($emails) < 1) {
                //
                //Compile the error
                array_push($this->errors, "The user with this '$user_pk' does not exist");
                //
                //Disregard the current address and continue the process
                continue;
            }
            //
            //Add the address to an array
            array_push($addresses, $emails[0]);
        }
        //
        //Compile the email addresses into a lists
        return $addresses;
    }
    //
    //Send emails to members of the given business. A business is identified by
    //an id and a name:-{id,name}
    //Return the errors if any
    private function send_group_addresses(\stdClass $business): array {
        //
        //1. The query to fetch all emails for users registered under the current
        //business
        $sql = "
            select
                user.email,
                user.name 
            from user 
                inner join member on member.user=user.user
                inner join business on business.business= member.business
            where business.id= '$business->id'
                and not(user.email is null) "
            //
            //Added for testing purposes
            . "and user.user in (1269, 1274)";
        //
        //2. Get the receivers of the emails
        $receivers = $this->dbase->get_sql_data($sql);
        //
        //Return a list of receivers
        return $receivers;
    }
    //
    //Send an sms to the recipient who is either:-
    //- a group (where we send to all the members of the business).
    //- or selected individuals of the business.
    private function send_twilio_sms(object $recipient, string $subject, string $body): array/*<error>*/ {
        //
        //Get the recipient addresses. 
        $addresses = $this->get_addresses($recipient);
        //
        //Loop through the addresses sending an sms to each one.
        foreach ($addresses as $address) {
            //
            //Send the message using twilio technology.
            $result/*'ok' | error*/ = $this->twilio->send_message($address, $subject, $body);
            //
            //The phone numbers provided
            $phone = implode(",", $address);
            //
            //Log the error if any.
            if ($result != 'ok')
                array_push($this->errors, "The sms to '$phone' was not successfully sent for the following reasons:'$result'.");
        }
        //
        //Return the errors if any.
        return $this->errors;
    }
    //
    //Get the addresses of the recipient(s) to send the messages.
    //The recipient type has the following structure:-type recipient =
    //
    //A group has a business id used to get all members associated with that group
    //{ type: 'group', business: outlook.business }
    //
    //The selected individuals have usernames which is used to retrieve their
    //email address or mobile number
    //| { type: 'individual', user: Array<string> }
    private function get_addresses($recipient): array {
        //
        //if the recipient is of type business...
        if ($recipient->type == "group") {
            //
            //Get all the addresses associated with this business.
            //
            //Get the business: it has the following structure:-
            // business = {id: string, name:string}
            $business = $recipient->business;
            //
            // Formulate the condition(recipients) to retrieve the data
            $condition = "business.id = '$business->id'";
        } else {
            //
            //The recipient is of type individual. Get their addresses.
            //
            //Get the user: its an array of user name.
            //user: Array<string> 
            $users_array = $recipient->user;
            //
            //Formulate a condition that involves this users
            //$users_str = join(',', array_map(fn ($user) => "'$user'", $users_array));
            $users_str = implode(",", $users_array);
            //
            //Formulate the sql to get the phone number of the selected user.
            $condition = "user.user in ($users_str)";
            //
        }
        //
        //Use the recipient condition to formulate the complete sql.
        $sql =
            "with
                #
                #Get the primary phone number of each user
                mobile as(
                    select
                        concat(mobile.prefix,mobile.num) as num,
                        row_number() over(partition by mobile.user) as users
                    from mobile
                        inner join user on mobile.user= user.`user`
                        inner join member on member.user= user.user 
                    where $condition
                )
                #
                #Select all users with phone numbers linked to a business
                select num from mobile where users=1";
        //
        // Get the addresses from the above query.
        $adresses = $this->dbase->get_sql_data($sql);
        //
        //Return the adresses.
        return $adresses;
    }
    //
    //The mobitech method for sending messages using their interface, two major parameters are passed:-
    //the phone number to send the message, and the message to send
    private function mobitech_sender(string $address, string $message) {
        //
        //The request API Key. Provided on the Mobitech portal for every user sending
        //the message.i.e. It is unique for each user.
        $api_key = "b87777523fdd5d446190f84965e66c67bc27277d3001dd8f544a74c9f4a1a284";
        //
        //The default Code that is used to send messages to the recipient. The user 
        //will receive the message from this short code. Other short codes can be
        //acquired by purchasing it through Mobitech.
        $sender_code = "23107";
        //
        //To send the message, a request is made to the mobitech send sms url(endpoint)
        //with the mobile, the type of response(optional), the service_id, the name of the sender,
        //and the message to be delivered.
        $message_req = array(
            "mobile" => $address,
            "response_type" => "json",
            "sender_name" => $sender_code,
            "service_id" => 0,
            "message" => $message
        );
        //
        //Compile the message request
        $payload = json_encode($message_req);
        //
        //Initialize a curl instance to send the message request
        $curl = curl_init();
        //
        //Set up the curl request's additional requirements to create a one way communication to the mobitech server
        curl_setopt_array($curl, array(
            CURLOPT_URL => 'https://api.mobitechtechnologies.com/sms/sendsms',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => '',
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => 'POST',
            //
            //Pass the compiled message request
            CURLOPT_POSTFIELDS => $payload,
            //
            //Set the connection header access credentials and the returned response type
            CURLOPT_HTTPHEADER => array(
                'h_api_key: ' . $api_key,
                'Content-Type: application/json'
            ),
        ));
        //
        //Execute the compiled request with all requirements satisfied
        $output = curl_exec($curl);
        //
        //Close the initialized connection to the server
        curl_close($curl);
        //
        //Format the response to a processable format
        $response = json_decode($output);
        //
        //Compile the errors if any
        if ($response[0]->status_code != 1000) {
            array_push($this->errors, $response[0]->status_desc);
        }
    }
    //
    //Send SMS Messages using the Mobitech interface. The charge for this platform is different than the others.
    private function send_mobitech_sms(object $recipient, string $subject, string $body) {
        //
        //Collect all the addresses.
        $addresses = $this->get_addresses($recipient);
        //
        //Compile the message before sending it
        $text = "$subject :".PHP_EOL." $body";
        //
        //Send a message to each of the selected address
        foreach ($addresses as $address) {
            //
            //Compile the address into a simple string
            $phone = implode(",", $address);
            //
            //Send the text message to the extracted address
            $this->mobitech_sender($phone, $text);
        }
    }
    //
    //
    //This function sends emails and sms's to the given recipient.
    //The recipient is either an individual or 
    //a group.The recipient type has the following structure:-
    //
    //A group has a business id used to get all members associated with that group
    //{ type: 'group', business: outlook.business }
    //
    //The selected individuals have usernames which is used to retrieve their
    //email address or mobile number
    //| { type: 'individual', user: Array<string> }
    //
    //The technology is used as a list of message delivery service providers,
    // e.g., twilio,PHPMailer, Mobitech e.t.c.
    //The return is an array of errors if any
    public function send(\stdClass $recipient, string $subject, string $body, array $technologies): array/*error*/ {
        //
        //For every technology type, send their corresponding message
        foreach ($technologies as $technology) {
            //
            //Send messages using each technology
            switch ($technology) {
                    //
                    //Send messages using twilio
                case "twilio":
                    //
                    //1. Send the phone messages and register errors (if any)in the errors property
                    $this->send_twilio_sms($recipient, $subject, $body);
                    //
                    //Continue the execution
                    break;
                    //
                    //Sending messages using the phpmailer.
                case "phpmailer":
                    //
                    //2. Send the emails and register errors (if any)in the errors property
                    $this->send_emails($recipient, $subject, $body);
                    //
                    //Continue the execution
                    break;
                    //
                    //Send messages using the mobitech technology
                case "mobitech":
                    //
                    //1. Send the emails and register errors (if any)in the errors property
                    $this->send_mobitech_sms($recipient, $subject, $body);
                    //
                    //Continue the execution
                    break;
                    //
                    //If no technology is provided, return the error.
                default:
                    array_push($this->errors, "The message was not sent using of the following"
                        . "standard technologies (twilio, phpmailer,mobitech)");
            }
        }
        //
        //Return the errors if any
        return $this->errors;
    }
}
