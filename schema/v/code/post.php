<?php
namespace mutall;
//
//Catch all errors, including warnings.
\set_error_handler(function($errno, $errstr, $errfile, $errline /*, $errcontext*/) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
//
//The schema is the base of all our applications; it is primarily used for
//supporting the database class. 
include_once 'schema.php';
//
//Include other files, as required by the mthod being tested
include_once 'questionnaire.php';
//
//Get the last posted data
$contents = file_get_contents('post.json');
//
//Assign it to global request variable using array indices 
$_REQUEST = json_decode($contents, true);
//
//Execute the posted request
$result = mutall::fetch();
//
//Show the results
echo "<pre>".json_encode($result)."/pre>";
