//Describes the entiy names in so to maintain my code local vocabularies as 
//derived from php
export type ename = string;
//
//The database name 
export type dbname=string;
//
//These are the custom datatype for the column name to maintain a semantic meaning to my code 
export type cname=string;

//
//The actual value being sent to the server or received from a server. NB. 
//Error is not a basic value; we would never write to a database
export type basic_value = boolean|number|string|null;

//Let fuel be the data type that describes a record derived from an sql statement.
export type fuel = {[index:string]:basic_value};

//
//The types of columns available in this file
type col_type="attribute"|"primary"|"foreign"| "field";

//
//The name-indexed databases accessible through this schema. This typically
//comprises of the mutall_users database and any other database opened by
//an application.
export const databases:{[index:string]:database} = {};

//
//Modelling special mutall objects that are associated with a database schema.
//Database, entity, index and column extends this class. Its main characterstic
//is that it has an orgainzed error handling mechanism.
export class schema{
    //
    //The partial name is the unique identifier of this schema object; it aids in 
    //xml logging and also in saving of this schema in an array since this name  
    //is mostly used as an index
    partial_name:string;
    //
    //Error logging is one of the major features of this schema with its ability 
    //to bash?? its own error which affects the display of this schema (im metavisuo)
    errors:Array<Error>;
    //
    //Define a globally accessible application url for supporting the working of
    //PHP class autoloaders.
    //The url enables us to identify the starting folder for searching for 
    //PHP classes.
    public static app_url:string;
    //
    //To create a schema we require a unique identification also called a partial 
    //name described above. The default is no name
    constructor(partial_name:string='unnamed'){
        //
        //The unique identification of this schema 
        this.partial_name= partial_name;
        //
        //A collection of the errors saved inform of an array for further buffered for 
        //latter reporting. note these are the mojor causes for a schema object to be 
        //represented using a red color 
        this.errors=[];
    }
    //
    //Displays the error in this schema object in a div element that can be appended 
    //as a node where required. Is this for metavisio support? 
    display_errors():HTMLDivElement{
        //
        //create a div where to append the errors with an id of errors 
        const div = document.createElement('div');
        div.setAttribute("id","errors");
        //
        //add the title of this error reportin as this partial name has count no
        // of error
        const title= document.createElement('h2');
        title.textContent=`<u><b>This shema ${this.partial_name} has ${this.errors.length} not compliant 
                           with the mutall framework </u></b>`;
        div.appendChild(title);
        //
        //loop through each of the errors appending their text content to the div 
        this.errors.forEach(function(error){
           //
           const msg= document.createElement("label");
           msg.textContent=error.message;
           div.appendChild(msg);
        });
        //
        return div;
    }
    //
    //Activates static error objects retrieved from php to js errors for further 
    //altering of the display in this this schema 
    activate_errors(static_errors:object){
        //
        for (const err in static_errors) {
           const erro= new Error(err);
           //
           //offload any additional information eg the additional information
           Object.assign(erro, err);
           //
           //Add these errors to the error collection 
           this.errors.push(erro);
        }
    } 
    
}
//
//This class extends the normal Javascript error object by 
//alerting the user before logging the same to the console.
export class mutall_error extends Error{
    //
    //Every error has an error message. The extra information is optional. If
    //present, it is displayed in the console log, and the user is alerted to this
    //effect. Typically, the extra is a a complex object, where we can use the 
    //console log to inspect it.
    constructor(msg:string, extra?:any){
        //
        //Create the parent error object
        super(msg);
        //
        //If the extra is available, console log it
        if (extra!==undefined) console.log(extra);
        //
        //Compile the console invitation
        const invitation = extra===undefined ? "": 'See the console.log for further details'
        //
        //Alert the user with the error message, expanded with console invitation 
        alert(`${msg}\n${invitation}`);
    }
}
//
//Represents the php version of the database, i.e (static_dbase). These is inorder
//to solve the datatype error required for the creation of the database
export interface Idatabase {
    name: dbname;
    //
    //The reporting string of all the errors of the database
    report:string;
    //
    //Entities/views/tables of this static database
    entities:{[index:string]:Ientity};
    //
    //Errors retrieved from php
    errors:Array<object>
}

//Is a mutall object that models a database class. Its key feature is the 
//collection of entities.
class database extends schema{
    //
    //A collection of entites for this database modeled intoa map because with 
    //an object it was difficult to test its data type 
    public entities:{[index:string]:entity};
    //
    //Databases are identified with the column name hence should be a unique string name
    //you may notice it is similar with the schema partial name but it homed here 
    //and its childern need it hence worth repeating 
    public name:string
    //
    //Construct the database from the given static database structure imported
    //from PHP
    constructor(
        //
        //The static dbase that is used to create this database it is derived from php
        //i.e the encoded version of the php database 
        public static_dbase:Idatabase
    ){
        //
        //Initialize the parent so that we can access 'this' object
        super(static_dbase.name);
        //
        //Offload all the properties in the static structure o this new database
        Object.assign(this, static_dbase);
        //
        //Activate the entities so as to initialize the map 
        this.entities=this.activate_entities();
        //
        //activate any errors if any 
        this.activate_errors(static_dbase.errors);
        //
        //initialize the name of the database 
        this.name=static_dbase.name;
        //
        //Register the database to global collection of databases
        databases[this.name] = this;
    }
    //
    //Activate the static entities collection of entities  as entities in a map with 
    //string enames as the keys and the activated entity as the value returninig a map
    //which activates this entities
    activate_entities(): {}{
        //
        //start with an empty map
        const entities :{[index:string]:entity}= {};
        //
        //Loop through all the static entities and activate each one of them setting it in
        //the object entities indexed by thr 
        for(let ename in this.static_dbase.entities){          
            //
            //Create the active entity, passing this database as the parent
            let active_entity = new entity(this, ename);
            //
            //Replace the static with the active entity
            entities[active_entity.name] = active_entity;
        }
        //
        //Return the entities of this database
        return entities;
    }  
    //
    //Returns the entity if is found; otherwise it throws an exception
    get_entity(ename: ename): entity {
        //
        //Get the entity from the collection of entities in the map
        //used the $entity so as not to conflict with the class entity 
        const Entity = this.entities[ename];
        //
        //Take care of the undeefined situations by throwing an exception
        //if the entity was not found
        if (Entity === undefined){
            //
            throw new mutall_error(`Entity ${ename} is not found`);
        }
        else{
            return Entity;
        }
    }
    // 
    //Retrive the user roles from this database. 
    //A role is an entity that has a foreign key that references the 
    //user table in mutall users database.
    //The key and value properties in the returned array represent the 
    //short and long version name of the roles.
    get_roles():Array<{name:string, value:string}>{
        //
        //Get the list of entities that are in this database
        const list = Object.values(this.entities);
        //
        //Select from the list only those entities that refer to a user.
        const interest= list.filter(Entity=>{
            //
            //Loop throuh all the columns of the entity, to see if there is any
            //that links the entity to the user. NB: Entity (in Pascal case) is 
            //a variable while entity (in Snake case) is a class name
            for(let cname in Entity.columns){
                //
                //Get the named column 
                const col = Entity.columns[cname];
                //
                //Skip this column if it is not a foreign key
                if (!(col instanceof foreign)) continue;
                //
                //The foreign key column must reference the user table in the 
                //user database; otherwise skip it. NB. This comparsion below
                //does not give the same result as col.ref === entity.user. Even
                //the loose compasrison col.ref==entity.user does not give the
                //the expected results. Hence thos lonegr version
                if (col.ref.dbname !== entity.user.dbname) continue;
                if (col.ref.ename!== entity.user.ename) continue;
                
                //
                //The parent entity must be be serving the role function. D no more
                return true;            }
            //
            //The entity cannot be a role one
            return false;
        });
        //
        //Map the entities of interest into outlook choices pairs.
        const roles= interest.map(entity=>{
            //
            //Get teh name element
            const name = entity.name;
            //
            //Return the complete role structure
            return {name, value:name};
        });
        
        return roles;   
    }
      
}
//
//The static entity that is directly derived from php required to form php
//The entity before activation 
export interface Ientity{
    //
    //In php an entity is defined by the ename and the dbname
    name:ename;
    dbname:dbname;
    //
    //The class name of this entity
    class_name:"view"|"entity"|"table"|"alien";
    //
    //The metadata of the entity 
    comment:string
    //
    //The dependency
    depth?:number;
    //
    //The error derived from php
    errors:Array<{message:string}>;
    //
    indices?:{[index:string]:index};
    //
    //The columns/fields of this entity
    columns: { [index: string]: Icolumn };
}

//
//This is the matadata that is required for an entity to be presented.
//it includes the cx, cy, visibility, purpose. They are originally stored in the 
//coment but this will soon change to catter for the views and the aliens
//NB the purpose and the visibility can be null
interface entity_metadata{
    cx:number
    cy:number
    purpose?:string
    visibility?:boolean
    color:string
}
//
//An index is just a list of olumn names that uniquely idenity an entity
type index = Array<cname>;
   
//An entity is a mutall object that models the table of a relational database
class entity extends schema{
    //
    //Every entity has a collection of column inmplemented as maps to ensure type integrity
    //since js does not support the indexed arrays and yet columns are identified using their 
    //names.
    //This property is optional because some of the entities eg view i.e selectors do not have 
    //columns in their construction  
    columns:{[index:string]:attribute|foreign|primary};
    // 
    //The long version of a name that is set from this entity's comment 
    public title?: string;
    //
    //Every entity is identified uniquely by a name 
    name:ename;
    //
    //Define the sql used for uniquely identifying a record of this entity
    //in a friendly way. The result of this sql is used for driving a record
    //selector. The sql is derived when needed. 
     id_sql_?:string;
     //
    //Defne the identification index fields in terms of column objects. This
    //cannot be done at concstruction time (becase the order of building 
    //datbaase.entities is not guranteed to follow dependency). Hense the 
    //use of a getter
    ids_?:Array<primary|foreign|attribute>;
    //
    //static object of the indices that are used to activate the ids. NB. PHP 
    //indexed arraya are converted to javascript objects.
    indices?:{[index:string]:index};
    //
    //the depth of this entity as derived from php
    depth?:number;
    //
    //The goup tag that holds the html of this entity including the attributes 
    group:HTMLElement;
    
    //A reference to the user database (that is shared by all databases in this 
    //server)
    static user:subject = {dbname:'mutall_users', ename:'user'};
    //
    //Store the static/inert version of this entity here
    public static_entity:Ientity;
    //
    //Construct an entity using:-
    //a) the database to be its parent through a has-a relationship
    //b) the name of the entity in the database
    constructor(
        //
        //The parent of this entity which is the database establishing the reverse 
        //connection from the entity to its parent. it is protected to allow this 
        //entity to be json encoded. Find out if this makes any diference in js 
        //The datatype of this parent is a database since an entity can only have 
        //a database origin
        public dbase: database,
        //
        //The name of the entity
        name:string
    ) {
        //Initialize the parent so thate we can access 'this' object
        super(`${dbase.name}.${name}`);
        //
        //
        //The static structure from which this entity is formulated. it is mostly derived 
        //from php. It is of type any since it is a object
        const static_entity: Ientity =this.static_entity= dbase.static_dbase.entities[name];
        //
        //unique name of this entity 
        this.name=name;
        //
        //Offload the properties of the static structure (including the name)
        Object.assign(this, static_entity);
        //
        //Use the static data to derive javascript column objects as a map 
        this.columns = this.activate_columns();
        //
        this.depth=static_entity.depth;
        //
        //activate any imported errors
        this.activate_errors(static_entity.errors);
        //
        //initialize the indices 
        this.indices=static_entity.indices;
        //
        //initialize the sqv group element for presentation purpses
        this.group=document.createElement('g');
    }    
    //Activate the columns of this entity where the filds are treated just like 
    //attributes for display
    activate_columns(): {}{
        //
        //Begin with an empty map collection
        let columns:{[index:string]:foreign|attribute|primary}={};
        //
        //Loop through all the static columns and activate each of them
        for(let cname in this.static_entity.columns ){
            //
            //Get the static column
            let static_column:Icolumn = this.static_entity.columns[cname];
            //
            //Define a dynamic column
            let dynamic_column:primary|attribute| foreign;
            //
            switch(static_column.class_name){
                //
                case "primary": 
                    dynamic_column = new primary(this, static_column);
                    columns[static_column.name]=dynamic_column;
                    break;
                case "attribute": 
                    dynamic_column = new attribute(this, static_column);
                    columns[static_column.name]=dynamic_column;
                    break;
                case "foreign":
                    dynamic_column = new foreign(this, static_column);
                    columns[static_column.name]=dynamic_column;
                    break;
                case "field": 
                    dynamic_column = new attribute(this, static_column);
                    columns[static_column.name]=dynamic_column;
                    break;
                default:
                    throw new mutall_error(`Unknown column type 
                    '${static_column.class_name}' for ${this.name}.${static_column.name}`)

            }
            
        }
        return columns;
    }
    
    
    //Returns the named column of this entity; otherwise it cratches
    get_col(cname:cname):column{
        //
        //Retrieve the named column
        const col = this.columns[cname];
        //
        //Report eror if column not found
        if (col===undefined) 
            throw  new mutall_error(`Column ${this}.${cname} is not found`);
        //
        return col;        
    }    
    
    //Defines the identification columns for this entity as an array of columns this 
    //process can not be done durring the creation of the entity since we are not sure 
    //about the if thses column are set. hence this function is a getter  
    get ids():Array<primary|foreign|attribute>|undefined{
        //
        //Return a copy if the ides are already avaible
        if (this.ids_!==undefined) return this.ids_;
        //
        //Define ids from first principles
        //
        //Use the first index of this entity. The static index imported from 
        //the server has the following format:-
        //{ixname1:[fname1, ...], ixname1:[....], ...} 
        //We cont know the name of the first index, so we cannot access directly
        //Convert the indices to an array, ignoring the keys as index name is 
        //not important; then pick the first set of index fields
        if (this.indices === undefined) { return undefined; }
        //
        const fnames:index= this.indices[0];
        //
        //If there are no indexes save the ids to null and return the null
        if(fnames.length===0){return undefined;}
        //
        //Activate these indexes to those from the static object structure to the 
        //id datatype that is required in javascript 
        // 
        //begin with an empty array
        let ids: Array<primary | foreign | attribute> = [];
        // 
        //
        fnames.forEach(name=>{
            //
            //Get the column of this index
           const col= this.columns[name];
           if (col === undefined) { }
           else{ ids.push(col)} 
        });
        return ids;
    }
    
     //Returns the relational dependency of this entity based on foreign keys
    get dependency():number|undefined{
        //
        //Test if we already know the dependency. If we do just return it...
        if (this.depth!==undefined) return this.depth;
        //
        //only continue if there are no errors 
        if(this.errors.length>0){return undefined}
    
        //...otherwise calculate it from 1st principles.
        //
        //Destructure the identification indices. They have the following format:-
        //[{[xname]:[...ixcnames]}, ...]
        //Get the foreign key column names used for identification.
        //
        //we can not get the ddependecy of an entity if the entity has no ids 
        if(this.ids===undefined){return undefined;}
         //
         //filter the id columns that are foreigners
         let columns:Array<foreign>=[];
         this.ids.forEach(col =>{if(col instanceof foreign){columns.push(col);}});
        //
        //Test if there are no foreign key columns, return 0.
        if(columns.length === 0){
            return 0;
        }
        else{
            //Map cname's entity with its dependency. 
            const dependencies = columns.map(column=>{
                //
                //Get the referenced entity name
                const ename = column.ref.ename;
                //
                //Get the actual entity
                const entity = this.dbase.get_entity(ename);
                //
                //Get the referenced entity's dependency.
                return entity.dependency;
            });
            //
            //remove the nulls
            const valids=<Array<number>>dependencies.filter(dep=>{return dep !==null})
            //
            //Get the foreign key entity with the maximum dependency, x.
            const max_dependency = Math.max(...valids);
            //
            //Set the dependency
            this.depth=max_dependency;
        }
        //
        //The dependency to return is x+1
        return this.depth;
    }
    
    //The toString() method of an entity returnsthe fully spcified, fully quoted name, fit
    //for partcipatin in an sql. E.g., `mutall_users`.`intern`
    toString(){
        return '`'+this.dbase.name+'`' + "." + '`'+this.name+'`';
    }
    
    //Collect pointers to this entity from all the available databases
    *collect_pointers():Generator<foreign>{
        //
        //For each registered database....
        for(const dbname in databases){
            //
            //Get the nameed database
            const dbase = databases[dbname];
            //
            //Loop through all the entity (names) of the database
            for(const ename in dbase.entities){
                //
                //Loop through all the columns of entity
                for(const cname in dbase.entities[ename].columns){
                    //
                    //Get the named column
                    const col = dbase.entities[ename].columns[cname];
                    //
                    //Only foreign keys are considered
                    if (!(col instanceof foreign)) continue;
                    //
                    //The column's reference must match the given subject
                    if (col.ref.dbname !== this.dbase.name) continue;
                    if (col.ref.ename !== this.name) continue;
                    //
                    //Collect this column
                    yield col;
                }
            }
        } 
    }

}
//
//The structure of the static column 
interface Icolumn{
    //
    //a column in php is identified by the name, ename, dbname 
    name:cname;
    ename:ename;
    dbname:dbname;
    //
    //The columns in php can either be of type 
    class_name:col_type;
    //
    //Errors resolved in a column
    errors:Array<object>
}

//Modelling the column of a table. This is an absract class. 
class column extends schema{
    //
    //Every column if identified by a string name
    name:string;
    //
    //Every column has a parent entity 
    entity:entity;
    //
    //The static php structure used to construct this column
    static_column: any;
    //
    //Boolean that tests if this column is primary 
    is_primary: boolean;
    // 
    //This is the descriptive name of this column 
    //derived from the comment 
    public title?: string;
    //
    //Html used to display this column in a label format
    view:HTMLElement;
    //
    //The construction details of the column includes the following
    //That are derived from the information schema  and assigned 
    //to this column;- 
    //
    //Metadata container for this column is stored as a structure (i.e., it
    //is not offloaded) since we require to access it in its original form
    public comment?:string;
    //
    //The database default value for this column 
    public default?: string;
    //
    //The acceptable datatype for this column e.g the text, number, autonumber etc 
    public data_type?: string;
    //
    //Determines if this column is optional or not.  if nullable, i.e., optional 
    //the value is "YES"; if mandatory, i.e., not nullable, the value is 
    //"NO"
    public is_nullable?: string;
    // 
    //The maximum character length
    public length?: number;  
    //
    //The column type holds data that is important for extracting the choices
    //of an enumerated type
    public type?: string; 
    // 
    //The following properties are assigned from the comments  field;
    // 
    //This property is assigned for read only columns 
    public read_only?: boolean;
    // 
    //A comment for tagging columns that are urls.
    public url? :string;
    //
    //These are the multiple choice options as an array of key value 
    //pairs. 
    public select?: Array<[string, string]>
    //
    //The value of a column is set when an entoty is opened. See questionnairs
    public value:basic_value = null;
    
    //
    //The class constructor that has entity parent and the json data input 
    //needed for defining it. Typically this will have come from a server.
    constructor(parent:entity, static_column:any){
        //
        //Initialize the parent so that we can access 'this' object
        super(`${parent.dbase.name}.${parent.name}.${static_column.name}`);
        //
        //Offload the stataic column properties to this column
        Object.assign(this, static_column);
        //
        this.entity = parent;
        this.static_column=static_column;
        this.name=static_column.name;
        //
        //Primary kys are speial; we neeed to identify thm. By default a column
        //is not a primary key
        this.is_primary = false;
        //
        //Html used to display this column in a label format
        this.view=document.createElement('label');
    }
    
    //Returns true if this column is used by any identification index; 
    //otherwise it returns false. Identification columns are part of what is
    //known as structural columns.
    is_id(): boolean {
        //
        //Get the indices of the parent entity 
        const indices: {[index:string]:index} = this.entity.indices!;
        //
        //Test if this column is used as an 
        //index. 
        for(const name in indices) {
            //
            //Get the named index
            const cnames:Array<cname> = indices[name];
            //
            //An index consists of column names. 
            if (cnames.includes(this.name)) return true;
        }
        //This column is not used for identification
        return false;
    }
    
    //The string version of a column is used for suppotring sql expressions
    toString():string{
        //
        //Databasename quoted with backticks
        const dbname = '`'+this.entity.dbase.name+'`';
        //
        //Backtik quoted entity name
        const ename = '`'+this.entity.name + '`';
        //
        //The backkicked column name;
        const cname = '`'+ this.name + '`';
        //
        return `${dbname}.${ename}.${cname}`;
    }
        
}

//Modelling the non user-inputable primary key field
class primary extends column{
    //
    //The class contructor must contain the name, the parent entity and the
    // data (json) input 
    constructor(parent:entity, data:any){
        //
        //The parent colum constructor
        super(parent, data);
        //
        //This is a primary key; we need to specially identify it.
        this.is_primary = true;
    }
    
    //
    //
    //popilates the td required for creation of data as a button with an event listener 
    create_td():HTMLElement{
        //
        //Create the td to be returned
        const td= document.createElement('td');
        //
        //Set the attributes
        td.setAttribute("name", `${this.name}`);
        td.setAttribute("type", `primary`);
        td.textContent=``;
        //
        return td;
    }
    
}

//Subject is a reference to a table name in a named database
export interface subject {
    //
    //The entity/table name
    ename:string,
    //
    //The database name
    dbname:string
}

//Modellig foreign key field as an inputabble column.
class foreign extends column{
    //
    //The reference that shows the relation data of the foreign key. It comprises
    //of the referenced database and table names
    ref:subject;
    //
    //Construct a foreign key field using :-
    //a) the parent entity to allow navigation through has-a hierarchy
    //b) the static (data) object containing field/value, typically obtained
    //from the server side scriptig using e.g., PHP.
    constructor(parent:entity, data:any){
        //
        //Save the parent entity and the column properties
        super(parent, data);
        //
        //Extract the reference details from the static data
        this.ref = {
            ename:this.static_column.ref.table_name,
            dbname:this.static_column.ref.db_name
        }; 
    }
    
    //
    //Returns the type of this relation as either a has_a or an is_a inorder to 
    //present differently using diferent blue for is_a and black for has_a
    get_type(){
       //
       //Test if the type is undefined 
       //if undefined set the default type as undefined 
       if(this.static_column.comment.type===undefined || this.static_column.comment.type===null){
           //
           //set the default value 
           const type= 'has_a';
           return type;
       }
       //
       //There is a type by the user return the type
       else{
           const type= this.static_column.comment.type.type;
           return type;
       }
    }
           
    //The referenced entity of this relation will be determined from the 
    //referenced table name on request, hence the getter property
    get_ref_entity(){
        //
        //Let n be table name referenced by this foreign key column.
        const n = this.ref.ename;
        //
        //Return the referenced entity using the has-hierarchy
        return this.entity.dbase.entities[n];
    }
    //
    //Populates the td required for creation of data as a button with an event 
    //listener (to support metavisuo work)
    create_td():HTMLElement{
        //
        //Create the td to be returned
        const td= document.createElement('td');
        //
        //Set the inner html of this td 
        td.setAttribute('type', 'foreign');
        td.setAttribute('name', `${this.name}`);
        td.setAttribute('ref', `${this.ref.ename}`);
        td.setAttribute('id', `0`);
        td.setAttribute('title', `["0",null]`);
        td.setAttribute('onclick', `record.select_td(this)`);
        //
        //Set the text content to the name of this column 
        td.textContent=`${this.name}`;
        //
        //return the td
        return td;
    }

    //Tests if this foreign key is hierarchical or not
    is_hierarchical():boolean{
        //
        //A foreign key represents a hierarchical relationship if the reference...
        //
        return (
            //...database and the current one are the same
            this.entity.dbase.name === this.ref.dbname
            //
            //...entity and the current one are the same
            && this.entity.name === this.ref.ename
        )    
    }
    
}
    
//Its instance contains all (inputable) the columns of type attribute 
class attribute extends column{
    //
    //The column must have a name, a parent column and the data the json
    // data input 
    constructor(parent:entity, data:any){
        //
        //The parent constructor
        super(parent, data);
    }
    //
    //popilates the td required for creation of data as a button with an event listener 
    create_td(){
        //
        //Create the td to be returned
        const td= document.createElement('td');
        //
        //Set the inner html of this td 
        td.setAttribute('type', 'attribute');
        td.setAttribute('name', `${this.name}`);
        td.setAttribute('onclick', `record.select_td(this)`);
        td.innerHTML='<div contenteditable tabindex="0"></div>';             
        //
        return td;
    }   
}
//
//
export {database, entity, column, attribute, primary, foreign};