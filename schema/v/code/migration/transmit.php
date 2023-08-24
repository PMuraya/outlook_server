<?php
namespace mutall;
//
//This file supports the link between the server and client sub-systems
//
//Start the buffering as early as possible. All html outputs will be 
//bufferred 
\ob_start();
//
//Catch all errors, including warnings.
\set_error_handler(function(
    $errno, 
    $errstr, 
    $errfile, 
    $errline /*, $errcontext*/
){
    throw new \ErrorException($errstr, $errno, \E_ALL, $errfile, $errline);
});
//The output structure has the format: {ok, result, html} where:-
//ok: is true if the returned result is valid and false if not. 
//result: is the user request if ok is true; otherwise it is the error message
//html: is any buffered html output message that may be helpful to interpret
//  the error message 
$output = new \stdClass();
//
//Catch any error that may arise.
try{
    //
    //Use the global variables to exrect the cmd property; it represents the
    //request from the receiver.
    //
    //Extract the command parameters: class, cargs, method, margs
    //
    //Use the class name to construct the matching object
    //
    //Execute the requested method, using the given arguments and collect the 
    //result
    //    
    //Set the output property to the executed result
    //
    //The process is successful; register that fact
    $output->ok=true;
}
//
//The user request failed
catch(\Exception $ex){
    //
    //Register the failure fact.
    $output->ok=false;
    //
    //Compile the full message, including the trace
     //
    //Replace the hash with a line break in the terace message
    $trace = \str_replace("#", "<br/>", $ex->getTraceAsString());
    //
    //Record the error message in a friendly way
    $output->result = $ex->getMessage() . "<br/>$trace";
}
finally{
    //
    //Empty the output buffer to the output html property
    $output->html = ob_end_clean();
    //
    //Convert the output to a string
    $encode = \json_encode($output, \JSON_THROW_ON_ERROR);
    //
    //Return output to the client
    echo $encode;
}