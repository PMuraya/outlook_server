<?php
//Generate the Object-Relation-Mapping (orm.ts) file
//
//Resolve reference to the schema entity
include_once "schema.php";
//
//
//Resolve referebce to the join class
require_once 'sql.php';
//
//Use the objevt to generated an orm file for all the databases on this server
map_databases();
//
echo 'Ok';
//Generate code (in orm.js) for mapping databases in this server to a interface
//that can used for describing matching classes in typescript. It is used as
//follows:-
//import {orm} from "./orm.js" //The file that holds the auto-generated code
//inport * as der from "./derivative.ts" //The file that uses orm define database, entities 
//  and attributes. It contains statements such as
//export type databases<x extends orm> = Partial<{[k in x]:database<k>}>  
//expoert type database<k extends keyof orm> = ...etc. 
//interface databases implements der.databases{
//...
//..the implememtation allows us implement classes such as
//  class msg extends tuple implements der.entity<'msg'>{
//  } 
//}
//The striucture of orm....
//interface orm={[dbname:string]:{[ename:string]:{name:string, columns:{[cname:string]:{type, legnth}}}}}}
function map_databases():void{
    //
    //Create a new schema object
    $schema = new \mutall\schema();
    //
    //Get the databases that are running on this server
    $databases = $schema->get_databases();
    //
    //Open file orm.ts for writing. It is conceived as a ts file, rather 
    //than js, so that ts can check it to generated the js
    $stream = fopen(__DIR__.'/orm_auto.ts', 'w');
    //
    //Output the import statement
    fwrite($stream, 'import * as tuple from "./tuple.js"'.";\n");
    //
    //Loop through all the databases to generate a clause such as
    for($i=0; $i<count($databases); $i++){
        //
        //Output 2 databases only
        if ($i<2) $databases[$i]->map($stream);
    }
    //
    //Close file orm.ts
    fclose($stream);
}
