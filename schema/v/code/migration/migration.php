<?php
namespace mutall\migration;
use mutall;


//The server class supports data migration, i.e., the extraction, transmission 
//and ingestion of data, from one server to the current one. 
class server{
    //
    //Credentials for accessing the different servers. The url allows us
    //(using a post method) to exevute a 'command' on the remote server
    //using the browser fetch() interace or curl library
    const CO = [
        'url'=>'https://mutall.co.ke/schema/v/code/index.php',
        'username'=>'root',
        'password' => ''
    ];
    //
    const DO = [
        'url'=> 'http://206.189.207.206/schema/v/code/index.php',
        'username'=>'root',
        'password' => ''
    ];
    
    const LOCALHOST= [
        'url'=> 'http://localhost/schema/v/code/migration/transmit.php',
        'username'=>'root',
        'password' => ''
    ];    
    //
    //Name of the databse on the local server, to migrate the data to
    public $dbname;
    
    function __construct(string $dbname){
        $this->dbname = $dbname;
    }
    
    //Migrate data from a server to this local host. The from an indexed array
    function migrate(array /*{dbname, server}*/ $from):string /*'ok'|error string*/{
        //
        //Specify the tables to migrate to this server
        //
        //Get the table names to import from CO
        $tnames = ['payment', 'wreading', 'ebill', 'agreement', 'credit', 'debit'];
        //
        //Get the SQLs to execute on the remote server
        $sqls/*Array<{tname, sql}>*/ = array_map(fn($tname)=>$this->get_sql($tname), $tnames);
        //
        //Define the command to execute on the remote server
        $cmd = [
            'class'=>'extractor',
            'cargs'=>[$from['dbname'], $sqls],
            'method'=>'execute',
            'margs'=>[]
            ];
        //        
        //Create a new transmitter for data (extracted from CO server) to the 
        //current one
        $transmitter = new transmitter($from['server'], $cmd);
        //
        //Use the sqls to extract data from remote and transmit it the current one
        $data/*Array<{tname, cnames, matrix}>|false*/ = $transmitter->execute();
        //
        //Test if transmission was succesful or not. If not don't continue.
        if($data === false) return false;
        //
        //Use the returned data to create the ingester
        $ingester = new ingester($data, $this->dbname);
        //
        //Ingest the returned results
        $result /*:'ok'|error as a string*/ = $ingester->execute();
        //
        return $result;
    }
    //
    //Get the SQLs to execute on the remote server, plus the table name.
    private function get_sql($tname):array/*{tname: string, sql:string}*/{
        //
        //Get the sql from the table name and add the suffix which is (.sql).
        $sql = file_get_contents(__DIR__."../sqls/$tname.sql");
        //
        return ['tname'=>$tname, 'sql'=>$sql];
    }
    
}

//Data collector, implemented as triggers. 
//Currently the triggers are already set, manually. This class allows us to
//set them autimatically, by reading the code from a local sql file and 
//executing it on a remote machine
class collector {
    //
    function __construct(){}
    //
    //Set up triggers on the remote machine. Create as many insert/update/delete
    //triggers as are required on the remote database
    function set_triggers():void{
        
    }
    
    //Clear the triggers from the remote database
    function clear_triggers():void{
        
    }
    
}

//Extracts data from a specified server
class extractor{
    //
    //The database name (on the local server) to extract the data from
    public string $dbname;
    //
    //The credentials for the server 
    public object /*{url, userbane, password}*/$server;
    //
    function __construct(string $dbname, object $server){
        $this->dbname = $dbname;
        $this->server = $server;
    }
    
    //Execute the array of sqls to extract desired data from te lcal databse
    function execute(array/*{tname:string, sql:string}*/ $sqls):array /*<ingester>*/{
        //
        //Create a pdo (data connection) using the extractors dbname
        //
        //Thse credentials are for link to which server ?.
        //
        $dsn = "mysql:host=localhost;dbname=$this->dbname";
        //
        //Now create the PDO
        $pdo = new \PDO($dsn, $this->server->username, $this->server->password);
        //
        //Use the PDO to compile teh desireed data
        return array_map(fn($sql)=> self::get_data($sql, $pdo), $sqls);
    }

    //The desired data is a matrix correspiknding to a the sql , plus all
    //the columns (as a pair of ename anc cname), that make up the sql
    function get_data($sql/*{tname:string, sql:string}*/, \PDO $pdo):array /*<{tname, matrix, columns}>*/{
        //
        //Run the query to get a pdo statement
        $stmt = $pdo->query($sql->sql);
        // 
        //Fetch the result as a  simple matrix, i.e, Array<Array<basic_value>>
        $matrix = $stmt->fetchAll(\PDO::FETCH_NUM);
        //
        //Use the PDO statement to get the column metadata and map the metadata
        // to columns, i.e., ename/cname pairs
        $columns = $this->get_column_meta_data($stmt);
        //
        return ['tname'=>$sql->tname, 'matrix'=>$matrix, 'columns'=>$columns];
    }
    //
    //Get the column meta data from a PDOStatement. And extract the column names.
    function get_column_meta_data(\PDOStatement $stmt):array /*<{ename:string, cname: string}>*/ {
        //
        //Start with an empty array
        $result = [];
        //
        // get the column count from the statement
        $count = $stmt->columnCount();
        //
        //Loop through the count and for each get the column data;
        for ($col = 0; $col < $count; $col++){
            //
            //Get the column data. This is an array.
            $columns_meta[]= $stmt->getColumnMeta($col);
            //
            //Get the table name from the meta data.
            $ename= $columns_meta['table'];
            //
            //From the column meta data, extract the column names.
            $cname = $columns_meta['name'];
            //
            array_push($result, ['ename'=>$ename, 'cname'=>$cname]);
        }
        //
        return $result; /*Array<{ename, cname}*/
    }
    
}
    
//Use the curl library to transmit data (extracted from a remote server using
//a given command) to the local host
class transmitter{
    //
    //The curl connection
    public $curl;
    //
    //The command object has the form: 
    /*
    {
        //Class name that containes...
        class_name:string
        //
        //...the methodto execute
        method_name:string
        //
        //The class constructor argumenta
        cargs:Array<any>
        //
        //The mnetod's arguments    
        margs:Array<any>
    } 
    */
    function __construct(string $server_url, object $cmd){
        //
        //Initialize a curl connection to Mutall co to execute the query
        $this->curl = curl_init();
        //
        //Create multiple options for the cURL transfer
        curl_setopt_array($this->curl, array(
            //
            //Get some output from the request once it is sent
            CURLOPT_RETURNTRANSFER => true,
            //
            //Set a POST custom request
            CURLOPT_CUSTOMREQUEST => 'POST',
            //
            //Pass the command as part of the post method
            CURLOPT_POSTFIELDS => ['cmd'=>json_encode($cmd)],
            //
            //Set the url that links us to teh remote setver
            CURLOPT_URL => $server_url
        ));    
    }
    
    //Execute the curl connection and return the desired data, thus 
    //transmitting the desired data to the caller. The data is an array
    //of teh folowing elements, a.k.a., ingestee:-
    /*
    type ingester = 
        {
            //the table name where the data is extracted from.
            tname:string,
            //
            //The data received from the execution of the query on the table above.
            matrix: matrix = Array<Array<basic_value>>,
            //
            //The column names to support the formulating of labels to save 
            //the data to the database.
            columns: subject = {ename:string, cname: string}
        }
    */
    function execute():array|false/*Array<ingestee>|false*/{
        //
        //Execute the request.
        $ans/*string|boolean*/= curl_exec($this->curl);
        //
        $result/*Array<ingester>|false*/ = $ans===false ? false: json_decode($ans);
        //
        //Compile the result
        return $result;
    }
}

//Ingests available data into a local server
class ingester{
    //
    //This is the expression used to get data from the given table and column.
    const LOOKUP = "mutall\\capture\\lookup";
    
    //The data to be ingested, i.e., the ingestee. Its structure is explained below
    public array /*<{tname, columns, matrix}>*/$data;
    //
    //The database to use for the ingestion
    public string $dbname;
    
   function __construct(array/*<{tname, columns, matrix}>*/ $data, string $dbname){
       $this->data = $data;
       $this->dbname=$dbname;
   }
   
   //Execute use the ingester data to effect the kingestion process
   function execute():string /*'ok'|error as string*/{
       //
        //1. Create the layouts from the ingester.
        $layouts = [...$this->get_layout()];
        //
        //2. Create a new questionnaire to load the given layouts.
        $q = new \mutall\questionnaire($layouts);
        //
        //3. Load the layouts.
        $result/*'Ok' | string as error*/  = $q->load_common();
        //
        //4. Return the result.
        return $result==='Ok' ? true: $result;
   }
   
    //
    //Generate the layouts for loading the data extracted from mutall.co.ke (server) to
    //mutallco rental database in (do) server.
    function get_layout():\Generator{
        //
        //Loop through all the ingester elements and yield a table and its 
        //corresponding labels
        foreach($this->data as $ingester){
            //
            //Extract the table name from the ingester,...
            $tname /*string */ = $ingester->tname;
            // 
            // column names as subjects,...
            $columns /*{ename:string, cname: string}*/ = $ingester->columns;
            // 
            // and the matrix from the ingester above.
            $matrix /*basic_value[][]*/ = $ingester->matrix;
            //
            //Yield the table layout.
            yield $this->get_table($tname, $columns, $matrix);
            //
            //Yield the labels; there will be as many as there are columns in the table.
            yield from $this->get_labels($tname, $columns);
        }
    }
   
      /*
    //Yield the table of type layout where the source of the data is a matrix. 
    It has the following structure.
    {
        classname: "mutall\\capture\\matrix",
        args : [
            //
            //The table's name, used in formulating lookup expressions    
            tname: string,
            //
            //The table's header as an array of colum names indexed by their 
            //positions     
            cnames:  Array<cname>
            //    
            //A tables fueuel, as a double array of basic values    
            ifuel: matrix = Array<<Array<basic_value>>>,
            //
            //Where does the body start    
            body_start:int = 0
        ]
    }*/
    function get_table(string $tname,array /*<subject ={ename, cname}>*/ $columns, array/*matrix*/$matrix):\Generator {
        //
        // Create a new standard object.
        $table = new \stdClass();
        //
        $table->classname = "mutall\\capture\\fuel";
        //
        $table->args = [
            //
            //Get the table name.
            $tname,
            //
            //Get the column names as an array
            array_map(fn($column) => $column->cname , $columns),
            //
            //Get the data.
            $matrix
        ];
        //
        yield $table;
    }
  
    //Yield the labels for the columns to support saving of the data, to the 
    //database specific tables on the local server.
    function get_labels(string $tname,array /*<subject ={ename, cname}>*/ $columns): \Generator {
        //
        //Get the database name to save the data to
        $dbname = $this->dbname;
        //
        //Formulate the labels from the column names;
        foreach ($columns as $col) {
            //
            //Get the entity name from the column.
            $ename = $col->ename;
            //
            //Get the column name from the column.
            $cname = $col->cname;
            //
            //Generate the label
            yield [$dbname, $ename, [$tname], $cname, [self::LOOKUP, $tname, $cname]];
        }
    }
    
}
