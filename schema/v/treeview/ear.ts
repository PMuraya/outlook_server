//Resolve reference to ifuel
import * as lib from "../code/library";
//
//Resolve mutall_error class
import * as schema from "../code/schema.js";
//
//To resolve the server methods
import * as server from "../code/server.js";
//
//Resolve the layouts for saving
import * as quest from "../code/questionnaire.js";
//
//Resolve references to the io
import * as io  from "../code/io.js";

//Import the base tree library
import * as tree from "./tree.js";

//The entity-attribute-relation data model organized as tree
//
//Modelling content that represent databases
export class dbase extends tree.common.content{
    //
    //A structre of databases, indexed by their names, needed to access all
    //databases participating in this session. Typically, they are the current 
    //database plus the mutall_users. It is static to allow global access to 
    //the databases
    static members:{[dbname:string]:schema.database} = {};
    //
    //Use a schema database to construct a database content
    constructor(public database: schema.database){
        //
        //The name used as a tag in a tree view as the same as that of the 
        //database
        const name:string = database.name; 
        //
        //The parent of this node is node. Root nodes have no parent
        super(name); 
        //
        //
        //Register the current application's database under its name
        dbase.members[this.name] = this.database;
    }
    
    //Completer those asynchronus processes of an ear that cannot be done
    //during constriction. In this context, loading the user datanase is important
    //to support linkages with other database
    async initialize():Promise<void>{
        //
        //Register the shared user's database. It needs to be part of the 
        //search space for record pointers. Also, it is needed for resolving 
        //foreign key references 
        //
        //Get the user's database structure
        const idbase:schema.Idatabase = await server.exec(
            'database',
            ['mutall_users'],
            'export_structure',
            []
        );
        //
        //Use the structure to create (and set) the database
        const mutall_users = new schema.database(idbase);
        //
        //Register the user's database under its name
        dbase.members[mutall_users.name] = mutall_users;
    }
    
    //Returns the children of a database as tables
    async get_children_content():Promise<Array<tree.common.content>>{
        //
        //Get the entities of this dbase as an array
        const entities = Object.values(this.database.entities);
        //
        //Map the entities to their content equivalents
        return entities.map(entity=> new table(entity, this));
    }
}
//
//Modelling content that represents a table. Its parent is a dbase and its 
//children are records. The number depends on whether the table is hierarchical
//or not
class table extends tree.common.content{
    //
    //The sql associated with this table that returns children of this table, 
    //taking care of hierachical of whether the table is hierarchical or not
    public sql?:string;
    //
    //The column names for for this table. They are filled in from the metadata
    //of the sql. Could these nt be derived from the schema entity|?
    public col_names?: Array<string>;
    //
    constructor(public entity: schema.entity, public parent:tree.common.content){
        //
        //Initialize the inherited class
        super(
            //The tagname to use for table is the same as its name 
            entity.name, 
            //
            //The parent of this content
            parent)
    }
    
    //The children of a table are records. the number depends on whether the
    //underlying entity is hierarchical or not
    async get_sql_data():Promise<Array<schema.fuel>>{
        //
        //Get the editor description.
        const metadata = await server.exec(
            //
            //The editor class is an sql object that was originaly designed 
            //to return rich content for driving the crud page.
            "editor",
            //
            //Constructor args of an editor class are ename and dbname 
            //packed into a subject array in that order.
            [this.entity.name, this.entity.dbase.name],
            //
            //The method called to retrieve editor metadata on the editor class.
            "describe",
            //
            //There are no describe method parameters
            []
        );
        //
        //Destructure the metadata
        //const [idbase, col_names, sql_original, max_record] = metadata;
        this.sql = metadata[2]; 
        this.col_names = metadata[1]; 
        //
        //Formulate the (local) sql for selecting children of the primary key,
        //taking care of hierarchical conditions 
        const local_sql = `select entry.* from (${this.sql}) as entry ${this.get_children_condition()}`;
        //
        //Execute the sql to get Ifuel,
        const ifuel = await server.exec(
            //
            //Use the database class to query
            "database",
            //
            //Get the dbname, as the only database constructor argument
            [this.entity.dbase.name],
            //
            //The method to execute
            "get_sql_data",
            //
            //The sql argument of the method
            [local_sql]
        );
        //
        //Return the Ifuel
        return ifuel;
    }

    //The children of a table content is a list of primary key (record) contents 
    //read off the underlying database
    async get_children_content(): Promise<Array<tree.common.content>> {
        //
        //Execute the sql for returning all records (a.k.a., fuel) associated 
        //with this table
        const fuels  = await this.get_sql_data();
        //
        //Convert each fuel record to the equivalent record content
         return fuels.map(fuel => new primary_record(fuel, this));
    }
        
    //Returns the 'where' clause for selecting children of this (table) content. 
    //If the table is hierarchical only the children that have no parent are 
    //considred; otherwise all the members are returned, i.e., no condition
    get_children_condition():string{
        //
        //Define an entity's column
        let col:schema.column; 
        //
        //An entity is hierarchical if... 
        const is_hierarchical:boolean =
            //
            //...it has a column named 'child of'...
            (col = this.entity.columns['child_of'])
            //
            //...that is a foreign key...
            && col instanceof schema.foreign
            //
            //...pointing to itself
            && col.ref.ename === col.entity.name; 

        //
        return is_hierarchical ? 'where child_of is null': ''; 
    }

    //Returns the header colum names. They are set when the children are read
    //from the server
    get_header_names(): string[] {
        //
        //The column names must be set by now; otherwise there is a problem
        if (this.col_names===undefined)
            throw new schema.mutall_error(`Header column names are not yet set`);
        return this.col_names;    
    }
    
}

//A record is an extension of a table content, with a specific primary key value
//This class is shared by both the primary and foreign key records.
abstract class record extends table{
    //
    //The  key number
    public pk:number;
    //
    //The friendly component of a primary key string
    public friend:string;
    //
    constructor(
        //
        //The primary key string value (comprising of the value and friendly
        //components)
        pk_str:string,
        //
        //The entity on which this record is based
        public entity:schema.entity,
        //
        //The parent of a record may be a table (or another key). For instance
        //the parent of a primary key is a table. The parent of a foreign key is
        //a key
        public parent:table|record
    ){
        //
        //Initialize the table parent. The  entity needed for the inituialization
        //is teh same as that of the table
        super(entity, parent);
        //
        //Convert the json string to a tuple of 2 elements
        const [pk, friend] = JSON.parse(pk_str);
        //
        //Set the numeric primary key value and its friend
        this.pk = pk;
        this.friend = friend;
        //
        //Set the tagname to be the friendly component
        this.name = friend;
    }   

    //Convert the given fuel to key children and add the pointers as well    
    convert_fuel_2_children(fuel: schema.fuel):Array<attribute|foreign_record|pointer>{
        //
        //Use the given fuel to collect the column-based children, i.e.,
        //attribute and foreign content 
        const columns = this.collect_columns(fuel);
        //
        //Use the current entity to collect the pointer-based children of this 
        //record. 
        const pointers = this.collect_eas_pointers();
        //
        //Return both column- and pointer-based children of this record 
        return [...columns, ...pointers];
    } 
   
    //Use the properties of this record to collect the column-based children. 
    * collect_columns(fuel: schema.fuel):Generator<attribute|foreign_record>{
        //
        //Loop through all the properties of this record. The key of a property
        //corresponds to the name of a column
        for(const cname in fuel){
            //
            //The column named tagname is not drived from a schema.column, so
            //it cannot create an ear.column. Ignore it
            if (cname==='tagname') continue;
            //
            //Get the column that matches the name
            const col = this.entity.columns[cname];
            //
            //Verify that the column is valid
            if (col===undefined)
                throw new schema.mutall_error(`Column '${cname}' is not defined in entity ${this.entity.name}`)
            //
            //Exclude foreign keys that point to the parent of this content
            if (this.discard_foreigner(col)) continue;
            //
            //All non-foreign attributes yield attribute column contents. The 
            //parent of the column is this record
            if (!(col instanceof schema.foreign)) {
                yield new attribute(fuel[cname], col, this);
                continue;
            }
            //At this point the column must be a foreign key
            if (!(col instanceof schema.foreign)) 
                throw new schema.mutall_error(
                    'Column is not a foreign key contrary to expectation'
                );
            //
            //The value associated with this foreign key can be obtained from
            //this record's properties. It is a json string comprising of the 
            //primary key value and its friendly component
            const pk_str = String(fuel[cname]);      
            //
            //Yield a foreign key record content 
            yield new foreign_record(pk_str, col, this);
        }
    };
    
    //Determine if a foreign key column is to be discarded from the children
    //of this record or not. It should be if points to an ancestor that is 
    //a record refereced by the column
    discard_foreigner(col:schema.column):boolean{
        //
        //The column should be discarded if it is a foreign key...
        return col instanceof schema.foreign 
            //
            //...and that this record has a parent...
            && this.parent !==undefined
            //
            //...that has another parent of type key...
            && this.parent.parent instanceof record
            //
            //..that is referenecd by the foreign key column.
            && this.parent.parent.entity.name === col.ref.ename
            && this.parent.parent.entity.dbase.name === col.ref.dbname;
    }

     
    //
    //Use the current entity to collect the pointer-based children of this record. 
    //There is no possibility of recurssion since only the first level of pointers
    //is considered.
    protected *  collect_eas_pointers():Generator<pointer>{
        //
        //Get all the  pointers of the current entity as foreign key columns
        const schema_pointers:Generator<schema.foreign> = this.collect_schema_pointers();
        //
        //Loop through the schema pointers to convert them to the EAR versions
        for(const schema_pointer of schema_pointers){
            //
            //Convert the schema pointer to ear version
            const ear_pointer = new pointer(schema_pointer, this);  
            //
            yield ear_pointer;
        }
    }

    //Returns the pointers of this record. These are foreign keys that references
    //the entity of this record.
    protected * collect_schema_pointers(){
        yield *this.entity.collect_pointers();
    }
}

//A primary record content is a derivative of the normal (abstract) record 
//extended by fuel availability (not just a primary key). In addition, her
//children are column values(of the underlying entity) and pointers to that entity.
class primary_record extends record{
    //
    constructor(
        //
        //The fields and values associated with this record.
        public fuel:schema.fuel,
        //
        //The parent of a record may be a table (or another record). NB: A record
        //extends a table.
        public parent:table
    ){
        //
        //Get the primary key string value (comprising of the value and friendly
        //components)
        const pk_str = String(fuel[parent.entity.name]);
        //
        //Initialize the table parent. The  entity needed for the inituialization
        //is the same as that of the parent table
        super(pk_str, parent.entity, parent);
    }
    
    //Returns the colum names needed to head the childrem in the list
    //view. There is only one: the (child) column's value 
    get_header_names(): string[] {
        return ['value'];    
    }

    //Get the children of a primary record as columns derived from the columns and 
    //pointers of the parent (database) table
    async get_children_content(): Promise<Array<tree.common.content>> {
        //
        //Convert the fuel of this primary to column and add the pointer contents
       return this.convert_fuel_2_children(this.fuel);  
    } 
    
    //Return the fuel of a primary record as its properties
    get properties():tree.properties{
        return this.fuel;
    }
    
    //By comparing the original and the values in the tr, write changes to the storage 
    //system
    async save(tr:HTMLTableRowElement):Promise<lib.crud_result>{
        //
        //Collect all the label layouts and use questionnaire to save the data
        const layouts:Array<quest.label> = Array.from(this.collect_labels(tr));
        //
        //Write the data to the database
        const result:lib.Imala = await server.exec(
            //
            //Use the php questionnaire class
            "questionnaire",
            //
            //The only constructor argument is the layouts
            [layouts],
            //
            //Use the load method that returns a more structured result that
            //can be interrogated further
            'load_user_inputs',
            //
            //Load common needs no arguments
            []
        ); 
        //
        //Report the Imala resukt
        return this.report_imala(result, tr);    
    }

        //
        //This method makes the error button visible and puts the error in its 
        //(the button's) span tag which allows the user to view the Imala report.
        //It also updates the primary key field with a "friend", when it is not 
        //erroneous
        private report_imala(mala: lib.Imala, tr:HTMLTableRowElement): lib.crud_result {
            //
            //If there are syntax errors, report them; there cannot be other
            //types of errors, so, abort the process after the report.
            if (mala.class_name === "syntax") {
                //
                //Convert the errors to a string.
                const errors = mala.errors.join("\n");
                //
                const error = new schema.mutall_error(`${ mala.errors!.length} syntax errors:\n ${errors}`);
                //
                //Abort the reporting, as there cannot be other types of errors, and return the error.
                return error;
            }
            //At this time we must have a runtime result. It is a sign of a problem if we don't 
            if (mala.class_name !== "runtime") throw new schema.mutall_error(`A runtime result was expected`);
            //
            //We expect, when we call this method, to be loading one (tr) row, so 
            //there will be only one indexed entry in the Imala result. Ensure
            //this assumption is held
            if (mala.result.length!==1) 
                throw new schema.mutall_error(`Only one runtime entry is expected. ${mala.result.length} found`);
            //
            //Get the only runtime entry
            const entry = mala.result[0].entry;
            //
            //If the the entry points to an error, return the message
            if (entry.error) return new Error(entry.msg);
            //
            //At this point, the saving must have been successful. We need to 
            //update the primary key and friendly attributes of the list view, 
            //as well as the node of the tree view 
            //
            //Update the primary io in the list view
            //
            //Formulate the primary value and friend as a json string comprising
            //of a tuple with the 2 elements
            const json = JSON.stringify([entry.pk, entry.friend]);
            //
            //Get the primary key io
            const Io:io.io = this.get_pk_io(tr);
            //
            //Set its value
            Io.value = json; 
            //
            //Update the matching io in the tree view
            //
            return 'ok';
        }

        //Returns the io corresponding to the primary key value from the given tr
        get_pk_io(tr:HTMLTableRowElement):io.io{
            //
            //Get all the tds of the tr as an array
            const tds = Array.from(tr.cells);
            //
            //Find the td that has an io of the primary key class
            const td:HTMLTableCellElement|undefined = tds.find((td)=>io.io.get_io(td) instanceof io.primary);
            //
            //It is an error if the primary key cannot be found
            if (td===undefined) throw new schema.mutall_error(`Unable to find a primary io in this tr '${tr}'`);
            //
            //Get the io that matches the td
            return io.io.get_io(td);

        }
        
    
        //Collect the data to be written to the database as label layouts
        private *collect_labels(tr:HTMLTableRowElement):Generator<quest.label>{
            //
            //Loop through all the cells of the given tr and yield its label 
            //if valid. In future, an io should yield a label directly
            for(const td of Array.from(tr.cells)){
                //
                //Get the io that matches the td
                const Io = io.io.get_io(td);
                //
                //If the io is not asociated with a fatabase  column, then you
                //cannot save it. Ignore it and continue
                if (Io.col===undefined) continue;
                //
                //Get the database, table and column names
                const dbname = Io.col.entity.dbase.name;
                const ename = Io.col.entity.name;
                const cname = Io.col.name;
                //
                //Get the value to save
                const value_new = Io.value;
                //
                //Get the original value
                const value_old = this.properties[cname];
                //
                //Yield the value, if it is valid for saving
                if (this.value_is_valid(Io.col, value_old, value_new)) {
                    //
                    //Use the tr's row index as a label
                    yield [dbname, ename, [tr.rowIndex], cname, value_new];
                }    
            }
        }    
        //Decide if a value is fit for saving or not
        private value_is_valid(col:schema.column, value_old:schema.basic_value, value_new:schema.basic_value):boolean{
            //
            //A primary key is valid for saving if it is not null
            if (col.name===col.entity.name && value_old!==null) return true;
            //
            //Any value is valid for update if it has changed
            if (value_old!==value_new) return true;
            //
            //By default, a value is not valid for saving
            return false;
        }
}

//A foreign record is an extension of the abstract record.It differs from
//the primary one in 2 ways:- 
//- it has only a primary key value (rather than full fuel)
//- her children are primary records obtained by searching the primary key
//in the underlying database.
class foreign_record extends record{
    //
    constructor(
        //
        //The primary key value as a json string of the numeric key and friendly 
        //component
        pk_str:string,
        //
        //The foreign key column that identifies this foreign content
        public col: schema.foreign,
        //
        //The parent of a foreign key is another key -- primary or foreign
        public parent:record,
        
    ){
        //Use the column's reference to access the pointed database name
        const dbname = col.ref.dbname;
        //
        //the foreign column's referenec to access the entoty name
        const ename = col.ref.ename;
        //
        //The entity pointed at by this foreign key is obtained from the key's
        //reference
        const entity:schema.entity = 
            //
            //Get all databases relevant for this session
            dbase.members[dbname]
            //
            //Access the named entity
            .entities[ename];
    
        //Initialize the parent record which is being referenced by this foreign
        //key
        super(pk_str, entity, parent);
        //
        //Let tghe tag name be the same as that of the columns name
        this.name = col.name;
    }
    
    //The properties of a foreign key are its numeric and friendly values
    get properties():tree.properties{
        return {value:`${this.pk}/${this.friend}`};
    }
    
    //The properties of a forein recoird should show in the tree view
    get_tree_view_attributes(){
        return this.properties;
    }
    
    //Override how attributes of a foreign record. In general, all tree 
    //the propertiesof the some content are attached to the given selector as 
    //key/value pairs. For a foreign record, the primary key (both the numeri
    //and frendly parts) is shown
    add_tree_attributes(node: tree.node,  selector:HTMLElement):void{
        //
        //Create the option element as a child of the selector
        const option = node.create_element('div', selector, {className:'option'});
        //
        //Add the key/value separator span tag
        node.create_element('span', option, {className:'sep', textContent:':'});
        //
        //If the current column is a primary key, show the number only
        const value = `${this.pk}/${this.friend}`;
        //
        //Add the value span tag to the option. 
        node.create_element('span', option, {className:'value', textContent:value});
    }
    
    //The children of this foreing key. They are similar to those of a primary
    //key. 
    async get_children_content():Promise<Array<tree.common.content>>{
        //
        //Select all data from the underlying table that mathes this foreigner's
        //primary key
        const ifuels = await this.get_sql_data();
        //
        //Only one record should be returned
        //
        //If there was none, Its an error; re-check the value of the foreign key. 
        if (ifuels.length===0) 
            throw new schema.mutall_error(
                `No record of table '${this.entity.name}' matches condition  '${this.get_children_condition()}'`
        );
        //    
        // If there is more that one (perhaps you may have forgotten to
        //specify the filtering condition); its an error also 
        if (ifuels.length>1) 
            throw new schema.mutall_error(
                `${ifuels.length} records of table '${this.entity.name}' match condition  '${this.get_children_condition()}'`
            );
        //
        //Return the only (fuel) record
        const fuel = ifuels[0];
        //
        //Convert the fuel to children of this foreign record and add the 
        //pointers as well
        return this.convert_fuel_2_children(fuel);
    }
    
    //This condition is needed for formulating the where clause for selecting 
    //records from this foreign key's underlying table
    get_children_condition():string{
        //
        //Formulate a a backick quoted field name based on the primarky key of 
        //the underlying entity
        const cname = '`'+this.entity.name+'`';
        //
        //Formulate the where clause. E.g., where client = 5,
        //where student is null. 
        //Remember that the primary key is a json field with 2 components. The
        //primary key value is the first one
        //
        const pk = `${cname}->>"$[0]"`;
        //
        //Select between is and = as the operator
        const operator = this.pk===null ? 'is': '=';
        //
        //Now formulate the condition
        return ` where ${pk} ${operator} ${this.pk}`;
    }
}


//The attribute columm content as a terminal
class attribute extends tree.common.content{
    //
    constructor(
        //
        //The value of the attribute
        public value:schema.basic_value,
        //
        //The schema column associated with this content
        public col:schema.attribute|schema.primary,
        //
        //The parent of an attribute column is a key 
        public parent:record
    ){
        //
        //The tagname is the same as the column's name
        const tagname = col.name;
        //
        //Initialize the content
        super(tagname, parent);
    }

    //
    //The only column's property is its value
    get properties():tree.properties {
        //
        //Compile and return the only property
        return {value:this.value};
    }
    

    //Column is a leaf (not branch)
    is_branch(): boolean {
        return false;
    }

    //Leaves do not have children; its illegal to try to access their children as it
    //indicates a logic failure somewhere.
    async get_children_content(): Promise<Array<tree.common.content>> {
        throw new schema.mutall_error('A column-based content has no children as it is a leaf node')
    }
    
    //Returns the tree attributes of an attribute content. They are the same
    //as the properties of this column
    get_tree_view_attribute(): tree.properties{
        return this.properties;
    }
    
    //Override how attributes of a column are displayed. In general, all tree 
    //attributes are attached to the given selector as key/value pairs. For a 
    //column, tehre is only one: its value. Tthe property name 'value' is dropped
    add_tree_attributes(node: tree.node,  selector:HTMLElement):void{
        //
        //Create the option element as a child of the selector
        const option = node.create_element('div', selector, {className:'option'});
        //
        //Add the key/value separator span tag
        node.create_element('span', option, {className:'sep', textContent:':'});
        //
        //Convert the value attribute to a string
        const value = String(this.properties.value);
        //
        //If the current column is a primary key, show the number only
        const str = this.col instanceof schema.primary ? String(JSON.parse(value)[0]):value;
        //
        //Truncate the string to 20 characters, if necessary
        let trunc = str.length > tree.max_value_length ? str.substring(0, tree.max_value_length-1) + '…' : str;
        //
        //Add the value span tag to the option. 
        node.create_element('span', option, {className:'value', textContent:trunc});
    }
}

//A pointer is like a table that has a key associated with it. In that regard its 
//similar to a foregin key. Its children are primary records.
class pointer extends table{
    //
    constructor(
        //
        //The foreign key that defines this pointer
        public pointer:schema.foreign,
        //
        //The parent of a pointer is a key
        public parent:record
    ){
        //The entity of a pointer is obtained directly. 
        const entity = pointer.entity;
        //
        //Initialize the (table) base content 
        super(entity, parent);
    }

    //Create the io for the named column of this pointer. The only name that is
    //expected is tagname. All other nams must as a result of displaying
    //columns and pointers in the same table as records. Ignore them by making
    //them read only. This issue will be better resolved when the list view is
    //laid out not just in a tabular fashion
    create_io(cname: string, anchor:io.anchor): io.io {
        //
        return new io.readonly(anchor);
    }
    
    
    //The where clause for selecting all records from the database that
    //point to the parent
    get_children_condition():string{
        //
        //Get the field name to search in the pointer's home 
        const fname = "`"+this.pointer.name+"`";
        //
        //get the expression for extraction the exact primary key value from the
        //foreign key whose value is a json string. It is the first component of the
        //foreign key
        const exp = `${fname}->>"$[0]"`;
        //
        //All the children must point to the primary key of the parent 
        const pk = this.parent.pk;
        //
        //Formulate the complete where clause (note the quotes enclosing the primary ey value)
        return `where  ${exp} = '${pk}'`;
    }
}
