//
import * as outlook from "./outlook.js";
//
//Import app class.
import * as app from "./app.js";
//
//Resolve the reference to the schema
import * as schema from "../../../schema/v/code/schema.js";
//
//Resolve the reference to the server
import * as server from "../../../schema/v/code/server.js";
//
//Complete the level one registration of the user after logging into the system.
export class complete_lv1_registration extends outlook.baby {
    //
    user;
    //
    //construct the reg class
    constructor(app) {
        //
        //Call the super class constructor with the file name.
        super(app, "/outlook/v/code/lv1_reg.html");
    }
    //
    //Collect the data from the form above for saving to the db
    get_layouts() {
        //
        //Return the business and subscription data.
        return [
            //
            //Collect the user/business/membership labels.
            //...this.get_business_data(),
            //
            //Collect the subscription labels
            ...this.get_subscription_data(),
            //
            //Collect the labels for linking the local database to the
            //shared database(mutall_users).
            ...this.link_to_mutall_users()
        ];
    }
    //
    //Link the local database to the users database.
    *link_to_mutall_users() {
        //
    }
    // //
    // //Get business data
    // *get_business_data(): Generator<quest.layout> {
    //     //
    //     //Ensure that the business is set.
    //     if(this.result!.business === undefined)
    //         throw new schema.mutall_error(`Business has not been set check your code.`);
    //     //
    //     //Get the business.
    //     const business = this.result!.business;
    //     //
    //     //
    //     if(business.source === 'user'){
    //         //
    //         //2. Collect the business id
    //         yield['mutall_users', 'business', [], 'id', business.id];
    //         //
    //         //collect the business name.
    //         yield['mutall_users', 'business', [], 'name', business.name];
    //     }else{
    //         //collect the primary key.
    //         yield["mutall_users", 'business', [], 'business', business.pk];
    //     }
    //     //
    //     //Yield the current member (with a null primary key) in the mutall_user database.
    //     yield["mutall_users", "member", [], "member", null];
    //     //
    //     // Ensure the users and businesses in the local database are linked
    //     //to the mutall_users database.
    //     //
    //     if(business.source === 'user') {
    //         //yield the business in the local database i.e the table that has the business name.
    //         yield[app.app.current.dbname , "organization", [],"id", business.id];
    //         //
    //         yield[app.app.current.dbname , "organization", [],"name", business.name];
    //     }
    //     //
    //     //Extract the role as a string.
    //     const myrole = this.result!.role_ids!.join();
    //     //
    //     if (app.app.current.user!.name === null ) {
    //         throw new schema.mutall_error("No user name");
    //     }
    //     //
    //     //yield the user in local database i.e the entity that is the user.
    //     yield[app.app.current.dbname, myrole ,[],"name", app.app.current.user!.name];
    // }
    //
    *get_subscription_data() {
        //
        const user = app.app.current.user;
        //
        //Collect the user and application data.
        yield ["mutall_users", "application", [], "id", app.app.current.id];
        //
        if (app.app.current.user.name === null) {
            throw new schema.mutall_error("You cannot login without a user name");
        }
        yield ["mutall_users", "user", [], "name", user.name];
        //
        //Collect as much subcription data as there are roles
        //subscribed by the user.
        const roles = this.result.role_ids;
        //
        for (let i = 0; i < roles.length; i++) {
            //
            //Extract the role as a string.
            const myrole = this.result.role_ids.join();
            //
            //Indicate that we need to  save a subscription record
            yield ["mutall_users", "subscription", [i], "is_valid", true];
            //
            //
            //
            //Indicate that we need to save a player
            yield ["mutall_users", "player", [i], "is_valid", true];
            //
            //Collect the user roles in this application
            yield ["mutall_users", "role", [i], "id", myrole];
            //
            //Collect all available pointers to the user to enable us link to
            //the application's specific database.
            yield [app.app.current.dbname, myrole, [i], "name", user.name];
        }
    }
    //
    //Get the result.
    async get_result() {
        return this.result;
    }
    //
    //Collect and check the data from the form.
    async check() {
        //
        //1. Collect and check the data entered by the user.
        //
        //1.1 Collect the role ids
        const role_ids = this.get_input_choices("roles");
        //
        //1.3 Collect the business .
        const business = await this.get_business();
        //
        //Save the role and business to the result.
        this.result = { role_ids, business };
        //
        //2. Save the data to the database.
        const save = await app.app.current.writer.save(this);
        //
        //3. Return the result if the was successful.
        return save;
    }
    //
    //Get the business from the current page. Its either from the selector
    //as a primary key or from direct user input as name and id.
    async get_business() {
        //
        //Get the select element.
        const select = this.get_selected_value("organization");
        //
        //If the user default is selected, open a popup that retrieves
        //the user created business{id,name} from the newly created business
        if (select === "0") {
            //
            //Get the id .
            const id = this.get_input_value("id");
            //
            //Get the name.
            const name = this.get_input_value("name");
            //
            //return the id and name.
            return { id, name };
        }
        //
        //Get the selected business from the selector
        else {
            //
            //Convert the selected business to a number
            const pk = +select;
            //
            //Get the name of the selected business
            const _business = await server.exec("database", ["mutall_users"], "get_sql_data", [`select id,name from business where business.business=${pk} `]);
            //
            //return the id and name.
            return { id: _business[0].id, name: _business[0].name };
        }
    }
    //
    //add an event listener.
    async show_panels() {
        //
        //1. Populate the roles fieldset.
        //Hint. Check out how the current roles are being filled in from the database.
        this.fill_user_roles();
        //
        //2. Populate the business selector with businesses.
        //Hint. Use the selector query to populate.
        this.fill_selector("business", "mutall_users", "organization");
        //
        //
    }
    //
    //Fill the user roles with the roles from the database.
    fill_user_roles() {
        //
        //Collect the user roles for this application from its
        //products
        const inputs = app.app.current.dbase.get_roles();
        //
        //Get the div element to add the roles
        const elem = this.get_element("content");
        //
        //Loop through the array to create each role.
        inputs.forEach(input => {
            //
            //create a label element.
            const label = this.create_element(elem, "label", {
                textContent: input.value
            });
            //
            //Create a new input element and add the attributes(inputs)
            const role = this.create_element(label, "input", {
                type: "checkbox",
                name: "roles",
                id: input.key,
                value: input.value
            });
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
class register_business extends outlook.popup {
    business;
    //
    //constructor
    constructor(
    //
    //A business is defined by the business_name and the business_id
    business) {
        super("new_business.html");
        this.business = business;
        //
    }
    //
    //Return all inputs from a html page and show cases them to a page
    async get_result() {
        return this.result;
    }
    //
    //Collect and check the recursion data and set the result.
    async check() {
        //
        //1. Get and check the business name of the element
        const b_name = this.get_input_value("name");
        //
        //2. Get and check the business_id from the business
        const b_id = this.get_input_value("id");
        //
        //Initialize the result
        this.result = { id: b_id, name: b_name };
        //
        //Return true once the result is collected
        return true;
    }
    get_layouts() {
        return Array.from(this.create_business());
    }
    *create_business() {
        //
        const business = this.result;
        //
        //Get the business name
        yield ["mutall_users", "business", [], "name", business.name];
        //
        //Get the business_id
        yield ["mutall_users", "business", [], "id", business.id];
    }
    //
    //This method sends some feedback to the user once the user has successfully
    //registered a business
    async show_panels() {
        //
        //Show an alert if a user saved the data correctly.
        if (this.business.id !== undefined || this.business.name !== undefined)
            alert("You have successfully created your business,\n\
                   please relogin to select the business");
    }
}
