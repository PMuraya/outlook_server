//
//Resolves reference to the asset.products data type
import * as outlook from 'outlook.js';
//
import * as app from '../../../outlook/v/code/app.js';
//
//Import schema from the schema library.
import * as schema from '../../../schema/v/code/schema.js';
//
//Resolve the iquestionnaire
import * as quest from '../../../schema/v/code/questionnaire.js';
//
//Resolve the modules.
import * as mod from '../../../outlook/v/code/module.js';
//
//Import server from the schema library.
import * as server from '../../../schema/v/code/server.js';
//
//import main from tracker
import main from './main.js';
//
//Resolve the piq.
import * as piq from './piq.js';
//
//import basic value from schema library.
import * as lib from '../../../schema/v/code/library';
//
//This is an executable sql statement.
type sql = string;
//
//The structure for holding the data to retrieve the data from the database to
// the registration form
interface sql_retriever {
    //
    //The sql for retrieving scalars, i.e., simple inputs.
    scalar:sql,
    //
    //The sqls for retrieving arrays, i.e., tabular inputs.
    tabular:Array<{
        //
        //The name of the table that is the source/destination of the data.
        tname: string,
        //
        //The sql to execute to retrieve the data for the table.
        body:sql
    }>
};
//
//The data retrieved using the retriever sql.
interface data_retriever {
    //
    //The scalar data retrieved from the database, i.e., simple inputs.
    scalar:{[index:string]: schema.basic_value},
    //
    //The sqls for retrieving arrays, i.e., tabular inputs.
    tabular:Array<{
        //
        //The name of the table that is the source/destination of the data.
        tname: string,
        //
        //The sql to execute to retrieve the data for the table.
        body: Array<schema.fuel>
    }>
};
//
//Get the user data from the database and prefill the PIQ form for editing.
export class edit_my_profile extends piq.register_intern{
    //
    //This is the css for selecting all simple inputs.
    public css = `[data-cname]:not(table *)`;
    //
    //This is the name of the base table to use for this work.
    public base_subject = ["intern", "mutall_tracker"];
    //
    //Create a new class instance
    constructor(mother: main) {
        //
        //Call the super class constructor with the mother page and the file name.
         super(mother);
    }
    //
    //Additional information needed after the page fires.
    async show_panels(): Promise<void> {
        //
        //Get the SQLs to retrieve the intern data.
        const sql:sql_retriever = this.get_intern_sql();
        //
        //Get the intern data from the database.
        const data:data_retriever = await server.exec(
            'database',
            [app.app.current.dbname],
            'get_intern_data',
            [sql]
        );
        //
        //Use the data to complete this(PIQ) form.
        this.complete_form(data, 'edit');
    }
    
    //
    // Extract all the database columns that correspond to scalar inputs.
    get_columns(): Array<schema.column>{
       //
        //Use the css for isolating scalar elements from the form.
        const scalar_inputs = Array.from(this.document.querySelectorAll(this.css));
        //
        //Get the derived column names from the scalar elements assuming that 
        //the current form has been checked for metadata checks.
        const labels = scalar_inputs.map(field => {
            //
            //Get the database name where to save the data.
            const dbname:string = field.getAttribute('data-dbname')!;
            //
            //Get the table name where to save the data.
            const ename:string = field.getAttribute("data-ename")!;
            //
            //Get the column name where to save the data.
            const cname:string = field.getAttribute('data-cname')!;
            //
            //Extract the column name from our database 
            const column = app.app.current.databases[dbname].entities[ename].columns[cname];
            //
            return column;
        }); 
        //
        return labels;
    }
    
    //
    //Get the sql that contains the intern data.
    get_intern_sql():sql_retriever {
        //
        //Get the scalar sql. 
        const scalar:sql = this.get_scalar_sql();
        //
        //Get the tabular sqls.
        const tabular: Array<{tname: string, body: sql}> = this.get_tabular_sqls();
        console.log({scalar, tabular});
        //
        return {scalar, tabular};
    }
    
    //
    //
    //Formulate the sql for retrieving the scalar values. It has the following 
    //structure:-
    // select $fields from $base $join where $base.$base = $user.
    // where 
    //  - $fields match all the scalar inputs.
    //  - $base corresponds the user table.
    //  - $join is a set of left joins connecting to the $base.
    //  - $user is the primary key that corresponds  to the primary key.
    get_scalar_sql():sql{
        //
        //Destructure the base subject to get the base table and database.
        const [ename, dbname] = this.base_subject;
        //
        //Get the database columns that correnspond to inputs on our form.
        const columns :Array<schema.column> = this.get_columns();
        //
        //Get the derived column names from the scalar elements assuming that 
        //the current form has been checked for metadata checks.
        const cnames = columns.map(column => column.str);
        //
        //Join the field names with a comma separator.
        const fields = cnames.join(", ");
        //
        //Create the joins as left joins to the base table to take care of 
        //missing data.
        const join = this.get_join(columns);
        //
        //The part that allows a user to select from either intern or user table.
        const from = `tracker.intern \t inner join mutall_users.user on tracker.intern.user = mutall_users.user.user.user `;
        //
        // Get the intern user name from the logged in user.
        const user: number = app.app.current.user!.pk!;
        //
        //Return the complete sql with the two parts.
        const sql = `
            select 
                ${fields} 
            from 
                ${from} 
                ${join} 
            where ${this.base_subject}.${this.base_subject}= ${user}`;
        //
        return sql;
    }
    //
    //Get the tables from the form and create a join.(use the left join).
    get_join(columns:Array<schema.column>):string {
        //
        // Extract the (dirty) entities mentioned in the columns; 
        // they are dirty as there can be duplicates.
        const dirty_entities: Array<schema.entity> = columns.map(col => col.entity);
        //
        //Remove duplicates 
        const entities: Array<schema.entity> = [...new Set(dirty_entities)];
        //
        // Remove the base entity.
        //
        //Get the base entity.
        //
        //Get the base entity name from the curret setup. It is the first 
        //component of our base_subject property.
        const base_name: string = this.base_subject[0];
        //
        //Get the entity from the base name above.
        const base_entity: schema.entity = app.app.current.dbase!.entities[base_name];
        //
        //Get the other entities without the base entity.
        const pointers: Array<schema.entity> = entities.filter(entity => entity !== base_entity);
        //
        //Map the pointers entities to their foreign equivalents.
        //
        //Let f be the table that the given source is joined to.
        const pair = (pointer: schema.entity): {pointer:schema.entity, foreign:schema.entity} => { 
            //
            //There are two databases involved in the form they are:-
            // -mutall_users and
            // - the current application database.
            // If the subject x  is the base table we shall link it to the base 
            // table. If its from mutall_users we shall link to mutall_users
            // otherwise there is a problem.
            switch(dbname) {
                //
                case 'mutall_users':return [dbname, "user"];
                break;
                //
                case base_dbname : return [dbname, base_ename];
                //
                default: throw new schema.mutall_error(`The ${dbname} is not among the ${base_dbname} or mutall_users.`);
            }
        }
        //
        // Map the tables to their joins.
        const joints = other_subjects.map(subject => [pair(subject), subject])
        //
        // loop through the tables and for each create a join statement.
        const joins:Array<string> = joints.map(pair => {
            //
            //Destructure the subject.
            const [from, to] = pair;
            //
            //Destructure  the from and to.
            const [from_ename, from_dbname] = from;
            //
            //Destructure the to.
            const [to_ename, to_dbname] = to;
            //
            // Complete the on clause. The "to" subject supplies the forign key.
            const on:string = `${from_dbname}.${to_ename} = ${from_dbname}.${from_ename}`;
            //  
            //  The subject to join is the 'to'.
            return `left join ${to_dbname}.${to_ename} on ${on}`;
        });
        //
        //Convert the array of joins to a string.
        const join = joins.join('\t');
        //
        //Return the complete join.
        return join;
    }
    //
    //Formulate the sql for retrieving the tabular values.
    get_tabular_sqls(user_name: string): { tname: string; body: sql; }[] {
        //
        //Collect the table names.
        const all_tables: Array<HTMLTableElement> = Array.from(document.querySelectorAll('table'));
        //
        //Get the requirements and formulate the sql statements for each table from the form.
        const tables: Array<{tname: string;body: string;}> = all_tables.map(table => {
            //
            //Get the th's of the table.
            const ths: Array<HTMLTableCellElement> = Array.from(table.querySelectorAll('th')!);
            //
            //Get the table name
            const tnames: Array<string>= ths.map(th =>th.getAttribute('data-ename')!);
            //
            //Get one name from the duplicates, and return as a string.
            const tname:string = String([...new Set(tnames)]);
            //
            //Formulate the sql for this table.
            //
            // 1. Get the column names of the table.
            const cnames: Array<string> = ths.map(th => th.getAttribute('data-cname')!);
            //
            //Convert the array to a strimg
            const names: string = cnames.join(", ");
            // 
            // Destructure the base_subject to get the base table.
            //
            // 2. Create the sql statement.
            const body:sql = `select ${names} from ${this.base_table} where ${this.base_table}.name = '${user_name}'`;
            //
            return {tname, body};
        });
        //
        return tables;
    }
    //
    //Use the data to complete this(PIQ) form.
    complete_form(data: data_retriever, mode: "edit" | "normal"): void {
        //
        //Select all the simple inputs.
        const scalars: Array<Element> = Array.from(document.querySelectorAll(this.css));
        //
        // Add the simple data to the form.
        this.populate_scalars(scalars, Object.values(data.scalar));
        //
        // Get the tabular inputs.
        const tabular: Array<HTMLTableElement> = Array.from(document.querySelectorAll('table'));
        //
        // Add the table data to the form.
        this.populate_tabular(tabular, Object.values(data.tabular));
        
    }
    //
    //Fill the simple inputs of the form with the interns data.
    populate_scalars(inputs: Element[], values:Array<schema.basic_value>) {
       //
       //Set the values to the input elements.
        inputs.forEach((input,index)=> this.set_value(input, values[index]));
    }
    //
    // Set the  values for each input element.
    set_value(input: Element, value: string | number | boolean | null): void {
        //
        const data_io = input.getAttribute("[data-io]");
        //
        // switch through all the data-io types as for each set the value.
        switch(data_io){
            //
            //The case is input
            case "input": {
                //
                //Get the input element from the template.
                const field: HTMLInputElement = input.querySelector("input")!;
                //
                //Set the value to the html element.
                field.value = String(value);
            }
            break;
            //
            //The case is checkbox
            case "checkbox": {
                //
                //Get the input element from the template.
                const field: HTMLInputElement = input.querySelector("input")!;
                //
                //Set the value to the html element.
                if(field.value === "yes") field.checked? 'yes': 'no';
            }
            break;
            //
            //The case is checkboxes
            case "checkboxes": {
                //
                //Get the input elements from the template.(decode the values and for each add to the template).
                // const checkboxes = ;
            }
            break;
            //
            //The case is textarea
            case "textarea": {
                //
                //Get the textarea element from the template.
                const field: HTMLTextAreaElement = input.querySelector("textarea")!;
                //
                //Set the value to the html element.
                field.value = String(value);
            }
            default: throw new schema.mutall_error(`Unknown ${data_io}! Please check to add to the existing.`);
        }
    }
    //
    //Fill the tables with the intern data.
    populate_tabular(tabular: HTMLTableElement[], tabular_values: {tname: string; body: Array<schema.fuel>;}[]) {
        //
        // Loop through all the tables setting data for each.
        tabular.forEach((table, index)=> {
            ???
        });
    }
}