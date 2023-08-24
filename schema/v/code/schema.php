<?php
namespace mutall;
//
require_once 'config.php';
//
//Include questionnaire to see if this addresses the following problem
//Fatal error: 
//  Could not check compatibility between 
//      mutall\capture\artefact::pk(): mutall\capture\column 
//  and mutall\entity::pk(): mutall\column, 
//  because class mutall\capture\column is not available 
//in questionnaire.php on line 796
//
//This did not solve the problem, so I commemneted it out
//require_once 'questionnaire.php';
//
//The super class that supports the common methods for all the classes 
//in a mutall project. 
class mutall {

    //
    //Every mutall object is characterised by this property
    public string $class_name;
    //
    //The namespace of this mutall object
    public string $ns;
    //
    public bool $throw_exception;

    //
    function __construct(bool $throw_exception = true) {
        //
        //What do you do if there are any (entity) errors?. That depends on the
        //3rd parameter -- throw_exception. The Default is true
        $this->throw_exception = $throw_exception;
        //
        //
        $reflect = new \ReflectionClass($this);
        //
        $this->class_name = $reflect->getShortName();
        //
        //Add the namespace from which this objet was created
        $this->ns = $reflect->getNamespaceName();
    }

    //The function that supports executon of arbitray methods on arbitrary class
    //objects from Javascript. This method is called from index.php. 
    static function fetch()/*:result*/ {
        //
        //The class name must be set 
        if (!isset($_REQUEST['class'])) 
            throw new \Exception('Class name not found');
        
        // 
        //Get the requested class name. PHP classes referenced in Javascript are
        //expected to be found in the \mutall namespace
        $class = "\\mutall\\".$_REQUEST['class'];
        //
        //The method must be set
        if (!isset($_REQUEST['method'])) {
            throw new \Exception('The method of the class to execute must be set');
        }
        //
        //Retrieve and set the method from the global request 
        $method = $_REQUEST['method'];
        //
        //Get the method parameters 
        if (!isset($_REQUEST['margs'])) {
            throw new \Exception("Method parameters not found");
        }
        $margs = json_decode($_REQUEST['margs'], null, 512, JSON_THROW_ON_ERROR);
        //
        //This method is executable at an object state or static state
        //controlled by the is_static property at the request
        $is_static = isset($_REQUEST['is_static']) && $_REQUEST['is_static'];
        //
        //If this is an object method...
        if (!$is_static) {
            //
            //Create an object of the class to execute
            //
            //Get the class contructor arguments
            if (!isset($_REQUEST['cargs'])) {
                throw new \Exception("Class constructor parameters not found");
            }
            $cargs = json_decode($_REQUEST['cargs'], null, 512, JSON_THROW_ON_ERROR);
            $obj = new $class(...$cargs);
            //
            //Execute on object method
            $result = $obj->$method(...$margs);
        } else {
            //
            //Execute the static method on the class 
            $result = $class::$method(...$margs);
        }
        //
        //This is the Expected result from the calling method
        return $result;
    }

    
     /**
      * Illustrate how the image file is moved to the server.
      * @return bool
      */
    static function post_file(): bool {
        //
        //Get the files to upload...
        $fs_name = $_FILES['file']['name'][0];
        $fs_tmp_name = $_FILES['file']['tmp_name'][0];
        //
        //Get the post Folder to save to
        $folder = $_POST['folder'];
        //
        //Concatenate the folder and file name to get the actual path to save to.
        $path = $folder . '/' . $fs_name;
        //
        //
        //The move_uploaded_file() moves an uploaded file to a new location.
        //if the destination file already exists it will be overwritten.
        //requires a file_path: the file to be moed.
        //moved_path: where the file will be moved.
        return move_uploaded_file($fs_tmp_name, $path);
    }
    
    //Report exceptions in a more friendly fashion
    static function get_error(\Exception $ex): string {
        //
        //Replace the hash with a line break in the trace message
        $trace = str_replace("#", "<br/>", $ex->getTraceAsString());
        //
        //Retirn the full message
        return $ex->getMessage() . "<br/>$trace";
    }

    //
    //sets the database access credentials as session keys to avoid passing them
    //any time we require the database object 
    static function save_session($username, $password) {
        //
        //save the database credentials as session variables hence we do not have to 
        //overide them anytime we want to acccess the database yet they do not change 
        //Save the username 
        if (!isset($_SESSION['username'])) {
            $_SESSION['username'] = $username;
        }
        //
        //Save the password 
        if (!isset($_SESSION['password'])) {
            $_SESSION['password'] = $password;
        }
    }

    //The following tow functios are used for intercepting posted data for debugging
    //purposes.
    //
    //1. Save Requested/posted data to the given file
    static function save_requests(string $filename) {
        $json = json_encode($_REQUEST);
        file_put_contents($filename, $json);
    }

    //Retrieve posted data to a file
    static function set_requests(string $filename) {
        $contents = file_get_contents($filename);
        //
        //Set teh requests, using keys as array indices
        $_REQUEST = json_decode($contents, true);
    }
    
    
    //Offload the properties from the source to the destination
    static function offload_properties($dest, $src) {
        //
        //If the source is empry, there is nothing to offload
        if (is_null($src)) return;
        //
        //Loop through all the keys of the source and for each key add it to 
        //to the destination if it does not exist
        foreach ($src as $key => $value) {
            //
            if (!isset($dest->$key)) {
                $dest->$key = $value;
            }
        }
        return $dest;
    }

    //Ignoring the variables that are not used mostly durring destructring 
    //or position based element
    static function ignore() {
    }
    
    //This method is used for resolving user defined classes found in the 
    //application's website folder by autoloading the appropriate php file.
    //It assumes one file per class, saved in the root folder
    static function search_class(string $class_name){
        //
        //Get the website folder; it must have been passed to the server from
        //the client, so it must exist.
        if(!isset($_REQUEST['url']))
            throw new \Exception("Website url not found");
        //
        //Now get the complete url,.e.g., 
        //http://localhost:90/tracker/v/code/index.php ?x=y
        $url= $_REQUEST['url'];
        //
        //Get the complete index path for the application website
        //.e.g., /tracker/v/code/index.php
        $index= parse_url($url, PHP_URL_PATH);
        //
        //Retrieve the website folder,.e.g., tracker/v/code
        $website= pathinfo($index,PATHINFO_DIRNAME);
        //
        //Add the requested class name to the website folder
        $file_name= 
            //
            //Start from document root folder, e.g..
            //D:\mutall_project\    
            $_SERVER["DOCUMENT_ROOT"]
            //
            //Add the website, e.g., tracker/v/code    
            .$website
            //
            //Add the directory separator, i.e, forward slash, 
            .DIRECTORY_SEPARATOR
            //
            //Add the class name, taking care of namespaces to match folder 
            //structure    
            .str_replace('\\', DIRECTORY_SEPARATOR, $class_name)    
            //
            //Add the php extension
            .".php";
        //
        //Include this file once if it exists
        if(file_exists($file_name)) require_once $file_name;
    }

    //This version of the shell exec imlementatiion is an extension of the
    //standard php version; but this one fauls if the sshell command canno
    //be executed, rather than just retutning false 
    static function shell_exec(string $command):null|string{
        //
        //Call the standard shell exec command
        $result = \shell_exec($command); 
        //
        //If the shell command failed report it. NB. The === is used rather than 
        //a (!result) becase a null value evaluates to false. HARD LESSON LEARNT
        if ($result===false)
            throw new \Exception("The shell command '$command' failed to execute");
        //
        //return teh result
        return $result;
    }

}


//Modelling special mutall objects that are associated with a database schema.
//Database, entity, index and column extends this class. Its main charatreistic
//is that it represents a package whose contents can "saved", resulting in 
//a basic expression.
class schema extends mutall {
    //
    //This partial name of a schema objected is its name plus the database 
    //source it needed for formulating xml tags, indexing joints, etc.
    public string $partial_name;
    //
    //Toggle the default auto commit of the trasactions to true of false onorder to 
    //influence a rollback and a commit upon the end of a transaction 
    //The default is a false 
    static bool $roll_back_on_fatal_error = false;
    //
    //A achema object has dual forms. The first one is said to be static; the 
    //second one is activated. When a schema object is activated, the resulting 
    //errors are manaed by ths property
    public array /* error[] */$errors = [];
    //
    //When a shema object is written to a database, the result can be accessed
    //from here
    public /*answer*/ $answer;

    //The partial name is used for identifying this object in the
    //context of generating xml logs
    function __construct(string $partial_name='no_name') {
        //
        $this->partial_name = $partial_name;
        //
        parent::__construct();
    }
    
    //Compile the full name of a node from the partial ame. This is implemented
    //as a function because the partial name may change during runtime, e.g., in 
    //the case of barrel saving
    function full_name():string{
        return "$this->class_name.$this->partial_name";
    }

    //
    //Exports a schema object to the database by:-
    //-opening the save tag (nameed using the partial name)
    //-writing the schema object to the database
    //-closing the save tag.
    //The key point about save is that all schema objects use this 
    //implementation AND CANNOT OVERRIDE IT, so its final.
    //
    //The input parameter is either a row detail, if the save was initiated
    //from a table; otherwise it is null.
    //
    //The result is an output expression, a.k.a., answer
    final function save(/*row|null*/$row): answer{
        //
        //Use the row data to determine if logging is necessary
        $log = $this->logging_is_necessary($row);
        //
        //Open the log for this export operation
        if ($log) {
            $element = log::$current->open_tag("save.{$this->full_name()}");
            //
            //Add the schema-specific attributes to the save element
            $this->log_attributes($element);
        }
        //
        //Get the expression returned after a write into the database. Take care 
        //of the fact that the writing may fail with an exception
        $ans = $this->write($row);
        //
        //Save this answer for future reference.
        $this->answer = $ans;
        //
        //Log the result if loggig mode is on.
        if ($log){
            //
            log::$current->add_attr('result', "$ans");
            //
            //Close the log for this save
            log::$current->close_tag($element);
        }
        //
        //Return the basic expresiion 
        return $ans;
    }
    
    //Determines if logging is necessary or not. By default, logging is 
    //necessary. In the case of a beral, we should control logging, to
    //avoid cluterring the log file with repetitive errors
    function logging_is_necessary($row){
        //
        return true;
    }
    
    //
    //Add the schema-specific attributes to the save element. For now only the
    //save.artefect element has meaniful attributes to log
    function log_attributes($element):void{}

    //Every schema object must implement its own way of writing to 
    //the database .When it does, it must return an answer. If it does not 
    //implement a write method then this default one will throw an exception. 
    //
    //This write operation is implemennted for all schema objects.
    protected function write(/*row|null*/$row):answer{
        //
        throw new \Exception("We cannot write schema object of type "
                . "$this->class_name to the database");
    }

    //Returns the named database if it was previously opened; otherwise it creates
    //one from the information schema. 
    function open_dbase(string $dbname): database {
        //
        //Return a previously opend database if it exists
        if (isset(database::$current[$dbname])) return database::$current[$dbname];
        //
        //Create a fresh copy of the requested database
        $dbase = new database($dbname);
        //
        //Set the current database
        database::$current[$dbname] = $dbase;
        //
        return $dbase;
    }

    //Add fields (to this schema object) derived from the given comment string 
    //provided as a json (or no json)
    function add_comments(string $json): void {
        //
        //If the comment is empty, then it has nothig to add
        if (empty($json)) return;
        //
        //Decode the comment (which might be in proper json format) to a php 
        //(\stdClass) object, so it may fail. 
        $comment = json_decode($json);
        //
       //If the comment is not a valid json text, then consider teh original text
       //as a title for this schema object
       if (is_null($comment)){
           //
           $this->title = $json;
           //
           return;
       }
       //
       //If the comment is an object, then assign the propertis and their values
       //to this schema object, i.e., entity or column
       //E.g. {"cx":200, "cy":"-23"}, accs the cx and cy propertis  to a table
        if (is_object($comment)) {
            //
            //Offload the comment fields to this schema object. This works similarly
            //to Object.asiign in javascript
            mutall::offload_properties($this, $comment);
            return;
        }
        //
        //If the comment is a valid json that is not an object (remember null 
        //is an object) then consider teh decoded version as a title of the 
        //schema object
        $this->title = $comment;
    }
    
    //Returns all the databses in this server
    function get_databases():Array{
        //
        //Use the information schema to formulate sql for retrieving databases
        //Set the system databses for filtering later
        $system_dbs = "
            'information_schema',
            'performance_schema',
            'phpmyadmin',
            'webauth',
            'mysql',
            'sys'
        ";
        //Select all database names excluding php system databases
        $sql = "
            select 
                schema_name as dbname 
            from 
                information_schema.schemata
            where 
                schema_name not in ($system_dbs)
        ";
        //
        //Execute the sql (without formulating compiling a mutall-compliant 
        //database -- because the information schema is not compliant)
        $names = (new database('information_schema', false))->get_sql_data($sql);
        //
        //Map the names to their corresponding (complete) databases. Do not
        //stop even if there are database errors
        $databases = array_map(fn($db)=>new database($db['dbname'], true, false), $names);
        //;
        //Return the databases
        return $databases;
        
    }
}    
//Answer is an expression that can particicate as an output expression 
//from a save operation. The Typescript's style of definition would be
//type answer = myerror|scalar. Without this union way of expressing ourselves
//in PHP we have implemented it as an interface where myerror and scalar implements
//this interface.
interface answer{
    //
    //Answers must be convertible to strings for xml logging
    //purposes
    function __toString();
    //
    //At some point, we need to enrich an answer with position data
    //when its available. The data can be recovered using this function
    //
    function  get_position()/*:[row_index, col_index?]|null*/; 
        
}

//An operand is an expression that can take part in input operations. It can be
//a complex exression that is simplifiable to get an answer. See the definition 
//of an answer. Both were designed to support the questionnnaire class for large 
//data loading.
interface operand{
    //
    //An operand must be simplifiable to get answer
    function simplify():answer;
}

//This general form of an expression was originaly designed to suport sql 
//operations
interface expression {
    //
    //Every expression must be expressable as a valid sql string expression.
    //Often, this method returns the same value as the __toString() magic method,
    //but not in all cases. For instance, the __toString() of the id field in 
    //a selector is, e.g., "mutall_login.application.id__" whereas its to_str()
    //value is "concat(mutall_login.application.name,'/')". The __toString() of
    // an the application entity is, e.g., "muutall_login.application"; but that
    // of the aplication expression, to_str() refers to the primary key field
    // "mutall_login.application.application"
    function to_str(): string;

    //Yield the entities that participate in this expression. This is imporatnt 
    //for defining search paths for partial and save_indirect view. This is the 
    //method that makes it posiible to analyse mutall view and do things that
    //are currently woul not be possible without parsing sql statements
    function yield_entity(): \Generator;

    //
    //Yields the primary attributes that are used in fomulating this expression.
    //This is important for determining if a view column is directly editable or 
    //not. It  also makes it possble to expression values by accesing the primary
    //eniies that constitue them up.
    function yield_attribute(): \Generator;
}

//This class models a function as originally designed to support sql statements
//and later moved to the schema file to support parsing of default values
//
//A function is an expressiion that can be used as an answer to a simplification
//process. So, it can the result of an scheme::save() method
class function_ implements expression, answer{
    //
    //These are the function's arguments
    public array /*expression []*/$args;
    //
    //This is the name of the function e.g., concat 
    public $name;
    //
    //???
    public bool $is_view;
    //
    //Requirements for supporting the get_position() method
    public /*[row_index, col_index?]*/$position = null;
    //
    //This functin is imporant for transferring expression ppostion data 
    //between exprssions. E.g., 
    //$col->ans->position = $col->exp->get_postion()
    function get_position(){return $this->position; }
    //
    function __construct(string $name, array/*expression[]*/ $args){
        //
        $this->name = $name;
        $this->args = $args;
    }
    
    //Convert a function to a valid sql string
    function to_str():string{
        //
        //Map every argument to its sql string equivalent
        $args = array_map(fn($exp)=>$exp->to_str(), $this->args);
        //
        //All function arguments are separated with a comma
        $args_str = implode(', ', $args);
        //
        //Return the properly syntaxed function expression
        return "$this->name($args_str)";
    }
    
    //Yields all the entity names referenced in this function
    function yield_entity():\Generator{
        //
        //The aarguments of a functin are the potential sources of the entity
        //to yield
        foreach($this->args as $exp){
            //
            yield from $exp->yield_entity();
        }
    }
    //Yields all the atrributes referenced in this function
    function yield_attribute():\Generator{
        //
        //The aarguments of a functin are the potential sources of the entity
        //to yield
        foreach($this->args as $exp){
            //
            yield from $exp->yield_attributes();
        }
    }
    //
    //
    function __toString() {
        return $this->to_str();
    }
}

//Modelling the database as a schema object (so that it too can save data to 
//other databases)
class database extends schema {
    //
    //An array of entties the are the collection of the tables that are required to create a 
    //database 
    public array $entities = [];
    //
    //This is the pdo property that allows us to query and retrieve information from 
    //the database it is a property to avoid this class from extending a pdo
    public \PDO $pdo;
    //Let the user set what should be considered as the default database. This is 
    //the database that is picked if a daabase name is not given explicity. This 
    //is designed to simplify working with a single database.
    static database $default;
    //
    //An aray of ready to use databases (previously descrobed as unserialized). 
    static array/* database[name] */ $current = [];
    //
    //This is where the error report is saved.
    public string $report;

    //
    //The database constructor requires the following parameters 
    //name: name of the database which is mandatory 
    //complete: an optional boolean that indicates whether we desire a database
    //complete with its entities or not. The the default is complete. If not 
    //an empty shell is returned; this may be useful when quering the database
    //directly, i.e., without the need of the object model
    function __construct(
            //
            //The database name.
            string $name,
            //
            //An optional boolean that indicates whether we desire a database
            //complete with its entities or not. The the default is complete.
            // If not  complete an empty shell is returned; this may be useful when 
            //quering the database directly, i.e., without the need of the object model
            bool $complete = true,
            //
            //An option that throws errors as soon as they are found; the  
            //default is true
            bool $throw_exception = true
    ) {
        //
        //Construct the parent 
        parent::__construct($name);
        //
        $this->name = $name;
        //
        //Set the default value of the optional complete as true
        $this->complete = $complete;
        //
        //What do you do if there are any (entity) errors?. That depends on the
        //3rd parameter -- throw_exception. The Default is true
        $this->throw_exception = $throw_exception;
        //
        //Connect to the database by initializing the php PDO object
        $this->connect();
        //
        //Set the current database, so that it can be accessed by all her 
        //dependants during activation.
        database::$current[$name] = $this;
        //
        //Attend to the 'complete' option. You are done if an incomplete database 
        //is required. Don't waste time on entities. This is important if all we
        //want is to run a query
        if (!$complete) {
            return;
        }
        //
        //Activate the schema objects (e.g., entities, columns, etc) associated
        //with this database
        $ok = $this->activate_schema();
        //
        //If there any errors, fix them before you carry on
        if (!$ok) {
            $this->report_errors();
            return;
        }
        //
        //Set the relational dependency for all the entities and log all the 
        //cyclic conditions as errors.
        $this->set_entity_depths();
        //
        $this->report_errors();
    }
    
    // 
    //Use this database to test if a user with the given credentials is 
    //found in the user database or not. It returns an array
    //which when json encoded and decoded behaves like an stdclass of
    //the shape: {result:'ok', pk:number} | {result:'error', msg:string}
    public function authenticate(string $name, string $password):array{
        // 
        //Create an sql/view to retrieve the password from  user table. 
        //the user with the given name 
        $sql = "
            select 
                password, 
                user 
            from 
                user 
            where 
                name= '$name' ";
        //
        //Execute the query and retrieve the password
        $users= $this->get_sql_data($sql);
        // 
        // Test if there is any user that matches the name if not report so
        if(count($users)===0){return ['result'=>'error', 'msg'=>'Please sign up first, to access services'];}
        // 
        //If there is more than one  user we throw an exception
        if(count($users)>1){throw new myerror("More than one name found. "
                . "Check your data model");}
        //
        //If the user exists verify the password.
        $ok = password_verify($password, $users[0]["password"]);
        //
        //If the autentication exists, return {result:'ok', pk:number}
        if ($ok)return ['result'=>'ok', 'pk'=>$users[0]["user"]];
        //
        //Otherwise return {result:'error', msg:string}
        else return ['result'=>'error', 'msg'=>'Sign in failed because of wrong credentials'];         
    }
                
    //Create a new account for the given user from first principles 
    //so that we can take charge of error reporting. It returns an array
    //which when json encodede and decodes behaves like an stdclass of
    //the shape: {result:'ok', pk:number} | {result:'error', msg:string}
    public function register(string $name, string $password):array{
        // 
        //Create an sql/view to retrieve the password from  user table. 
        //the user with the given name 
        $sql = "
            select 
                user,
                password 
            from 
                user 
            where name= '$name'";
        //
        //Execute the query and retrieve the password
        $users= $this->get_sql_data($sql);
        //
        //Get the entity on which to do the insert this will aid in string 
        //processing since entities and columns have their string equivalent
        $entity=$this->entities["user"];
        //
        //if no user is found, create the user's instance
        if(count($users)===0){
            // 
            //Formulate the sql to insert from first principle 
            //insert statement 
             $sql = "INSERT \n"
                    //
                    //Get the entity to insert 
                    . "INTO  {$entity} \n"
                    //
                    //Insert the two columns name and password
                    . "("
                            . "{$entity->columns["name"]},"
                            . "{$entity->columns["password"]} "
                    . ")\n"
                    //
                    //Insert the given values.
                    . "VALUES ("
                         . "'{$name}','" .password_hash($password, PASSWORD_DEFAULT)."'"
                    . ")\n";
            //
            //Execute the insert query
            $this->query($sql);
            //
            //Stop any further execution, returning success the last insert id
            return ['result'=>'ok', 'pk'=>$this->pdo->lastInsertId()];
        }
        //
        //This user exists 
        //
        //Test if user exists with a null password. If he does, set the password
        //to the given one
        if(is_null($users[0]["password"])){
            $stmt="UPDATE \n"
                    //
                    //Update this entity
                    . "{$entity} \n"
                    . "SET \n"
                    //
                    //Update the password from the null to the hashed version. 
                    . "{$entity->columns["password"]}='"
                        .password_hash($password, PASSWORD_DEFAULT). "'\n"
                    //
                    //Update only the given nameed user.
                    . "WHERE {$entity->columns["name"]}='$name'\n";
            //
            //execute
            $this->query($stmt);
            //
            //Stop any futher execution, returning ok with the selected primary key 
            return ['result'=>'ok', 'pk'=>$users[0]['user']];
        }
        //
        //We have a user who has a password already. Return the error message
        return ['result'=>'error', 'msg'=>"You '$name' already have an account; please use it to log in"];
    }
    //
    //For now we do not have a need of saving an entity 
    protected function write(/*row|null*/ $row): answer {
        throw new \Exception("You cannot save a database");
    }

    //The user may decide to report the errors in a different way than just 
    //throwing an exception. For instance, if the database initialization was 
    //started from javascript, the reported errors may be input to a better 
    //reportng system than the dumbed output.
    private function report_errors() {
        //
        //Compile the error report.
        //
        //start with an empty report and no_of_errors as 0
        $no_of_errors = 0;
        $report = "";
        //
        $this->get_error_report($no_of_errors, $report);
        //
        //Save the error report -- incase you want to access it
        $this->error_report = $report;
        //
        //Depending on the throw_exception setting...
        if ($this->throw_exception) {
            //
            if ($no_of_errors > 0) {
                throw new \Exception($report);
            }
        }
    }

    //Activate the schema objects (e.g., entities, columns, etc) associated
    //with this database
    private function activate_schema(): bool {
        //
        //Query the information information scheme once for the following data
        //
        //Activate all the entities of this database from the tables of the 
        //information
        $this->activate_entities();
        //
        //Activate all the columns of this database from the columns of the 
        //information schema
        $this->activate_columns();
        //
        //Activate all the identification inices from the statistics of the 
        //information schema
        $this->activate_indices();
        //
        //Check for Mutall model consistency, e.g., 
        //missing indices, missing primary keys, invalid data type for primary
        //keys, invalid relations
        return $this->check_model_integrity();
    }

    //
    //Check for mutall model consistency, e.g., 
    //missing indices, missing primary keys, invalid data type for primary
    //keys, invalid relations
    private function check_model_integrity(): bool {
        //
        //collection of the errors
        $errors = [];
        //
        //loop through all the entities to test the following 
        foreach ($this->entities as $ename => $entity) {
            //
            //1. indices
            if (!isset($entity->indices)) {
                //
                //Set an error message both at the database level and the entity 
                $error = new \Error("Entity $ename is incomplete and lack indexes");
                array_push($this->errors, $error);
                //
                //Ensure that the primary key is noy used for indexing.
                // $this->x();
            }
            //
            //2.missing primary keys
            if (!isset($entity->columns[$entity->name])) {
                //
                //Set an error message both at the database level and the entity 
                $error = new \Error("Entity $ename does not have the primary key");
                array_push($this->errors, $error);
            }
            //
            //Every column should have the proper credentials
            foreach ($entity->columns as $col) {
                //
                //Check the integrity of this column, including comments
                $col->verify_integrity();
                
                //
                //Collect column errors if any
                $errors += $col->errors;
            }
            //
            $errors += $entity->errors;
        }
        //
        //return true if the count og errors is greater than 0 else it is a false
        return count($errors) === 0;
    }

    //Check if an sql is valid. It returns thh same sql.
    //This is important for debudgging queries that depend on others
    public function chk(string $sql):string{
        //
        try{
            //Run the query to catch any errors in the query
            //
            $this->pdo->beginTransaction();
            $this->query($sql);
            $this->pdo->rollBack();
        }catch(\Exception $ex){
            //
            //Re-throw the exception with the full sql appended
            die(
                "<pre>"
                .$ex->getMessage()
                ."\n"    
                .$ex->getTraceAsString()    
                ."\n".$sql
                ."</pre>"
            );
        }
        //
        //Return the same sql as the input
        return $sql;
    }
    
    //Activate all the entities of this database by querying the information schema.
    //This method needs to be overriden to extend entities, for instance, when 
    //entities in the capture namespace are created from those in the root.
    function activate_entities(): void {
        //
        //Get all the static entities from the information schema's table.
        $tables = $this->get_entities();
        //
        //Now activate the entities, indexing them as you go along
        foreach ($tables as [$dbname, $ename, $comment]) {
            //
            //Ensure that the database names match
            if ($dbname!==$this->name)
                throw new \Exception("This dataase name $$this->name does not match $dbname");
            //
            //Create the entity in the root namespace
            $entity = new table($this, $ename);
            //
            //Add fields derived from comments
            $entity->add_comments($comment);
            //
            //Push the entity object to the array to be returned
            $this->entities[$ename] = $entity;
        }
    }

    //Retyrn all th tables of this database from the nformation schema
    private function get_entities(): array/* [dbname, ename, comment][] */ {
        //
        //Let $sql be the statement for for retrieving the entities of this
        //database.
        $sql = "select "
                //    
                . "table_schema as dbname, "
                //    
                . "table_name as ename, "
                //    
                . "table_comment as comment "
                . "from "
                . "information_schema.tables "
                . "where "
                //
                //Only tables of the current database are considerd
                . "table_schema = '$this->name' "
                //
                //Exclude the views
                . "and table_type = 'BASE TABLE'";
        //
        //Execute the $sql on the the schema to get the $result
        $result = $this->pdo->query($sql);
        //
        //Retrueve the entires from the $result as an array
        $tables = $result->fetchAll();
        //
        //Return the tables list.
        return $tables;
    }

    //Activate all the columns of all the tables in this database. This can be
    //overriden, so it is public
    function activate_columns(): void {
        //
        //Get the static columns from the information schema
        $columns = $this->get_columns();
        //
        //Use the static data to formulate a capture column object
        foreach ($columns as [$dbname, $ename, $cname, $data_type, $default, $is_nullable, $comment, $length, $key, $type]) {
            //
            //The database names must match
            if ($dbname!==$this->name) 
                throw new \Exception("This database name $this->name does not match $dbname");
            //
            //Get the named entity; it is an error if it does not exist
            if (!isset($this->entities[$ename]))
                throw new \Exception("Entity '$ename' not found in database '$dbname'");
            $entity = $this->entities[$ename];
            //
            // Return the column as primary if its key is set to PRI
            if (isset($key) && $key == 'PRI') {
                //
                //The column constrcutior variablles are desifgned to a) initialize
                //its capture parent and b) check consistency with Mutall 
                //framework
                $column = new primary($entity, $cname, $data_type, $default, $is_nullable, $comment, $length, $type);
            }
            //
            //Create an ordinary column. It will be upgrated to a foreign key
            //at a later stage, if necessary.
            else {
                $column = new attribute($entity, $cname, $data_type, $default, $is_nullable, $comment, $length, $type);
            }
            //
            //Add fields derived from comments, i.e., offload the comment properties
            //to the column.
            $column->add_comments($comment);
            //
            //Add the column to the database
            $this->entities[$ename]->columns[$cname] = $column;
        }
        //
        //Activate the foreign key colums
        //
        //Promote attributes to foreign keys where necessary, using the column 
        //usage of the information schema
        $this->activate_foreign_keys();
    }

    //Get all the columns for all the tables in this database
    private function get_columns(): array/**/ {
        //
        //Select the columns of this entity from the database's information schema
        $sql = "select "
                //
                . "columns.table_schema as dbame, "
                //
                //specifying the exact table to get the column from
                . "columns.table_name as ename, "

                //Shorten the column name
                . "column_name as cname, "
                //
                //Specifying the type of data in that column
                . "data_type, "
                //
                //Get the default 
                . "column_default as `default`, "
                //
                //if it is nullable
                . "is_nullable, "
                //
                //Extract any meta data json information in the comments
                . "column_comment as comment, "
                //
                //The size of the collumn
                . "character_maximum_length as length, "
                //
                //The column key so as to identify the primary keys
                . "column_key as `key`, "
                //
                //Add the column type, to access the enum data type (if any) 
                //needed for supporting the selector i/o 
                ."column_type as type "
                //
            . "from "
                //
                //The main driver of this query
                . "information_schema.`columns` AS columns "
                //
                //Prepare to select only columns from base tables(rather than 
                //view)
                ."inner join information_schema.tables as tables on "
                    . "columns.table_schema = tables.table_schema "
                    . "and columns.table_name = tables.table_name "
                . "where "
                //
                //Filter out the view
                ." tables.table_type = 'BASE TABLE' "
                //    
                // The table schema is the name of the database
                . " AND columns.table_schema = '{$this->name}' ";
        //
        //Execute the $sql on the the schema to get the $result
        $result = $this->pdo->query($sql);
        //
        //Retrieve the entities from the $result as a simple array
        return $result->fetchAll(\PDO::FETCH_NUM);
    }

    //Promote existing columns to foreign keys where necessary, using the column 
    //usage of the information schema
    private function activate_foreign_keys() {
        //
        //Retrieve the static foreign key columns from the informatuion schema
        $columns = $this->get_foreign_keys();
        //
        //Use each column to promote the matching attribute to a foreign key.
        foreach ($columns as $column) {
            //
            //Destructure the column usage data to reveal the its properties
            list($dbname, $ename, $cname, $ref_table_name, $ref_db_name, $ref_cname) = $column;
            //
            //Get the named entity from this database. 
            //
            //The dbnames must match
            if ($dbname!==$this->name)
                throw new \Exception("This databae name $this->name does not match $dbname");
            //
            //Get the named entity
            $entity = $this->entities[$ename];
            //
            //Get the matching attribute; it must be set by this time.
            $attr = $entity->columns[$cname];
            //
            //Ignore all the primary columns  in this process since only attributes 
            //can be converted to foreigners
            if ($attr instanceof primary) {
                continue;
            }
            //
            //Compile the referenced (database and table names)
            $ref = new \stdClass();
            $ref->table_name = $ref_table_name;
            $ref->db_name = $ref_db_name;
            $ref->cname = $ref_cname;
            //
            //Create a foreign key colum using the same attribute name
            $foreign = new foreign($entity, $cname, $attr->data_type,
                    $attr->default, $attr->is_nullable, $attr->comment, $attr->length, $attr->type,
                    $ref);
            //
            //Offload the remaining options to the foreign key as local 
            //properties. (Why is this necesary? Just in case there were 
            //properties derived from comments)
            mutall::offload_properties($foreign, $attr);
            //
            //Replace the attribute with the forein key
            $entity->columns[$cname] = $foreign;
        }
    }

    //Update some ordinary columns to foreign columns base on the key column 
    //usage table
    private function get_foreign_keys(): array/* [dbname, ename, cname, ref_table_name, ref_db_name][] */ {
        //
        //Set sql statement for selecting all foreign key columns of this table 
        //and database
        $sql = "select "

                // The table schema is the name of this database
                . "table_schema  as dbname, "
                //
                //specifying the exact table to get the column from
                . "table_name as ename, "
                //
                . "column_name as cname, "
                //
                //Specify the referenced table and her database
                . "referenced_table_name as ref_table_name, "
                //    
                . "referenced_table_schema as ref_db_name,"
                . "referenced_column_name as ref_cname "
                . "from "
                //
                //The main driver of this query
                . "information_schema.key_column_usage "
                . "where "
                //    
                // The table schema is the name of this database
                . "table_schema = '{$this->name}' "
                //
                //The column must be used as a relation (i.e., as a forein key) 
                . "and referenced_table_schema is not null ";
        //
        //Execute the $sql on the the schema to get the $result
        $result = $this->pdo->query($sql);
        //
        //Retrueve the entitiesfrom the $result as an array
        return $result->fetchAll();
    }

    //Activate all the identification indices from the statistics of the 
    //information schema. NB. This process does not affect a table that does 
    //not have indices, so, we must initialize all indices when we create an table
    function activate_indices() {
        //
        //Get all the index columns for all the indices for all the entities
        //in this database
        $columns = $this->get_index_columns();
        //
        //Build the indices and their active columns
        foreach ($columns as [$ename, $ixname, $cname]) {
            //
            //Start a new index if need be
            if (!isset($this->entities[$ename]->indices[$ixname]))
                $this->entities[$ename]->indices[$ixname]=[]; 
            //
            //Push the named column to the index;
            $this->entities[$ename]->indices[$ixname][]=$cname;
        }
    }

    //Get all the static index columns for all the indices of all the entities
    //in this database
    private function get_index_columns(): array/* [][] */ {
        //
        //The sql that obtains the column names
        $sql = "select "
                //
                . "table_name as ename, "
                // 
                . "index_name  as ixname, "
                //  
                . "column_name as cname "
                //
                . "from "
                //
                //The main driver of this query
                . "information_schema.statistics "
                . "where "
                //    
                // Only index rows from this database are considerd
                . "index_schema = '{$this->name}' "
                // 
                //Identification fields have patterns like id2, identification3
                . "and index_name like 'id%'";
        //Execute the $sql on the the schema to get the $result
        //
        //
        $result = $this->pdo->query($sql);
        //
        //Retrueve the entitiesfrom the $result as an array
        return $result->fetchAll();
    }

    //Returns an error report and the number of errors it contains
    private function get_error_report(int &$no_of_errors, string &$report): void {
        //
        //Start with an empty report
        $report = "";

        //Report errors at the database level
        $count = count($this->errors);
        //
        //Compile the errors if necessary, at the database level.
        if ($count > 0) {
            //
            $report .= "\n<h2><b><u>There are $count errors in table'$this->name'</u></b></h2>";
            //
            $report .= '<ol>';
            foreach ($this->errors as $error) {
                $report .= "\n <li> $error </li>";
            }
            $report .= '</ol>';
        }
        //
        //Contintue compiling to include the entity-level errors
        foreach ($this->entities as $entity) {
            //
            $entity->get_error_report($no_of_errors, $report);
        }
    }

    //Set the dependency depths for all the entities as weell as loggin any 
    //cyclic errors
    private function set_entity_depths(): void {
        //
        foreach ($this->entities as $entity) {
            $entity->depth = $entity->get_dependency();
        }
    }

    //Report errrors arising out of the activation process, rather than throw 
    //than error as it occurs
    private function report_activation_errors() {
        //
        //Get teh numbe of errors
        $count = count(self::$errors);
        //
        //There has to be at leason one error for the reporting to be done
        if ($count === 0) {
            return;
        }
        //
        $msg = "There are $count activation errors. They are:-<br/>"
                . implode(".<br/>", database::$errors);
        //
        throw new \Exception($msg);
    }

    //When you serialize a database, exclude the pdo property. Otherwise you
    //get a runtime error.
    function __sleep() {
        return ['name', 'entities'];
    }

    //Set the pdo property when the database is unserialized    
    function __wakeup() {
        $this->connect();
    }

    //
    //Returns data after executing the given sql on this database. The sql may 
    //be directly specified as a string, or indirectly as a file to read from.
    //The default is from a string. File names will be specified as paths
    //relative to the document root
    function get_sql_data(string $sql, string $source='str'): array{
        //
        //If the source of the sql is a file, read from it; otherwise it must be
        //a strinh
        if ($source==='file') $sql = \file_get_contents($_SERVER['DOCUMENT_ROOT'].$sql);
        elseif ($source!=='str') throw new \Exception("Sql source '$source' is not known");     
        //
        //Execute the sql to get a pdo statement; catch PDO erors if any
        try{
            //
            //Query the database using the given sql
            $results = $this->pdo->query($sql);
            //
            //Fetch all the data from the database -- indexed by the column name
            $data = $results->fetchAll(\PDO::FETCH_ASSOC);
            //
            //Return the fetched data                
            return $data;
        }
        //PDO error has ocurred. Catch it, append the sql and re-throw
        catch(\Exception $ex){
            throw new \Exception($ex->getMessage()."<br/><pre>$sql</pre>");
        }
    }
    // 
    //Retrieves the account datails of the specified account
    function accounting(string $accname):array{
    $sql ="SELECT"
            ."`transaction`.`date` as `date` ," 
            ."`transaction`.`ref` as `ref_num` ,"
            ."`je`.`purpose` as `purpose` ,"  
             ."'' as dr ," 
            ."`je`.`amount` as cr "
        ."From `credit` \n"
            ." inner join `je` on `credit`.`je`= `je`.`je`
            inner join `transaction` on `transaction`.`transaction`= `je`.`transaction`
            inner join account on `credit`.account= `account`.account "
        //
        //specify the account under study
        ."WHERE `account`.id ='$accname' "
        //--
        //--join the sqls
        ." union "
        //--
        //--The sql that derives all the debited je 
        ." SELECT"
            ."`transaction`.`date` as `date` , 
           `transaction`.`ref` as `ref_num`,
           `je`.`purpose` as `purpose`,  
           `je`.`amount` as dr,
            '' as cr "
        ." From `debit` "
            ." inner join `je` on `debit`.`je`= `je`.`je`
            inner join `transaction` on `transaction`.`transaction`= `je`.`transaction`
            inner join account on `debit`.account= `account`.account "
        // --
        //--the account under study.
        ."WHERE `account`.id ='$accname'";
    return $this->get_sql_data($sql);
    
    }

    //
    //Returns a complete database structure, .i.e one that is populated with 
    //entities and columns
    //We return an any because we do not wish to check the structure of our data  
    function export_structure(): database {
        return $this;
    }

    //Turns off autocommit mode. Hence changes made to the database via $this->pdo
    //are not committed until you end the transaction by calling $this->commit()
    //or $this->rollBack
    function beginTransaction(): void {
        $this->pdo->beginTransaction();
    }

    //Save the changes made to the database permanently 
    function commit(): void {
        $this->pdo->commit();
    }

    //Roles back the current transaction. i.e avoid commiting it permanently 
    //to the database.Please note this function is only effective if we had begun
    // a transaction
    function rollBack(): void {
        $this->pdo->rollBack();
    }

    //Implementing the method so that it can be evoked from JS using the
    //standard method. We use this method for sqls that don't return a result
    function query($sql): void{
        //
        //NB. We cannot access the pdo clas from Js, hence this workround
        $this->pdo->query($sql);
    }
    
     //Retrieve metadata for an sql statement
    function get_column_metadata(string $sql):array/*<metadata>*/{
        //
        //Get a pdo statement, by executing the given query. The statement can
        //be interogated to get column metadata.
        $stmt = $this->pdo->query($sql);
        //
        //Get the number of columns in the pdo statement
        $cols  = $stmt->columnCount();
        //
        //Start with an empty list of metadata columms
        $list = [];
        //
        //For each column psoition....
        for ($i = 0; $i < $cols; $i++) {
            //
            //Get the metadata for the i'th column
            $metadata = $stmt->getColumnMeta($i);
            //
            //Save the metadata to the out array
            array_push($list, $metadata);
        }
        //
        //Return the final list of metadata columns
        return $list;
        
    }

    //Set the PDO property of this database; this links the mutall database 
    //model to the PHP vesrion.
    private function connect() {
        //
        //Formulate the full database name string, as required by MySql. Yes, this
        //assumed this model is for MySql database systems
        $dbname = "mysql:host=localhost;dbname=$this->name";
        //
        //Initialize the PDO property. The server login credentials are maintained
        //in a config file.
        $this->pdo = new \PDO($dbname, config::username, config::password);
        //
        //Throw exceptions on database errors, rather than returning
        //false on querying the dabase -- which can be tedious to handle 
        //quering errors
        $this->pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        //        
        //Prepare variables (e.g., current and userialised) to support the 
        //schema::open_databes() functionality. This is designed to open a database
        //without having to use the information schema which is terribly slow.
        //(Is is slow wor badly written? Revisit the slow issue with fewer 
        //querying of the information schema)
        //Save this database in a ready, i.e., unserialized,  form
        database::$current[$this->name] = $this;
        //
        //Add support for transaction rolling back, if valid. See the 
        //\capture record->export() method
        if (isset(schema::$roll_back_on_fatal_error) && schema::$roll_back_on_fatal_error) {
            $this->pdo->beginTransaction();
        }
    }

    //Returns a json string of this database structure 
    function __toString() {
        //
        //Encode the database structure to a json string, throwing exception if
        //this is not possible
        try {
            $result = json_encode($this, JSON_THROW_ON_ERROR);
        } catch (\Exception $ex) {
            $result = mutall::get_error($ex);
        }
        //
        return $result;
    }

    //Returns the primary key value of the last inserted in a database.
    //Remember that pdo is prrotected, and so cannot be accessed directly
    function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    //Map the database to a namespace in Typescript. This is for supporting the 
    //ORM objective
    function map($stream):void{
        //
        //Write the opening tag as a namespace. E.g., 
        //export namespace mutall_users{
        fwrite($stream, "export namespace $this->name {\n");
        //
        //Map all the entiries of this databse corresponding classes
        foreach($this->entities as $entity) $entity->map($stream);
        //
        //Write the closing tag
        fwrite($stream, "}\n");
    }
  
}

//
//Class that represents an entity. An entity is a schema object, which means 
//that it can be saved to a database.
abstract class entity extends schema implements expression {
    //
    //The entity name
    public string $name;
    //
    //The columns of this entity
    public array /*<column>*/$columns;
    //
    //The indices of this entity. They are initializes when a database is being
    //constructed
    public array/*<cname>*/ $indices;
    //
    function __construct(string $name) {
        //
        $this->name = $name;
        //
        parent::__construct($name);
    }

    //The primary key column of any entity is teh column named the
    //same as the view
    function pk():column{
        //
        //Get the name of this entity
        $name = $this->name;
        //
        //There must be a column indexed by this name
        if (!isset($this->columns[$name])) 
            throw new \Exception("No primary key column found for entity $name");
        //
        //Return the column
        return $this->columns[$name];
    }
    
    //Set the columns of this entity. It is illegal to try to access the columns 
    //before calling this method.
    public function set_columns(): void{
        //
        //Open the named database if available; otherwise construct one
        //from he infrmation schema
        $dbase = $this->open_dbase($this->dbname);
        //
        //Set this entity's columns
        $this->columns = $dbase->entities[$this->name]->columns;
    }
    
    //
    //This is the string represention of this table 
    public function to_str(): string {
        return "`$this->dbname`.`$this->name`";
    }

    //Returns an error report and the number of errors it contains
    function get_error_report(int &$no_of_errors, string &$report): void {
        //
        //        
        $count = count($this->errors);
        $no_of_errors += $count;
        //
        //Compile the errors if necessary, at the database level.
        if ($count > 0) {
            //
            $report .= "\n<h2><b><u>There are $count errors in entity $this->partial_name</u></b></h2>";
            //
            $report .= '<ol>';
            foreach ($this->errors as $error) {
                $report .= "\n <li> $error </li>";
            }
            $report .= '</ol>';
        }
        //
        //Report column errors
        foreach ($this->columns as $column) {
            //
            $column->get_error_report($no_of_errors, $report);
        }
    }

    //Returns the string version of this entity as an sql object for use in array
    //methods.
    function __toString(): string {
        return $this->to_str();
    }

    //
    //An entity yields iself
    function yield_entity(): \Generator {
        yield $this;
    }

    //The attributes that are associated with an entity are based on its columns:-
    function yield_attribute(): \Generator {
        foreach ($this->columns as $col) {
            if ($col instanceof attribute)
                yield $col;
        }
    }

    //Returns foreign key columns (only) of this entity. Pointers are exccluded 
    //beuase they take time to build and may not always be required at the same
    //time with forein keys. The resulst of theis functi should not be buffred
    //bacsuse with the addition of views in our model, the structure of the 
    //database can change at run time.
    function foreigners(): \Generator/* foreigner[] */ {
        //
        //
        foreach ($this->columns as $col) {
            if ($col instanceof foreign) {
                yield $col;
            }
        }
    }

    //
    //yield only the structural foreigners
    function structural_foreigners(): \Generator/* foreigner[] */ {
        //
        //Loop throug all the columns of this entity
        foreach ($this->columns as $col) {
            //
            //A column is a structural foreigner if.....
            if (
                //...it is a foreign key..
                $col instanceof foreign
                //
                //..that is not used for reporting
                &! $col->away()->reporting()
                //
                //..and is not a cross member. A cross member is a column 

            ) {
               
                yield $col;
            }
        }
    }

    //
    //yields only the structural pointers
    function structural_pointers(): \Generator/* pointers[] */ {
        //
        //The search for pointers will be limited to the currently open
        //databases; otherwise we would have to open all the databases on the 
        //server.
        foreach (database::$current as $dbase) {
            foreach ($dbase->entities as $entity) {
                //
                //remove all reporting entities
                if ($entity->reporting()) {
                    continue;
                }
                //
                //Loop through all the structural foregn keys of this entity
                foreach ($entity->structural_foreigners() as $foreigner) {
                    //
                    //remove all the foreigners that reference to the reporting entities
                    if ($foreigner->away()->reporting()) {
                        continue;
                    }
                    if ($foreigner->home()->reporting()) {
                        continue;
                    }
                    //
                    //A foreigner is a pointer to this entity if its reference matches
                    //this entity. The reference matches if...
                    if (
                        //...database are teh same...
                        $foreigner->ref->db_name === $this->dbname
                        //
                        //...and the table names are the same
                        && $foreigner->ref->table_name === $this->name
                    ) {
                        //
                        //Create a pointer 
                        yield new pointer($foreigner);
                    }
                }
            }
        }
    }

    //returns true if the entity is used for  reporting 
    function reporting() {
        //
        //Check if the purpose is set at the comment
        if (isset($this->purpose)) {
            //
            //Return the repoting status
            return $this->purpose == 'reporting';
            //
            //else return a false 
        }
        return false;
    }
    

    //Yield all the parts of a friendly column. Each part is derived from 
    //an identifier attributes.Every entity has its own way of generating 
    //friendly columns
    function get_friendly_part2(): \Generator {
        //
        //Use non-verbosity to construct the friendly name, if requested
        if (!$this->is_verbose) return yield from $this->get_friendly_part_non_verbosely();
        //
        //Use verbosity to construct the parts of a friendly cokumn
        //
        //Loop through all the columns of this entity, yielding its 
        //friendly components
        foreach ($this->columns as $col) {
            //
            //A column is friendly if...
            //
            //1. ... it is an identification attribute or ... 
            if ($col->is_id() && $col instanceof attribute
                    //
                    //Ignore the is_valid column
                    && $col->name !== "is_valid") {
                yield $col;
            }
            //
            //2. ...it is a mandatory column named as: description, name, title or ...
            elseif ($col->is_nullable==="NO" && $col->is_descriptive()) {
                yield $col;
            }
            //
            //3. ...it is a  identification foreign key.
            elseif ($col->is_id() && $col instanceof foreign) {
                yield from $col->away()->get_friendly_part();
            }
        }
    }
    
    //Yield all the parts of a friendly column and avoid verbosity
    function get_friendly_part_non_verbosely(): \Generator {
        //
        //Get the entity that is driving this propcess
        $entity = $this->source;
        //
        //Use the first of the entitity's indices to drive the parts. Remember 
        //that the indices is an indexed array
        $index = array_values($entity->indices)[0];
        //
        //Loop through the columns of this index. An index is an array of column
        //names
        foreach($index as $cname){
            //
            //Get the column that matches this cname
            $col = $entity->columns[$cname];
            //
            //Collect this column if it is an attribute
            if ($col->is_id() && $col instanceof foreign) 
                yield from $col->away()->get_friendly_part();
            elseif ($col->is_id() && $col instanceof attribute)
                yield $col;    
        }
    }    

    //Returns the mandatory columns of this entity as ids i.e those not nullable 
    //and those used as ids as a record to be saved 
    function get_id_columns(): array {
        //
        //begin with an empty array of the mandatory columns to be inserted
        $ids = [];
        //
        //1. loop through the column of this entity to add all the columns 
        //which are not nullable and those that are used as ids in this 
        foreach ($this->columns as $column) {
            //
            //filter those not nullable
            if ($column->is_nullable === 'NO') {
                $ids[$column->name] = $column;
            }
            //
            //filter the id columns
            if ($column->is_id()) {
                $ids[$column->name] = $column;
            }
        }
        //
        //
        return $ids;
    }

    //
    //Returns a true if the data provided for an update contains all the needed 
    //identification record or an error message indicating the column name of
    //the data that was not provided 
    function is_data_valid()/* a true or error string is returned */ {
        //
        //Get the columns to be inserted 
        $cnames = array_keys(record::$current->getArrayCopy());
        //
        //1. loop through the column of this entity to ensure that all the columns 
        //which are not nullable are included in the cnames else return a error
        //and those that are used as ids 
        foreach ($this->columns as $column) {
            //
            //proceed with the loop if this column name is included 
            if (in_array($column->name, $cnames)) {
                continue;
            }
            //
            //if the column is not nullable throw are exception is not found in 
            //enames 
            if ($column->is_nullable === 'NO') {
                //
                //return the message that this column has to be set 
                return "New record was not saved because The $column->name is a "
                        . "mandatory data and has to be provided for this data to be valid";
            }
        }
        //
        //2.0 loop through the cnames to ensure that all those columns exist 
        foreach ($cnames as $cname) {
            if (!array_key_exists($cname, $this->columns)) {
                return "the column $cname does not exist please check your spellings";
            }
        }
        //
        //
        return true;
    }

    //Returns the source entity taking care 
    function get_source(): string {
        //
        if (isset($this->alias_name)) {
            return "$this->alias_name";
        }
        return "$this->name";
    }

    //returns a valid sql string from expression
    function fromexp(): string {
        //
        if (isset($this->alias_name)) {
            $str = "`$this->alias_name` as";
        } else {
            $str = '';
        }
        return "$str `$this->name`";
    }

    //returns a valid sql column representation of the primary column this method 
    //is overidden because an alien violates the rule that the primary column
    //of an entity has the same name as the entity 
    function get_primary(): string {
        //
        if (isset($this->alias_name)) {
            $str = ".`$this->alias_name`";
        } else {
            $str = '';
        }
        return "`$this->name`$str";
    }
    
     //Map this entity to a class in Typescript. This is for supporting the ORM 
     //objective
    function map($stream):void{
        //
        //Write the opening tag, e.g., declare class event extends tuple {...
        fwrite($stream, "\tdeclare class $this->name extends tuple.tuple {\n");
        //
        //Map the columns to the properties optional of this entity
        foreach($this->columns as $column) {
            //
            //Convert mysql type to typescript
            $type = match($column->data_type){
                "int"=>"number",
                "varchar"=>"string",
                'datetime'=>'Date',
                'date'=>'Date',
                'tinyint'=>"boolean",
                'money'=>'number',
                default=>$column->data_type,
            };
            //
            //Output the column
            fwrite($stream, "\t\tpublic $column->name?: $type;\n");
        }    
        //
        //Override abstract methods
        fwrite($stream, $this->get_overrides());
        //
        //Write the closing tag
        fwrite($stream, "\t}\n");
    }
    
    private function get_overrides():string{
        return 
    "
    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    ";
    }
    
    /*
     //
    //The database default value for this column 
    public ?string $default;
    //
    //The acceptable datatype for this column e.g the text, number, autonumber etc 
    public string $data_type;
    //
    //defined if this column is mandatory or not a string "YES" if not nullable 
    // or a string "NO" if nullable
    public string $is_nullable;
    
     */
  

}

//
//The class models an actual table on the database it extends 
//an entity by including the indexes an a dependancy
class table extends entity {
    //
    //The parent database. It is protected to avoid recursion during json encoding
    protected database $dbase; 
    //
    //To allow external access to this table's protected database
    function get_dbase(){return $this->dbase; }
    //
    //The database name associated with this table
    public string $dbname;
    //
    //The relation depth of this entity.  
    public ?int $depth = null;
    //
    //The json user information retrieved from the comment after it was decoded  
    public $comment;
    //
    //The unique indices of this table, used for identification of record
    //in the table. Ensure that his property is set before
    //using it. By default, the index is empty. The database creation processs
    //will update those indices that are valid.
    public array /*<index>*/$indices=[];

    //
    function __construct(database $parent,string $name) {
        //
        parent::__construct($name);
        //
        $this->dbase = $parent;
        //
        //Set the database name for global access
        $this->dbname = $parent->name; 
    }
    
    //Yields an array of pointers as all the foreigners that reference this 
    //table. This function is similar to foreigners(), except that its output 
    //cannot be buffered, because, with ability to add views to the database, 
    //the pointers of an entity can change.
    function pointers(): \Generator/* pointers[] */ {
        //
        //The search for pinters will be limited to the currently open
        // databases; otherwise we woulud have to open all the databse on the 
        //server.
        foreach (database::$current as $dbase) {
            foreach ($dbase->entities as $entity) {
                foreach ($entity->foreigners() as $foreigner) {
                    //
                    //A foreigner is a pointer to this entity if its reference match
                    //this entity. The reference match if...
                    if (
                    //...database names must match...
                            $foreigner->ref->db_name === $this->dbname
                            //
                            //...and the table names match
                            && $foreigner->ref->table_name === $this->name
                    ) {
                        //
                        //Create a pointer 
                        yield new pointer($foreigner);
                    }
                }
            }
        }
    }

    //This is the string represention of this table 
    public function to_str(): string {
        return "`{$this->dbase->name}`.`$this->name`";
    }
    
    //
    //Get the friendly component of the given primary key.
    function get_friend(int $pk): string {
       //
       //Formulate a selector sql based on this table's ename and dbname
       $selector = new selector($this->name, $this->dbname);
       //
       //Formulate a view based on the selector and the primary 
       //key criteria
       // 
       //Formulate the criteria 
       $criteria= new binary($this->columns[$this->name], "=",new scalar($pk));
       //
       //Compile the view, using...
       $view = new view(
               //
               //This table as the subject
               $this, 
               //
               //The only column in the view is the friendly id of the selector
               [$selector->friend()],
               //
               //The join is the same as that of the selector
               $selector->join, 
               //
               //No need for naming this view
               "noname",
               //
               //Add the name criteria
               $criteria
           );
        // 
        //Execute the view to get the friendly component
        $sql =$view->stmt();
        // 
        //Get the table's database.
        $dbase = $this->dbase;
        // 
        //Retrieve the data. 
        $data= $dbase->get_sql_data($sql);
        // 
        //We expect one row of data unless something went wrong
        if(count($data) !==1){
            throw new \Exception("The following sql did not yield one row "
                    . "of data '$sql'");
        }
        // 
        //Extract and return the friendly component; its the id
        //column of the first row.
        //
        //NB. The column may be indexed by column name
        return $data[0][$selector->friend()->name];
    }


    //
    //Returns the friendly name of the given primary key 
    function get_friendly_name(int $pk): string {
        //
        //Create the selector view
        $selector = new selector($this->name, $this->dbname);
        //
        //Modify the selecctor statement using the given primary key
        //
        //Formulate the query extension
        $where = " where `$this->name`.$this->name`= $pk";
        $sql = $selector->stmt() . $where;
        //
        //Execute the sql statement to get a result 
        $result = $this->open_dbase($this->dbname)->get_sql_data($sql);
        //
        //There should only one record 
        if (count($result) !== 1) {
            $str = json_encode($result);
            throw new \Exception("Invalid friendly name result $str");
        }
        //
        //Return the sting friend.
        return $result[0]["friend"];
    }

    //
    //Returns the "relational dependency". It is the longest identification path 
    //from this entity. 
    //The dependency is the count of the targets involved in the join of this view
    //based on the dependency network (i.e., the path whose joins return the highest 
    //number of targets);
    //How to obtain the dependency:- 
    //1. Test if it is already set inorder to trivialise this process
    //2. Create a dependecy network with this entity as its source
    //3. Using the dependency network create a join from it 
    //4. Count the number of targets in the join 
    function get_dependency(): ?int {
        //
        //1. Test if the dependecy was set to trivilalize this process
        if (isset($this->depth)) {
            return $this->depth;
        }
        //
        //2. Create a dependecy network with this entity as its source
        //To create this network we need the foreign strategy 
        $dependency = new dependency($this);
        //
        //3.Create a join using the paths dependency network 
        $join = new join($dependency->paths);
        //
        //Check for network building errors, including, cyclic loops
        $this->errors += $dependency->errors;
        //
        //If there are errors return a null
        if (count($dependency->errors) > 0) {
            return null;
        }
        //
        //4. Count the number of joints in the join 
        $depth =  $join->joints->count();
        //
        return $depth;
    }
}

//
//Models the sql of type select which extends an entity, so that it can take part
//in the database model. To resolve the root entity requires the inclusion of a
//config file in the main application.
class view extends entity {
    //
    //The criteria of extracting information from the from an entity as a 
    //boolean expression.
    public ?expression $where;
    //
    //The from clause of this view is an entity.  
    public entity $from;
    //
    //Has the connection on the various entities which are involved in this sql
    public ?join $join;
    //
    //Other clauses of an sql that the user can provide after a view is created
    public array $group_by = [];

    //We dont expext to callt this constructor from Js, because the data types 
    //are not simple
    function __construct(
            //
            //The base of this view
            entity $from,
            //
            //An array of named expressions, i.e., fields    
            array /* <field> */$columns,
            //    
            //The join that this view uses to access/define its data
            join $join,
            //
            //The name of the view; this is needed if this view participates in 
            //other view    
            string $name,
            //
            //The where clause as an expression
            expression $where = null,
            //
            //The group by clause -- which is an array of coulumns
            array /*<column>*/$group_by = []
    ){
        //
        //Properties are saved directly since this class is not callable from 
        //javascript
        $this->from = $from;
        $this->join = $join;
        $this->where = $where;
        $this->group_by = $group_by;
        //
        //The columnsn of a view are expected to be fields, i.e., named 
        //expresions. We use the name to index the columns.
        $keys = array_map(fn($field) => $field->name, $columns);
        $this->columns = array_combine($keys, $columns);
        //
        parent::__construct($name);
    }

    //
    //The short form of identifying a view
    function id(): string {
        return "`$this->dbname`.`$this->name`";
    }

    //Yield the trivial entity in this view includes all the target entites involved 
    //in this join
    function yield_entity(): \Generator {
        foreach ($this->join->targets->keys() as $entity) {
            yield $entity;
        }
    }

    //
    //Yields the columns in that are involved in this view useful for editing a none
    //trivial view(sql).
    function yield_attribute(): \Generator {
        //
        //Loop through the columns in this view and yield them all 
        foreach ($this->columns as $column) {
            //
            if ($column instanceof attribute)
                yield $column;
        }
    }

    //Executes the sql to return the data as an double array. At this point, we 
    //assume that all the view constructor variables are set to their desired
    //values. This is clearly not true for extensions like editor and selector. 
    //They must override this method to prepare the variables before calling
    //this method.
    function execute()/* value[][cname] */ {
        //
        //Extend the sql statement Of this view using the given where and order 
        //by clauses.
        //
        //Test if extending the where is necesary or not
        if (isset($this->where_ex)) {
            //
            //It is necessary to extend the where clause (ithe extension is 
            //provided).
            //
            //Test if a where clause already exists for this viewor not.
            if (!is_null($this->where)) {
                //
                //There already exists a where clause.
                //
                //Extend it.
                $where_str = "$this->where AND $this->where_ex";
            } else {
                //
                //There is no where clause in this view.
                //
                //Insert one.
                $where_str = "WHERE $this->where_ex";
            }
        } else {
            //
            //Extending the where clause is not necessary
            //
            //Return an empty string
            $where_str = '';
        }
        if (!isset($this->order_by)) {
            $this->order_by = "";
        }
        //
        //Compile the complete sql.
        $sql = "{$this->stmt()} \n$where_str \n$this->order_by";
        //
        //Get the current database, guided by the database name of the from 
        //clause
        $dbase= database::$current[$this->from->dbname];
        //
        //Execute the $sql to get the $result in an array 
        $array = $dbase->get_sql_data($sql);
        //
        //Return the array 
        return $array;
    }

    
    //Returns the standard string representation of a select sql statement
    public function stmt(): string {
        //
        //Ensure that each view constructor argument is set. If not we will 
        //assume the default values.
        //
        //If the fields are not set, then use all of those of the 'from' clause
        if (is_null($this->columns)) {
            $this->columns = $this->from->columns;
        }
        //
        //Convert the columns into thier sql string equivalnets
        $columns_str = implode(
            //
            //The coma sparates the columns    
            ",", 
            //
            //Note the as clause, to ensure the columns are properly named
            array_map(
                //
                //Note that its the string version of a column we want, NOT
                //THE EXPRESSION     
                fn($col) => "\n\t{$col->to_str()} as `$col->name`", 
                $this->columns
            )
        );
        //
        //If the join is not set, then assume none
        $join = is_null($this->join) ? '' : $this->join->stmt();

        //Compile the where clause in such a way that exra conditions can
        //be added at query time. For better performance, the where clause is 
        //ommited all togeher if not required
        $where = is_null($this->where) ? '' : "WHERE \n\t{$this->where->to_str()}";
        //
        //Get the from expression
        $fromxp = $this->from instanceof view 
                ? $this->from->stmt() : $this->from->to_str();
        //
        //Add the group by if necessary
        $group = "";
        if (count($this->group_by)>0){
            //
            //Convert the group by columns to a comma separated list of column
            //names;
            $group_by_str = implode(
                //
                //Use the comma as the separator
                ", ",
                //
                //Convert the roup by columns to thier string equivalents
                array_map(fn($col)=>"$col", $this->group_by)
            );
            //
            $group =  " group by \n\t$group_by_str";
        }
        //
        //Construct the sql (select) statement. Note use of the alias. It allows 
        //us to formulate a generalised sql that is valid for both primary
        //and secondary entities, i.e, views. For instance, let $x be a primary 
        //entity or view. The generalised sql is:-
        //
        //select * from $x as $x->name
        //
        //If $x is bound to the primary entity say, e.g., 'client', the final 
        //sql would be:-
        //
        //select * from client as client ....(1)
        //
        //Note that this is verbose, because of 'as client',  but correct. 
        //
        //However if $x is bound to a view named, say, test and whose sql is, e.g.,
        //
        // select name from account 
        //
        //the required sql should be:-
        //
        //select * from (select name from payroll) as test.
        //
        //The opening and closing brackets are valid for views only as it is 
        //illegal to say 
        //
        //select * from (client) as client
        //
        //in statement (1) above. Hence the brackets are conditional.
        //
        //The opening and closing brackets of the from clause are required by 
        //view only. Let $b be the set of brackets
        $b = $this->from instanceof entity ? ['', ''] : ['(', ')'];
        //
        //Now compile teh full sttaement
        $stmt = "SELECT \n"
                //
                //List all the required fields
                . "\t$columns_str \n"
                . "FROM \n"
                //
                //Use the most general form of the 'from' clause, i.e., one with
                //conditional brackets and a valid AS phrase
                ."\t". $b[0] . $fromxp . $b[1] . "\n"
                //
                //Add the joins, if any.
                . "$join\n"
                //
                //Add the where clause, if necessary    
                . $where."\n"
                //
                //Add the group by clause            
                . $group;
        //
        //Return the complete sttaement        
        return $stmt;
    }

    //ITS YOUR RESPINSIBILITY TO MAKE SURER THE SQL STATEMENT YIELDS A SCALAR
    function to_str(): string {
        return "({$this->stmt()}) as `{$this->name}` ";
    }

    //
    //sets the default of fields of this view to be either 
    //1. The fields of a from if the from is another view 
    //2. The columns of the from if the from is a root entity 
    protected function set_default_fields(): void {
        //
        $this->columns = $this->from->columns;
    }
}

//Modeling the columns of an entity as the smallest package whose 
//contents can be "saved" to a database. It is an expresion. 
//Note: this class is not abstract as we can use it to create
//columns. This is important in the context of left joins
class column extends schema implements expression{
    //
    //The parent/home of this column; it is protected to prevent recurssion when 
    //the database object is json encoded
    protected entity $entity;
    //
    //To allow access to the protcted entity
    function get_entity():entity {return $this->entity;}
    //
    //Every column should have a name 
    public string $name;
    public string $ename;
    
    //
    function __construct(
            //
            //The parent/home of this column
            entity $parent,
            //
            //The actual name of the column 
            string $name
    ) {
        //
        parent::__construct("$parent->name.$name");
        //
        //Save the constructor arguments
        $this->entity= $parent;
        $this->name = $name;
        $this->ename = $parent->name;
    }

    // //Returns an error report and the numbet\r of errors it contains
    public function get_error_report(int &$no_of_errors, string &$report): void {
        //        
        $count = count($this->errors);
        $no_of_errors += $count;
        //
        //Compile the errors if necessary, at the database level.
        if ($count > 0) {
            //
            $report .= "\n<h2><b><u>There are $count errors in column $this->name</u></b></h2>";
            //
            $report .= '<ol>';
            foreach ($this->errors as $error) {
                $report .= "\n <li> $error </li>";
            }
            $report .= '</ol>';
        }
    }
    //
    //Only an attribute column can yield itself; all other columns cannot
    function yield_attribute(): \Generator {}
    
    //Yield the entity of this column
    function yield_entity(): \Generator {
        yield $this->entity;
    }
 
    //Returns the string version of this column. NB. There is no reference to
    //a database. Compare this with the capture:: version.
    function __toString() {
        return "`$this->ename`.`$this->name` ";
    }

    //
    //The expression string version of a column has the form
    //``$ename`.`$cname`????????/
    function to_str(): string {
        return "$this";
    }
    
}
//Modelling primary (as opposed to derived) columns needed for data capture and 
//storage. These are columns extracted from the information schema directly 
//(so they need to be checked for integrity).
abstract class capture extends column {
    //
    //To support global access to database and entity names
    public string $dbname;
    //
    //The construction details of the column includes the following;- 
    //
    //Metadata container for this column is stored as a structure (i.e., it
    //is not offloaded) since we require to access it in its original form
    public ?string $comment;
    //
    //The database default value for this column 
    public ?string $default;
    //
    //The acceptable datatype for this column e.g the text, number, autonumber etc 
    public string $data_type;
    //
    //defined if this column is mandatory or not a string "YES" if not nullable 
    // or a string "NO" if nullable
    public string $is_nullable;
    //
    //The size of the column
    public ?int $length;
    //
    //The column type (needed for extraction enumerated of choices)
    public string  $type;
    //
    //Every capture column should be checked for compliance to the Mutall 
    //framework.
    abstract function verify_integrity();
    //
    function __construct(
            table $parent,
            string $name,
            string $data_type,
            ?string $default,
            string $is_nullable,
            string $comment,
            ?int $length,
            string $type
    ) { 
       //
        //save the properties of the capture the default, datatype, is_nullable,
        //comment
        $this->comment = $comment;
        $this->data_type = $data_type;
        $this->default = $default;
        $this->is_nullable = $is_nullable;
        $this->length = $length;
        $this->type = $type;
        //
        //Create the parent column that requires the dbname, the ename and the 
        //column name  
        parent::__construct($parent, $name);
        //
        //Initialize dataase and entity names
        $this->dbname = $parent->dbname;
    }
    
    //The string version of a capture column, iis the same as that of an
    //ordinary column, prefixed with the database name to take care of 
    //multi-database scenarios
    function __toString() {
        return "`$this->dbname`.".parent::__toString();
    }
    
    //Returns the non-structural colums of this entity, a.k.a, cross members. 
    //These are optional foreign key columns, i.e., thhose that are nullable.
    //They are important for avoidng cyclic loops during saving of data to database
    function is_cross_member() {
        return 
            $this instanceof foreign 
            && $this->is_nullable === 'YES'
            &! $this->is_id();
    }

    //Returns true if this column is used by any identification index; 
    //otherwise it returns false. Identification columns are part of what is
    //known as structural columns.
    function is_id(): bool {
        //
        //Get the indices of the parent entity 
        $indices = $this->entity->indices;
        //
        //Test if this column is used as an index 
        foreach ($indices as $cnames) {
            //
            if (in_array($this->name, $cnames)) {
                return true;
            }
        }
        //
        return false;
    }

    //
    //Returns a true if this column can be used for fomulating a friendly 
    //identifier.
    function is_descriptive(): bool {
        //
        //The descriptive columns are those named, name, title or decription 
        return in_array($this->name, ['name', 'description', 'title', 'id']);
    }
}

//
//The primary and foreign key column are used for establishing relationhips 
//entities during data capture. It:-
//1. Is named the same as the entity where it is homed,
//2. Has the autonumber datatype 
class primary extends capture {

    //
    function __construct(
            entity $entity,
            string $name,
            string $data_type,
            ?string $default,
            string $is_nullable,
            string $comment,
            ?int $length,
            string $type
    ) {
        //
        //To construct a column we only need the dbname, ename and the 
        //column name 
        parent::__construct($entity, $name, $data_type, $default, $is_nullable, $comment, $length, $type);
    }

    //
    //The conditions of integrity of the primary key are:- 
    //1. It must be an autonumber 
    //2. It must be named the same way as the home entity 
    //3. It must not be nullabe. [This is not important, so no need for testing 
    //it] 
    function verify_integrity() {
        //
        //1. It must be an autonumber 
        if ($this->data_type !== 'int') {
            //
            $error = new \Error("The datatype, $this->data_type for primary key $this should be an int and an autonumber");
            array_push($this->errors, $error);
        }
        //
        //2. It must be named the same way as the home entity. The names are case 
        //sensitive, so 'Application' is different from 'application' -- the reason
        //we empasise sticking to lower case rather than camel case
        if ($this->name !== $this->entity->name) {
            $error = new \Error("The primary key column $this should be named the same its home entity {$this->entity->name}");
            array_push($this->errors, $error);
        }
    }

    //
    //Yield teh attribute of an entity
    function yield_entity(): \Generator {
        //
        //This database must be opened by now. I cannot tell when this is not 
        //true
        yield database::$current[$this->dbname]->entities[$this->ename];
    }
    
}
//Atributes are special columns in that they have options that describe the data
//that they hold, e.g., the data type, their lengths etc. Such descritions are 
//not by any other column
class attribute extends capture implements expression {
    //
    //create the attributes with is structure components see in in capture above 
    function __construct(
            entity $entity,
            string $name,
            string $data_type,
            ?string $default,
            string $is_nullable,
            string $comment,
            ?int $length,
            string $type
    ) {
        parent::__construct($entity, $name, $data_type, $default, $is_nullable, $comment, $length, $type);
    }

    

    //Yield this attribute
    function yield_attribute(): \Generator {
        yield $this;
    }
    

    //There are no special ntegrity checks associated with an attribute for 
    //compiance to teh mutall framework
    function verify_integrity() {
        
    }
   
}

//
//Modelling derived columns, i.e., those not read off the information schema. 
class field extends column implements expression {
    //
    //This is the calculated/derived expression that is represented by
    //this field. 
    public expression $exp;
    //
    function __construct(
        //
        //The parent/home entity of the field.
        entity $parent,
        //
        //The field name, used as as in 'as id
        string $name,
        //
        //The expression which produces the field's value
        expression $exp
    ) {
        //
        $this->exp = $exp;
        //
        parent::__construct($parent, $name);
    }

    //The component of a field used in aselect statement
    //e.g., SELECT {$this->to_str()} AS {$this->name}
    function to_str(): string {
       return $this->exp->to_str();
    }

    //
    //Override the magic to string methd to ensure that the name of a 
    //field does not include a dbname
    function __toString() {
        //
        return "`{$this->get_entity()->name}`.`$this->name`";
    }

    //Yield the primary *nort derived) attributes of this entity. They are needed
    //to support editing of fields formulated from complex expressions
    function yield_attribute(): \Generator {
        yield from $this->exp->yield_attribute();
    }

    //Yield the primary (not derived) entities of this expression. They are 
    //needed for constructing paths using primary entoties only. A different
    //type iof yeld is required for search maths that include views. This may be
    //imporatant when deriving view from existing views. Hence the primary qualifier
    function yield_entity(bool $primary = true): \Generator {
        //
        yield from $this->exp->yield_entity($primary);
    }

}

//The link interface allows us to express relationhip between 2 columns
//as a string. Foreig and link casses implements it
interface ilink{
    //
    //A link must implement the on string needed by a join clause
    //Examples of such strings are:-
    //for many-to-one cases: todo.developer == developer.developer
    //for one-to-one case: developer.developer = user.user
    function on_str():string; 
}

//
//This class is used for establishing a link between any 2 columns
//irrespective of whether its a many to one or one to one
class link implements ilink{
    //
    //The 2 entties being linked
    public column $a;
    public column $b;
    //
    function __construct(column $a, column $b){
        $this->a = $a;
        $this->b = $b;
    }
    //
    //Example of the on clause of a one to many link:-
    //developer.developr = user.user
    function on_str(): string {
        return "$this->a = $this->b";
    }
}

//A foreign key column participates in data capture. It implements the 
//many-to-one link between 2 entities. The home entity is the one that
//houses the column. The second entity, a.k.a, away entity, is the one pointed 
//to by the relationshp
class foreign extends capture implements ilink{
    //
    //The name of the referenced table and database
    public \stdClass /* {ref_table_name, ref_db_name} */ $ref;
    //
    function __construct(
            entity $entity,
            string $name,
            string $data_type,
            ?string $default ,
            string $is_nullable,
            string $comment,
            ?int $length,
            string $type,
            \stdClass $ref
    ) {
        //
        //save the ref 
        $this->ref = $ref;
        parent::__construct($entity, $name, $data_type, $default, $is_nullable, $comment, $length, $type);
    }

    //A foreign must have satisfy the following conditions to be compliant to the
    //Mutall framework
    //1. The datatype of the foreigner must be of int
    //2. The referenced column name must be a primary key
    function verify_integrity() {
        //
        //1. It must of type int
        if ($this->data_type !== 'int') {
            //
            $error = new \Error("The foreign key column $this of data type $this->data_type should be int");
            array_push($this->errors, $error);
        }
        //
        //2. The referenced column name must be a primary key
        //This is because the Mutall framework works with only many-to-one relationships
        //Other types of relationships are not recognized
        if ($this->ref->table_name !== $this->ref->cname) {
            $error = new \Error("The foreign key column $this should reference a table {$this->ref->table_name} using the primary key");
            array_push($this->errors, $error);
        }
    }
    
    //Implement the on clause for a many-to-one relationship. It has a form
    //such as: todo.developer = developer.developer
    function on_str():string{
        //
        //Define the column on the many side, i.e., freign key column on the
        //the home side.
        $many = "`{$this->home()->name}`.`$this->name`";
        //
        //Define the one side, i.e., the primary key column on the away side
        $one = "`{$this->away()->name}`.`{$this->away()->name}`";
        //
        //Compile and return the equation
        return "$many = $one";
    }

    //
    //Returns the entity that the foreign key is pointing 
    //at i.e., the referenced entity.
    public function away(): entity {
        //
        //Get the referenced dbname.
        $dbname = $this->ref->db_name;
        //
        //Get the referenced database.
        $dbase = $this->open_dbase($dbname);
        //
        //Get the referenced ename.
        $ename = $this->ref->table_name;
        //
        //Get the referenced entity.
        $entity = $dbase->entities[$ename];
        //
        return $entity;
    }

    //
    //The home method returns the entity in which the 
    //foreign key is housed. It is indicated with a chicken foot
    //in our data model.
    public function home(): entity {
        //
        return $this->entity;
    }

    //Yield the entity asssociated with this column
    function yield_entity(): \Generator {
        yield $this->entity;
    }

    //returns the name
    function get_ename(): string {
        return "{$this->entity->name}.$this->name";
    }

    //Tests if a foreign key is hierarchical or not
    function is_hierarchical(): bool {
        //
        //A foreign key is hierarchical if...
        return
            //
            //...the table it references is the same as parent of 
            //this  
            $this->ref->table_name == $this->entity->name
            //
            //and in the same database    
            && $this->ref->db_name == $this->entity->get_dbase()->name;
    }
    
}

//This class models a column in an entity that points to a referenced entity.
// The diference between a pointer and a foreign is that the pointers it not 
//homed at the entity it found
class pointer extends foreign {
    //
    function __construct(foreign $col) {
        parent::__construct(
            $col->get_entity(),
            $col->name, 
            $col->data_type,
            $col->default,
            $col->is_nullable,
            $col->comment, 
            $col->length,
            $col->type,    
            $col->ref
        );
    }

    //Pointers run in the opposite direction to corresponding foreign keys, so 
    //that its away entity is the home version of its foreign key
    function away(): entity {
        //
        //Get the referenced entity aand return it 
        return parent::home();
    }

    //By definition, pointers run in the opposite direction to corresponding foreign keys, so 
    //that its home entity is the away entity of its foreign key.
    function home(): entity {
        //
        //Get the referenced entity aand return it 
        return parent::away();
    }

    //
    //The expression string version of a comlumn has the form
    //`$dbname`.`$ename`.`$cname`
    function to_str(): string {
        return "$this as `$this->name`";
    }

}

//Expression for handling syntax and runtime errors in the code execution note that 
//the error class does not have an sql string equivalent 
//$msg is the error message that resulted to this error 
//$suplementary data is any additional information that gives more details about 
//this error.
//Error seems to be an existing class!!
//
//My error can be participate as an output expression in schema::save()
class myerror implements expression, answer{
    //
    //Keeping track of the row counter for error reporting in a multi-row dataset
    static /* row id */  ?int $row = null;
    
    //The supplementary data is used for further interogation of the error 
    //message. 
    public $supplementatry_data;
    //
    //Requirements for supporting the get_position() method
    public /*[row_index, col_index?]*/$position = null;
    //
    //This functin is imporant for transferring expression ppostion data 
    //between exprssions. E.g., 
    //$col->ans->position = $col->exp->get_postion()
    function get_position(){return $this->position; }
    
    //
    //Construction requires a mandatory error message and some optional suplementary 
    //data that aids in debugging
    function __construct(string $msg, $supplementary_data = null) {
        $this->msg = $msg;
        $this->supplementary_data = $supplementary_data;
    }

    //The strimg representtaion of an error
    function __toString(): string {
        return "Error. $this->msg";
    }

    //
    function to_str(): string {
        return "Error. $this->msg";
    }

    //An error is always an error.
    function is_error() {return true;
    }

    //
    //There are no entities in an error, so this generator yields nothing. IM NOT
    //SURE HOW TO GET THE COMPILER NOT TO FLAG THIS CONSTRUCT (WITHOUT YIELD) AS
    //AN ERROR  
    function yield_entity():\Generator {}

    //
    //There are no attributes in  error, so this generator yields nothing 
    function yield_attribute(): \Generator {}

}

//Home for methods shared between a scalar defined in this namespace and
//that defined in the capture namespace
trait scalar_trait{
    
    //A simple mechanism for distinguishing between different scalars
    public $type;
    //
    //This is the value to be represented as an expression. It has to be a absic
    //type that can be converted to a string.
    public /* string|int|boolean|null*/ $value;
    //
    //Requirements for supporting the get_position() method
    public /*[row_index, col_index?]*/$position = null;
    //
    //This functin is imporant for transferring expression ppostion data 
    //between exprssions. E.g., 
    //$col->ans->position = $col->exp->get_postion()
    function get_position(){return $this->position; }
    //
    //When you simplify a scalar you get the same thing because a scalar
    //is both an operand, i.e., input expression, and an answer, i.e., output 
    //expression. 
    function simplify():answer{
        return $this;
    }

    //String representation of a literal. Note tha there are no quotes, or special
    //processing of empty cases
    function __toString() {
        return "$this->value";
    }
    
}

//This is the simplest form of an expression. It is encountered
//in sql operatiopns, as an answer to schema::save() and as an
//operand in input operations
class scalar implements expression, answer, operand {
    //
    //Copy implementations from the root scalar trait
    use \mutall\scalar_trait;
    //
    function __construct($value, $type = null) {
        //
        //The value of a scalar is a basic_value. It  is 
        //what PHP  defines as a scalar AND as a null
        if (!(is_scalar($value) || is_null($value))) {
            throw new \Exception('The value of a literal must be a scalar or null');
        }
        //
        //save the value
        $this->value = $value;
        $this->type = $type;
    }

    //
    //Converting a literal to an sql string
    public function to_str(): string {
        //
        //A string version of a scalar is the string version of its value. For
        //null cases, its the word null without quotes; otherwise  
        //it should be enclosed in single quotes as required by mysql
        return is_null($this->value) ? 'null': "'$this->value'";
    }
    

    //There are no entoties in a literal expression
    function yield_entity(): \Generator {
        
    }

    //There are no attributes in a literal 
    function yield_attribute(): \Generator {
        
    }
}

//Modelling the null value. A null needed for supporting both the
//capuire and reiorting f data. So, it is both an answer and an operand
class null_ implements expression, answer, operand{
    //
    //Requirements for supporting the get_position() method
    public /*[row_index, col_index?]*/$position = null;
    //
    //This functin is imporant for transferring expression ppostion data 
    //between exprssions. E.g., 
    //$col->ans->position = $col->exp->get_postion()
    function get_position(){return $this->position; }
    //
    function __construct(){}
    // 
    //
    function to_str(): string {
        return "null";
    }
    //There are no entoties in a literal expression
    function yield_entity(): \Generator {}

    //There are no attributes in a literal 
    function yield_attribute(): \Generator {}
    // 
    //
    function __toString() {
        return $this->to_str();
    }
    //
    //As an operand, a null simplifies to itself
    function simplify():answer{
        return $this;
    }
}

//The log class help to manage logging of save progress data, for training 
//purposes
class log extends \DOMDocument {

    //
    //The file name used for used for streaming
    public $filename;
    //
    //The current log, so that it can be accessed globally
    static log $current;
    //
    //Indicates if logging is needed or not; by default it is needed
    static bool $execute = true;
    //
    //The elememnt stack
    public array $stack = [];

    //
    //The document to log the outputs
    function __construct($filename) {
        //
        //Set the file handle
        $this->filename = $filename;
        //
        parent::__construct();
        //
        if (log::$execute) {
            //
            //Start the xml document 
            $root = $this->createElement('capture.data');
            $this->appendChild($root);
            //
            //Place the root at the top of the stack
            $this->stack = [$root];
        }
    }

    //Returns the element at the top of the stack
    function current() {
        return $this->stack[count($this->stack) - 1];
    }

    //Output the xml document
    function close() {
        //
        //Close the file handle
        $this->save($this->filename);
    }

    //Output the open tag for start of expression save
    function open_save(schema $obj) {
        //
        //Output the expresion full name tag
        if (!log::$execute) {
            return;
        }
        //
        //Create the element
        $elem = $this->createElement($obj->full_name());
        $this->current()->appendChild($elem);
        //
        //Place it in the stack
        array_push($this->stack, $elem);
        //
        return $elem;
    }

    //Creates a tag and appends it to the tag on top of the stack given a tag name  
    function open_tag(string $tag_name) {
        //
        //Only continue if we are in a logging mode 
        if (!log::$execute) {
            return;
        }
        //
        //In the logging mode...
        //
        //Create the element of the tagname provided. Prepare to catch invalid 
        //tagnames
        try{
            $elem = $this->createElement($tag_name);
        }catch(\Exception $ex){
            echo "Problem with tagname '$tag_name'";
            //
            //Rethrow the exception
            throw $ex;
        }
        //
        //Append the element to the one on top of the stack  i.e current;
        $this->current()->appendChild($elem);
        //
        //Place it in the stack
        array_push($this->stack, $elem);
        //
        //return the element creates
        return $elem;
    }

    //sets the attributes of an element given the string attribute name, the element 
    //and the value 
    function add_attr(string $attr_name, string $value, $element = null) {
        //
        if (!log::$execute) {
            return;
        }
        //
        //
        //$Ensure the element we are adding the value is at the top of the stack
        //enquire on how to deal with this situatuation 
        if (!is_null($element) && $this->current() == !$element) {
            throw new \Exception('Your stack is corrupted');
        } else {
            $this->current()->setAttribute($attr_name, $value);
        }
    }

    //ClosiNg pops off the given element from the stack
    function close_tag($element = null) {
        //
        //If not in log mode
        if (!log::$execute) {
            return;
        }
        //
        //Use the givebn element for tesing integory
        if (!is_null($element) && $this->current() == !$element) {
            throw new \Exception('Your stack is corrupted');
        }
        array_pop($this->stack);
    }

}

//Models the network of paths that start from an entity and termnate on another
//as a schema object so that it can manage errors associated with the process of 
//formulating the paths.
abstract class network extends schema {

    //
    //keeps a count of all the paths that were considered for deburging puposes 
    public int $considered = 0;
    //
    //The entity that is the root or origin of all the paths pf this network
    public entity $source;
    //
    //The collection of paths that form this network. Each path terminates on
    //another entity. Multiple paths terminating on the same entity are not allowed.
    //The better of the two is prefered over any other alternative. Note that 
    //this property is deliberately unset, so that execute() will do it when 
    //required.
    public array /* path[name] */$paths;
    //
    //The strategy to use in searching for paths in a network (to improve 
    //performance). This ensures that networks that dont use pointers do not have
    //to carry the budden asociated with construcring poinsters
    public strategy $strategy;

    //To create a network we must atleast know where the network will begin which 
    //is the source entity. The constructor cannot be called from javascript 
    //because of its complex data type. 
    function __construct(entity $source, strategy $strategy) {
        //
        //save the start point of this network
        $this->source = $source;
        $this->strategy = $strategy;
        //
        //Initialize the parent process. There is no partial name that is 
        //associated with a network as it has no presence in the relatinal data 
        //model (unlike entities, attributes, indices, etc)
        parent::__construct('unnamed');
        //
        //Extract the paths involved in this network 
        $this->build_paths();
    }

    //Every network should have a way of defining whe its paths come to 
    //an end
    abstract function is_terminal(entity $entity): bool;

    //
    //By default, every foreign key can contribute in a network
    function is_excluded(foreign $key): bool {
        //
        //Ignore the key
        mutall::ignore($key);
        //
        //No forein key is excluded from partcipating in a network
        return false;
    }

    //By default every foreign key should be included.
    function is_included(foreign $key): bool {
        //
        //Ignore the key
        mutall::ignore($key);
        //
        //No forein key is excluded from partcipating in a network
        return true;
    }

    //Executing the network establishes and sets its associated paths. Any errors 
    //encountered are handled according to the throw_excepon setting. If true, 
    //an expetion will be thrown immediately. If not, it is save in the error 
    //log. (Remmember that network is a schema object). 
    function build_paths(bool $throw_exception = true) {
        //
        //Begin with an empty path. 
        /* path[name] */$this->paths = [];
        //
        //Starting from the source, populate ths network's  paths, indexed 
        //by the terminal entity name. In a multi-database setting the ename is
        //not sufficent to identify an entity. The database name is also required
        //Hence the partial name.
        foreach ($this->path_from_entity($this->source, []) as $newpath) {
            //
            $this->paths[] = $newpath;
        }
        //
        //Verify integrity of the paths. E.g., in a fit, ensure that all the
        //targets are covered.
        $this->verify_integrity($throw_exception);
    }

    //By default all paths returned from exceuting a network have integrity. So,
    //do noting.
    function verify_integrity(bool $throw_exception = true) {
        mutall::ignore($throw_exception);
    }

    //Yields all the paths that start from the given entity. Each path is indexed
    //by a suitable name
    private function path_from_entity(entity $from, /* foreigner[] */ $path): \Generator {
        //
        //Check if we are at the end of the path. We are if the
        //termnal condition is satisfied
        if ($this->is_terminal($from)) {
            //
            //Yield teh indexed and the target name
            yield $from->partial_name => $path;
        }
        //
        //Us the foreigner returned by executing each of the serch functiion
        foreach ($this->strategy->search($from) as $foreigner) {
            //var_dump($foreigner->partial_name);
            //
            //count the foreigners
            $this->considered++;
            //
            // Consider teh foghner for the path being searched
            yield from $this->path_thru_foreigner($foreigner, $path);
        }
    }

    //Yields all the paths that pass through the given foreigner
    private function path_thru_foreigner(foreign $foreigner, array /* foreigner[] */$path): \Generator {
        //
        //Determine if this foreigner is to be included in the path. Don't waste
        //time with any operation besed on this foeigner if,after all, we are 
        //not goin to include it in the path!
        if ($this->is_excluded($foreigner)) {
            return;
        }
        //
        if (!$this->is_included($foreigner)) {
            return;
        }
        //
        //We are not at the end yet; Prepare to add this foreigner to the path
        //and continue buiiding the path using its away component; but first, 
        //attend to cyclic looping condition. For now....(in future we throw 
        //exeption immedately or log it as an error, e.g., in identifier)
        //
        //A cyclic path will occur if a) the relation is hierarchical or.... 
        if ($foreigner->is_hierarchical()) {
            return;
        }
        //
        //b)...if 'there is evidence' that it is already in the path.
        $repeated = array_filter($path, fn($f) => $f->partial_name == $foreigner->partial_name);
        //
        if (count($repeated) > 0) {
            return;
        }
        //
        //Add this foreigner to the path
        $path[] = $foreigner;
        //
        //Continue buildig the path, as if we are starting from the away entity
        //of the foreigner.
        $entity = $foreigner->away();
        //
        yield from $this->path_from_entity($entity, $path);
    }

}

//Modelling strategy for searching through a network. Searching through paths 
//indiscriminately is very time consuming because potetually we would have to 
//search through all the databases in the sever -- in a multi-database scenario. 
//To improvoe performance, we have limuetd to the search to currently opened 
//databases only. Even then, pointers are not buffered, because, with introduction 
//of views (that can be connected to the model at any time) the problems of 
//updating the buffer is not worth the trouble. Some searches do not require
//pomiters, so thet dont have to beer the budden. The stargey class is desifned 
//to dismiss pointers when they are not necessary
abstract class strategy extends mutall {

    // 
    //Types of strategies for searching paths in a network are designed for  
    //boosting the search performance
    //
    //Use the foreign key columns only. Typically, the identifier network uses 
    //this strategy
    const foreigners = 0;
    //
    //Use the pointers only for the network. I have no idea which network would
    //ever use this, so this strategy is not implemented for now.
    const pointers = 1;
    //
    //Use both pointers and foreign key columns. The fit and save (indirect) 
    //networks use this strategy. 
    const both = 2;
    //
    //using only structural foreigners 
    const structural = 3;

    //
    function __construct(int $type = self::foreigners) {
        $this->type = $type;
        //
        //The true in the parent is for the throw exception option which by default 
        //is true but i passed it here so that i can be aware of it.
        parent::__construct(true);
    }

    //
    //Yields the required foreign depending on the strategy o nwhich the network is 
    //operating on
    abstract function search(entity $source): \Generator;
}

//Use foreiners only
class strategy_foreigner extends strategy {

    //
    function __construct() {
        parent::__construct(self::foreigners);
    }

    function search(entity $source): \Generator {
        yield from $source->foreigners();
    }

}

//
//The network that utilises both the foreigners and the pointers in the formulation of
//its path this strategy is particulary important in the areas where we do 
//not know how the entites are related i.e for the fit and the save network 
class strategy_both extends strategy {

    //
    //The stategy for this network is a both see in strategy above 
    function __construct() {
        parent::__construct(self::both);
    }

    //
    //Saerches in this strategy are bound to both the foreigners and the pointers 
    //since both constitute the path of a network in this strategy 
    function search(entity $source): \Generator {
        yield from $source->foreigners();
        yield from $source->pointers();
    }

}

//
//This strategy is to save on the processing time needed to where we constrain the path 
//to only the structural or administative entities (no reporting) ment to reduce the number 
//of paths that are considered for a complete join 
class strategy_structural extends strategy {

    //
    //The stategy for this network is a both see in strategy above 
    function __construct() {
        parent::__construct(self::structural);
    }

    //
    //Serches in this strategy are bound to both the foreigners and the pointers 
    //since both constitute the path of a network in this strategy 
    function search(entity $source): \Generator {
        //
        //Test if this entity is a reporting entity any to ensure that no path in yielded in 
        //such a situation
        if ($source->reporting()) {
            
        }
        //
        //entity not reporting yield both the pointers and the foreigners 
        else {
            yield from $source->structural_foreigners();
            yield from $source->structural_pointers();
        }
    }

}

//This is a network of all the foreigns that are none cross members from the source 
//to terminal condition 
//Terminal condition is an entity that does not have structural foreign key(structural
//means those entties that that are  not cross members)
//parameter $source is the root orignin of this network see in network above 
class dependency extends network {
    //
    //
    function __construct(entity $source) {
        //
        //The dependency network only relies on foreigners (not pointers) keys to 
        //create for its path
        $strategy = new strategy_foreigner();
        //
        //Search the network paths using the foreign strategy 
        parent::__construct($source, $strategy);
    }

    //We only utilise those foreign keys that are not cross members 
    function is_included(foreign $key): bool {
        //
        //Exclude cross members 
        if ($key->is_cross_member()) {
            return false;
        }
        //
        return true;
    }

    //Returns true if the given entity does not have any foreign keys that are 
    //not cross members i.e structural foreign keys 
    function is_terminal(entity $from): bool {
        //
        //Filter the columns of the entity to remain with the foreign keys
        //that are not cross members
        $id_foreigners = array_filter($from->columns, fn($col) =>
                $col instanceof foreign & !$col->is_cross_member()
        );
        //
        //We are at the end of the path if the given entity has no foreign column 
        //that are structural
        return count($id_foreigners) === 0;
    }

}