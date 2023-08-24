declare namespace php_fn{ 
    //Mutall label format for exporting data to a database.
    //The data has the following structure [dbname, ename, alias, cname, value].
    type dbname = string;
    type mutall_ename = string;
    type alias = Array<number>;
    type mutall_cname = string;
    type value = boolean|number|string;
    type label = Array<[dbname, mutall_ename, alias, mutall_cname, value]>;
    //
    //the key value pair resolved as data from a select query 
    //describing this structure [{role.name: "tenant"}] or 
    //[{role.name: "tenant"},{role.name: "tenant"}]
    //This entries could increase as there are columns 
    /**type row */
    type row =object
    //
    /**type cname*/
    //Mostly required by the partial sql to generate the entity and 
    //database to which the column belongs. it should contain the 
    //minimum information required to obtain a column from any database
    //i.e dname.ename.cname
    //currently researching on how to add constrains to my string ie 
    //should contain three periods and the period should not be the 
    //last thing for now it is a string 
    type cname =[ename,string];
    //
    /**type ename*/
    //Describes a schema entity as a string with the basic information 
    //that can be used to create an entity that is the entity name and
    //the dbname i.e ename.dbname string for now 
    type ename = [string,string];
    //
    /**type condition*/
    //This model a boolean expression that can be used as a criteria to
    //retrieve data from a database i.e role.name='tenant'
    type condition = string;
    //
    

     class database {
        //
        /**query(sql:string)  */
        //Used for saving data in the server that returns a void mostly
        //for queries that do not have a return i.e create, update and delete
        //Any errors that arise from this method are alerted by dumping them 
        //using a new window and also console logs any errors.
        //This query assumes that the sql is implicity from the current database
        /**consult from the team the  best way to handle a database name was
         * thinking of introducing a dbname parameter*/
        static query(sql: string):{html:string,ok:boolean};
        //
        /**get_sql_data(sql:string):array<row>*/
        //Retrieves the data from that satisfy a given sql provided returning 
        //a row whose data is shown above 
        //e.g select * from assignment 
        //This kind of sql assumes the data is being retrieved from the current
        //application database i.e last actively used whose name is in the config
        //Incase the data is intended to be retrieved accross another database
        //include a complete sql with databasename.tablename.columnname
        //e.g select * from tracker.assignment {where tracker is the dbname}
        /** The same is done for the columns e.g select tracker.assignment.assignment
        from tracker.assignment*/
        static get_sql_data(sql: string): Array<row>;
        //
        //
        //3. alter
        //alters the comment of entity mostly used by metavisuo to add
        //a title etc
        //Note this method is not created but i need it for the
        //
        
        //
        /** export_structure(dbname:string)*/
        static export_structure(dbname: string);
    }
    //
  class record {
        //
        //export 
        //php implementation
        //
        //Exports the data from the record to the database by
        //function export(array $sachet=null, bool $keep_log=true, bool $roll_back_on_fatal_error=true):\root\expression{
        static export(milk: label, format?: "label", keep_log?: boolean, roll_back_on_fatal_error?: boolean); 
    }
    class partial_select {
        // 
        // 
        constructor();
        //
        /**execute(source:ename,columns:Array<cname>,where:condition,rtn:"data"|"label"|"tabular")*/
        //Retrieves column data that specify the given condition 
        //from the database parameters
        //columns: these are the columns' whose data  is to be retrieved
        //from the database 
        //source: this is an table name or a saved view its of type ename 
        //desribed above it used to formulate the from clause of the sql
        //where is the condition used to filter the data from the database
        //retn this is the expected return type 
        static execute(source: ename, columns: Array<cname>, where: condition, rtn: "data" | "label" | "tabular");
    }
     class id_sql {
        //
        constructor(source: ename, dbname: string,)
        /**execute(sou  rce: ename, dbname:dbname, rtn: "data" | "label" | "tabular")  */
        //displays all the id columns related to a particular ename 
        static execute(where:string, sort:string, rtn: "data" | "label" | "tabular")
    }
    class editor{
        //
        constructor(source: ename, dbname: string);
        /**execute(source: ename, dbname:dbname, rtn: "data" | "label" | "tabular")  */
        //displays all the id columns related to a particular ename 
        //static execute(filter: string, sort: string);
        static execute(ename: string, dbname: string, filter: string, sort: string);
    }
    /**  */
     class user {
        constructor(name: string);
        //
        //Returns the roles, as saved in a database, played by 
        //the logged in user
        static get_roles(name: string, app_id: string): Array<string>;
        //
        //Exports the given milk (data) to  database and rturns a html text
        //of result e.g
        //Saved with:3 warnings
        static export_data(milk: label): {html:string};
        
    }

}