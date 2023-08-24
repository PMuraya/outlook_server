<?php
//
//The reference to the mpesa php configuration file
require_once __DIR__ . '/api.php';
//
//Instantiate the api class
$api = new API();
//
//Obtain the order id
$order_data = file_get_contents("php://input");
//
//Get the order amount
$order = json_decode($order_data);
//
//Round off the floating point number to the highest whole number
$amount = ceil($order->total);
//
//Generate the order ID as an unique id
$order_id = uniqid();
//
//The payload array
$payload = array(
    "BusinessShortCode" => $business_short_code,
    "Password" => $password,
    "Timestamp" => $time_stamp,
    "TransactionType" => "CustomerPayBillOnline",
    "Amount" => $amount,
    "PartyA" => $order->phone,
    "PartyB" => $business_short_code,
    "PhoneNumber" => $order->phone,
    "CallBackURL" => LNMO_CALLBACK_URL . $order_id,
    "AccountReference" => $order_id,
    "TransactionDesc" => "Payment of X"
);
//
//URL that we will need to send
$url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";
//
//Get the response back once our message has been sent to our lipa na MPESA class
$response = $api->lipa_na_mpesa_online($url, json_encode($payload));
//
//The data array contains three main variables namely
$data = [
    'orderid' => $order_id,
    'order' => $order,
    'stkreqres' => json_decode($response, true)
];
//
//Confirm that the orders directory exists and if it does not exist,
//
//Modify the permissions on the orders to make write access available
//chmod("order", 07777);
//
//Processing of orders in this case requires the completion of code
$ord = fopen("orders/" . $order_id . ".json", "a");
//
//Write data to the orders file
fwrite($ord, json_encode($data));
//
//Close the data file once the save is completed
fclose($ord);
//
//Send the response to the customer
echo json_encode($data);
