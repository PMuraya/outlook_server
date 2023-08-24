<?php
namespace mutall;
//
//The registrar class is a derivatiove of a database to support CRUD 
//functionality for registering users.
class query extends \mutall\database {
    //
    //Use given database to retrieve ro support registtaion of users
    function __constructor(string $dbname, object $sqls){
        //
        //Initialize the parent database system
        parent::__construct($dbname);
    }
    //
    //Retrieve the data for writing to the registration form, given an sql retriever
    //The retrievers have the following shapes
    //  sql_retriever = {scalar:$sql, tabular:Array<$sql>}
    //  data_retriever = {scalars:Array<basic_value>, matriecs:Array<$matrix>}
    //where:-
    //-$sql is text for an sql statement
    //-$matrix is a 2-dimensional arrau of basic values, i.e, Array<Array<basic_value>> 
    function execute():array/*retriever*/{
        //
        //Execute the scalar query, ensuring that we return an array of number-indexed
        //basic values. We trap the process for better error reporting
        try{
            //
            //Query the database using the given sql
            $results = $this->pdo->query($sql_retriever->scalars);
            //
            //Fetch all the data from the database -- indexed by the column number
            $matrix = $results->fetchAll(\PDO::FETCH_NUM);
            //
            //There must be one and only one record returned by the scalar sql
            //
            //Count the number of records
            $count = \count($matrix);
            //
            //Its an error if there is no record
            if ($count===0) throw new \Exception(`No data found`);
            //
            //Its an error if there is moore than 1 record
            If ($matrix>1) 
                throw new \Exception("A scalar sql can yield only one row, $count found");
            //
            //Return the only fetched rowdata                
            $scalars = $matrix[0];
        }
        //PDO error has occurred. Catch it, append the sql (for better reporting) 
        //and re-throw
        catch(\Exception $ex){
            throw new \Exception($ex->getMessage()."<br/><pre>$sql_retriever->scalars</pre>");
        }
        //
        //Map the tabular sqls to a 2 dimensional matrix of basic values, by 
        //executing the sql for each table
        $matrices = array_map(fn($sql)=>$this->get_sql_matrix($sql), $sql_retriever->matrices);
        //
        //Compile and return the data retriever. NB: An indexed array is returned
        //to javascript as an object
        return ['scalars'=>$scalars, 'matrices'=>$matrices];
    }
    
    //Given a (tabular) sql, return its matching matrix of fetched data
    protected function get_sql_matrix(string $sql):array/*<matrix>*/{
        //
        //Execute the sql to get a pdo statement; catch PDO erors if any
        try{
            //
            //Query the database using the given sql
            $results = $this->pdo->query($sql);
            //
            //Fetch all the data from the database -- indexed by the column number
            $matrix = $results->fetchAll(\PDO::FETCH_NUM);
            //
            //Return the matrix
            return $matrix;
        }
        //PDO error has occurred. Catch it, append the sql (for better reporting) 
        //and re-throw
        catch(\Exception $ex){
            throw new \Exception($ex->getMessage()."<br/><pre>$sql</pre>");
        }
        
    }
} 