//Resolve the mutall error class, plus access to the application url
import * as schema from "./schema.js";

//Define the structure of a questionnaire, Iquestionnaire
//
//A questionnaire is either:-
export type Iquestionnaire = 
    //
    // ...an array of layouts....
    Array<layout>
    //
    //...or a (Mutall) commented Microsoft Excel file name
    |string;
//
//A layout is either labeled or tabular
export type layout = label|table;
//
//A labeled layout is a tuple of 5 elements
//
//We are considering the use of a .dts file generated from a server to support type 
//checking of the following label components: dbname, ename and cname.
export type label = [dbname, ename, alias, cname, expression];

//A datababase name must exist on the server
//
//Assign Peter Kamau to derive the databases from a server needed for
//describing this type so that Typescript can check the proper use of
//database, entity, column and index names
type dbname = string; //"mutall_users"|"tracker"|"rentize"|"postek"|"chama"|"real_estate";
//
//The database table, a.k.a., entity, where the data is stored
type ename = string;
//
//The column name where the data is stored in an entity
type cname = string;
//
//A context that uniquely describes the entity. An artefact is acontextualized  database 
//table
type alias = Array<schema.basic_value>;
//
//The arguments of an expression is an array of any type
type Args = any[];
//
//The data to be stored in the database, specified as an expression. An expression may be:-
type expression = 
    //
    //...a basic Typescript value...
    schema.basic_value
    //
    //...or a tuple that has a function name and its arguments. The name is a 
    //reference to a PHP class and the arguments should match those of the 
    //(class) constructor
    |[string, ...any]
    
//-------------------------------------------------------------------
//    
//
//The description of input data laid out in a tabular format
export interface table  {
    //
    //The class name of the table. The following are inbuilt -- all in the
    //capture namespace
    //fuel: A table whose body is an array
    //csv:A table whose booy is derived from a csv file
    //query:A table whose body is fetched using an sql statement
    //Users may add their own class names, as long as they define a matching 
    //php Class. For instance, the whatsapp class was added to support processng
    //of whatsup messages
    class_name:string,
    //
    //The arguments of the class constructor. For the inbuilt classes
    //check file questionnaire.php to get the correct order and type of 
    //constructor arguents
    //For user-defined classes, ensure that the arguments match those of 
    //the PHP class constructor 
    args:Array<any>
}

//The table layout associate with a matrix of basic values
export interface matrix extends table{
    class_name:'\\mutall\\capture\\matrix';
    args:[
        //
        //The table's name, used in formulating lookup expressions    
        /*tname:*/ string,
        //
        //The table's header as an array of colum names (implicitky 
        //indexed by their positions). An empty list means that columns will be
        //idenfied by thier index positions     
        /*cnames:*/ Array<string>,
        //    
        //A table's body of data, as a double array of basic values    
        /*body*/ Array<Array<schema.basic_value>> ,
        //
        //Where does the body start, an optional numbe which if ommited is
        //set to 0     
        /*$body_start*/number?
    ]
}

//

//The output from loading a questionnaire is the Imala data structure.
//The structure is either...
export type Imala = 

  //...a list of syntax errors...
  {class_name:'syntax', errors:Array<string>}
  //
  //..or runtime result from loading artefacts that are ....
  |{  
        class_name:'runtime', 
        //
        //...independent of data tables in the questionnaire
        labels:Array<label>,
        //
        //...dependent of the tables 
        tables:Array<{
            //
            //Name of the table
            name:string,
            //
            //Total number of logged errors
            errors:number
            //
            //A sample of the top 3 rows to reveal row based reaults 
            rows:Array<label> 
        }>
   }
//
//The errors retuned in the label_errors part of teh Imala structure
//is designed to be rich enough for reporting. For now,i its a simple string      
type error = string;
//
            