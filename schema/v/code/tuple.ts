//The tuple class "extends" an entity with data for one record/tuple. It houses
//methods that are shared by all entities, e.g., save(), fetch()
//
//To support execution of PHP-based methods
import * as server from "./server.js";
//
//References to the questiopnnaire that is the backbone of the save method()
import * as quest from "./questionnaire.js";
//
//Access to the current database
import * as schema from "./schema.js";
//
//
//The tuple class is the root of all classes derived automatically by mapping the 
//relation to the object model. It extends a schema entity
export abstract class tuple extends schema.entity{
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    public calc?:calc<tuple>;
    public checked?:checker<tuple>;
    public read?: reader<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    public written?: writer<tuple>;
    //
    //The primary key field is initialized to error 
    public pk:pk|Error=new Error('Save the data to access its prmary key');
    //
    //The foreign key columns that  drive the pointer system for this entity
    public pointers:{[cname:schema.cname]:schema.foreign}={};
    //
    //Initialize this tuple with the relevant entity schema. We can tell what
    //ename this tuple belongs to from the constructor.name. What about the name
    //of the database? Can we interrogate an instance for its parent namespace?
    //Consider passing the database name as a parameter. 
    constructor(
        //
        //Requirements for constructing a schema entity
        dbase:schema.database,
        //
        //Support for constructing pointers
        public databases:{[dbname:string]:{[ename:string]:$abstract}},

        name:string,
        //
        //The tuple's input data feed; it is undefined for a brand new tuple
        public feed?:feed<tuple>
    ){
        //Initialize the base entity class
        super(dbase, name);
        //
        //Set the pointers for this tuple
        [...this.collect_pointers()].forEach(fkcol=>this.pointers[fkcol.name]=fkcol);
        //
        //Use the given feed to populate this tuple with available data. This 
        //effectively ensures that no editable variable is null 
        this.initialize(feed);
    }

    //Use the given feed to initialize this tuple with available data. This method
    //is executed as part of the constructor, so it cannot be asynchronous.The 
    //feed, effectively allows us to have implement different ways of constructing
    //a tuple.
    initialize(feed?:feed<tuple>):void{
        //
        //If this is a brand new tuple, then we cannot go any further; the 
        //editable tuple properties retain thier initial value:null
        //getting ready.
        if (feed===undefined) return;
        //
        //Initialize the feed, depdning on its type
        switch(feed.type){
            //
            //The only known editable property that can be deduced from the feed
            //is the primary key.
            case 'primary':
                //
                //If the primary key is an error, then this fetching is illegal.
                //Perhaps you are fetching data of an unsaved record. Report the
                //error
                if (this.pk instanceof Error) throw Error;
                //
                this.pk = {value:feed.data, friend:new Error('Fetch before you can use the friend')};
                break;
            //
            //Both the primary and frendly components can be deduced from the 
            //feed's data afterfriendly string decoding the 
            case 'friend':this.pk = this.decode_pk_str(feed.data); break;
            //  
            //Convert the reader to edit data; then assign it to this tuple         
            case 'reader': 
                Object.assign(this, this.convert_reader_2_edit(feed.data)); 
                break;
            //
            //Populate this tuple using the feed data
            case 'ready': 
                Object.assign(this, feed.data);
                break;
        }
    }     

    //Fetch this tuple's  properties from a database (so that users 
    //can use it locally to do their thing) and return this tuple -- just incase 
    //we need chaining.
    //This method is particulary important for expanding foreign key values to 
    //their equivalent tuples. Only tuples created with primary and friend feed 
    //types are candidates for fetch.
    async fetch():Promise<this>{
        //
        //If this is a brand new tuple, then there is nothing to fetch from a 
        //databasewe.
        if (this.feed===undefined) return this;
        //
        //Only the primary and friendly type of feeds are suitable candidates 
        //for fetching
        switch(this.feed.type){
            //
            case 'primary':
            case 'friend': 
                //
                //If the primary key is an error, then this fetching is illegal.
                //Perhaps you are fetching data of an unsaved record. Report the
                //error
                if (this.pk instanceof Error) throw Error;
                //
                //Use the primary key value to retrieve the editable data
                const editable:edit<tuple> = await this.seek(this.pk.value);
                //
                //Transfer the editable data to this form
                Object.assign(this, editable); 
                break;
            //
            //Fetching on any other type of feed does nothing
            default:;    
        }
        //
        //Return this tuple. This unusual construct is designed to support 
        //chaining.
        return this;
    }
    
    //
    //Write this tuple to the database, returning true if successful or
    //an error message, if the process failed. 
    async save():Promise<true|Error>{
        //
        //Collect all the layouts of this entity
        const layouts: Array<quest.layout> = [...this.collect_layouts()];
        //
        //Use the layouts to write this entity the database on the server, using 
        //the (simpler) //normal method
        const result:'Ok'|string /*the error*/ = await server.exec(
            //
            //Use the questionnaire class to write the data
            'questionnaire',
            //
            //The arguments of this method are layouts
            [layouts],
            //
            //The method to use is the much simple common one 
            'load_common',
            //
            //The name of the database to use depends on the entity schema
            [this.dbase.name]
        )
        //
        //Check and return the desired result
        return result==='Ok' ? true: new Error(result);    
    }
    
    //Collect all the layouts of this entity
    *collect_layouts(): Generator<quest.layout>{
        //
        //Collect attribute base layouts
        for(const cname in this.columns){
            yield [this.dbase.name, this.name, [], cname, this.write[cname]];
        }
        //
        //Collect pointer based layoyouts
        for (const pointer in this.pointers){
            //
            //This yielding is conditional to the pointer having been fetched
            //
            //Yield the data source as a \mutall\capture table of the matrix type
            yield {class_name:'\mutall\capture\matrix', args:[tname, cnames, matrix]};
            //
            //Yield the destination labels.pointers
            //
        }
    }
    
    //
    //Get the primary key value from the given friendly/value tuple
    decode_pk_str(pk_str:string):pk{
       //
       //Decode the input string into a tuple of primary key value and its 
       //friend. Discard the frend
       const [value, friend] = JSON.parse(pk_str);
       //
       //The keys must be defined
       if ((value===undefined)||(friend===undefined))
            throw new schema.mutall_error(`String ${pk_str} is not a valid value/friend tuple`)
       //
       //The primary key must be a number
       if (typeof value!=='number')
           throw new schema.mutall_error(`The primary key value, ${value}, must be a number`);
       // 
       //return the decoded parts
       return {value, friend};        
   }
//    
//    //Return the pointers of the given subject searched from its own database only
//    private static async get_pointers(subject:schema.subject):Promise<Array<schema.foreign>>{
//        //
//        //Check if the subject's database is registered in schema databases or not
//        let dbase = schema.database.databases[subject.dbname];
//        //
//        //If it is, use it; otherwise open to register and return it.
//        if (dbase===undefined) {
//            //
//            //Get the database structure
//            const Idbase:schema.Idatabase = await server.exec(
//                'database',
//                [subject.dbname],
//                'export_structure',
//                []
//            )
//            //Create and register the database
//            dbase = new schema.database(Idbase);
//        }
//        //Return the pointers
//        return dbase.get_pointers(subject);
//    }    
//  
    
    //Use the given primary key to retrieve the desired (reader) record and 
    //return it in as an edit<tuple>
    //format
    async seek(value:number):Promise<edit<tuple>>{
        //
        //Seek scalar-based values
        const scalars: reader<tuple> = await this.seek_scalars(value);
        //
        //Convert the basic to ready
        const editable:edit<tuple> = this.convert_reader_2_edit(scalars);
        //
        //Return the result
        return editable;
    }
    
    //Read scalar-based data
    async seek_scalars(value:number):Promise<schema.fuel>{
        //
        //Use the PHP editor class to get an sql statement, fit for editing data
        const result = await server.exec(
            'editor',
            [this.name, this.dbase.name],
            'describe',
            []
        );
        //
        //The sql is the 3rd member of a resulting tuple
        const sql1:string = result[2];
        //
        //Add the primary key condition to the editor sql. NB. The toString()
        //method of an entity returnsthe fully spcified, fully quoted name, fit
        //for partcipatin in an sql
        const sql = `${sql1} where ${this}=${value}`;  
        //
        //Execute the sql statement
        const records:Array<schema.fuel> = await server.exec(
            'database',
            [this.dbase.name],
            'get_sql_data',
            [sql]
        );
        //
        //Its an error if none or more than one record is identified
        if (records.length!==1)
            throw new schema.mutall_error(`${records.length} are identified by clause promary key ${value}`);
        //
        //Return the only retrieved record;
        return records[0];
    }
    
    //
    //Read the data of this entity, identified by given primary key value, from
    //a database, returing a single record that has 2 parts: scalars and matrices.
    async seek_matrices(value:number):Promise<{[index:string]:Array<schema.fuel>}>{
        //
        //Collect all the pointers of the subject
        const pointers:Array<schema.foreign> = [...this.collect_pointers()]; 
        //
        //Convert the pointers to matrices. Use the for each, method; the 
        //asynchronous inside a map does not seem to work as exoected
        //return pointers.map(async(pointer)=>await this.seek_matrix(value, pointer));
        //
        //Start with an empty fuel;
        const result:{[index:string]:Array<schema.fuel>}={};
        //
        //For aeach pointer...
        for(const pointer of pointers){
            //
            //Add it to the fuel.
            result[pointer.name] = await this.seek_matrix(value, pointer);
        }
        //Return the complete fuel
        return result;
    }
    //Use the given primary key to read data (from the pointer's table) that 
    //matches the foreign key
    async seek_matrix(value:number, pointer:schema.foreign):Promise<Array<schema.fuel>>{
        //
        //Use the pointer's database and entity name to get an sql statement, 
        //fit for editing data
        const result = await server.exec(
            'editor',
            [pointer.entity.name, pointer.entity.dbase.name],
            'describe',
            []
        );
        //
        //The sql is the 3rd member of a tuple
        const sql1:string = result[2];
        //
        //Compile the where clause. E.g., where `mutall_users`.`intern`.`name`=5
        const where:string = `${pointer}=${value}`;
        //
        //Add the where clause to the editor sql
        const sql = `${sql1} where ${where}`;  
        //
        //Execute the sql statement
        const records:Array<schema.fuel> = await server.exec(
            'database',
            [pointer.entity.dbase.name],
            'get_sql_data',
            [sql]
        );
        //
        //Return all teh retrievdd records
        return records;
    }
    
    //Collect pointers to this entity from all the available databases
    *collect_pointers():Generator<schema.foreign>{
        //
        //For each registered database....
        for(const dbname in schema.databases){
            //
            //Get the nameed database
            const dbase = schema.databases[dbname];
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
                    if (!(col instanceof schema.foreign)) continue;
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
//There 2 types of databases required to drive this system: the schema and orm 
//versions
//
//The orm (database) class referenced in a tuple is a dictionary of concrete (rather 
//than abstract) entity classes indexed by their entity names
export type database = {[ename:string]: concrete};
//
//A concrete type is one than can be used for constructing an of a class object
export type concrete = new(...args:any)=>any;
//
//In contrast, an abstract type cannot be used for constructing any class objects
export type $abstract = abstract new(...args:any)=>any;
//
//Representation of a friendly primary key. The friend may require a data fetch
//if you need to use it
export type pk = {value:number, friend:string|Error}; 
//
//Consider this example of an auto-generated message class
/*

class msg extends tuple{
    public msg?:pk|null = null;
    public date:Date|null = null;
    public subject:string|null = null;
    public text:string|null = null;
    public user:mutall_user.user|null = null;
    public business:business|null = null;
    public language?:string|null = null;
    public child_of:mutall.msg:null = null;
    constructor(){
        super('mutall_user', 'msg');
      ...
    }
    ....    
}
The edit properties (K) of a tuple (T) are its properties whose values are assignable 
null. Hence:- 
*/
export type edit<T extends tuple> = {[K in keyof T as T[K] extends null ? K: never]:T[K]};
//
//
//The reader object has the same properies as the editable one, except that the 
//values are basic properties that are read from a database
//Given our example, the desired result is:-
//{
//  msg:friend, 
//  date:string, 
//  text:string, 
//  user:friend, 
//  business:friend
//  }
//NB.The  child_of is not part of the basic structure
//
export type reader<Tuple extends tuple> = {
    //
    //Scalar keys are the same as those of an editor
    [Cname in keyof edit<Tuple> as get_scalar_key<Cname, edit<Tuple>[Cname]>]: get_read_value<edit<Tuple>[Cname]>
}
//
//A scalar values is any non-array value of an editable
//value
type get_scalar_key<Cname, Value> = Value extends Array<any> ? never : Cname;

//A scalar value read from a database is either basic or (a json-encoded) string
type get_read_value<Value> =
    //
    //If the value is basic, then return it as it is, otherwise assume it is a 
    //complex value encoded as a string 
    Value extends schema.basic_value ? Value
    //
    //By default, a scalar value read from a databse is a json-editable string
    :string

//A scalar value mrant for writing to a databse
export type writer<Tuple extends tuple> = {
    //
    //Scalar keys are the same as in of an editor
    [Cname in keyof edit<Tuple> as get_scalar_key<Cname, edit<Tuple>[Cname]>]: get_write_value<edit<Tuple>[Cname]>
}
    
    //A scalar value fit for writing to a database. Typically this relevant for
    //preparing pointer-based table layouts for writing to a database, or for 
    //deriving label layouts for ready values before wring them to a databse
    type get_write_value<Value> =
        //
        //If the value is basic, then return it as it is, otherwise assume it is a 
        //complex value encoded as a string 
        Value extends schema.basic_value ? Value
        //
        //The scalar value of a foreign key (tuple) is its primary key value
        :Value extends tuple ? number
        //
        //The scalar verson of a primary key is an optional number. For data
        //that came from a database, the basic value is a number. For brand new
        // (ready) data the value is undefined
        :Value extends pk ? number|undefined 
        //
        //By default, a scalar is a (json-encoded) text
        :string

//Returns an object whose key values are all arrays. Given our example, the 
//desire result is:-
//{
//  child_of:Array<scalars<msg>>
//}        
export type matrices<Tuple extends tuple> = {
    [Cname in keyof edit<Tuple> as get_matrix_key<Cname, edit<Tuple>[Cname]>]: edit<Tuple>[Cname]
}

//A matrix column name, is one whose value is an array.
type get_matrix_key<Cname, Value> = Value extends Array<any> ? Cname : never;

//Let feed be the data used for constructing a tuple. It may be:-
export type feed<T extends tuple> = 
    //
    //- the primay key value
    {type:'primary', data:number}
    //
    //-the friendly string comprising of the value/friend tuple
    |{type:'friend', data:string}
    //
    //- a record of basic values read from a database
    |{type:'reader', data:reader<T>}
    //
    //- an record of values ready for use in programming
    |{type:'ready', data:edit<T>};


//The pointer class allows us to manage lists of tuples of some type. 
export  class pointer<T extends tuple>{
    //
    //The members of the home tuple; this is defined when the pointer is populated
    public members?:Array<T>;
    //
    constructor(
        //
        //The databases on this server
        public databases:{[dbname:string]:{[ename:string]:concrete}},
        //
        //Member constructor
        public $constructor:$abstract,
        // 
        //The tuple that defines the data that is needed for initializing members 
        public away:tuple
    ){}

    //
    //The foreign key column that defines this pointer
    get col():schema.foreign{
        //
        //Get the name of the member constructor
        const cname = this.$constructor.name;
        //
        //Get column for this pointer; it must be a foreign key
        return <schema.foreign>this.away.pointers[cname];
    }
    

    //
    //Populate home members of this pointer, returning the same members. This 
    //allows chaining, so that instead of the following 2 statements:-
    //if x.members===undefined awawit x.populate(); x.map(...)
    //
    //we can code it as one statement
    //
    //(await x.populate()).map(...)
    async populate():Promise<Array<T>>{
        //
        //Don't waste time if members are already populated
        if (this.members!==undefined) return this.members;
        //
        //Continue only if the away primary key (pk) is valid
        if (this.away.pk instanceof Error) throw Error;
        //
        //Get the primary key of the away tuple
        const value:number = this.away.pk.value;
        //
        //Select * from col.entity where col.name = value
        let rows:Array<schema.fuel> = await this.away.seek_matrix(value, this.col);
        //
        //Get the home database and entity names of the foreign key for this pointer
        const dbname:string = this.col.entity.dbase.name;
        const ename:string = this.col.entity.name;
        //
        //Get the factory for constructing new members of the home entity
        const factory:new(...args:any)=>any = this.databases[dbname][ename];
        //
        //Construct as many members as there are results of the seek and assign
        //them the members
        this.members = rows.map(row=>new factory({type:'basic', data:row}));
        //
        //Return the mebers -- thus supporting chaining
        return this.members; 
    }

    //A pointer is associated with a matrix layout for exporting its data
    get_table_layout():quest.table{
        //
        //Let the table be named after the name of the foreign key column
         const tname = this.col.name;
        //
        //There will be as many output columns as those of the home entity
        const cnames:Array<schema.cname> = Object.keys(this.col.entity.columns);
        //
        //The members  must be set
        if (this.members===undefined) 
            throw new schema.mutall_error('Fetch member data before using them');
        //
        //There are as may body data rows as the members of the pointer
        const body:Array<Array<schema.basic_value>> = this.members.map(member=>this.get_matrix(member, cnames)); 
        //
        //Define the matrix table we require
        let matrix:quest.table = {
            class_name:'mutall\capture\matrix',
            args:[tname, cnames, body]
        }
        //
        //Return the table
        return  matrix;
    }

    //Convert a scalars object into an arrray ordered by the given columns
    get_matrix(Tuple:tuple, cnames:Array<schema.cname>):Array<schema.basic_value>{
        //
        //Convert the tuple to a basic matrix for writing purpose
        const matrix:writer<tuple> = Tuple.convert_2_writer();
        //
        //Following the order of the given columns, produce an array of basic values
        const result:Array<schema.basic_value> = [];
        for(const cname in cnames){
            result.push(matrix[<keyof writer<tuple>>cname]);
        }
        //
        return result;
    }
    
}
    


