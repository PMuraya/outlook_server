//
import * as schema from '../../../schema/v/code/schema.js';
//
import * as server from '../../../schema/v/code/server.js';
//
//Resolve the iquestionnaire
import * as quest from '../../../schema/v/code/questionnaire.js';
//
import {view} from "./view.js";
//
import {baby, popup} from "./outlook.js";
//
//Import app class.
import {app, user, business} from "./app.js";
//
//Resolve the modules.
import * as mod from './module.js';

//
//Complete the level one registration of the user after logging into the system.
export class complete_lv1_registration
    extends baby<{role_ids:Array<string> , business: business} | undefined>
    implements mod.questionnaire
{
    //
    public user?:user;
    //
    //The current application's database name
    get app_dbname(){return app.current.dbase!.name};
    //
    //The user database name;
    get user_dbname(){return app.current.config.user_subject.dbname; };
    //
    //construct the reg class
    constructor(app: app) {
        //
        //Call the super class constructor with the file name.
        super(app,'/outlook/v/code/lv1_reg.html');
    }
    //
    //Collect the (layout) data from this above for saving to the database
    get_layouts(): Array<quest.layout> {
        //
        //Get the user that is currently logged in.
        const user = app.current.user;
        //
        //We assume that the user must have logged in successfuly
        if (user===undefined) 
            throw new schema.mutall_error("Sorry, the user is not logged in");
        //
        //The user must have selected the business for  which s/he is regsietering
        const business = this.result!.business;         
        //
        //Ensure that the business is actually  set.
        if( business=== undefined) 
            throw new schema.mutall_error(`Business has not been set.`);
        //
        //Get the user roles specified for teh user
        const roles:Array<string> = this.result!.role_ids;
        //
        //Return the business and subscription data.
        return [
            //
            //Collect the user name; 
            [this.user_dbname, 'user', [], 'name', user.name],
            //
            //Collect the subscription data (labels), including players
            ...this.get_subscription_data(roles),
            //
            //Collect the user business/membership data (labels).
            ...this.get_business_data(business),
            //
            //Collect the data (labels) for linking the local database to the
            //shared database(mutall_users).
            ...this.link_to_mutall_users(user, business, roles)];
    }
    //
    //Link the application and user databases.
    *link_to_mutall_users(user:user, business:business, roles:Array<string>): Generator<quest.label> {
        //
        //1. Link the user table to as many tables in the application database as
        //there are roles
        for(let i = 0; i < roles.length; i++){
            //
            //The name of the table in the application datanase that matches
            //this role.
            const role = roles[i];
            //
            //Assuming that name is a field on the role table in the
            //application as the onlu unique identifier.....
            yield[this.app_dbname, role ,[],"name", user.name];
        }
        //
        //2. Link the user business to the corresponding one in the application
        //database. 
        //
        //The table name that matches business a database can be
        //derived from the data model. 
        const entity = app.current.get_business_entity();
        //
        //Compile the business label usoing the application database and 
        //assuming that the entity has id column that uniquely identifes a 
        //business. In future this assumption will be dropped
        yield[this.app_dbname, entity.name, [],  "id", business.id];
    }
    //
    //Collect the data (i.e., member) that links the user to a business. 
    //Get business data. A member is uniquely defined by a user and the 
    //a business 
    *get_business_data(business: business): Generator<quest.layout> {
        //
        //2. Collect the business id
        yield[this.user_dbname, 'business', [], 'id', business.id];
        //
        //collect the business name.
        yield[this.user_dbname, 'business', [], 'name', business.name];
        //
        //Force a member as it has no available attributes (to annunce its 
        //presence in this database)
        yield[this.user_dbname, "member", [], "member", null];
    }
    
    //Collect the labels (data) for the subscription sub-system.
    //
    //A subscription is uniquely identified by:-
    //-the user, who is subscribing
    //-the player, who is defined by both application and the role the that he
    //  is subscribing to
    //-the end date of the subscription. By default it is the 'end of time'
    //When a subription is terminated, the end date is updated.        
    *get_subscription_data(roles:Array<string>): Generator<quest.label>{
        //
        //Collect the application id.
        yield[this.user_dbname, 'application', [], 'id', app.current.id];
        //
        //Collect the players labels.
        //
        //A player is the association of an application and the role that the
        //user plays in that application
        //
        //For the current application, collect as many player labels
        //as there are roles
        //
        //For each role, collect the player and role labels. NB: The 'forEach' 
        //and 'yield' constructs do not go well together. Hence the 'for(...)' 
        //version
        for(let i = 0;i < roles.length; i++){
            //
            //A player is uniquely identifed by...
            //
            //...(a) the role palyed by the user in an application
            yield[this.user_dbname, 'role', [i], 'id', roles[i]];
            //
            //....(b) the application associated with the role -- whose label 
            //is already defined above.
            //
            //The presence of these 2 identifies in a dataset does not always
            //define a role. So, if you don't do anything, no player will not be 
            //saved to the datanase and therefore the role and the application 
            //will not be linked. To solve this, we need to announce the presence 
            //of a playe as follows:-  
            yield[this.user_dbname, 'player', [i], 'player', null];
            //
            //There are may subscriptions as there are players
            //
            //Collect the end date of the subscription. NB:Although the default is 
            //end-date is hard-wired into the database, we need at least one label 
            //referring to the subscription. That is a design feature of the data 
            //writer module
            yield[this.user_dbname, 'subscription', [i], 'end_date', view.end_of_time];
        }; 
    }
    //
    //Get the result.
    async get_result(): Promise<{role_ids:Array<string> , business: business}> {
        return this.result!;
    }
    //
    //Collect and check the data from the form.
    async check(): Promise<boolean> {
        //
        //1. Collect and check the data entered by the user.
        //
        //1.1 Collect the role ids
        const role_ids:Array<string> = this.get_input_choices('roles');
        //
        //1.3 Collect the business .
        const business:business = await this.get_business();
        //
        //Save the role and business to the result.
        this.result = {role_ids, business};
        //
        //2. Save the data to the database.
        const save = await app.current.writer.save(this);
        //
        //3. Return the result if the was successful.
        return save;
    }
    //
    //Get the business from the current page. Its either from the selector
    //as a primary key or from direct user input as name and id.
    async get_business(): Promise<business> {
        //
        //Get the select element.
        const pk = this.get_selected_value('organization');
        //
        //Test for the value thats 0 and if so return the id and name.
        if(pk === '0') {
            //
            //Get the id .
            const id = this.get_input_value('id');
            //
            //Get the name.
            const name = this.get_input_value('name');
            //
            //return the id and name.
            return {id, name};
        }
        //
        //from a selector, use the pk to get the id of the business..
        const business:business = await this.get_business_info(pk);
        //
        return business;
    }
    //
    //Get the id from the given primary key of the business.
    async get_business_info(pk: string):Promise<business> {
        //
        //formulate the query to get the business id.
        const sql = `
            select
                id,
                name
            from
                business
            where
                business.business = ${pk}
        `;
        //
        //Execute the query to the database and get the result.
        const business_id:Array<{id:string, name:string}> = await server.exec(
            'database',
            [this.user_dbname],
            'get_sql_data',
            [sql]
        );
        //
        //return the result.
        return {id: business_id[0].id, name: business_id[0].name};
    }
    //
    //add an event listener.
    async show_panels(): Promise<void> {
        //
        //Populate the roles fieldset.
        this.fill_user_roles();
        //
        //Populate the business selector with businesses.
        //Hint. Use the selector query to populate.
        this.fill_selector( "business",this.user_dbname, "organization");  
    }
   //
   //Fill the user roles with the roles from the database. 
    fill_user_roles() {
        //
        //Get the current application database. It must be set
        const dbase = app.current.dbase;
        if (dbase===undefined) 
           throw new schema.mutall_error(`No database found for this application`);
        //
        //Collect the user roles from the application's database
        const inputs = dbase.get_roles();
        //
        //It a sign of a design flaw if there are no roles
        if (inputs.length===0)
            throw new schema.mutall_error(`Database ${dbase.name} does not have user roles`)
        //
        //Get the div element to attach the roles
        const elem = this.get_element('content');
        //
        //Loop through the array to create each role.
        inputs.forEach(input =>{
            //
            //create a label element.
            const label = this.create_element( "label", elem, {textContent:input.name});
            //
            //Create a new input element and add the attributes(inputs)
            const role = this.create_element( "input" , label, { type:"checkbox", name:'roles' ,id: input.name, value:input.value});
            //
            //Add the values to the content.
            label.append(role);
        });
    }
}
//
//THis class allows a user who wants to create a new business to provide
// the business name and the business_id to support login incase the business is
//not among the ones listed.
class register_business extends popup<business>{
    //
    //constructor
    constructor(
        //
        //A business is defined by the business_name and the business_id
        public business?: business
    ) {
        super("new_business.html");
        //
    } 
    //
    //Return all inputs from a html page and show cases them to a page
    async get_result(): Promise<business> {return this.result!;}
    //
    //Collect and check the recursion data and set the result.
    async check(): Promise<boolean> {

        //1. Get and check the business name of the element
        const name:string= this.get_input_value("name");
        //
        //2. Get and check the business_id from the business
        const id:string= this.get_input_value("id");
        //
        //Initialize the result
        this.result ={id, name};
        //
        //Save the result from a popup.
        return true;
    }
    get_layouts(): Array<quest.layout>{
        return Array.from(this.create_business());
    }
    *create_business(): Generator<quest.layout>{

        //Get the business name
        yield["mutall_users", "business", [], "name", this.result!.name];
        //
        //Get the business_id
        yield ["mutall_users", "business", [], "id", this.result!.id];
  
    }
    //
    //This method sends some feedback to the user once the user has successfully
    //registered a business
    async show_panels() {
        //
        //Show an alert if a user saved the data correctly.
        if (this.business!) 
            alert
                ("You have successfully created your business,\n\
                   please relogin to select the business"
                );
    }

}
