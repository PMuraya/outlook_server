<?php

namespace mutall;
//
//Resolve references to the database
include_once '../schema.php';
//
abstract class technology{
    //
    //Errors encountered when sending messages
    public array/*:string*/ $errors=[];
    //
    //The sql for retriecing content addressees
    public string $sql;
    //
    //The mutall users database
    public \mutall\database $dbase;
    //
    function __construct(string $sql){
        //
        $this->sql = $sql;
        //
        //Create a mutall user database without filling in the entities
        $this->dbase = new \mutall\database('mutall_users', false);
    }
    
    //Execute the given query and use the undelying technoloy to send the
    //message content to the addressees.
    function execute(
        \stdClass /*{body:string, subject:string, date:string, sender:username, type:'plain'|html'}*/$content,    
        \stdClass /*{offset:int, size:int}*/$page
    )
    :array /*<error as string>*/{
        //
        //Paginate the sql
        $psql = "$this->sql offset $page->offset limit $page->size";
        //
        //Execute the  paginated sql
        $addresses/*Array<{address:string, username:string}>*/ = $this->dbase->get_sql_data($psql);
        //
        $this->send($addresses, $content);
        //
        //Collet and return the errors
        return $this->errors;
    }
    
    
    //For emalls, this sends the content. For sms, this does nothing
    abstract function send(
        array /*<{address:string, username:string}>*/$addreses, 
        \stdClass /*{sender, subject, date, body, type}*/$content):void;

   //Returns the number of users to send the message to
    function get_count():int{
        //
        //Use the base sql to derive a counter version
        $sql = "select count(temp.*) as qty from ($this->sql) as temp";
        //
        //Execute teh sql to get only one record
        list($record) = $this->dbase->get_sql_data($sql);
        //
        //Retrieve the count
        return $record['qty'];
    }
}

class mobitech extends technology{
    //
    //Access to the mobitech technology
    const URL = 'https://api.mobitechtechnologies.com/sms/sendsms';
    //
    //The request API Key. Provided on the Mobitech portal for every user sending
    //the message.i.e. It is unique for each user.
    const API_KEY = "b87777523fdd5d446190f84965e66c67bc27277d3001dd8f544a74c9f4a1a284";
    //
    //The default Code that is used to send messages to the recipient. The user 
    //will receive the message from this short code. Other short codes can be
    //acquired by purchasing it through Mobitech.
    const SENDER_CODE = "23107";
    //
    //
    function __construct(string $sql){
        //
        parent::__construct($sql);
    }
    
    //
    //The mobitech method for sending messages using their interface, two major parameters are passed:-
    //the phone number to send the message, and the message to send
    function send(array $addresses, \stdClass $content):void {
        //
        foreach($addresses as $address){
            //
            //Retrieve the phone number)
            $phone = $address['address'];
            //
            //Compile the message
            $message = $content->subject
                .PHP_EOL
                ."Sent by: $content->sender"
                .PHP_EOL
                ."On:$content->date"
                .PHP_EOL
                .$content->body;
            //
            //To send the message, a request is made to the mobitech send sms url(endpoint)
            //with the mobile, the type of response(optional), the service_id, the name of the sender,
            //and the message to be delivered.
            $message_req = array(
                "mobile" => $phone,
                "response_type" => "json",
                "sender_name" => mobitech::SENDER_CODE,
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
                CURLOPT_URL => self::URL,
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
                    'h_api_key: ' . self::SENDER_CODE,
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
            //Format the response to a processable format. ::peter, what is teh 
            //complete strucure of teh ourpu
            $response = json_decode($output);
            //
            //Compile the errors if any
            if ($response[0]->status_code != 1000) {
                array_push($this->errors, $response[0]->status_desc);
            }
        }    
    }
}
