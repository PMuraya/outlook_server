<?php
//
//Resolve references to the config
require __DIR__ . '/config.php';
//
//This is the class that has access to the Daraja API
class API
{
    //
    //The vairbles defined in the configuration file
    //
    //The access_token
    public $access_token;
    //
    //The consumer key
    public $consumer_key;
    //
    //The consumer secret
    public $consumer_secret;
    //
    //The header that defines the type of content pr    ovided by the MPESA API
    public $headers;
    //
    //The basic authorization
    public $basic_auth;
    //
    //The constructor function that makes the development of the program much easier
    function __construct()
    {
        //
        //The consumer key
        $this->consumer_key = CONSUMER_KEY;
        //
        //The consumer secret
        $this->consumer_secret = CONSUMER_SECRET;
        //
        //Basic authorization
        //$this->basic_auth = base64_encode($this->consumer_key . ':' . $this->consumer_secret);
        //
        //The headers used during authentication for the access token
        $this->headers = ['Content-Type:application/json; charset=utf8'];
        //
        //the accesstoken to the daraja API
        $this->access_token = $this->get_access_token();
        //
        //the request header array send for other requests since it has the Bearer token used for authentication
        $this->request_header = array('Content-Type:application/json', 
            'Authorization:Bearer ' . $this->access_token);
    }
    //
    //Getting the access token from safaricom's daraja API
    private function get_access_token()
    {
        //
        //Open the curl connection at client_credentials url
        $curl = curl_init('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
        //
        //Curl access
        curl_setopt_array(
            $curl,
            //
            //The headers to the array
            array(
                //
                //Headers set
                CURLOPT_HTTPHEADER => $this->headers,
                //
                //A return value is needed by default
                CURLOPT_RETURNTRANSFER => true,
                //
                //We do not need the header information
                CURLOPT_HEADER => false,
                //
                //The user password which is a concatenation of the consumer key
                //and the consumer secret
                CURLOPT_USERPWD => $this->consumer_key . ':' . $this->consumer_secret
            )
        );
        //
        //Decode the result of executed curl function
        $result = json_decode(curl_exec($curl));
        //
        //Close the curl connection
        curl_close($curl);
        //
        //
        return $result->access_token;
    }
    //
    //The lipa na Mpesa Online (Express API)
    public function lipa_na_mpesa_online($end_point_url, $curl_post_data)
    {
        return $this->transaction_request_body($end_point_url, $curl_post_data);
    }
    //
    //This is the method needed to consumer the access token and the API
    public function transaction_request_body($end_point_url, $curl_post_data)
    {
        //
        //Initialize curl
        $curl = curl_init();
        //
        curl_setopt_array(
            $curl,
            array(
                CURLOPT_URL => $end_point_url,
                CURLOPT_HTTPHEADER => $this->request_header,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                //
                //A json encoded field
                CURLOPT_POSTFIELDS => $curl_post_data
            )
        );
        //
        //Execute the connection we obtained
        $curl_response = curl_exec($curl);
        //
        //return the obtained result
        return $curl_response;
    }
}
