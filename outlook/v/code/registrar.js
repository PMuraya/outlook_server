//
//Resolves reference to the asset.products data type
import * as outlook from '../../../outlook/v/code/outlook.js';
//
//Bring the app, so we can access the user currently logged in
import * as app from '../../../outlook/v/code/app.js';
//
//Import schema from the schema library.
import * as schema from '../../../schema/v/code/schema.js';
//
//Import server from the schema library.
import * as server from '../../../schema/v/code/server.js';
//
//Resolve referenecs to the sql.
import * as sql from '../../../outlook/v/code/sql.js';
//Resolve referenecs to the io library
import * as io from '../../../schema/v/code/io.js';
//
//A class that provides CRUD functionality to support friendly registration of 
//users, including:-
//- creating data using a form similar to paper questionnairs (PIQ)
//- reviewing the data in an intuitive fashion
//- updating the data, using a form that looks looks the original one used for
//for data entry
export class registrar
//
//This class can administer data entry as baby page (form) of some other 
//mother page. It does not reutrn match, just true or undefined
 extends outlook.baby {
    mode;
    role;
    //
    //Collect the columns that  correspond to the simple inputs, i.e., scalars
    scalars;
    //
    //The columns of all the tables that are in this form
    matrices;
    //
    //Create a new class instance; the mother of this page is an application 
    //page. This class may be used to support any CRUD function, depending on the
    //mode
    constructor(
    //This baby's mother page
    mother, 
    //
    //The CRUD servived we desire
    mode, 
    //
    //This is the reference to the table that matches the role being played
    //by the user in this application. 
    role, 
    //
    //The url pointting to the page template
    url) {
        //
        //Call the super class constructor with the mother page and the file name.
        super(mother, url);
        this.mode = mode;
        this.role = role;
        //
        //Collect the simple column io values correspond to the simple inputs, 
        //i.e., scalars
        this.scalars = this.get_scalar_ios();
        //
        //Collect the matrices, i.e., tables are in this form
        this.matrices = this.get_tables();
    }
    //
    //Satisfy the baby interface requirements
    async get_result() { return true; }
    //
    //After the page shows up, paint it with the data retrieved from the server--
    //ready for editing.
    async show_panels() {
        //
        //Get the set of sql statements to retrieve the user's data data.
        const retriever_sql = this.get_sql_retriever();
        //
        //Use the sql statements to retrieve the data from the database that matches
        //the user's role.
        const result = await server.exec(
        //
        //The class that implements the registrars CRUD functionality
        'registrar', 
        //
        //Use the database in which matches the user's role
        [this.role.name], 
        //
        //The registrar service to support the RU in CRUD
        'retrieve_data', 
        //
        //The sqls needed for data retrieval
        [retriever_sql]);
        //
        //Use the rerieved result to complete this(PIQ) form in the current.
        this.fill_form(result);
    }
    //Implement the questionnaire interface required by the database writer. This
    //means implementing teh get_layout method which collects label and table
    //layouts needed for saving teh data in this form to a database
    get_layouts() {
        return [...this.collect_layouts()];
    }
    //Collect all label layouts from the scalars on this form, plus and tables 
    //and thoer associated lookup columns
    *collect_layouts() {
        //
        //Collect label layours that match each ion in the scalar collection
        for (const io of this.scalars) {
            //
            //Collect the scalar label
            yield io.get_label_layout();
        }
        //
        //Collect all the layouts from a table, whichs has the structire
        //{element:HTMLTableElement, columns:Array<schema.column>}.
        for (const table of this.matrices) {
            //
            //Collect the tabular layout
            //
            //Destructure the table to reveal the table element and its associated
            //columns
            const { element, columns } = table;
            //
            //Get the name of the table from the element. It must exist
            const tname = element.id;
            if (tname === null)
                throw new schema.mutall_error(`This table is not named.`, element);
            //
            //Use the element to compile the desired table
            const tlayout = this.get_table_layout(tname, element);
            //
            //Skip the table if it is undefined
            if (tlayout === undefined)
                continue;
            //
            //Collect the table layout
            yield tlayout;
            //
            //Collect the labels for writing the table columns to a database
            for (let i = 0; i < columns.length; i++) {
                //  
                //Get teh column at tyhe i'th index
                const col = columns[i];
                //
                //Get the database columm's name
                const cname = col.name;
                //
                //Get the entity in which the column is found
                const ename = col.entity.name;
                //
                //Get the name of the database wher teh entity is found
                const dbname = col.entity.dbase.name;
                //
                //The alias is compiled from the name of the table being exported
                const alias = [tname];
                //
                //Get the value of this column will label's expression is a looked 
                //up from the named table and column
                const exp = ['\\mutall\\capture\\lookup', tname, i];
                //
                //Collect the lookup column for the table
                yield [dbname, ename, alias, cname, exp];
            }
        }
    }
    //Returns the (questionnaire) layout of a table
    get_table_layout(tname, element) {
        //
        //The body of the matrix table is derived
        const body = this.get_table_body(element);
        //
        //If teh body is undefined, return undefiend; otherwise continue
        if (body === undefined)
            return undefined;
        //
        //Define a questionnaire matrix as a tabuilat layou for exporting data
        //laid out as a simple 2x2 matrix; 
        const matrix = {
            class_name: '\\mutall\\capture\\matrix',
            args: [
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
    get_table_body(element) {
        //
        //Get the table's first body element.
        const tbody = element.tBodies[0];
        //
        //Retrieve  all the input rows under the table's body
        const input_rows = Array.from(tbody.rows);
        //
        //Initialize the desired rows of with an empty matrix
        const output_rows = [];
        //
        //For each row of input....
        for (const input_row of input_rows) {
            //
            //Create a new empty row of data;
            const output_row = [];
            //
            //Get all the input row's columns
            const tds = Array.from(input_row.cells);
            //
            //For each column
            for (const td of tds) {
                //
                //Get the corresponding io
                const Io = io.io.get_io(td);
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
    //Get the io, i.e., structured values, for feeding the simple inputs of 
    //this form
    get_scalar_ios() {
        //
        //This is the css for selecting all simple inputs. They are elements marked
        //with the data-cname attribute and outside of any table element
        const css = `[data-cname]:not(table *)`;
        //
        //Use the css for isolating scalar elements from the form. Force them
        //into html elements
        const scalar_inputs = Array.from(this.document.querySelectorAll(css));
        //
        //Map the scalar inputs to the columns. Corece the inputs to a 
        return scalar_inputs.map(input => this.get_element_io(input));
    }
    //Returns the database column that matches the given input element. 
    //The element may or may not be referencing a table. If it does, the oftable 
    //parameter tells us which one.  
    get_element_col(input, oftable = "") {
        //
        //Get the database name where to save the data.
        const dbname = this.get_attribute_value(input, 'data-dbname');
        //
        //Ensure that the database exist
        const dbase = schema.schema.databases[dbname];
        if (dbase === undefined)
            throw new schema.mutall_error(`Database ${dbname} ${oftable} is not found on this server`);
        //
        //Get the table name where to save the data, and ensure it exist
        const ename = this.get_attribute_value(input, "data-ename");
        //
        //Ensure that the named entity exist in the database
        const entity = dbase.entities[ename];
        if (entity === undefined)
            throw new schema.mutall_error(`Entity ${dbname}.${ename} ${oftable} is not found`);
        //
        //Get the column name where to save the data.
        const cname = this.get_attribute_value(input, 'data-cname');
        //
        //Ensure that the name column exist in the entity
        const col = entity.columns[cname];
        if (col === undefined)
            throw new schema.mutall_error(`Column ${dbname}.${ename}.${cname} ${oftable} is not found`);
        //
        return col;
    }
    //Returns the io, i.e., value, that matches the given input element. 
    get_element_io(input) {
        //
        //Get the dataase column that matcjes this input element
        const col = this.get_element_col(input);
        //
        //Define the value's anchor
        const anchor = { element: input, page: this };
        //
        //Get the io value type using the the user defined attribure - data-io
        const io_str = input.getAttribute('[data-io]');
        //
        //If the attribute is not found, then set it as undefiend
        const io_type = io === null ? undefined : io_str;
        //
        //Create and return the io    
        return io.io.create_io(anchor, col, io_type);
    }
    //Return the tables and their header columns ffrom this registration form
    get_tables() {
        //
        //1. Get all the tables in the form that are not marked as ignored
        //
        //1.1 Let css be the identifier of tables hat are not ignored
        const css = 'table:not([data-ignore] *)';
        //
        //2.2 Retrieve all the tables from this form, convering them into an 
        //array
        const table_elements = Array.from(this.document.querySelectorAll((css)));
        //
        //
        //2. Map each table to its columns
        const tables = table_elements.map(element => this.get_table(element));
        //
        //3. Return the tables of columns
        return tables;
    }
    //Returns a table and its header columns given table element
    get_table(element) {
        //
        //Get an identifier for the table, for use in reporting. 
        const id = element.id;
        //
        //Tables used in CRUD functions must be identified
        if (id === null) {
            console.log(element);
            throw new schema.mutall_error(`This table this form does not have an identifier. See console.log for details`);
        }
        //
        //Get the header column elements (i.e., th) of the given table as an 
        //array
        const ths = Array.from(element.querySelectorAll('th'));
        //
        //Map each column element to its schema column equivalent, passing the 
        //table id for reporting purposes
        const columns = ths.map(th => this.get_element_col(th, `(of table '${id}')`));
        //
        //Return the results
        return { element, columns };
    }
    //Compile the sqls that retrieve the registration data for editing purposes.
    get_sql_retriever() {
        //  
        //Get the database columns from all the scalar io of this form. The 
        //column must be defined
        const cols = this.scalars.map(io => io.col);
        //
        //Get the sql for constructing the simple inputs; it uses left joins
        //to the role entity -- jsut in case the join participant is empty
        const scalar = new registrar_sql(cols, this.role, 'left');
        //
        //Get the compiled tabular sqls.
        const tabular = this.get_tabular_sqls();
        //
        //Compile and return the sql retrievers
        return { scalar: `${scalar}`, tabular };
    }
    //Return all the sqls for retrieving the tabular values, a.k.a. matrices.
    get_tabular_sqls() {
        //
        //Conver each table element to its matching sql statement.
        const stmts = this.matrices.map(matrix => {
            //
            //Get the columns of the mattrix
            const cols = matrix.columns;
            //
            //Create a tabular sql using table's columns
            const sql = new registrar_sql(cols, this.role, 'inner');
            //
            //Convert the sql to a statement and return it. 
            return `${sql}`;
        });
        //
        return stmts;
    }
    //
    //Use the retrieved data to complete this registration form
    fill_form(data) {
        //
        //Destructure the ddata retriever to reveal the basic scalar values and
        //tabular matrices
        const { scalars, matrices } = data;
        //
        //Use the scalar values to fill all the simple inputs, assuming that the
        //io indices match those of the scalar basic values
        this.scalars.forEach((io, index) => io.value = scalars[index]);
        //
        //Match the form tables to trices using position indices
        this.matrices.map((matrix, index) => this.fill_matrix(matrix, matrices[index]));
    }
    //
    //Fill the specified table with the given data.
    fill_matrix(table, data) {
        //
        //Loop through all the data rows, creating a table row for each data row
        //and poulating it with the basic values
        data.forEach(basic_values => {
            //
            //Insert a row below the last one in the table element
            const tr = table.element.insertRow();
            //
            //Create as may empty tds as there are colums of this table, and for
            //each td, create and io and assign it the basic value
            //that matches the column's index
            table.columns.forEach((col, index) => {
                //
                //Create a td and append it to the row.
                const td = this.create_element("td", tr, {});
                //
                //Set the td's io value
                //
                //Create an achor, i.e., element plus its page, for the io
                const anchor = { element: td, page: this };
                //
                //Create the td's io. 
                const Io = io.io.create_io(anchor, col);
                //
                //Set the io's value (this must come after the show, thus ensuring
                //that the io's elements are in place)
                Io.value = basic_values[index];
            });
        });
    }
    //Chec the values of this form and process it, reporting any
    async check() {
        //
        //Check that the inputs on the form is valid data
        //
        //Save the data to the database (using the writer)
        app.app.current.writer.save(this);
        //
        //Send message to the CEO that new member has registered 
        //(using the messenger)
        //
        //Schdule any events -- if necessary(using teh scheduler)
        //
        //Update the book of accounts -- if necessary (using the accountant)
        return true;
    }
}
//Sql for retrieving scalars and tables that on are the registration form.
class registrar_sql extends sql.sql {
    cols;
    role;
    join_type;
    //Use the database columns to construct a scalar sql
    constructor(
    //
    //The columns on the input form corresponding to scalar inputs
    cols, 
    //
    //The role of the user that is being registered, expressed as an entity
    role, 
    //
    //The type of joint between enties partcipating in a join. The default is
    //the inner join
    join_type = 'inner') {
        //
        super();
        this.cols = cols;
        this.role = role;
        this.join_type = join_type;
    }
    //
    //The field selection of a scalar retrieving sql match the given ones
    get select() { return this.cols; }
    //The scalars on a registration form are retrieved from the user's role 
    //entity.
    get from() { return this.role; }
    //The join of a scalar retrieving sql comprises of left joints from any
    //entity directly joined to the role one.
    get join() {
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
        const entities = clean_entities.filter(entity => entity !== this.role);
        //
        //Convert the result into left joints to the role
        const joints = entities.map(entity => new sql.joint(entity, this.role, this.join_type));
        //
        //Create and return the join
        return new sql.join(joints);
    }
    //Constratin the scalars to the user logged in, assuming that this is a self 
    //registration exercise
    get where() {
        //
        //There must be a user that is currently logged in
        const user = app.app.current.user;
        if (user === undefined)
            throw new schema.mutall_error('No user is currently logged in');
        //
        //We assume that the role entity has a column identfied by 'name'
        const username = this.role.get_col('name');
        //Return a binary expression that evaluates to a boolean value, thus
        //constraing the user to the one who logged in, in the current application
        return [username, '=', user.name];
    }
}
//The io column, links an io to a database column
