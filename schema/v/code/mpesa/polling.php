<?php
//
//The reference to the mpesa php configuration file
require_once __DIR__ . '/api.php';
//
//Instantiate the api class
$api = new API();
//
//Send the checkout id as part of the GET request
$checkoutid = $_GET['id'];
//
//The payload request to the MPESA Express API
$payload = array(
    "BusinessShortCode" => $business_short_code,
    "Password" => $password,
    "Timestamp" => $time_stamp,
    "CheckoutRequestID" => $checkoutid
);
//
//URL that we will need to query the transaction status once a payment is made
$url = "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query";
//
//Get the response back once our message has been sent to our lipa na MPESA class
$response = $api->lipa_na_mpesa_online($url, json_encode($payload));
//
//Return the response of the MPESA query to the user
echo $response;
