<?php
namespace mutall;

//To resolve reference to the mutall and schema classes
include_once 'schema.php';
//
include_once 'sql.php';

//The merger class needs to extend the schema object so that we can access
//the method for opening databases. This is particularly important when dealing
//with pointers in a multi-database context.
class merger extends schema{
    //
    public string $dbname;
    public string $ename;
    public string $cname;
    //
    //The datanase holding the records to merge
    protected database $dbase;
    //
    //The entity class to which the members belong
    protected entity $ref;
    //
    //An all members members taking part in a merge, as an sql statement
    public string $members;
    //
    //The member into which minor members will be merged, as a
    //primary key
    public int  $principal;
    //
    //The members (as an sql string) that will be redirected to point to the 
    //principal
    public string $minors;
   // 
   function __construct(stdClass $Imerge) {
        //
        //Initialize the schema parent 
        parent::__construct();
        //
        //Destructure the members
        $this->dbname= $Imerge->dbname;
        $this-> ename= $Imerge->ename;
        $this-> members= $Imerge->members;
        //
        //Principal and minors are conditional
        if (isset($Imerge->principal)) $this->principal = $Imerge->principal;
        if (isset($Imerge->minors)) $this->minors = $Imerge->minors;
        if (isset($Imerge->cname)) $this->cname= $Imerge->cname;
        //
        //Set the database property
        $this->dbase = new database($this->dbname);
        //
        //Get the named entity from the database
        $this->ref = $this->dbase->entities[$this->ename];  
    }
    //
    //Categorize the members into a principal and the minors and return the 
    //result. There must be at least one minor. The principal is specified as
    //a primary key value; the minors as an sql
    public function get_players()/*: {principal:int,minors:sql}|null*/{
        //
        //Get the reference contributors (as a union of all pointer based 
        //queries).
        $contributor= $this->get_contributors();
        //
        //Get the principal sql; it depends on whether there are contributors
        //or not.
        $principal_sql = is_null($contributor)
            //    
            //If there is no contributor, then the first member is the
            //principal   
            ? $this->dbase->chk(
                "select "
                    . "member.member "
                . "from ($this->members) as member "
                //
                //Pick the first one in the list    
               . "limit 1 offset 0"
              )      
            //
            //If there are contributors, pick the member that is least expensive
            //to merge. This is the one pointed at by the highest number of
            //contributors
            : $this->dbase->chk(
                "select "
                    . "contributor.member, "
                    . "count(contributor.contributor) "
                . "from ($contributor) as contributor "
                //
                //Summarise the contributions of each member
                . "group by contributor.member "
                //
                //Ensure that the highest contibutor is at the top
                . "order by count(contributor.contributor) desc "
                //
                //Pick the first in the list    
               . "limit 1 offset 0"
            );
        //
        //Run the pincipal sql to get the only member
        $result = $this->dbase->get_sql_data($principal_sql);
        //
        //If the results is empty, then return a null
        if (count($result) ==0) return null;
        //
        //Retrieve the principal
        $this->principal = $result[0]['member'];
        //
        //Minors are all the members without the principal
        $minors = $this->dbase->chk(
            "select "
                ."member "
            ."from ($this->members) as member "
            ."where not (member =$this->principal)"
        );
        //
        //There must be at least one minor; otherwise return a null
        if ($this->dbase->get_sql_data(
           "select count(member) as freq from ($minors) as member"     
        )[0]['freq']==0) return null;
        //
        //
        //Compile and return the results
        return ['principal'=>$this->principal,'minors'=>$minors];
    }
    
    //
    //A query formed from the union of all the queries that are based on the 
    //pointers of the referenced entity -- if any
    public function get_contributors()/*string|null*/{
        //
        //Get the reference entity
        $entity= $this->ref;
        //
        //Get all the pointers to the reference entity (without preserving the keys)
        $pointers= iterator_to_array($entity->pointers(), false);
        //
        //If there are no pointers, then return a null
        if (count($pointers)==0) return null;
        //
        //Map the pointers to their corresponding sql statements
        $sql= array_map(fn($pointer)=> $this->get_pointer_sql($pointer), $pointers);
        //
        //Formulate a union of all the sql's
        $union= implode("union all ", $sql);
        //
        //Check that teh union sql is property constructed
        $contributors_temp = $this->dbase->chk($union);
        //
        //Ensure that this query yields at least one record, under the current
        //membership
        $contributors = $this->dbase->chk(
            "select "
                . "member.member, "
                . "contributor.contributor "
            . "from ($this->members) as member "
                . "inner join ($contributors_temp) as contributor on contributor.member= member.member "
        );
        //Execute this query, hopefully to get a non empty return set
        $rows= $this->dbase->get_sql_data($contributors);
        //
        //Return either the contributors sql or null -- if it yielded nothing 
        return count($rows)==0 ? null: $contributors;
    }
    //
    //This function returns the pointer sql which has a structure similar to e.g.
    //select msg.msg as contributor,msg.member as member from msg
    public function get_pointer_sql(pointer $pointer): string {
        //
        //
        return $this->dbase->chk(
            "select "
                . "$pointer as member, "
                . "{$pointer->away()->pk()} as contributor "
            . "from "
                . $pointer->away()
                        
        );
    }
    //
    //Obtain the values for the consolidation process.
    //This method returns an sql which if executed would give us data with the
    //the following structure. It comes from the union of individual based columns
    // Array<{cname:string, value: basic value}>
    public function get_values(): string{
        //
        //Get the columns of the referenced entity
        $all_columns = $this->ref->columns;
        //
        //Remove the unnecessary keys, to remain with data columns
        $data_columns = array_filter(
            $all_columns, 
            fn($col)=>
                //
                //Primary keys are never manually merged
                !$col instanceof primary
                //
                //Exclude any this column if it is being used for
                //redirection
                &!(isset($this->cname) && $col->name == $this->cname)
        );
        //
        //Use the remaining columns to formulate the queries for retrieving
        //values for each data column of the referenced entity.
        $queries = array_map(
            fn($col)=> $this->get_column_query($col), 
            $data_columns
        );
        //
        //Do a union of all the queries
        $all_values = implode("\nunion all ", $queries);
        //
        //The all values sql generates output that looks like:
        //Array<{cname:strng, value:string} in which the wors are
        //not unique. Modify the output so that only unique values are
        //returned
        //
        $unique_values = $this->dbase->chk(
           "select distinct cname, value from ($all_values) as all_values "
        );        
        //
        return $unique_values;
    }
    //
    //This method returns an sql which if executed would give us data with the
    //the following structure. It comes from the given column
    // Array<{cname:string, value: basic_value}>
    private function get_column_query(column $col):string{
        //
        //
        $sql = $this->dbase->chk(
            "select "
                . "'$col->name' as cname, "
                . "ref.value "
            . "from "
                //
                //Use the reference table
                . "("
                    . "select "
                        . "`$col->name` as value, "
                        . "{$this->ref->pk()} as member "
                    . "from ($this->ref) "
                . ") as ref "
                //
                //Filter by members
                . "inner join ($this->members) as member on member.member= ref.member "
               //
               //Aand consider only thoses values that are not empty
            . "where not(ref.value is null)"
        );
        //
        return $sql;
    }
    
    //Return consolidates as the data that takes part in conflict
    //resolution. It comprises of both clean and conflicting values
    function get_consolidation():stdClass/*:{clean:interventions, dirty:conflicts}*/{
        //
        //Get all the values (sql)
        $all_values = $this->get_values();
        //
        //Formulate the dispute support sql
        $dispute= function(string $comparator) use ($all_values): string {
            //
            //Obtain the records that are suspected to have conflicts 
            $sql= $this->dbase->chk(
                "select "
                    . "all_values.cname, "
                    . "count(all_values.value) as freq "
                . "from ($all_values) as all_values "
                . "group by all_values.cname "
                . "having count(all_values.value)$comparator"
            );
            //
            return $sql;
        };
        //
        //Get the clean values
        //
        // Get the clean values have one value per column
        $clean_sql = $dispute("=1");
        //
        //Formulate the clean values
        $clean_data= $this->dbase->chk(
            "select "
                . "all_values.cname, "
                . "all_values.value "
            . "from ($all_values) as all_values "
            . "inner join ($clean_sql) as clean on clean.cname = all_values.cname"
        );
        //        
        //  Execute the clean values sql
        $clean = $this->dbase->get_sql_data($clean_data);
        //
        //Get the conflicting values
        //
        //Conclicting data have more than one value per column
        $conflicts_sql = $dispute(">1");
        //
        //Summarise the conflicts
        $conflicts_summary=  $this->dbase->chk(
            "select "
                . "all_values.cname, "
                . "JSON_ARRAYAGG(all_values.value) as `values` "
            ."from "
                . "($all_values) as all_values "
                . "inner join ($conflicts_sql) as conflicts on conflicts.cname = all_values.cname "
            . "group by all_values.cname"
        );
        //  Execute the conflicts sql
        $conflicts1 = $this->dbase->get_sql_data($conflicts_summary);
        //
        //Map the raw conflicts to the expected type
        $conflicts = array_map(function($raw_conflict){
            //
            //NB. The raw conflict is an indexed array that has the 
            //has the following structure
            //[cname:string, values:string] = c;
            //
            //Access the values component from the raw conflict.
            $values_str = $raw_conflict['values'];
            //
            //Json-decode the values (string) to an array
            $values_array = json_decode($values_str, JSON_THROW_ON_ERROR);
            //
            //Recompile the desired conflict replacing the values string with 
            //the array version, so that the result should be looking 
            //like this:
            //{cname:string, values:Array<string>} 
            $desired_conflict = new stdClass();
            $desired_conflict->cname = $raw_conflict['cname'];
            $desired_conflict->values = $values_array;
            //
            //
            //Return the desired result
            return $desired_conflict;
        },$conflicts1);
        //
        $consolidates = new stdClass();
        //
        $consolidates->clean = $clean;
        $consolidates->dirty = $conflicts;
        //
        return $consolidates;
    }
    
    //
    //This function deletes the minor contributors and returns a 'ok' if 
    //the deletion was successful. If there was an integrity violation error
    //then an an array of pointers is returned in preparation for the 
    //redirection of all minor pointers to the principlal
    public function delete_minors()/*:<Array<pointer>|'ok';*/{
        //
        //Formulate a query to delete the minors
        $query = 
            "delete "
                . "$this->ref.* "
            . "from $this->ref "
            . "inner join ($this->minors) as minors "
                . "on minors.member = {$this->ref->pk()}";
                
        //Execute the query and return the output
        try{
            $this->dbase->query($query);
            //
            //The deletion was successful
            return 'ok';
        }
        catch(PDOException $ex){
            //
            $ecode = $ex->getCode(); 
            //
            //The deletion failed for some reason. If the reason was due 
            //to integrity error, we return pointers that help in resolving the
            //error; otherwise we don't handle the exception
            if($ecode== "23000"){return $this->get_pointers();}
            else{throw $ex;}
        }
    }
    
    //Returns all the pointers to the reference table, unconditionally
    private function get_pointers(): array /*<pointer>*/{
        //
        //Collect all the ponters to the reference table (without preserving the keys)
        $pointers = iterator_to_array($this->ref->pointers(), false);
        //
        //Map tthe pointers to the desired type
        return array_map(function($pointer){
            //
            //Create the output result
            $result = new stdClass();
            //
            //Get the pointer away entity a.k.a., contributor;
            $contributor = $pointer->away();
            //
            //Compile the result
            $result->dbname = $contributor->dbname;
            $result->ename = $contributor->name;
            $result->cname = $pointer->name;
            $result->cross_member = $pointer->is_cross_member();
            //
            return $result;
        }, $pointers);
    }
    //
    //
    //This function fetches the consolidations as an array, and merges them to the
    //principal resolving the numerous duplicates during execution.
    //e.g update `member`
    //      set `member`.`name`='Cyprian Kanake',`memeber`.`age`=42,...
    //           
    public function update_principal(
            array $consolidations /*: Array<{cname:string,value:string}>*/
    ): void{
        //
        //Map the consolidations array into an array of consolidation text
        $texts= array_map(fn($consolidation)=>
            "`$consolidation->cname`='$consolidation->value'",
            $consolidations);
        //
        //Join the consolidation texts with a comma separator
        $set= join(",", $texts);
        //
        //Formulate  update query
        $update= $this->dbase->chk(
            "update "
                . "$this->ref "
            . "set $set "
            . "where {$this->ref->pk()}=$this->principal" 
        ); 
        //
        //Execute the query. If the update fails, the system will crash
            $this->dbase->query($update);
    }
    //
    //This function redirects a pointer to the principlal. The shape of a 
    //pointer is {dbname, ename, cname, is_cros_member:boolean}
    //If successful the function returns 'ok'; if not (because of integrity 
    //violation) it returns an array of indices
    //An index has the following shape:-
    /*index = {
        signatures:Array<{signature}
        members:lib.sql
    }
    */
    public function redirect_pointer(stdClass /*pointer*/$pointer)/*:Array<index>|'ok'*/{
        //
        //Formulate the redirection query for the contributors, based on the 
        //given pointer
        $sql = "Update "
            //
            //The table to update, contributor, is derived from the pointer    
            . "`$pointer->dbname`.`$pointer->ename` "
            //
            //Filter contributors using the minors
            . "inner join ($this->minors) as minor "
                . "on minor.member=`$pointer->ename`.`$pointer->cname` "
            //
            //It is the pointer we are redirecting to the principal    
            . "set `$pointer->ename`.`$pointer->cname` = $this->principal ";
        //
        //Execute the query. If successful, return ok; otherwise formulate and 
        //return the Imerge structure to support merging of the pointee members
        try{
            $this->dbase->query($sql); 
            //
            //The redirection was successful
            return 'ok';
        } catch (Exception $ex) {
            //
            //The redirection failed for some reason. 
            //
            //If the reason was not integrity violation re-throw the Exception
            if ($ex->getCode()!=="23000") throw $ex;
            //
            //The reason for failure was integrity violation. Compile and 
            //return the array of indices
            return $this->get_indices($pointer);
        }
    }
    
    //Return the index-based data that is needed to merge pointers members that
    //that would violate unique key integrity if they where re-diredtd to the 
    //same principal. The data has the shape:-
    /*
        {
        //
        //Index name (for reporting purposes)
        ixname:string;
        //
        //An sql that generates a merging signature bases on the
        //violaters, i.e., the columns of an index needed to determine
        //integrity violaters. The sql has the shape:
        //Array<{signature}>
        signatures:Array<{signature:string}>, 
        //
        //The sql that is to be constrained by a specific to generate
        //the pointer members that need to be merged. he sql has the shape:-
        //Array<{signature, member}
        members:sql
    }
    */
    private function get_indices(stdClass $pointer):array/*<index>*/{
        //
        //Open teh pointer database
        $dbase = $this->open_dbase($pointer->dbname);
        //
        //Get the contributor table, i.e,, the away table of the pointer
        $contributor = $dbase->entities[$pointer->ename];
        //
        //Start with an empry array of indices
        $indices = [];
        //
        //For each index of the contributor, yield it if valid
        foreach($contributor->indices as $ixname=>$index){
            //
            //The index must contain the pointer; otherwise skip it.
            if (!(in_array($pointer->cname, $index))) continue;
            //
            //Compile the member sql
            //
            //Drop the pointer from the index the get signature columns
            $cnames = array_filter($index, fn($cname)=>$cname!==$pointer->cname);
            //
            //Convert the array of column names to comma separated fields
            $cnames_str = join(", ", $cnames);
            //
            //Formulate the siganture id
            $signature = "JSON_ARRAY($cnames_str)";
            //
            //Get the members sql. It has teh structure:
            //Array<{member:pk, signature:string}>
            //where the siganture is an array of all the signature columns
            $members = $this->get_member_sql($dbase, $signature, $pointer);
            //
            //Get the acutal sigantures
            $signatures = $this->get_signatures($dbase, $signature, $members);
            //
            //Only non-empty signatures are considerd
            if (count($signatures)==0) continue;
            //
            //Construct the index-based data and grow the indices
            $data = new stdClass();
            $data->ixname = $ixname;
            $data->members = $members;
            $data->signatures = $signatures;
            //
            //Push teh data to the array.
            $indices[]=$data;
        }
        //
        //There must be at least one index whose unique key integrity would
        //be violated for re-direction to have failed.
        if (count($indices)==0) 
            throw new Exception(
               "No index from "
                .json_encode($contributor->indices)
                ." in '$pointer->ename' for signature '$signature' "
                . "was found to be unique key violated. Thats unexpected");
        //
        return $indices;
    }
    
    
    //Given a pointer to a referenced entity return the sql that is
    //required for isolating the members to be merged. These are members
    //that cause the integrity violation when we attempted the merge -- so they 
    //must have resulted in duplicate values in a unique index 
    private function get_member_sql(database $dbase, string $signature, stdClass $pointer):string/*sql*/{
        //
        //Get the all pointer members taking part in this merge process
        return $dbase->chk(
            "Select "
                //The shared columns as the sgnature 
                . "$signature as signature, "
                //        
                //The members primary key
                ."`$pointer->ename`.`$pointer->ename` as member "
            //
            //The members to merge come from the pointer table
            . "from "
                . "`$pointer->dbname`.`$pointer->ename` "
                //
                //Limit the cases to those pointing to all the reference 
                //members (not just minors!)
                . "inner join ($this->members) as member "
                    . "on member.member=`$pointer->ename`.`$pointer->cname` "
        );
    }

    //Summarise the pointer members to isolate groups of members to be
    //merged. Members of the same group have the same signature
    private function get_signatures(database $dbase, string $signature, string /*sql*/ $members):array/*<signature>*/{
        //
        //Summarise the re-directs to get the members to be merged. They have 
        //the following shape:
        //Array<{signature?:Array<value>, members:Array<pk>}> 
        //where value is that of a shared column. The set of shared clumns 
        //define the identity of members to merge to a joint principal. It is a
        //signature
        $sql = $dbase->chk(
            "Select "
                //The siganture's id
                . "signature "
            . "from "
                //
                //The members to merge
                . "($members) as member "
             //
            . "group by "
                //
                //Use the signature to summarise
                . "$signature "
            //
            //Only cases where a signature has more than one member
            //are considered
            ."having count(member)>1"
        );
        //
        //Execute the query and return the desired data
        $rows = $dbase->get_sql_data($sql);
        //
        //Simplify the signatures to a simple string array, and return
        return array_map(fn($row)=>$row['signature'], $rows);
    }
}   