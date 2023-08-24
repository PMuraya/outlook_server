<?php
namespace mutall;

//This is where the schema structural database is defined with 
//entities and columns 
include_once 'schema.php';

//The class is used to support the selection of one record of an entity.
//It is a type of select sql that retrieves all the id columns of an entity 
//with all the foreign columns  resolved to their friendly values.
class selector extends view{
    //
    //The source of the sql that drives the "from clause" for the view and it 
    //also serves as the source of this class's identifier network 
    protected table $source;
    //
    function __construct(
         //
         //The name of the entity that is the base of the selector
        string $ename, 
        //
        //The name of the database where the entity is located
        string $dbname,
        //
        //The friendly column separator
       string $separator='/',
       //
       //Indicates if the friendly component parts are verbose or not
       //By deault they are verbose. For instance: '23-chic/Chic join bar' is
       //is verbose. 'chic' is not      
       bool $is_verbose=true     
    ){
        //
        //Save the properties
        $this->separator=$separator;
        $this->dbname=$dbname;
        $this->ename=$ename;
        $this->is_verbose = $is_verbose;
        //
        //The name of this selector query is the same as that of the source 
        //entity with a selector suffix 
        $this->name =$ename.'_selector';
        //
        //Get the source entity
        $dbase = $this->open_dbase($dbname);
        $this->source= $dbase->entities[$ename];
        //
        //Prepare the query/view constructor variables $columns and $join; they 
        //are critical for converting a selector to an sql string.
        //
        //1. Start with the join, as the columns can be derived from it.
        //
        //The network of join paths for a selector can be constructed by executing
        //an identifier network.
        //
        //Create an identifier network; its source is the same as that of this 
        //selector.
        $network = new identifier($this->source);
        //
        //Create a new join from the paths of the identifier network  
        $join = new join($network->paths);
        //
        //2. Derive the fields of selector. They are 2: the primary key 
        //column and the its friendly component.
        $columns = [
            //
            //This is required for linking the selector view to the relational 
            //network
            new field($this, $this->name, $this->source->pk()),
            //
            //The friendly name comprising of the identification attributes of 
            //this view's joint. Verbosity referes to parts that make up this
            //name
            $this->get_friend($join)
        ];
        //
        //The 'where' clause is omitted to allow us to modify the resulting
        //sql statement depending on further need, e.g., adding offset, 
        //filtering, sorting, etc.
        parent::__construct($this->source, $columns, $join, $this->name);
    }
    
    //Friend is the column named friend__. It must be set
    function friend():column{
        //
        //Ensure that it is set
        if (!isset($this->columns['friend__'])) 
            throw new Exception("No friend column found in view $this->name");
        //
        return $this->columns['friend__'];
    }


    //Returns the concat function, as field, used for implemneting the friendly 
    //name colum of this selector's entity.
    private function get_friend(join $join):field{
        //
        //Let  the field name of the friendly column be simply 'friend__', just
        //to be safe in case friend is a valid column of the source entity
        $fname = "friend__";
        //
        //Define a separator expression
         $sep= new scalar($this->separator);
        //
        //Formulate the concat_ws expression. The first argument is the separator
        //followed by parts to join
        $exp = new function_('concat_ws', [$sep, ...$this->get_friendly_part($join)]);
        //
        //Define the column of type field
        $field = new field($this, $fname, $exp);
        //
        //Return the field
        return $field;
    }

    //Yield all the parts of a friendly column, given the join that is used for
    //formulating this query. Each part is derived from an identifier attributes
    //that make up the entities partcipating in the join.
    function get_friendly_part(join $join):\Generator/*<column>*/{
        //
        //A join has joints, which is an order indexed list, i.e., map of joints
        //The values are the joints collection
        $joints = $join->joints->values()->toArray();
        //
        //Get the entities, i.e., bases, taking part in the joints
        $entities = array_map(fn($joint)=>$joint->base, $joints);
        //
        //Loop through all the join entities, including the source of this
        //query 
        foreach([$this->source, ...$entities] as $entity){
            //
            //Assumimg a non-verbose friend, get the column names of first index
            //of the entity 
            $cnames =array_values($entity->indices)[0];
            //
            //Loop through each one of column names and yield it if it is an 
            //attribute
            foreach($cnames as $cname){
                //
                //Retrieve the named column
                $col = $entity->columns[$cname];
                //
                //Only attributes are considered
                if ($col instanceof attribute) yield $col;
            }
        }
    }
}
//
//This class models an sql statement extends the selector one. It retrieves 
//all the columns of an entity. In particular the primary and foreign keys 
//values are accompanied by their friendly names to support editing 
//functionality.
class editor extends selector{ 
    //
    function __construct(
        //
        //This is the entity name from which we are doing the selection
        string $ename,
        //
        //The name of the database in which the entity is defined
        string $dbname
    ){
        //
        //Construct the selector query
        parent::__construct($ename, $dbname);
        //
        //Override the selector`s name, to suffix it with the 'editor'
        $this->name = $ename."_editor";
        //
        //Update the columns and joints of the underlying selector to make
        //them valid for an editor.
        $this->update_view();
    }
    
    //Update the columns and joints of the underlying (parent) selector to make
    //them valid for this editor
    private function update_view():void{
        //
        //Reset all the columns of this query to make them valid for this editor,
        //but first save the friendly field as we shall need it in a latter stage
        $friend = $this->friend(); 
        //
        //Prepare to collect all the columns of this editor
        $columns = []; 
        //
        //The first column should be the primary key; its name must be the same 
        //as that of this view
        //$columns[$this->name] = new field($this, $this-name, $this->source->pk());
        //
        //The second column is the friendly column
        //$columns[$friend->name] = $friend;
        //
        //But for this (test) version the primary key is the as that of
        //the source
        $columns[$this->source->name] = new field(
            $this, 
            $this->source->name, 
            new function_(
                'json_array', 
                [$this->source->pk(), $friend]
            )        
        );
        //
        //Guided by the columns of this query's source update its 
        //columns and joints
        foreach($this->source->columns as $col){
            //
            //Let $name to be that of this column
            $name = $col->name;
            //
            //Ignore the primary key because it was the first one handled before
            //we got into this loop
            if ($col instanceof primary) continue;
            //
            //An attribute contributes only itself
            if ($col instanceof attribute){ $columns[$name] = $col; continue; }
            //
            //All the cases below must refer to a foreign key column Ensure that
            //this is indeed the case
            if (!$col instanceof foreign) 
                throw new Exception("Column $col was expected to be a foreign key");
            //
            //All foreign keys need a selector (based on the away entity) to 
            //support friendly columns and their corresponding joints
            $selector  = new selector(
                $col->away()->name, $col->away()->dbname
            );
            //
            //Create a friendly column, NOT FIELD! so that its to_str() 
            //function is interpeted as 'selector_$name'.friend__
            $sfriend = new column(
               $selector,
               $selector->friend()->name     
            );
            //
            //Derive the json array aggregate field for this column
            $columns[$name] = new field(
                //
                //This editor is the base
                $this,
                //
                //The name of the field is the same as that of the column
                $name,
                //
                //The expression is the json array of 2 elements: the original 
                //column and the friendly component
                new function_(
                    'json_array', 
                    [$col, $sfriend]
                )
            );
            //
            //The join type depends on whether the column is a cross member or 
            //not
            $jtype = $col->is_cross_member() ? "left": "inner";
            //
            //Formulate the desired joint; it has one relation linking the 
            //foreign key column to the selector's primary key
            $link = new link($col, $selector->pk());
            $joint = new joint($selector, $jtype, [$link]);
            //
            //Add this joint to those of this editor
            $this->join->joints->put($selector->name, $joint);
        }
        //
        //Assign the collected columns to this view
        $this->columns = $columns;
    }
    
    //
    //This methods returns metadata necessary to drive the CRUD service.
    function describe():array/*[dbase, cname[], sql, max_records]*/{
        //
        //Get the database
        /*database*/$dbase = $this->open_dbase($this->dbname);
        //
        //Get the SIMPLE (NOT INDEXED) array of column names.This is best
        //done by looping over columns rather than mapping them. A better choice
        //is to use array_keys, assumimg the columns are indxed by their names. 
        //But this does not respect order, so, back to looping.
        $cnames=[];
        //
        foreach($this->columns as $column){
           array_push($cnames, $column->name);
        }
        //
        //
        //Ensure you use the 'from' expression, rather than the statement 
        //It has the form-: 
        //  (select....) as editor
        /*string*/$from = $this->to_str();
        //
        //Modify sql to get a count.
        $mysql = "select count(*) as records from $from";
        //
        //Run the query to get the maximum records
        //
        //Get the only record
        $rec1 = $dbase->get_sql_data($mysql)[0];
        //
        //Retrieve the count
        $max_records = $rec1['records'];
        //
        //Return the metadata.
        return [$dbase, $cnames, $this->stmt(), $max_records];
    } 
}

//This class formulates an sql given the inputs, e.g., fields, where, etc..,
//which do not reference any join. 
//The join is derived from the inputs to complete the sql. Hence the term parial.
class partial_select extends view{
   // 
   //Construct  a full sql, i.e., one with joins, from partial specifications 
   //of the from the conditions and the fields(i.e, without joins)
   function __construct(
        //
        //The base of the sql   
        entity $from, 
        //
        //Selected columns. Null means all columns from the source.    
        array $columns=null, 
        //   
        //The where clause expression   
        expression $where=null,
        //
        //Name of this partial sql   
        string $name=null   
    ){
       //
       //take care of the name since it must not be a null
       if(is_null($name)){$name="noname";}
       //
       //Construct the parent using the all the partial variables and a null 
       //join.
       parent::__construct($from, $columns, null, $where, $name);
    }
    
    //Execute this query by 
    //A. Evalauting and setting the join
    //B. Executing the parent to retrieve the data as an array
    function execute() {
        //
       //If the fields are null set them fields to the fields of the from
       //entity
       if(is_null($this->columns)){
           $this->columns= $this->get_default_fields();
       }
        //
        //A. Set the join that is required for the parent view that is derived from
        // the fit network
        //
        //compile the parameters of the fit network 
        //
        //Identitify target entities using the fields and where expressions 
        //(including other clauses that can potentially be associated with 
        //group_by, order_by, having.
        //
        //Start with an empty set
        $targets = new \Ds\Set();
        //
        //Yield all the targer entiteis of this view
        foreach($this->identify_targets() as $target){
            $targets->add($target);
        }
        //
        //Create a fit network; its source is this from using the target
        $network = new fit($this->from, $targets->toArray());
        //
        //Use the network to create a join 
        $this->join = new join($network->paths);
        //
        //Construct the fit paths using defaut settings, i.e., exceptions
        //will be thrown immediately rather than be logged)
        $this->join->execute();
        //
        //B. Now return the values from the parent execute
        return parent::execute();
    }
    
    //Compiles an array of the entities that are used in the fit network. 
    //These entities are retrieved from the fields and where clauses 
    private function identify_targets():\Generator/*$entity*/{
       //
       // 
       //Generate entities from the where clause
        if(!is_null($this->where)){
            yield from $this->wheres->yield_entity();
        }
       //
       //Loop through all the columns of this view, to generate entities from
       //each one of them
       foreach($this->columns as $col){
           //
           //only yield from the attributes and the foreign keys but not from the
           //the derived foreign of this view since it was established for 
           //linking only and hence cannot yield
           if($col instanceof foreign && $col->ename= $this->name){continue;} 
           yield from $col->yield_entity();
       }  
    }    
}

//
//Models a network of paths that are important for identifying an entity using
//attributes only, i.e., without referefnce to foreign keys. This network is 
//supports the formulaion of editor and selector views
class identifier extends network{
    //
    //
    function __construct(entity $source) {
        $strategy=new strategy_foreigner();
        parent::__construct($source, $strategy);
    }
    
    //We only utilise those foreign keys that are ids 
    function is_included(foreign $key): bool {
        //
        //return all id columns
        if($key->is_id()) return true;
        //
        return false;
    }
    
    //Returns true if the given entity does not have any foreign keys that are 
    //not cross members i.e structural foreign keys 
    function is_terminal(entity $from): bool {
        //
        //Filter the columns of the entity to remain with the foreign keys
        //that are ids
        $id_foreigners = array_filter($from->columns, fn($col)=>
             $col instanceof foreign && $col->is_id()
        );
        //
        //We are at the end of the path if the given entity has no foreign column 
        //that are id
        return count($id_foreigners)===0;
    }
}

//
//Models a network from a collection of known target entities. since it is not known 
//how the entities are related we utilise both the foreigners and the pointers 
//ie(a strategy called both see in strategy in the schema).
class fit extends network{
    //
    //The known collection of targets from which we are to get the undelying network 
    public array $targets;
    //
    //save all the visited targets in an array this is to prevent mutiple 
    //paths that are terminated by one terminal entity 
    public array $visited=[];
    //
    //To create a network we need an entity that acts as the source or origin of
    //the network see in network.
    function __construct(view $source,array /*entity[]*/$targets) {
        //
        $strategy=new strategy_both();
        //
        parent::__construct($source, $strategy);
        //
        //Initialise the targets 
        $this->targets= $targets;
    }
    
    //
    //terminate the looping if all the targets have been obtained
    function terminate(): bool {
        //
        return count(array_diff($this->targets, $this->visited))===0;
    }
//    //
//    //Yields all the paths that start from the given entity. 
//    function path_from_entity(entity $from, array/*foreigner[]*/$path):\Generator{
//        //
//        //Check if we are at the end of the path. We are if the
//        //termnal condition is satisfied
//        if ($this->is_terminal($from)){
//             //
//            //Yield teh indexed and the target name
//            yield $from->partial_name=>$path;
//        }
//        //
//        //Use the foreigner returned by executing each of the search function --
//        //depending on the current strategy
//        foreach($this->strategy->search($from) as $foreigner){
//           //
//            //For debugging, count the foreigners
//           $this->considered++;
//           //
//           //sort the foreigner to controll their order of preference  i.e 
//           //1. for the id foreigner 
//           //2. for the madatory foreigner 
//           //3.for the id pointers 
//           //4. mandatory pointers
//           //5. cross memebers 
//           //
//           //Begin with an array that has the 5 orders
//           $foreigners=[];
//           $foreigners[1]=[]; $foreigners[2]=[]; $foreigners[3]=[]; $foreigners[4]=[]; $foreigners[5]=[];
//           //
//           $this->sort_foreigners($foreigner,$foreigners);
//           //
//        }
//        //
//        //loop through the foreigners in their order of preference begigning from 
//        //the id columns as the most prefered 
//        for ($x=1;$x<=count($foreigners);$x++){
//            foreach ($foreigners[$x] as $foreigner){
//               //
//               // Consider the foreigner for the path being searched.
//               yield from $this->path_thru_foreigner($foreigner, $path); 
//            }
//        }     
//    }
//    
    //sort the foreigner to controll their order of preference  i.e 
    //1. for the id foreigner 
    //2. for the madatory foreigner 
    //3.for the id pointers 
    //4. mandatory pointers
    //5. cross memebers 
    private function sort_foreigners(foreign $col, array &$foreigners):array/*[order][foreigner]*/{
        //
        //1. for the id foreigner 
        //save the id column foreigns
        if($col->is_id() &! $col instanceof pointer){
           array_push($foreigners[1], $col);
           return $foreigners;
        }
        //2. for the madatory foreigner 
        //save the mandatory foreigners
        if(!$col->is_cross_member() &! $col instanceof pointer){
            array_push($foreigners[2], $col);
           return $foreigners;
        }
        //
        //3.for the id pointers 
        //save the mandatory pointers
        if($col->is_id() && $col instanceof pointer){
           array_push($foreigners[3], $col);
           return $foreigners;
        }
        //
        //4. mandatory pointers
        if(!$col->is_cross_member() && $col instanceof pointer){
           array_push($foreigners[4], $col);
           return $foreigners;
        }
        //
        //return the optional order 
        $foreigners[5][]=$col;
        return $foreigners;
    }

    //A path in the fit network comes to an end when the given entity is among the 
    //targets
    function is_terminal(entity $entity): bool {
        //
        if(in_array($entity, $this->targets)){
           //
           //return a false this entity was visited to prevent mutiple paths of 
           //a similar destination
           if(in_array($entity, $this->visited)){
               //
               return false;
           }
           //
           //save the visited
           array_push($this->visited, $entity);
           return true; 
        }
        //
        //return a false  if this etity is not among the targets
        return false;
    }
    //
    //exclude all the heirachial relationships
    function is_excluded(foreign $key): bool {
        //
        //exclude the heirachy 
        $status= $key->is_hierarchical();
        return $status;
    }


    //In a target fitting network, it is an error if a path was not found to a 
    //required target
    function verify_integrity(bool $throw_exception=true){
        //
        //Loop throu every target and report those that are not set
        foreach($this->targets as $target){
            //
            //The partial name of an entity should include the database (to take
            //care of multi-dataase situations)
            if (!isset($this->path[$target->partial_name])){
                //
                //Formulate teh error message
                $msg = "No path was found for target $target->partial_name";
                //
                if (!$throw_exception){
                    throw new \Exception($msg);
                }else{
                    $this->errors[]=$msg;
                }
            }
        }
    }
}

//The save network is needed to support indirect saving of foreign keys to a
//database during data capture. Its behaviour is similar to that of a fit
//The difference is :-
//a) in the constructor 
//b) the way we define interigity. In a fit the network has integrity when all 
//the targets are met; which is not the case with a fit.
//c) exclusion of the subject forein key fo which saving is required
class save extends network{
    //
    //The foreign key for which indirect saving support is needed
    public foreigner $subject;
    //
    //The pot is the 4 dimensional array of expressions used for capturing
    //data to a databse
    public array /*expression[dbname][ename][alias][cname]*/$pot;
    //
    //The alias to be asociated with the save process (of the foreigner)
    public \Ds\Map $alias;
    //
    //The target of a save path is a entity/pairmarykey pair that is indexd by by
    //the entties partial name. The paimary key is used for formulating where 
    //clause of a selection query.
    public array /*[entity, primarykey][partial_name]*/ $target;
    //
    function __construct(foreigner $subject, \Ds\map $alias, array /*exp[dbname]..[cname]*/$pot){
        //
        $this->subjcet = $subject;
        $this->pot = $pot;
        $this->alias = $alias;
        //
        //The starting entity for the network is the away version of the subject
        $from = $subject->away();
        //
        //Use the pot to collect entities for initializing teh parent fit
        //
        //Search the network paths using the bth the foreigners and pointers strategy.
        parent::__construct($from, network::both);
    }
    
    //A foreign key save network path comes to an end when the given entity 
    //(partial name) matches that of a target
    function is_terminal(entity $entity):bool{
        //
        return array_key_exists($entity->partial_name, $this->targets);
    }
    
    //Exclude the subject foreigner from all the save paths. Also do no 
    //include hose foreigners that pouint to referenced entoties that are for 
    //reportng puprpses
    function is_excluded(foreign $key):bool{
        //
        if ($key===$this->target) {return true;}
        //
        //Exclude foreign key fields whose away entities are used for reporting
        if ($key->away()->reporting()){ return true;} 
        //
        //Return the gerenaralized exclude
        return $this->is_exclude($key);
    }
    
    //Execute the save networtwork, first by using the pot to set the targets;
    //then excecuting the generalized version
    function execute(bool $throw_exception=true){
        //
        //Set the path targets if necessary.
        if (!isset($this->targets)) {
            //
            //Use the pot to collect the target entities of this network
            $this->targets =[];
            //
            foreach($this->collect_targets($this->pot) as $partial_name=>$target){
                $this->targets[$partial_name]= $target;
            }
        }    
        //
        //Now set the paths;
        parent::execute($throw_exception());
    }
    
    //Collect all the entities from the given pot, accompanied by their primary 
    //key values.
    protected function collect_targets(array $pot):\Generator{
        //
        //Visit all the dataases refereced by the pot
        foreach($pot as $dbname=>$entities){
            //
            //Open the database
             $dbase = $this->open_dbase($dbname);
            //
            //Loop through the entity names in the pot
            foreach(aray_keys($entities) as $ename){
                //
                //Get the namd entity from teh dtaase
                $entity = $dbase->entities[$ename];
                //
                //Check if the primary key of this aliased entity is set
                //
                //Only tose cases for which we have a primry key is considered
                if (isset($pot[$dbname][$ename][$this->alias][$ename])){
                    //
                    //Get teh primary key value
                    $primarykey = $pot[$dbname][$ename][$this->alias][$ename];
                    //
                    //Return a pair indexed by the entities partial name.
                    yield $entity->partial_name =>[$entity, $primarykey];
                }
            } 
        }
    }
}
 
//This class models the join clause of an sql staement. It has the following 
//shape:-
//  inner join $ename1 on <onclause1>
//  inner join $ename2 on <onclause2>
//  ...
//  inner join $enameI on <onclaseI>
//  ...
//  inner join $enameN on <onclauseN>
//The i'th part of a join is modeleld as a joint. 
//You must exceute a join in order for the joints to be constructed.
class join extends mutall{
    //
    //The ordered list of join targets indexed by the partial entity, pename. 
    //This list is constructed when a join is executed.
    public \Ds\Map /*<pename, joint>*/$joints;
    //
    //Paths is a double array of foreigners.
    function __construct(array /*Array<Array<foreigner>>*/ $paths) {
        //
        parent::__construct();
        //
        //Initialize the joins
        $this->joints = new \Ds\Map();
        //
        //Use the paths to populate the joints
        $this->build_joints($paths);
    }
   
    //Use the given double array of paths to build the join clause
    private function build_joints(array /*Array<Array<foreigner>>*/ $paths){     
        //
        //Visit each input path and use it to build the joints
        foreach(array_values($paths) as $path){
            //
            //Visit each foreigner in the path and use it to build the joints
            //The ordinal position of the link in  the path is the joint's 
            //dependency.
            foreach(array_values($path) as $position =>$foreigner){
                //
                //Add the join descendants, i.e., links and positions
                $this->add_descendants($foreigner, $position);  
            }
        }
    }
    
    //Add the join's descendants following the relational join model. They
    //are:-joint, link, and position. We assume that the joints are made 
    //of foreign key columns only.
    public function add_descendants(
        //
        //The foreign key link to be added
        foreign $link, 
        //
        //The ordinal position of the foreign key in the path, a.k.a., dependency    
        int $position
    ): void{
        //
        //Get the base entity of the joint to be considered
        $entity = $link->away();
        //
        //Get the partial name of the entity  which is required as 
        //the base of a new or existing joint.
        $pename = $entity->partial_name;
        //
        //Add the JOINT descendant, if it does not exist
        if (!$this->joints->hasKey($pename)){
            //
            //The default join is an inner join
            $joint = new joint($entity);
            //
            //Set the initial joint's position.
            $joint->position=$position;
            //
            //Attach the joint to this joins
            $this->joints[$pename] = $joint;
        }else{
            //Otherwise get the existing joint.
            //
            //The joint exists. Use the partial ename key to get it
            $joint= $this->joints[$pename];
            //
            //Update the joint's position if necessary.
            if($position>$joint->position) $joint->position = $position;
            //
        }    
        //
        //Add the LINK descendant unconditionally. These set domain will remove
        //duplicates
        $joint->links->add($link);
    }
    
    //Returns a complete join clause, i.e., 'inner join $target1 on a.b=b.b and ...'
    function stmt() :string/*join clause*/{
        //
        //Convert joints map to an array, so that we can use the standard 
        //array methods for procssing it.
        $joints = $this->joints->toArray();
        //
        //Test if this array is empty; If it is then the sql does not 
        //require the joins clause
        if(count($joints)===0){return "";}
        //
        //Order the targets by ascending dependency and ensure 
        //that the indexing keys are maintained.
        $ok=uasort($joints, fn($a, $b)=>$a->position<=>$b->position);
        //
        //Check whether the sorting was successful or not 
        if(!$ok)throw new Exception("Sorting of joints failed failed");  
        //
        //Map each field to its sql string version 
        $joins_str=array_map(fn($target)=>$target->stmt(), $joints);
        //
        //Join the fields strings using a new line separator
        return implode("\n", $joins_str);
    }
}

//A joint is a mutall object characterised by a target entity, a.k.a., base, 
//participating in a join clause. It has the following shape:-
//...inner join $base on <Link Clause>
class joint extends mutall{
    //
    //The target entity of this joint
    public entity $base;
    //
    //The links associated with this joint, independent of the path. They
    //are modelled as set to avoid duplicates
    public \Ds\Set /*<link>*/ $links;
    //
    //The highest position of this joint in any path, a.k.a., dependency
    //Using it, the bases in a join clause will be correctly ordered.
    //Set the default position to 0, to avoid errors of initilaization even when
    //position is not important
    public int $position=0;
    //
    //The type of the join for this target, e.g., inner or left or right join
    public string $jtype;
    //
    function  __construct(
        //    
        //The target entity
        entity $base,
        //
        //The default type of a join is the inner version    
        string $jtype='inner',
        //
        //Initial links of this joint; the default ie empty
        array /*<link>*/$links=[]    
    ){
        parent::__construct();
        //
        $this->base = $base;
        $this->jtype = $jtype;
        //
        //Initialize the link set
        $this->links = new \Ds\Set($links);
    }
    
    //Returns a complete join phrase in the format:-
    //$inner join $ename on $a.$b = $b.$b
    function stmt() :string{
         //
         //The  type of the join, e.g., inner join, left join
         $join_str = "$this->jtype join"
            //
            //Add the On clause
            . " \t {$this->base->to_str()} ON  {$this->on_str()}";
        //    
        return $join_str;
     }
     
     //Compile part of the ON clause, i.e.,  x.a.d = y.d.d and c.d=d.d and ....
     private function on_str(): string{
        //
        //Map each link to an equation string
        $on_strs = array_map(
           fn($link)=>$link->on_str(), 
           $this->links->toArray()
        );
         //
         //Join the equations with the 'and' operator
         return implode(" \n AND ",$on_strs);
     }
}

//The criteria in which data affected will be accessed the link to a particular 
//record that returns a boolean value as a true or a false????  
class binary extends mutall implements expression{
    //
    //The column involved in the where 
    public $operand1;
    //
    //The va
    public $operand2;
    //
    //the operator eg =, +_ \
    public $operator;
            
    function __construct(expression $operand1, $operator , expression $operand2) {
        //
        //Set the two fields as the properties of the class 
        $this->operand1= $operand1;
        $this->operand2=$operand2;
        $this->operator=$operator;
        //
        parent::__construct();
    }
    //
    //This method stringfies a binary expression
    function to_str() : string{
        //
        $op1 = $this->operand1->to_str();
        $op2 = $this->operand2->to_str();
        //
        //Note opending and closing brackets to bind the two operands very closly
        return "($op1 $this->operator $op2)";
    }
    
    //Yields the entities that are involed in this binary expression.
    function yield_entity(): \Generator{
        yield from $this->operand1->yield_entity()();
        yield from $this->operand2->yield_entity();
    }
    //
    //Yields the attributes that are involed in this binary expression.
    function yield_attribute(): \Generator{
        yield from $this->operand1->yield_attribute()();
        yield from $this->operand2->yield_attribute();
    }
}
