//The set of classes defined here support the use of a form, a.k.a., 
//questionnaire to create, review, edit and delete the general registration of 
//a user. It was using the intern registration exercise that we coverd in 2022

//Basic definitions are found here
import * as schema from '../schema.js';
import * as lib from '../library';

//Some of the earlier data types associated with a questionnaire come from here.
//Eventualy, the declarations in schema/questiinnaire.ts should be combined with 
//those defined here
import * as quest from '../questionnaire.js';

//The user interface is derived largely from outlook
import * as outlook from '../../../../outlook/v/code/outlook.js';

//
import * as app from '../../../../outlook/v/code/app.js';

//
import * as io from '../../../../schema/v/code/io.js';

//The sqls extracted from a questionnare for loading data to the same
//Support for basic sql
import * as sql from '../../../../outlook/v/code/sql.js';

import * as server from '../server.js';

//Crud operations. 
export type crud = 
    //
    //Create a new entity
    'create'
    //
    //Operate on an existing entity. pk is the primary key of the entity
    |{type:'review'|'update'|'delete', pk:number} 

//The came used for indexing scalar values
type name = string;
//
//Deriving the general output of a questionnaire

//Scalars are basic values indexed by both entity and column names. This 
//indexing gives easy access to the basic values found in a form for futher
//checks, more advanced than the basic ones. Note that the value of a scalar is
//an extension of the basic one, using the javscript error object 
//Here is how we might use scalars:=
//const [first_name, surname] = this.result.scalars.user.name.split(' ');     
interface scalars {
    [index:name]:schema.basic_value|Error;
}
//
//Matrices is a double array of basic values associated with the columns and the
//name of the table where they are found on the form. 
interface matrix{
    tname:string;
    columns:Array<{ename:lib.ename, cname:lib.cname}>,
    body:Array<Array<schema.basic_value|Error>>
}

//The output resulting from a questionnaire(i.e., layout) administration
//are scalars amd matrices.
interface Iresult {
    scalars?:scalars;
    matrices?:Array<matrix>
}

//Ios on on a questionnairs
interface ios {
    scalars:Array<io.io>;
    matrices:Array<{
        tname:string, 
        columns:Array<schema.column>, 
        body:HTMLTableElement
    }>;
}

//The combination of an entoty and column name, sperated by an underscore
type ename_cname = string;

//The structure of data retrieved using the retriever sql.
interface retrievee{
    //
    //The scalar data retrieved from the database is a set of basic
    //values indxed by a name that is formed by concatenating the entity and 
    //column names.
    scalars:{[index:ename_cname]:schema.basic_value},
    //
    //The tabular data corresoponding to the sql of a table. NB. We dont need
    //columns, assuming that data is laid out to match the same column positions
    //as in the ios.
    matrices: Array<{
        //
        //The table name in the output is not useful, since all the index
        //of a table is used to match the ios and retrievee tables. We include 
        //it here for debugging purposes 
        tname:string,
        //
        body:Array<Array<schema.basic_value>>
    }>
};

//The sqls are specified in terms of the string
interface sqls {
    //
    //One sql for extracting scalar values
    scalars:sql.str;
    //
    //As many sqls as are neede for filling the questionnaire tables
    matrices: Array<{tname:string, body:sql.str}>
}

//This class represents the general form used for 'cruding' any entity. It holds
//the lessons leart from our work on intern registration, so that we can apply 
//them to registration of other types of users. It is used for providing
//CRUD functionality of any form, beyond registration of users
export abstract class questionnaire 
    //
    //...is an interactive page that returns a simple output, true, on successful
    //administration
    extends outlook.baby<true>
    //
    //...can be used for collecting scalars and matrices
    implements Iresult
{
    //Scalars collected by this form, indexed by a name, for ease of further
    //data processing
    public scalars?:{[index:name]:schema.basic_value|Error};
    //
    //An empty array of tabular data
    public matrices?:Array<matrix>;
    
    //The ios of this questionnaire
   public ios?:ios;
    //
    //The crud operation to be performed using this questinnairs
    public operation:crud;
    //
    //If a url is ommited, then we use the relational data model to guide
    //the loading process; otherwise we follow the template
    constructor(mother:outlook.page, operation:crud, url?:string){
        super(mother, url);
        this.operation = operation;
    }
    
     //Construct the desired result as you check the inputs
    //Check the values of this form and process it, reporting any errors
    async check():Promise<boolean>{
        //
        //Check that the inputs on the form is valid data and construct the
        //output result. If not, do return false
        if (!this.check_inputs()) return false;
        //
        //Save the data to the database (using the writer)
        this.save();
        //
        //Send message to the CEO that new member has registered 
        //(using the messenger)
        //
        //Schedule any events -- if necessary(using the scheduler)
        //
        //Update the book of accounts -- if necessary (using the accountant)
        return true;
    }
    
    //Check that all the inputs on the form are valid, flagging those that are
    //not. While checking, the result is built. If all the inputs are valid then
    //the result is valid and we return a true; otherwise we return a false.
    check_inputs():boolean{
        //
        //Prepare  to count the errors
        let counter:number = 0;
        //
        //Check all that all the scalar ios are valid and use them to populate 
        //the result
        for (const io of this.ios!.scalars){
            //
            //Check the io's value and return its status
            const status:schema.basic_value|Error = io.check();
            //
            //If the io has a name, then use it to index the status on this for,
            //save that st
            const id:name|undefined = io.name;
            //
            //Skip the io, if it cannot be named
            if (id===undefined) continue;
            //
            //Index the scalar statuses
            this.scalars![id]=status;
            //
            //Collect the error
            if (status instanceof Error) counter++
        }
        //
        //Check that all the tabular ios are valid, and ignore their statuses
        for(const matrix of this.ios!.matrices){
            //
            //Get the table's (only) body
            const tbody:HTMLTableSectionElement = matrix.body.tBodies[0];
            //
            //Get all the rows as an array
            const rows:Array<HTMLTableRowElement> = Array.from(tbody.rows);
            //
            //Step through all the rows to access the table's ios 
            for(const tr of rows){
                //
                for (const td of Array.from(tr.cells)){
                    //
                    //Get the matching io
                    const Io = io.io.get_io(td);
                    //
                    //Check and collect the error if necessary
                    if (Io.check instanceof Error) counter++;
                }
            }
        }
        //
        //Verify that all the form results (both scalar and tabular ios) are valid
        //If not, return false; otherwise true
        return counter>0 ? false: true;
    }    
    //
    //This is a trivial result; but the interfase requires it. Consider this
    //requirement in future
    async get_result():Promise<true>{
        //
        //The result must be set
        if (this.result===undefined) 
            throw new schema.mutall_error(`The result of this '${this.constructor.name}' is not set`)
        //
        //Return the result    
        return this.result;
    }
    
    //Implement strategies for making the form responsive
    make_responsive():void{
        
        //Exploit the data-show and data-hide attributes. Compare with code 
        //from ::kaniu
        //
        //
        for(const what of ['data-show', 'data-hide']){
        
            //Get all inputs, as an array,  with a data-show attribute. Include
            //the ids to be shown,
            const inputs = <HTMLInputElement[]>Array.from(this.document.querySelectorAll('[${what}]'));
            //
            //Step through inpts to add a listenner
            for(const input of inputs){
                //
                //Get the is, depending on what
                const attr = input.getAttribute(what);
                //
                //If te attribute is null, return an en;ty list; otherwise return
                //he space separated ids
                const ids = attr===null ? [] : attr.split(' ');
                //
                //Add a lick even listent ot the input
                input.onclick = ()=>{
                    //
                    //On click, hide or show every element identified by the id
                    for(const id of ids){
                        //
                        //Get the identified element
                        const element = this.get_element(id);
                        //
                        //All hidden attributes are treated as such; otherwise 
                        //unhode them
                        element.hidden = (what==='data-hide');
                    }
                }
            }
        }
    }
    
    //Returns the elements identofied by a data-show or data-hide attribute
    private get_ids(element:HTMLInputElement, attr:string):Array<HTMLElement>{
        //
        //Get the named attribute
        const str:string = element.getAttribute(attr)!;
        //
        //Use the space tp split the string
        const strs:Array<string> = str.split(' ');
        //
        //Map the strings to ids
        return strs.map(id=>this.get_element(id));
    }
    
    //Returns the ios associated with this questionnaire
    get_ios():ios{
        //
        //Collect the simple column io values correspond to the simple inputs, 
        //i.e., scalars
        const scalars:Array<io.io> = this.get_scalar_ios();
        //
        //Collect the matrices, i.e., tables that are in this form
        const matrices:Array<{tname:string, columns:schema.column[], body:HTMLTableElement}>= this.get_matrices();
        //
        return {scalars, matrices}
    }
    
    //Get the ios, i.e., structured values, for feeding the simple inputs of 
    //this form
    private get_scalar_ios():Array<io.io>{
        //
        //This is the css for selecting all simple inputs. They are elements marked
        //with the data-cname attribute and outside of any table element
        const css = `[data-cname]:not(table *)`;
        //
        //Use the css for isolating scalar elements from the form. Force them
        //into html elements
        const scalar_inputs = Array.from(
            this.document.querySelectorAll(css)
        ) as Array<HTMLElement>;
        //
        //Map the scalar inputs to the columns. Corece the inputs to a 
        return scalar_inputs.map(input=>this.get_element_io(input));
    }
    
    //Returns the io, i.e., value, that matches the given input element. 
    private get_element_io(input:HTMLElement):io.io{
        //
        //Get the database column that matches this input element
        const col = this.get_element_col(input);
        //
        //Define the value's anchor
        const anchor:io.anchor = {element:input, page:this};   
        //
        //Get the io value type using the the user defined attribure - data-io
        const io_str:string|null = input.getAttribute('[data-io]');
        //
        //If the attribute is not found, then set it as undefined
        const io_type = io === null ? undefined : io_str as io.io_type; 
        //
        //Create and return the io    
        return io.io.create_io(anchor, col, io_type);    
    }
    
    //Returns the database column that matches the given input element. 
    //The element may or may not be referencing a table. If it does, the oftable 
    //parameter tells us which one.  
    private get_element_col(input:HTMLElement, oftable:string=""):schema.column{
        //
        //Get the database name where to save the data.
        const dbname:string = this.get_attribute_value(input, 'data-dbname');
        //
        //Ensure that the database exist
        const dbase:schema.database = schema.schema.databases[dbname];
        if (dbase===undefined) 
            throw  new schema.mutall_error(`Database ${dbname} ${oftable} is not found on this server`);
        //
        //Get the table name where to save the data, and ensure it exist
        const ename:string = this.get_attribute_value(input, "data-ename");
        //
        //Ensure that the named entity exist in the database
        const entity:schema.entity = dbase.entities[ename];
        if (entity===undefined) 
            throw  new schema.mutall_error(`Entity ${dbname}.${ename} ${oftable} is not found`);
        //
        //Get the column name where to save the data.
        const cname:string = this.get_attribute_value(input, 'data-cname');
        //
        //Ensure that the name column exist in the entity
        const col:schema.column= entity.columns[cname];
        if (col===undefined) 
            throw  new schema.mutall_error(`Column ${dbname}.${ename}.${cname} ${oftable} is not found`);
        //
        return col;    
    }
    
    //Return (from this registration form) the table-based ios, a.k.a., matrices,  
    private get_matrices():Array<{tname:string, columns:schema.column[], body:HTMLTableElement}>{
        //
        //1. Get all the tables in the form that are not marked as ignored
        //
        //1.1 Let css be the identifier of tables hat are not ignored
        const css = 'table:not([data-ignore] *)';
        //
        //2.2 Retrieve all the tables from this form, convering them into an 
        //array
        const table_elements = Array.from(
            this.document.querySelectorAll((css))
        ) as Array<HTMLTableElement>;
        //
        //
        //2. Map each table to its columns
        const tables:{tname:string, body:HTMLTableElement, columns:Array<schema.column>}[] 
            = table_elements.map(element=>this.get_matrix(element))
        //
        //3. Return the tables of columns
        return tables;
    }
    
     //Returns a table element and its header columns given table element
    private get_matrix(element:HTMLTableElement):{tname:string, columns:Array<schema.column>, body:HTMLTableElement}{
        //
        //Get an identifier for the table, for use in reporting. 
        const tname = element.id;
        //
        //Tables used in CRUD functions must be identified
        if (tname===null){
            console.log(element);
            throw new schema.mutall_error(`This table this form does not have an identifier. See console.log for details`);
        }    
        //
        //Get the header column elements (i.e., th) of the given table as an 
        //array
        const ths: Array<HTMLTableCellElement> = Array.from(element.querySelectorAll('th'));
        //
        //Map each column element to its schema column equivalent, passing the 
        //table id for reporting purposes
        const columns = ths.map(th=>this.get_element_col(th, `(of table '${tname}')`));
        //
        //Return the result; teh body of the table is its element
        return {tname, columns, body:element};
    }
    
    //Set ths ios during show panels
    async show_panels():Promise<void>{
        //
        //Set the ios. They help in immediate data checks when the data are 
        //entered. Furthermore, when they are also needed when we write the
        //data to the database
        this.ios = this.get_ios();
    }
    
    
    //
    //Write the data in this questionnaire to a database
    async save(): Promise<boolean> {
        //
        //1.Get the layouts from the input questionnaire
        const layouts: Array<quest.layout> = [...this.collect_layouts()];
        //
        //2. Use the layout and the questionniare class to load the data to a
        //database returning the HTML error report or Ok.
        const result: 'Ok'|string = await server.exec(
                //
                //Use the questionnaire class to load the data
                "questionnaire",
                //
                //the only parameter required by the questionnaire is the array of
                //layouts
                [layouts],
                //
                //Use the more general version of load common that returns a html
                //output or Ok.
                "load_common",
                //
                //Calling the load common method with no input parameters
                []
        );
        //
        //3. Check the results on whether they were successful.If not successful,
        //report an error and return false to this method. If successful, return true
        if (result === "Ok") return true;
        //
        //Report this error
        this.report(true, result);
        //
        //The sacing failed.
        return false;
    } 
    
    //
    //Collect the layous of this form
    //Collect all label layouts from the scalars on this form, plus and tables 
    //and thoer associated lookup columns
    public *collect_layouts():Generator<quest.layout>{
        //
        //Collect label layours that match each io in the scalar collection
        for(const io of this.ios!.scalars){
            //
            //Collect the scalar label
            yield io.get_label_layout();
        }
        //
        //Collect all the layouts from a table, whichs has the structire
        //{element:HTMLTableElement, columns:Array<schema.column>}.
        for(const table of this.ios!.matrices){
            //
            //Collect the tabular layout
            //
            //Destructure the table to reveal the table element and its associated
            //columns
            const {tname, columns, body} = table;
                        //
            //Use the element to compile the desired table
            const tlayout: quest.table|undefined = this.get_table_layout(tname, body);
            //
            //Skip the table if it is undefined
            if (tlayout===undefined) continue;
            //
            //Collect the table layout
            yield tlayout;
            //
            //Collect the labels for writing the table columns to a database
            for (let i = 0; i < columns.length; i++){
              //  
              //Get teh column at tyhe i'th index
              const col = columns[i];
              //
              //Get the database columm's name
              const cname = col.name;
              //
              //Get the entity in which the column is found
              const  ename = col.entity.name;
              //
              //Get the name of the database wher teh entity is found
              const dbname = col.entity.dbase.name;
              //
              //The alias is compiled from the name of the table being exported
              const alias = [tname];
              //
              //Get the value of this column will label's expression is a looked 
              //up from the named table and column
              const exp:[string, ...any] = ['\\mutall\\capture\\lookup', tname, i]; 
              //
              //Collect the lookup column for the table
              yield [dbname, ename, alias, cname, exp];      
            }
        }
    }
    
    //Returns the (questionnaire) layout of a table
    private get_table_layout(tname:string, element:HTMLTableElement):quest.matrix|undefined{
        //
        //The body of the matrix table is derived
        const body:Array<Array<schema.basic_value>> = this.get_table_body(element); 
        //
        //If teh body is undefined, return undefiend; otherwise continue
        if (body===undefined) return undefined;
        //
        //Define a questionnaire matrix as a tabuilat layou for exporting data
        //laid out as a simple 2x2 matrix; 
        const matrix:quest.matrix = {
            class_name:'\\mutall\\capture\\matrix',
            args:[
                tname,
                //
                //Use the index position to refernce the columns
                [],
                body
            ]
        };
        //
        //Retuen the matrix table layout
        return matrix;
    }
    
    //Returns the body of the given table element as a double array of basic values
    private get_table_body(element:HTMLTableElement):Array<Array<schema.basic_value>>{
        //
        //Get the table's first body element.
        const tbody:HTMLTableSectionElement = element.tBodies[0]
        //
        //Retrieve  all the input rows under the table's body
        const input_rows: Array<HTMLTableRowElement> = Array.from(tbody.rows);
        //
        //Initialize the desired rows of with an empty matrix
        const output_rows:Array<Array<schema.basic_value>> = [];
        //
        //For each row of input....
        for(const input_row of input_rows){
            //
            //Create a new empty row of data;
            const output_row:Array<schema.basic_value>=[];
            //
            //Get all the input row's columns
            const tds: Array<HTMLTableCellElement> = Array.from(input_row.cells);
            //
            //For each column
            for(const td of tds){
                //
                //Get the corresponding io
                const Io:io.io = io.io.get_io(td);
                //
                //Retrieve the data ad it to the output row
                output_row.push(Io.value);
            }
            //
            //Add the row to the result
            output_rows.push(output_row);
        }
        //
        //Return the resulton row outpts
        return output_rows;
    }
    
    //Use the io, anchored at the element with the given id, to return the basic 
    //value
    public get_value(id:string):schema.basic_value{
        //
        //Get the anchor tag from this form identified by the id
        const anchor = this.get_element(id);
        //
        //Get the io associated with the anchor tag
        const Io = io.io.get_io(anchor);
        //
        //Retrieve and retirn the io's value
        return Io.value;
    }
       
}

//This class generalizes the reguistration process, beyond that of an intern
//
//This class provides CRUD functionality to support friendly registration of 
//users, including:-
//- creating data using a form similar to paper questionnairs (PIQ)
//- reviewing the data in an intuitive fashion
//- updating the data, using a form that looks looks the original one used for
//for data entry

export class registrar extends questionnaire{
    //
    //The entity referenced by the subject, as the role played by the user in 
    //this registration exercise
    public role:schema.entity;
    //
    constructor(mother:outlook.page, operation:crud, subject:schema.subject, url?:string){
        super(mother, operation, url);
        //
        //Convert the subject to a database.
        this.role = schema.schema.databases[subject.dbname].entities[subject.ename];
    }
    
     //Load this intern form with data from a database
    async load_inputs():Promise<void>{
        //
        //Determin the method of loading, i.e., using a template or not
        if (this.url===undefined){
            //
            //Follow the structure of the relational model to load the data
            await this.load_using_relational_model();
            //
            return;
        } 
        //
        //Use the current template to guide the data loading process
        //
        //Use this form with a builder to create the sqls for extracting 
        //data from the interns databse
        const sqls:sqls = new builder(this.ios!, this.role).execute();
        //
        //Use the sqls to query the mutall_user database to get the inputs 
        const inputs:retrievee = await server.exec(
            'query',
            [this.role.dbase.name, sqls],
            'execute',
            []
        );
        //
        //Use the inputs to fill the current 
        new filler(inputs, this).execute();
    }
   
    //Verify that the home (application) page is ready for intern registration, 
    //i.e., there is a slection in the subject panel that is pointing at an 
    //intern entity of mutall users. This is partcularly important for review, 
    //update and delete operations. assign::kangara
    app_page_ready(app:app.app):boolean;
      
    //Add an  an new entry to the subject panel in the application page.
    //::jk can do this.
    //The true value is returned to throw an error showing us that the method
    //is not implemented. Avoid void; is a delusion
    update_subject_panel(app:app.app):void;
        
        
    //Follow the structure of the relational model to load the data.
    //::pm can demonstrate the concepts using the tree viewer
    load_using_relational_model():Promise<void>;
    
    
}    

//This class supports registration of an intern as a special case of a registrar
//It is the basis of all the registration work that was done in 2022. The original
//name of this class is edit_my_profile.ts, developed by ::francis
export class intern extends registrar{
    //
    //The url of an intern regisration is ./interns_reg_form provided by
    //::Kang'ara
    constructor(mother:app.app, operation:crud){
        //
        //The intern's entity and database names
        const subject:schema.subject = {ename:'intern', dbname:'mutall_tracker'}
        //
        //The intern template was jpintly devepoped: the metadata was
        //captured by ::kang'ara, the invoice section by ::carol, the image 
        //section by ::kaniu, the multiple checkbox input by ::francis, the tables
        //were made responsive by ::pk, etc.
        super(mother, operation, subject, './interns_reg_form.html'); 
    }    
    
    //Prepare the form with io's
    async show_panels():Promise<void>{
        //
        //Make the form responsive by exploting the data-show and data-hide
        //attributes. Get code from intern::kaniu
        this.make_responsive();
        //
        //Load the form with inputs, if it is necessary. It is not, if we are
        //creating a new intern
        if (this.operation!=='create') await this.load_inputs();
    }
    
}

  
//This class supports buiding of sqls from a questionnaire for ecxtracting data 
//that can be loaded to the same questionnaire.
export class builder{
    //
    constructor(public ios: ios, public role: schema.entity){}
    //
    //Compile the sqls that retrieve the registration data for editing purposes.
    execute():sqls {
        //  
        //Get the database columns from all the scalar io of this form. The 
        //column must be defined
        const cols:Array<schema.column> = this.ios.scalars.map(io=>io.col!);
        //
        //Get the sql for constructing the simple inputs; it uses left joins
        //to the role entity -- jsut in case the join participant is empty
        const scalars = new registrar_sql(cols, this.role, 'left').toString();
        //
        //Get the compiled tabular sqls.
        const matrices: Array<{tname:string, body:sql.str}> = this.get_tabular_sqls();
        //
        //Compile and return the sql retrievers
        return {scalars, matrices};
    }
    
    //Return all the sqls for retrieving the tabular values, a.k.a. matrices.
    private get_tabular_sqls(): Array<{tname:string, body:sql.str}>{
        //
        //Convert each table element to its matching sql string.
        const sqls: Array<{tname:string, body:sql.str}> = this.ios.matrices.map(matrix=> {
            //
            //Destructire the table
            const {tname, body} = matrix;
            //
            //Get the columns of the mattrix
            const cols: Array<schema.column> = matrix.columns; 
            //
            //Create a tabular sql using table's columns
            const sql = new registrar_sql(cols, this.role, 'inner');
            //
            //Convert the sql to a statement and return it. 
            return {tname, body:`${sql}`};
        });
        //
        return sqls;
    }
   
}

//Use retrieved data to fill a form
class filler{
    //
    //
    constructor(public retrievee:retrievee, public form:questionnaire){}
    //
    //Use the retrieved data to complete this registration form
    execute(): void {
        //
        //Get the form's ios
        const ios = this.form.ios!;
        //
        //Destructure the data retriever to reveal the basic scalar values and
        //tabular matrices
        const data:retrievee = this.retrievee;
        //
        //Use the scalar values to fill all the simple inputs, assuming that the
        //io indices match those of the scalar basic values
        ios.scalars.forEach((io, index)=>io.value=data.scalars[index]);
        //
        //Get the io table
        const tables:Array<{
            tname:string, 
            columns:Array<schema.column>, 
            body:HTMLTableElement
        }> = ios.matrices;
        //
        //Match the form to the retrievee tables using position indices
        data.matrices.forEach((matrix, index)=>this.fill_matrix(matrix, ios.matrices[index]))
    }
    
    //
    //Fill the given data to the given table. Using the tname to index both data
    //and the ios is another alternative to using array positions. For now, we 
    //use the position indexing approach
    private fill_matrix(
        data:{
            tname:string,
            body:lib.matrix
        },
        table:{
            tname:string, 
            columns:Array<schema.column>, 
            body:HTMLTableElement
        }
    ) {
        //
        //Loop through all the data rows, creating a table row for each data row
        //and populating it with the basic values
        data.body.forEach(basic_values=>{
            //
            //Insert a row below the last one in the table element
            const tr: HTMLTableRowElement = table.body.insertRow();
            //
            //Create as may empty tds as there are colums of this table, and for
            //each td, create and io and assign it the basic value
            //that matches the column's index
            table.columns.forEach((col, index)=>{
                //
                //Create a td and append it to the row.
                const td = this.form.create_element("td", tr, {});
                //
                //Set the td's io value
                //
                //Create an achor, i.e., element plus its page, for the io
                const anchor = {element:td, page:this.form};
                //
                //Create the td's io. 
                const Io:io.io = io.io.create_io(anchor, col);
                //
                //Set the io's value (this must come after the show, thus ensuring
                //that the io's elements are in place)
                Io.value = basic_values[index];
            }) 
        })
    }
    
}

//An sql for retrieving scalars and tables that are in the registration form.
class registrar_sql extends sql.stmt{
    
    //Use the database columns to construct a scalar sql
    constructor(
        //
        //The columns on the input form corresponding to scalar inputs
        public cols: Array<schema.column>,
        //
        //The role of the user that is being registered, expressed as an entity
        public role:schema.entity,
        //
        //The type of joint between enties partcipating in a join. The default is
        //the inner join
        public join_type:'inner'|'left'='inner'
    ){
        //
        super();
    }
    //
    //The field selection of a scalar retrieving sql match the given ones
    get select():Array<schema.column>{ return this.cols;}
    
    //The scalars on a registration form are retrieved from the user's role 
    //entity.
    get from():schema.entity {return this.role;}  
    
    //The join of a scalar retrieving sql comprises of left joints from any
    //entity directly joined to the role one.
    get join(): sql.join{
        //
        //Collect the joints of this sql. There are as many joints as there are
        //entities in the select colums of this query, excluding the the role.
        //
        //Collect all the entities referenced by the select columns. They are 
        //described as dirty because they have dulicates
        const dirty_entities = this.select.map(col => col.entity);
        //
        //Clean the entities by removing duplicates
        const clean_entities = [...new Set(dirty_entities)];
        //
        //Exclude the role entity
        const entities = clean_entities.filter(entity=>entity!==this.role); 
        //
        //Convert the result into left joints to the role
        const joints = entities.map(entity=>new sql.joint(entity, this.role, this.join_type));
        //
        //Create and return the join
        return new sql.join(joints);
    }
    
   //Constratin the scalars to the user logged in, assuming that this is a self 
   //registration exercise
    get where(): sql.expression {
        //
        //There must be a user that is currently logged in
        const user = app.app.current.user;
        if (user===undefined)
            throw new schema.mutall_error('No user is currently logged in');
        //
        //We assume that the role entity has a column identfied by 'name'
        const username:schema.column = this.role.get_col('name');     
        
        //Return a binary expression that evaluates to a boolean value, thus
        //constraing the user to the one who logged in, in the current application
        return [username,'=', user.name];
    }
    
}

