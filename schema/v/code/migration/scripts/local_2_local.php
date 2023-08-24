<?php
//
//This is a script executed using a browser to test migration
//of data from one database to another on this local machine. This code
//must be inatslled locally
//
//Resolve access to the shared migration code

use mutall\migration\server;

include_once '../migration.php';

//Create a server that will write data to mutallco_rental_test database
//on the local server
$local= new server('mutallco_rental');
//
//Compile the data source
$from_local = ['dbname'=>'mutallco_rental_test', 'server'=>server::LOCALHOST];
//
//Migrate data from mutallco_rental to mutallco_rental_test databses both of 
//which are in this local machine
$result = $local->migrate($from_local);
//
echo $result;