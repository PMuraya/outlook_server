
import {popup} from "./outlook.js";
//
import {user} from "./app.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js"
//
//Resolve the server method for backend communication
import * as server from "../../../schema/v/code/server.js"
//
//Resolve referemce to the io
import * as io from "../../../schema/v/code/io.js"

//Define data types for all our element's ids/name in the login page.
//
//Group all the available providers and defines a data type for them. This will
//allow for handling(Hiding and Showing) the credentials.
type provider_id = 'google' | 'facebook' | 'outlook';

//Keys for data being collected
type keys = 'name'|'password'|'operation_id'|'provider_id';
   
//
//This is a popup page used for authenticating users so 
//that they can be allowed to access the application 
//services. The page takes in a provider and returns a user
export class page extends popup<user> {
    // 
    //The authentication provider for this page 
    public provider?: provider;
    //
    constructor(url:string) {
        //
        //Use the config file to get the login url
        //super(app.current.config!.login);
        super(url);
    }
    
    //Return the logged in user
    async get_result():Promise<user>{
        //
        //return teh user, set during tthe chech. I know it is set
        return this.result!;
    }
    
    //
    //Compiles a provider from the user's selection
    get_provider(provider_id:provider_id, username:string, password:string): provider|Error {
        //
        //1. Define the provider
        let Provider: provider|Error;
        //
        //Set the provider -- depending on the user selection
        switch (provider_id) {
            case "outlook":
                Provider = new outlook(username, password);
                break;
           case "google":
                //Provider = new google(username, password);
                throw new schema.mutall_error('Google authentication not yet implemented');
                break;
           case "facebook":
                //Provider = new facebook(username, password);
                throw new schema.mutall_error('facebook authentication not yet implemented');
                break;          
        }
        //
        return Provider;
    }
      
    //Check if we have the correct data before we close the popup. For instance, 
    //if the provider is outlook, verify that the required input fields are 
    //filled in correctly.
    async check():Promise<boolean> {
        //
        //1. Check the inputs; discontinue if there is an issue
        //
        //Get all the checked inputa
        const inputs =  this.check_inputs();
        //
        //Collect the input values
        const values:Array<schema.basic_value|Error> = Object.values(inputs);
        //
        //If there is any input issue, discontinue this check
        if (values.some(value=>value instanceof Error)) return false;
        //
        //2. Autheticate or register the user
        //
        //Define a user, to be completed via registration or authetication.
        let User:user|Error;
        //
        //Get the users's credentials, i.e., username and password (as strings) 
        const username = String(inputs.name); 
        const password = String(inputs.password); 
        const provider_id = String(inputs.provider_id) as provider_id;
        //
        //Get the service provider
        const Provider:provider|Error = this.get_provider(provider_id, username, password);
        //
        //If the provider is erroneous, report it and discontinue the test
        if (Provider instanceof Error){
            //
            this.report(true, Provider.message);
            //
            return false;
        }
        //
        //If the user is a visitor then register him...
        if (inputs.operation_id === 'register') User = await Provider.register_user();
        //    
        //...otherwise, i.e., If this is is a reqular user then use the provider 
        //to authicate him
        else User = await Provider.authenticate_user();
        //
        //If the user is erroneous then report it as an error
        if (User instanceof Error) this.report(true, User.message);
        //   
        //If the user is valid, set the result login result
        else this.result = User;
        //    
        //Return sucess if the User is valid
        return User instanceof user;
    }
    
    
    //Check the login and retirn the inputs as either valid values or error
    check_inputs():{[key in keys]:string|Error}{
        //
        return {
            name: this.get_input_value('name')?? new Error(`Name must be provided`),
            password:this.get_input_value('password')?? new Error(`Password must be provided`),
            operation_id:this.get_checked_value('operation_id')?? new Error(`Specify the required operation`),
            provider_id:this.get_checked_value('provider_id')?? new Error(`Specify the provider`)
        }
    }
    
    
    //Set the ios of the login panel.
    async show_panels(){
        //
        //Retrieve as an array all the io elements of this page
        const ios: Array<HTMLElement> = Array.from(this.document.querySelectorAll('data-io'))
        //
        //Use the elements to create the ios and set their default values
        for (const element of ios){
            //
            //Create the io. (It is saved it in the global collection of ios)
            const Io:io.io = io.io.get_io(element);
            //
            //Get its default value -- if any; otherwise null
            const value:schema.basic_value = 
                //
                //If the default is defined...
                element.dataset.default!==undefined  
                //
                //...then retirn it
                ? element.dataset.default
                //
                //...otherwise retrn a null
                : null
            //
            //Set the ios's value
            Io.value = value;    
        }
    }
}

  //
  //This class represents authentication service providers
  //e.g., google, facebook, github, outlook, etc
export abstract class provider {
      //
      constructor(public username:string, public password:string) {}
      //
      //Allows users to sign in using this provider. 
      //The returning a user, or an error message string
      abstract authenticate_user(): Promise<user|Error>;
      //
      //Registers a new user, returing true or am error message
      abstract register_user(): Promise<user|Error>;
  }

  //This class represents the authentication services provided by google.
//  class google extends provider{
//    //
//      constructor(public username:string, public password:string) {
//          super(username, password);
//      }
//      //
      //This method allows users to signin using their google 
      //account;it is borrowed from firebase.
    //   async authenticate():Promise<user> {
    //       //Google Authentication.
    //       //Provider required
    //       var provider = new firebase.auth.GoogleAuthProvider();
    //       //
    //       //Google login with redirect.
    //       await firebase.auth().signInWithRedirect(provider);
    //       //
    //       //
    //       const uuid = await firebase.auth().getRedirectResult();
    //       //
    //       //Create an applicatioon user
    //       const User:user = new user(uuid.user!.name!);
    //       //
    //       //Extract the provider details that we require for our user 
    //       //identification
    //       User.first_name = uuid.user!.displayName,
    //       User.full_name = uuid.user!.displayName,
    //       User.picture = uuid.user!.photoURL;
          
    //       //Return the new user
    //       return User;
    //   }
//  }
////
//Represents our custom login provided firebase
export class outlook extends provider {
    //
    constructor(public username: string, public password: string) {
        super(username, password);
    }
    //
    //This is our custom-made authentication (sign in) method using php hashing. 
    async authenticate_user(): Promise<user|Error> {
        //
        //Authenticate the user using the given name and password to get an 
        //answer 
        const ans:{result:'ok', pk:number} | {result:'error', msg:string}=
            await server.exec(
                "database",
                ["mutall_users"], 
                "authenticate",
                [this.username, this.password]
            );
        //
        //If the answer is ok, return a valid user; otherwise return the error.
        return (ans.result==='ok') ? new user(this.username, ans.pk): new Error(ans.msg);
    }    
    
    //Register the user requested in this login page
    async register_user():Promise<user|Error>{
        //
        //Create the user account and return the user's primary key
        const  ans:{result:'ok', pk:number} | {result:'error', msg:string} = 
                await server.exec(
                "database",
                ["mutall_users"], 
                "register",
                [this.username, this.password]
            );
        //
        //If the result is ok, return a new user; otherise, retirn an error
        return (ans.result === 'ok') ? new user(this.username, ans.pk) : new Error(ans.msg);
    }
    
}
  // 
  //Solomon was and lawrence have to develop this class
  //because facebook requires special setup.
//  class facebook extends provider {
//      // 
//      constructor(public username:string, public password:string) {
//          super(username, password);
//      }
//      //
      //This method allows users to signin using their google 
      //account;it is borrowed from firebase.
    //   async authenticate():Promise<user> {
    //     //Google Authentication.
    //     //Provider required
    //     var provider = new firebase.auth.FacebookAuthProvider();
    //     //
    //     //Google login with redirect.
    //     await firebase.auth().signInWithRedirect(provider);
    //     //
    //     //
    //     const uuid = await firebase.auth().getRedirectResult();
    //     uuid.user!.name 
    //     //
    //     //Create an applicatioon user
    //     const User:user = new user(uuid.user!.name);
    //     //
    //     //Extract the provider details that we require for our user 
    //     //identification
    //     User.first_name = uuid.additionalUserInfo!.username;
    //     User.full_name = uuid.user!.displayName,
    //     User.picture = uuid.user!.photoURL;
        
    //     //Return the new user
    //     return User;
    // }
//  }
//  
