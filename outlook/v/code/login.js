import { popup, user } from "./outlook.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
//
//Resolve the server method for backend communication
import * as server from "../../../schema/v/code/server.js";
//
//This is a page used for authenticating users so 
//that they can be allowed to access the application 
//services. The popup takes in a provider and returns a user
export class page extends popup {
    // 
    //The authentication provider for this page 
    provider;
    //
    constructor(url) {
        //
        //Use the config file to get the login url
        //super(app.current.config!.login);
        super(url);
    }
    //Return the logged in user
    async get_result() {
        //
        //Check whether the input are valid or not
        //
        //Get the provider
        this.provider = this.retrieve();
        //
        //Authenticate to get the user
        const User = await this.provider.authenticate();
        //
        //Compile the login response
        return User;
    }
    //
    //Retrieves a provider
    retrieve() {
        //
        //Retrieve the checked provider id
        let values = this.get_input_choices('provider_id');
        //
        //Check the values for validity
        if (values.length !== 1) {
            throw new schema.mutall_error(`Please select one provider`);
        }
        const provider_id = values[0];
        // 
        //Retrieve the checked operation id 
        values = this.get_input_choices('operation_id');
        //
        //Check the values for validity
        if (values.length !== 1) {
            throw new schema.mutall_error(`Please select one Operation`);
        }
        const operation_id = values[0];
        //
        //1. Define the provider
        let Provider;
        //
        switch (provider_id) {
            case "outlook":
                //
                //Retrieve the credentials
                const email = this.get_element('email').value;
                //     
                const password = this.get_element('password').value;
                //    
                Provider = new outlook(email, password, operation_id);
                break;
            default:
                throw new schema.mutall_error("The selected provider is not yet developed");
        }
        //
        return Provider;
    }
    //Check if we have the correct data before we close, i.e., if the
    //provider is outlook. See if there are inputs in 
    //the input fields.
    async check() {
        //
        //1. Proceed only if the provider is outlook.
        if (!(this.provider instanceof outlook))
            return true;
        //
        //Define a fuction for identifiyng and notifying empty values
        const is_valid = (id) => {
            //
            const elem = this.get_element(id);
            //
            const is_empty = ((elem.value === null) || elem.value.length === 0);
            //
            //Notify (on the login page) if empty
            if (is_empty) {
                //
                //Get the notification tag; its next to the id
                const notify = elem.nextElementSibling;
                notify.textContent = `Empty ${id} is not allowed;`;
            }
            return !is_empty;
        };
        //
        //2. Check if e-mail is empty, then flag it as an error if it is empty.
        const email_is_valid = is_valid('email');
        //
        //3. Check if password is empty, then flag it as an error if it is 
        //empty.
        const password_is_valid = is_valid('password');
        //
        //Return true if both the email and password are valid 
        return email_is_valid && password_is_valid;
    }
}
//
//This class represents authentication service providers
// eg. google,facebook,github
export class provider {
    // 
    //The request to the provider 
    operation_id;
    //
    //Every service provider is identified by this name
    //e.g google,facebook.
    name;
    //
    //Initialize the provider using the name. 
    constructor(name, operation) {
        this.name = name;
        this.operation_id = operation;
    }
}
// This class represents the authentication services provided by google.
class google {
    constructor(operation) {
        //super('google',operation);
    }
}
//
//Represents our custom login provided firebase
class outlook extends provider {
    //
    //
    email;
    password;
    constructor(email, password, operation) {
        super('outlook', operation);
        this.email = email;
        this.password = password;
    }
    //
    //This is our custom made signing method using php hashing. 
    async authenticate() {
        //
        //Check whether the user is registering or loging in;
        //if registering then create an account 
        if (this.operation_id === "register") {
            //
            //Registration 
            //
            //Create the user account
            await server.exec("database", ["mutall_users"], "register", [this.email, this.password]);
        }
        else {
            //
            //LOGIN
            //Authenticate the user using the given email and password 
            const ok = await server.exec("database", ["mutall_users"], "authenticate", [this.email, this.password]);
            //
            //If the login is not successful throw an exception
            if (!ok)
                throw new schema.mutall_error("Invalid login credentials");
        }
        //
        return new user(this.email);
    }
}
// 
//Solomon was and lawrence have to develop this class
//because facebook requires special setup.
class facebook {
    // 
    // 
    constructor(operation) {
        // 
        // 
        //super('facebook',operation);
    }
}
