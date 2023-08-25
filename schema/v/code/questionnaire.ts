//Resolve the mutall error class, plus access to the application url
import * as schema from "./schema.js";
//
//A layout is a format for presenting data. It is either labeled or tabular. 
//Here is data laid out in a label format(similar to how envelops are labeled): 
/*
name:'muraya';
address:'474 Kiserian
----------------------
name:'kangara'
address:'896 Kikuyu'
---------------------
etc
*/
//Here is the same data laid out in a tabular layout
/*
 name       address
 ---------------
 muraya     474 Kiserian
 kangara    896 Kikuyu
 etc
 */
export type layout = label|table;
//
//A labeled layout is a tuple of 5 elements, of which the first 3 are mandatory;
//the remainder are optinional. (The justification is that often we use the 
//dafault alias,[], and working across databases is not common)
//
//We are considering the use of a .dts file generated from a server to support type 
//checking of the following label components: dbname, ename and cname against 
//the available databases in the server.
export type label = [expression, ename, cname, alias?, dbname?];
//
//Assign Peter Kamau to derive the databases from a server needed for
//describing this type so that Typescript can check the proper use of
//database, entity, column and index names. Consider a parametrized definition of 
//e.g., a dbname that is driven by a server structure similar to:-
/*
type server = {
    mutall_users:{              <----------dbname
        user:{                  <----------ename
            name:string,        <----------cname
            password:string
        }
    tracker:{intern:.....}
    rentize:{client:
}    
 
Tpyes dbname, cname and ename can be then be expressed in terms of the servers 
structure. E.g.,
type dbname = keyof server; 
type ename<dbname> = keyof server[dbname]
type cname<dbname, ename> = keyof server[dbname][ename]

The parametrized definition of a label would be:-
type label<dbname, ename, cname> = [expression, ename<dbname>, cname<bame, ename>, alias?, dbname?>]

This definition would allow teh checking of labels against the databases on the 
sever, making data loading safer.

For now, the dbname, dname and ename are simply strings
*/
//The name of a database that must exist on the server
type dbname = string; 
//
//The database table (a.k.a., entity) name where the data is to be stored
type ename = string;
//
//The column name where the data is stored in an entity
type cname = string;
//
//An alias ia an id, such that its combination a dbname, ename, and cname is
//used to form a unique index of an expression The questionnaire loading system
//requires that all labeled expressions being loaded must be uniquely identified
//by the dbname/ename/cname/questionnaire combination. An alias is designed
//as an array to support loading of hierarchical data.
type alias = Array<schema.basic_value>;
//
//An expression is the data to be stored in the database. It may be the simple
//basic type or a named function implemented in PHP
type expression = 
    //
    //...a basic Typescript value...
    schema.basic_value
    //
    //...or a tuple that has a function name and its arguments. The name is a 
    //reference to a PHP class and the arguments should match those of the 
    //(class) constructor
    |[string, ...any]

    //Add examples of typical usage of a label
    
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
            