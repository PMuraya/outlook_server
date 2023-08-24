//
import * as library from "../../../schema/v/code/library.js";
import * as server from "../../../schema/v/code/server.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c.
import * as schema from "../../../schema/v/code/schema.js"
//
import * as outlook from "./outlook.js";
import * as crud from "./crud.js";
import * as theme from "./theme.js";
import * as login from "./login.js";
import * as quest from "../../../schema/v/code/questionnaire.js"
//
//Resolve a template viewer during the design phase
import * as viewer from "./viewer.js"
//
//Resolve the level one registration.
import * as reg from './reg.js'
//
//Resolve the modules.
import * as mod from './module.js'
//
//Replica is a column on the application database that is linked to a
//corresponding one on the user database. Sometimes this link is broken and
//may need to be re-established.
type replica = {ename: string, cname: string};
//
//The application class provides the mechanism for linking services providers
//to their corresponding consumers. It is the base of the various mutall-based
//applications, e.g.,chama, tracker, postek e.t.c.
//An application is a page (with panels)
export abstract class app extends outlook.page {
    //
    //
    public writer: mod.writer;
    public messenger: mod.messenger;
    public accountant: mod.accountant;
    public scheduler: mod.scheduler;
    //
    //The database name that is retrived from a config file
    public dbname: string;
    //
    //The actual database constructed during initialization
    public dbase?: schema.database;
    //
    //The visitor/regular user who is attached to the application.
    public user?: outlook.user;
    //
    //All the possible products that a user can access via this application
    public products: products;
    //
    //Remember that static properties cannot reference class parameters, we cannot
    //do public static current: app<role_id, ename>
    public static current: app;
    //
    //Image associatd witn this app
    public logo?: string;
    //
    //The full trademark name of the application
    public name?: string;
    //
    //For advertis=ing purposes
    public tagline?: string;
    //
    //The subject (entity) driving the content panel
    public subject: outlook.subject;
    //
    //The id of this application; if not given, we use this
    //constructors name
    //The short name for this application
    public id: string;
    //
    //
    constructor(
        //
        //The configuration settings for this application
        public config: Iconfig
    ) {
        //An app has no mother view, and uses the uel of the current window.
        super();
        //
        //Set this as teh current application
        app.current = this;
        //
        //initialize the modules 
        this.writer = new mod.writer();
        this.messenger = new mod.messenger();
        this.accountant = new mod.accountant();
        this.scheduler = new mod.scheduler();
        //
        //Ensure that the globally  acessible application url in the shema
        //class is set to that of this document. This is important to support
        //registration autoloaders in PHP
        schema.schema.app_url = window.document.URL;
        //
        this.dbname = this.config.app_db;
        //
        this.subject = config.subject;
        //
        //If the id of an appliction is not given, then use name of application
        //class that extednds this ne.
        this.id = config.id;
        //
        //Set the application's window.
        this.win = <Window> window;
        //
        //Compile the products of this application
        this.products = new products();
        //
        //Create and set the application panels
        this.panels
            .set("services", new services(this))
            .set("theme", new theme.theme(this.subject, "#content", this))
            .set("message", new theme.theme(['msg', "mutall_users"], "#message", this))
            .set("event", new theme.theme(['event', "mutall_users"], "#event", this));

    }
    async show_panels(): Promise<void> {
        //
        //The for loop is used so that the panels can throw
        //exception and stop when this happens
        for (const panel of this.panels.values()) {
            await panel.paint();
        }
    }
    //
    //The user must call this method on a new application object; its main
    //purpose is to complete those operations of a constructor that require
    //to function synchronously
    async initialize(): Promise<void> {
        //
        //Do the standard page initialization, including setting up the win
        //property
        await super.initialize();
        //
        //Extend the standard initialization with the following bits
        //that are specific to an application:-
        //
        //Set the application database based on the subject property.
        await this.set_dbase();
        //
        //Expand the inbuilt products with all those read from the database that:-
        //a) are associated with this application through the execution link
        //b) are global, i.e., not associated with specific role or application.
        await this.products.expand();
        //
        //Show this application on the address bar and make ensure that
        //the initial window history state is not null; it is this application.
        this.save_view('replaceState');
        //
        //Show the panels at this point; the user operations that follow
        //requires the service panel to be set
        await this.show_panels();
        //
        //Test if there is a user that already exists in the local
        //storage, i.e., if there is a user currently logged in.
        const user_str = this.win.localStorage.getItem("user");
        //
        //If this user exists then use hom/her to login
        if (user_str !== null) {
            //
            //Get the user credentials (as a string) and convert them to a
            //local data type
            const user = JSON.parse(user_str.trim());
            //
            //Initiate the login procedure, without asking for credentials
            await this.login(user);
        }
        //
        //Populate the subject selector with all the entities of the
        //application.
        await this.populate_selector();
    }
    //
    //Return true/false depending on whether the named entity is linked to
    //the user database or not
    private get_role_id(ename: library.ename, dbase: schema.database): boolean {
        //
        //Get the named entity
        const entity = dbase.entities[ename];
        //
        //Get the column names of this entity
        const cnames = Object.keys(entity.columns);
        //
        //Select only those columns that are used for linking
        //this application's database to the mutall_user one.
        const f_cnames = cnames.filter(cname => {
            //
            //Get the named column
            const col = entity.columns[cname];
            //
            //Test if this is a foreign key column pointing to the
            //mutall_user's database
            //
            const test = col instanceof schema.foreign
                && col.ref.db_name === "mutall_user"
                && col.ref.table_name === "user";
            //
            //
            return test;
        });
        //
        //Only those entities that have columns that pass the test are
        //considered
        return f_cnames.length > 0;
    }
    //
    //Set the current database
    private async set_dbase() {
        //
        //Get the static database structure
        const idbase = await server.exec("database", [this.dbname], "export_structure", []);
        //
        //Activate the static and set it to this app
        this.dbase = new schema.database(idbase);
    }
    //
    //This method authenticates a new user that wants to access the
    //services of this application.
    //There are two ways of calling this method, with or without the User
    // Parameter.
    //If there was a previous login, the User must have been provided and saved
    //in the local storage, otherwise, the user details will be provided via
    //a dialog box.
    async login(User?: outlook.user) {
        //
        //If no user exists at the local storage get the user (credentials)
        //through the authentication process.
        if (User === undefined) {
            //
            //1.Create and open the login page for the user to choose the login
            //provider.
            const Login = new login.page(this.config.login);
            //
            //2.Get the authenticated user from the login popup
            this.user = <outlook.user> await Login.administer();
        }
        else this.user = User;
        //
        //3.Use the server to check whether the user is registered with
        //outlook or not
        //
        //Formulate the sql statement to retrieve the roles and business of the user.
        //
        //Retrieve the roles.
        //Select from the user database all the subscription for the user
        //whose name and the application_id are the given ones
        const sql =
            //
            //1. Specify what we want using a "select" clause
            "SELECT "
            //
            //...Specify the role id id.
            + "role.id "
            //
            //2. Specify the "from" clause
            + "FROM "
            + "subscription "
            //
            //These are the joins that trace our route of interest
            + "inner join user ON subscription.user= user.user "
            + "inner join player ON subscription.player= player.player "
            + "inner join application ON player.application=application.application "
            + "inner join role on player.role = role.role "
            //
            //3. Specify the conditions that we want to apply i.e "where" clause
            + "WHERE "
            //
            //Specify the name condition
            + `user.name='${this.user.name}' `
            //
            //Specify the application condition
            + `AND application.id='${this.id}'`;
        //
        //Get  the role ids of this user from the server
        const ids = <Array<{id: string}>> await server.exec(
            "database",
            ["mutall_users"],
            "get_sql_data",
            [sql]
        );
        //
        //Extract the role id components from the server and assign them to the
        //user.
        this.user.role_ids = ids.map(e => e.id);
        //
        //The user is a visitor if he has no previous roles
        this.user.type = this.user.role_ids.length === 0 ? "visitor" : "regular";
        //
        //Register the User if he is a visitor. This effectively updates
        //the roles and business properties and changes the user to a regular.
        if (this.user.type === "visitor") {
            //
            //create a new instance of a complete level one registration of a page.
            const Regist = new reg.complete_lv1_registration(this);
            //
            //Collect the roles and the business.
            const result = await Regist.administer();//Register the user.
            //
            if (result === undefined) 
                throw new schema.mutall_error(`User aborted registration`);
            //
            //Destructure the result
            const {role_ids, business} = result;
            //
            //Assign the roles to the user.
            this.user.role_ids = role_ids;
            //
            //Assign the business to the user.
            this.user.business = business;
        }else{
            //
            //initialize the business component of the user.
            this.user.business = await this.get_current_business();

        }
        //
        //Welcome the user to the home page unconditionaly and update the welcome
        //and services panels accordingly
        await this.welcome_user();
        //
        //Save the user in local storage to allow re-access to this page
        //without logging in.
        window.localStorage.setItem("user", JSON.stringify(this.user));
    }
    async get_current_business():Promise<outlook.business> {
        //
        //1. Get the business from the database.
        //
        //1.1 Formulate an sql statement.
        const sql = `
            select 
                business.business as pk,
                business.id,
                business.name
            from  
                member 
                inner join business on member.business = business.business
                inner join user on member.user = user.user
            where 
                user.name = '${this.user!.name}'
        `;
        //
        //1.2 Get the data from the database.
        const businesses:Array< {id: string, name: string, pk: string}> = await server.exec(
            "database",
            ["mutall_users"],
            "get_sql_data",
            [sql]
        );
        //
        //Test the businesses to get the number of businesses a user is registered with.
        //
        //Throw an exception if the number of businesses is 0.
        if(businesses.length === 0) 
            throw new schema.mutall_error(`The user '${this.user!.name}' has no business associated to.`)
        //
        //Create a choices for the user if there is more than one business. 
        if(businesses.length > 1) {
            //
            //Create a new choice for the user to select a business.
            const selection = businesses.map(business =>({key : pk, id: id, value: name}));
            //
            //2. Use the pairs to create a new choices POPUP that returns a selected
            //table
            const Choice = new outlook.choices<string>(this.config.general, selection, "role_id", undefined, "#content", "single");
            //
            //3. Open the POPUP to select a business.
            const selected: string[] | undefined = await Choice.administer();
            //
            //Get the value of the selected business.
            if(selected === undefined) throw new schema.mutall_error(`No business was selected for this ${this.user!.name}.`);
            //
            //For a single case we expect to get only one element in the array.
            const pk:string = selected[0];
            //
            return {source:"selector", pk};
        }
        //
        //Get the values of the business as there is only one.
        //
        //2. Get the id.
        const id = businesses[0].id;
        //
        //3. Get the name.
        const name = businesses[0].name;
        //
        //return the business.
        return {source:"user", name, id};
    }
    //
    //On successful login, welcome the definite user, i.e., regular or visitor
    //and not anonymous,  to the home page by painting the welcome panel
    //and activating solutions in the services panels.
    private async welcome_user(): Promise<void> {
        //
        //Paint the welcome message for a regular user.
        await this.paint_welcome("regular");
        //
        //Modify the appropriate tags
        //
        //Set user paragraph tags
        this.get_element("user_name").textContent = this.user!.name!;
        this.get_element("app_id").textContent = this.id!;
        this.get_element("app_name").textContent = this.name!;
        //
        //.???
        const busi = this.user!.business!;
        if(busi.source === "user") {
            //
            this.get_element("business_name").textContent = busi.name;
        }
      
        //
        //3.Set the user roles for this application
        const role_element = this.get_element("roles");
        //
        //Clear the current roles
        role_element.innerHTML = "";
        //
        //Add all the user roles to the welcome panel.
        this.user!.role_ids!.forEach(role_id => {
            //
            //Get the role title. Note the role_id as the datatype defind in
            //the application parameters, rather than outlook.role.role_id
            //const title = this.products[<role_id>role_id][0];
            const title = role_id;
            //
            //This is what the role fragment looks like.
            //<div id="role_tenant">Tenant</div>
            //
            //Build the fragment
            const html = `<div id="role_${role_id}">${title}</div>`
            const div = this.document.createElement("div");
            role_element.appendChild(div);
            div.outerHTML = html;
        }
        );
        //
        //Activate the free products and those that this user has subscribed to
        //on the services pane;
        await this.activate_products();
    }
    //
    //Activates all the products that are relevant for this applicatiion and
    //the logged in user.
    private async activate_products(): Promise<void> {
        //
        //Define a set of the product ids to be activated
        const prod_id: Set<string> = new Set();
        //
        //Collect all the free products of this application that are globally
        //accessible
        this.products.forEach(Product => {
            if (
                //Free products....
                (Product.cost === undefined
                    || Product.cost === null
                    || Product.cost === 0)
                //
                //...that are  global
                && Product.is_global === 'yes'
            )
                prod_id.add(Product.id)
        });
        //
        //Get all the application specific products available to the user. These
        //are products that are:-
        //- custom made for the user's role and have no cost
        //- qualify as user's assets, i.e., they have a cost and the user has
        //  subscribed to them explicitly
        const subscribed = await server.exec(
            "app",
            [this.id],
            "available_products",
            [this.user!.name!]
        )
        //
        //Add the subscribed
        subscribed.forEach(prod => {
            prod_id.add(prod.product_id);
        });
        //
        //Activate the product (with the given id) by attaching event listeners
        //to its solutions nd highlighting them as an anchor tags
        prod_id.forEach(id => this.products.activate(id));
    }

    //
    //Returns the products that are share between all applicatiions that
    //are extensions of this one.
    public get_products_shared(): Array<outlook.assets.uproduct> {
        //
        //The roles and products of this application.
        return [
            {
                id: "setup",
                title: "Database Administration",
                solutions: [
                    {
                        title: `Relink User System to ${this.dbname}`,
                        id: "relink_user",
                        listener: ["event", () => this.relink_user()]
                    },
                    {
                        title: "Edit any Table",
                        id: "edit_table",
                        listener: ["event", () => this.edit_table()]
                    },
                    {
                        title: "Load Data",
                        id: "load_data",
                        listener: ["event", () => this.load_data()]
                    },
                    {
                        title: "View Template",
                        id: "view_template",
                        listener: [
                            "event",
                            async () => await (new viewer.viewer(this)).administer()
                        ]
                    }
                ]
            }
        ]
    }

    //Returns inbuilt (unindexed) products that are specific to this pplication
    abstract get_products_specific(): Array<outlook.assets.uproduct>;
    //
    //Register the user and return the roles which s/he can play
    // in this application.
    async register(): Promise<Array<string> | undefined> {
        //
        //1.Collect from the user the minimum registration requirement.
        //The minimum requirement are the roles
        //
        //
        //Collect the user roles for this application from its
        //products
        const inputs = this.dbase!.get_roles();
       
        //
        //If these roles are undefined alert the user
        if (inputs === undefined || inputs.length < 0) {
            alert("No roles found");
            return;
        }
        //
        //Open the popup page for roles
        const Role = new outlook.choices<string>(this.config.general, inputs, "role_id");
        //
        //Get the user roles
        const role_ids = await Role.administer();
        //
        //Test if the user has aborted registration or not
        if (role_ids === undefined) throw new schema.mutall_error(
            "User has aborted the (level 1) registration"
        );
        //
        //Save the user roles
        this.user!.role_ids = role_ids;
        //
        //1.Collect the data needed for a successful 'first level' registartion.
        //e.g., username, application name, user_roles, name.
        // The data has the following structure "[dbname, ename, alias, cname, exp]".
        const login_db_data: Array<quest.label> = this.get_subscription_data();
        //
        //2. Write the data into the database and return an array of error messages.
        //User.export_data(login_db_data):Promise<Array<string>>;
        const html: string = await server.exec(
            "questionnaire",
            [login_db_data],
            "load_common",
            ["log.xml"]
        );
        //
        //3.Verify that writing to db was successful
        //and report to the user otherwise throw an exception.
        //Show the report if the saving was not successfull
        if (html !== "Ok") {
            const Report = new outlook.report(app.current, html!, this.config.general);
            await Report.administer();
            //
            //Abort the login process.
            throw new Error("Registration failed");
        }
        //
        // The registration was successful so, return the role ids
        return this.user!.role_ids;
    }
    //
    // Return the data needed for a successful 'first level' registration,
    // i.e., the data required for the current visitor to be recognized as a
    // subscriber of the current application.
    private get_subscription_data(): Array<quest.label> {
        //
        // Prepare an array for holding the registration data.
        const reg: Array<quest.label> = [];
        //
        //Collect the user and appication data
        reg.push(['mutall_users', 'application', [], 'id', this.id]);
        //
        if (this.user!.name === (undefined || null)) {
            throw new schema.mutall_error("You cannot login without a user name");
        }
        reg.push(['mutall_users', 'user', [], 'name', this.user!.name!]);
        //
        //Collect as much subcription data as there are roles
        //subscribed by the user.
        this.user!.role_ids!.forEach((myrole, i) => {
            //
            //Collect all available pointers to the user to enable us link to
            //the application's specific database.
            reg.push([app.current.dbname!, myrole, [i], 'name', this.user!.name!]);
            //
            //Indicate that we need to  save a subscription record
            reg.push(['mutall_users', "subscription", [i], 'is_valid', true]);
            //
            //Indicate that we need to save a player
            reg.push(['mutall_users', 'player', [i], 'is_valid', true]);
            //
            //Collect the user roles in this application
            reg.push(['mutall_users', 'role', [i], 'id', myrole]);
        });
        //
        // Return the completed 1st level registration data.
        return reg;
    }

    //This is the generalised crud procesor, alowing us to create, review
    //update and delete records from any table in teh current application.
    //The current version is not complete, it does not specify what
    //do after teh administration. That depends on where this method was called
    //from, so the best we can do is to return the result of the crud.page
    //administration. If the cuding was aborted, teh result is undefined
    async crud(
        //
        //The database entity being CRUDed
        subject: outlook.subject,
        //
        //The CRUD operations allowed on the entity
        Xverbs: Array<outlook.assets.verb>
    ): Promise<crud.crud_result | undefined> {
        //
        //Create a new crud page
        const page: crud.page = new crud.page(app.current, subject, Xverbs);
        //
        //Perform the crud interactions and return the result. The caller
        //determines what  to do with the result
        const result = await page.administer();
        //
        //Refresh the app pannels that matches the subject if administration
        //was no canceled.
        if (result !== undefined) this.panels.forEach(panel => {
            //
            //Only theme panels are considerd
            if (!(panel instanceof theme.theme)) return;
            //
            //Only the theme panel that matcjes the subject is considerd
            if (panel.subject == subject) panel.goto(0);
        });
        //
        return result;
    }
    //
    //Paint the welcome message for users on the home page.
    private async paint_welcome(usertype: "visitor" | "regular"): Promise<void> {
        /**
         * If the usertype is visitor invite the user to login
         */
        if (usertype === "visitor") {
            this.welcome_visitor();
            return;
        }
        //Regular user
        //
        //
        //Get the template's url.
        const url = this.config.welcome;
        //
        //Create the template using the url. A template is a page used
        //for caniblaising, i.e., it is not intended for viewing
        const Template = new outlook.template(url);
        //
        //Open the template (AND WAIT FOR THE WINDOW TO LOAD)
        await Template.open();
        //
        //Carnibalise the welcome template
        //
        //Paint the application homepage with the welcome message.
        Template.copy(usertype, [<outlook.view> this, 'welcome']);
        //
        //Close the tenplate (view)
        Template.win.close();
    }
    //
    //Welcoming the visitor means inviting him to login and
    //deactivating all the services that could have been active
    private welcome_visitor() {
        //
        //Invite the user to login
        this.get_element("welcome").innerHTML =
            ` Please <button onclick="app.current.login()">login</button> to access
                various services`;
        //
        //Deactivate any active service
        Array.from(this.document.querySelectorAll(".a"))
            .forEach(el => {
                el.classList.remove("a");
                el.removeAttribute("onclick");
            });
    }
    //
    //Log the user out of this application.
    async logout() {
        //
        //Use firebase to close its logout system
        //await firebase.auth().signOut();
        //
        //
        //Clear the entire local storage for this (debugging) version
        this.win.localStorage.clear();
        //
        //Remove the user from the local storege
        //this.win.localStorage.removeItem("user");
        //
        //Restore default home page by replacing the regular
        //user's welcome message with the visitor's one.
        this.paint_welcome("visitor");
    }

    //
    //Change the subject of this application temporarily. Edit the config file
    //to change it permanently
    async change_subject(selector: HTMLSelectElement): Promise<void> {
        //
        //Formulate a subject
        //
        // Get the dbname
        const dbname = this.config.app_db
        //
        //Get the selected entity
        const ename = selector.value;
        //
        //Compile the new subject
        const subject: [string, string] = [ename, dbname];
        //
        //Refrech the theme panel
        //
        //Get the theme panel
        const Theme = <theme.theme> this.panels.get("theme");
        //
        //Change the theme's subject
        Theme.subject = subject;
        //
        //Clear the existing theme content in the table
        this.document.querySelector('thead')!.innerHTML = '';
        this.document.querySelector('tbody')!.innerHTML = '';
        //
        //Repaint the theme panel (after re-settting the current view boundaries
        Theme.view.top = 0;
        Theme.view.bottom = 0;
        await Theme.continue_paint();
    }

    //
    //1. Populate the selector with table names from current database
    private populate_selector(): void {
        //
        //1.Get the current database: It must EXIST by THIS TIME
        const dbase = this.dbase;
        if (dbase === undefined) throw new Error("No current db found");
        //
        //2.Get the subject selector
        const selector = <HTMLSelectElement> this.get_element("selection");
        //
        //3.Loop through all the entities of the database
        //using a for-in statement
        for (const ename in dbase.entities) {
            //
            //3.1 Create a selector option
            const option = this.document.createElement('option');
            //
            //  Add the name that is returned when you select
            option.value = ename;
            //
            //3.2 Populate the option
            option.textContent = ename;
            //
            //Set the option as selected if it matches the current subject
            if (ename === this.subject[0]) option.selected = true;
            //
            //3.3 Add the option to the subject selector
            selector.appendChild(option);
        }
    }

    //
    //Establish the links between the user database and application database
    //For instance, in Tracker we link interns, CEOs and staff to the users,
    //organization and business respectively.
    async relink_user(): Promise<void> {
        //
        // Yield/get all the replicas (i.e., entities, in the application, that have
        //a matching table in the user database) that have have a broken link.
        const links = this.collect_broken_replicas();
        //
        //Continue only if there are broken links.
        if (links.length === 0) {
            alert("All links between the application datanase and mutall_users are well established");
            return;
        }
        //
        //Call the server to establish the links.
        const ok: boolean =
            await server.exec("tracker", [], "relink_user", [links]);
        //
        //If not ok, alert the user that the process has failed.
        if (!ok) alert("Process failed");
        else alert('Replicas relinked successfully');
    }

    //
    //Yield both roles and business replicas that are broken.
    private collect_broken_replicas(): Array<replica> {
        //
        //Start with an empty array pf replicas.
        let result: Array<replica> = [];
        //
        //Get the role replicas
        //
        //Get the current application database roles.
        const role = this.dbase!.get_roles();
        //
        //Collect the role replicas.
        const replicas: Array<replica> =
            role.map(role => {return {ename: role.key, cname: "user"}});
        //
        //Collect the business replicas.
        //
        //Get teh business entity
        const ename: string = this.get_business_ename();
        //
        //Add teh business to the business replicas.
        replicas.push({ename, cname: "business"});
        //
        //For each, merge ...
        for (let replica of replicas) {
            //
            //Get the application entity.
            const entity = this.dbase!.entities[replica.ename];
            //
            //Get the application column.
            const column = entity.columns[replica.cname];
            //
            //Test if the user column is an attribute and yield it.
            if (column instanceof schema.attribute) result.push();
        };
        //
        return result;
    }
    //
    //Retrieve the entity that represents the business in this application. It
    //has a (foreign key) column named business
    private get_business_ename(): string {
        //
        //Get all entities in the database.
        const entities = Object.values(this.dbase!.entities);
        //
        //Select only the entities that have a business column.
        const businesses = entities.filter(entity => {
            //
            //Get all columns of this entity.
            const cnames = Object.keys(entity.columns);
            //
            //Test if one of the columns is business.
            return cnames.includes("business");
        });
        //
        //Get the length of the businesses found.
        const count = businesses.length;
        //
        //If there's no entity linked to the business,
        //then this model is incomplete.
        if (count === 0)
            throw new schema.mutall_error("Business table missing; incomplete model");
        //
        //If there's more than one table with a business link then bring this to
        //the user's attention.
        if (count > 1)
            throw new schema.mutall_error(`We don't expect more than one business.
            Found ${JSON.stringify(businesses)}`);
        //
        //Return the only entity linked to business.
        return businesses[0].name;
    }

    //Load data using an external Iquestionnaire (json)file
    async load_data(): Promise<void> {
        //
        //Get the file from the local client
        //
        //Create a file reader popup window
        const popup = new file_picker();
        //
        //Use the popup to pick the file; the user may abort this process
        const file: File | undefined = await popup.administer();
        //
        //Abort this procecure if the file picking was alao aborted
        if (file === undefined) return;
        //
        //Read the local file content (as json text) and coerce it to
        //the Iquestionnaire shape
        const text = await new Promise(resolve => {
            //
            //Create a file reader
            const reader = new FileReader();
            //
            //Return the reader result when done. Note how we wire this
            //listener before initiating the reading process
            reader.onload = () => resolve(reader.result);
            //
            //Initiate the content reading
            reader.readAsText(file);
        });
        //
        //The text cannot be null, unless there is a problem
        if (typeof text !== 'string')
            throw new schema.mutall_error('Questionnaire text expected to be a string');
        //
        //Convert the json text to a javscriot structure and coerce it to the
        //the Iquestionnaire shape, as we are assuming thet the input follows
        //the same shape
        const Iquestionnaire = <quest.Iquestionnaire> JSON.parse(text);
        //
        //Load the data specified by the Iquestionnaire (using the common
        //method)
        const html = await server.exec(
            "questionnaire",
            [Iquestionnaire],
            "load_common",
            []
        );
        //
        //If the html is not ok, the a loading error must have cuured
        const error = html !== 'Ok' ? true : false;
        //
        //Report the error
        await this.report(error, html);
    }

    //
    //Edit any table in the current application's database. This feature is
    //available to the super-user.
    async edit_table() {
        //
        //1. Get all the tables from the system as key/value pairs
        //
        //1.1 Get the application database
        const dbase = this.dbase!;
        //
        //1.2 Use the database to extract the entities
        const enames = Object.keys(dbase.entities);
        //
        //1.3 Map the entities to the required key/value pairs needed
        //by the selector. Here, the key and value are the same; in future we
        //will use the entity titles + thier ids. E.g., member:Group Membershp
        const pairs = enames.map(ename => ({key: ename, value: ename}));
        //
        //2. Use the pairs to create a new choices POPUP that returns a selected
        //entity name
        const Choice = new outlook.choices<library.ename>(this.config.general, pairs, "table", undefined, "#content", "single");
        //
        //3. Open the POPUP to select a table.
        const selected = await Choice.administer();
        //
        //4. Abort the process if the selection was also aborted.
        if (selected === undefined) return;
        //
        //5. Use the table to run the CRUD service.
        const subject: outlook.subject = [selected[0], this.dbname];
        //
        //Disallow deleting of records
        const verbs: Array<outlook.assets.verb> = ['create', 'review', 'update', 'delete'];
        //
        //Run the crud process
        this.crud(subject, verbs);
    }
}

//Select a file from the local machine
export class file_picker extends outlook.popup<File>{
    //
    //The ng picked
    public input?: HTMLInputElement;

    //
    constructor() {
        //
        //Use the general.html , accessible from the current application
        const url = app.current.config.general;
        //
        //Use teh popup window specs
        //
        super(url);
    }
    //
    //Add the input file element to this picker
    async show_panels(): Promise<void> {
        //
        //Get the contemt element
        const content = this.get_element('content');
        //
        //Create teh input element as a child of the contemt
        this.input = this.create_element(content, 'input', {type: "file"});
    }

    async get_result(): Promise<File> {
        return this.result!;
    }
    //
    //Check that a file has been specified
    async check(): Promise<boolean> {
        //
        //Get the file input
        //
        //If no valid file ia available, return false
        //
        if (this.input == undefined) return false;
        //
        if (this.input.files === null) return false;
        //
        if (this.input.files[0] === null) return false;
        //
        //Set the result
        this.result = this.input.files[0];
        //
        return true;
    }
}

//
//The welcome panel of an app
export class services extends outlook.panel {
    //
    //The products to be displayed in the services panel
    public products: products | null;
    //
    //
    constructor(base: outlook.view, Products: products | null = null) {
        super("#services", base);
        this.products = Products;
    }
    //
    //Use the products to complete the painting of the services panel
    async continue_paint() {
        //
        //Get the services panel element where we will do the painting.
        const panel = this.get_element("services");
        //
        //Get the products to paint
        const prods = this.products === null
            //
            // Use the products defined at the root application level
            ? (<app> this.base).products
            //
            // Use the products defined at the local application level
            : this.products;
        //
        //
        //Step through the products to paint each one of them.
        prods.forEach((product) => {
            //
            //Paint the product and return a field set
            const fs: HTMLFieldSetElement = this.paint_product(panel, product);
            //
            //Loop through the solutions of this product appending them
            //as children of the field set
            Object.keys(product.solutions).forEach(id => {
                //
                //Get the solution to paint
                const solution = product.solutions[id];
                //
                //Paint the solution
                this.paint_solution(fs, solution);
            });

        });
    }
    //
    //Paint the given product and return  a field set element.
    private paint_product(
        //
        //The panel element where to paint the products
        panel: HTMLElement,
        //
        //The product being painted
        product: outlook.assets.product,
    ): HTMLFieldSetElement {
        //
        //1. Create a fieldset Element in the sevices panel
        const fs = this.create_element(panel, "fieldset", {
            //
            //Set the id to be the same as that of the role
            id: product.id,

        });
        //
        //2. Set the fieldset's legend
        this.create_element(fs, "legend", {
            //
            //Set its content to the title of the product
            textContent: product.title,
            //
            //Why these classes?
            className: "redo-legend reset-this"
        });
        //
        //Return the fieldset Element.
        return fs;
    }
    //
    //
    //Paint the solution
    private paint_solution(
        //
        //The fieldset tag where we paint this solution.
        fs: HTMLFieldSetElement,
        //
        //The solution to paint
        solution: outlook.assets.solution
    ): void {
        //
        //
        //Return if this product has no solutions
        if (solution === undefined) return;
        //
        // Destructure the solution to get its title and id
        const {title, id} = solution;
        //
        this.create_element(fs, "div", {
            //
            //A solution withn a product is identified by the solution id
            className: id,
            textContent: title
            //
            //Note that teh solution's listener is added when the user logs
            //in sucessfiully. That's how we control access to services
        });
    }

}
//
//This class models a collection of application products as a map. It extends
//a map so that it can be indexed by a role id.
export class products extends Map<string, outlook.assets.product>{
    //
    constructor() {
        //
        //Initialize the parent map
        super();
        //
        //Collect products shared between all applications
        const uproducts = app.current.get_products_shared();
        //
        //Collect products that are specific to those application
        //and add them to the shared ones
        const all_uproducts = uproducts.concat(app.current.get_products_specific());
        //
        //Use the products to initialize this products map
        for (let uproduct of all_uproducts) {
            //
            //Convert the (solution) undexed product to an indexed one
            let product: outlook.assets.product = {
                id: uproduct.id,
                title: uproduct.title,
                solutions: {},
                is_global: 'yes'
            };
            //
            //Propulate the indexed solutions
            for (let solution of uproduct.solutions) {
                product.solutions[solution.id] = solution;
            }
            //
            //Use the product id to index the solution indexed product
            this.set(uproduct.id, product)
        }
    }

    //
    //Retrieve more products from the user's database to create a more expanded
    //collection of all the products that are available for a particular
    //application.
    async expand(): Promise<void> {
        //
        //Get all the products that can be executed via this application
        const new_products: Array<library.Iproduct> = await server.exec(
            "app",
            [app.current.id],
            "get_products", []
        );
        //
        //Add the retrived products to this class object
        new_products.forEach(Iproduct => {
            this.add_product(Iproduct);
        });
        //
        //Update these products with the customised roles. Some  of the products
        //become available, others dont, depending the the user's subscription
        this.update();
    }
    //
    //Compiles a product from an Iproduct and add it into this collection
    add_product(Iproduct: library.Iproduct): void {
        //
        //The structure of the Iproduct (as an output from a dataabase query)
        //is:-
        //{id, title, cost,solution_id, solution_title,listener}
        //
        //Create an outlook solution of structure
        //{id, title, listener}
        let sol: outlook.assets.solution;
        //
        //To create a dbase solution we need a title and listener
        const title = Iproduct.solution_title;
        //
        //Get the string function declaration.
        const listener: outlook.assets.listener = ["string", Iproduct.listener];
        //
        //Formulate the solution
        //{id, title,listener}
        sol = {id: Iproduct.solution_id, title, listener};
        //
        //Get the product where to append this solution.
        let Product: outlook.assets.product;
        //
        //Get the product from the existing products
        if (this.has(Iproduct.id)) {Product = this.get(Iproduct.id)!;}
        //
        //Product does not exist Create a product with empty solutions
        else {
            Product = {
                title: Iproduct.title,
                id: Iproduct.id,
                solutions: {},
                is_global: Iproduct.is_global
            };
            //
            //Add this product to the collection
            this.set(Iproduct.id, Product);
        }
        //
        //Add the cost of this product
        Product.cost = Iproduct.cost === null ? null : parseInt(String(Iproduct.cost));
        //
        //Add the solution
        Product.solutions[Iproduct.solution_id] = sol;
    }
    //
    //Hides all the products that are not customised for the given user
    filter(user: outlook.user): void {
        //
        //Get all the global products_id
        const prod_ids: Set<string> = new Set();
        this.forEach(Product => {
            if (
                Product.customed === undefined
                || Product.customed === null
                || Product.customed.size === 0
            ) prod_ids.add(Product.id)
        });
        //
        //Add to the product id the products customed for this roles
        this.forEach(Product => {
            if (Product.customed !== undefined) {
                //
                //Test if any of this user's roles exist in the customed array
                user.role_ids!.forEach(role_id => {
                    if (Product.customed!.has(role_id)) prod_ids.add(Product.id);
                })
            }
        });
        //
        //Hide all the products whose ids are neither customed to this roles
        //nor free
        this.forEach(Product => {
            if (!prod_ids.has(Product.id)) {
                //
                //Get the product's field set
                const fs = app.current.get_element(Product.id);
                //
                //Hide this product
                fs.hidden = true;

            }
        })
    }
    //
    //Update these products with the customised roles. Some  of the products
    //become available, others don't, depending the the user's subscription
    //???????
    async update() {
        //
        //Get the ifuel that contains the information required to activate
        //these products
        const updates: Array<{role_id: string, product_id: string}> = await server.exec(
            "app",
            [app.current.id],
            "customed_products",
            []
        );
        //
        //Loop through the updates and update the affected product??????????
        updates.forEach(update => {
            if (this.has(update.product_id)) {
                const product = this.get(update.product_id)!;
                product.customed = new Set();
                product.customed.add(update.role_id);
            }
        });
    }
    //
    //Activate the product (with the given id) by attaching event listeners to
    //its solutiona nd highlihhting them as an anchor tags
    activate(product_id: string): void {
        //
        //If no product exists with the given in id throw an error
        if (!(this.has(product_id))) {
            throw new Error(`The product with id ${product_id} was not found`);
        }
        //
        //Get the product to be activated
        const product = this.get(product_id);
        //
        //If teh product is not found, throw an exception; something must be
        //wrong
        if (product === undefined)
            throw new schema.mutall_error(`Product ${product_id} is not found`);
        //
        //Get the product's field set
        const fs = <HTMLFieldSetElement> app.current.get_element(product_id);
        //
        //Get the solution to update
        Object.keys(product.solutions).forEach(id => {
            //
            //Get the solution to activate
            const sol = product.solutions[id]!;
            //
            //Get the solution element.
            const solution_element = <HTMLElement> fs.querySelector(`.${id}`)!;
            //
            //Set the listener based on the type which the first parameter of the listener
            switch (sol.listener[0]) {
                //
                //The post defined element have their events as strings
                case "string":
                    solution_element.setAttribute("onclick", `${sol.listener[1]}`);
                    break;
                //
                //Crud listener calls the crud method
                case "crud":
                    //
                    //Get the solution's listener
                    const [cat, ename, verbs, xor, dbname] = sol.listener;
                    //
                    //Compile the subject of the crud table
                    const subject = <outlook.subject>[ename, dbname === undefined ? app.current.dbname : dbname]
                    //
                    //
                    //convert the implied into explicit verbs
                    //
                    let Xverbs: Array<outlook.assets.verb>;
                    //
                    //Returns true if a verb1 is included in the list of availble
                    //verbs
                    const found = (verb1: outlook.assets.verb) => {
                        return verbs!.some(verb2 => verb1 === verb2);
                    };
                    //
                    //Get the explicit verbs. Its either the current selected (+) verbs
                    //or the list of all verbs excluding(-) the selected ones
                    Xverbs = xor === '+' ? verbs! : outlook.assets.all_verbs.filter(verb => !found(verb));
                    //
                    //Set the listener on the solution element
                    solution_element.onclick = () => app.current.crud(subject, Xverbs);
                    break;
                //
                //The predefined listeners are set directly
                case "event":
                    solution_element.onclick = () => (<((...n: any) => void)> sol.listener[1])();
                    break;
                //
                default: throw new Error(`Listener of type ${sol.listener[0]} is not known`)
            }
            //
            //Mark it as active
            solution_element.classList.add('a');
        });
    }
}
//
//The applications configulation interface
export interface Iconfig {
    //
    //The database access credentials
    username: string;
    password: string;
    //
    //The database for managing users and application that are
    //running on this server
    login_db: string;
    //
    //Title appearing on navigation tab should atc the namespsce
    id: string;
    //
    //The name of the application's database.
    app_db: string;
    //
    //Subject comprises of the entity name to show in the home page
    //plus the database it comes from.
    subject: [string/*ename*/, string/*dbname*/];
    //
    //The full trademark name of the application
    trade: string;
    //
    //For advertising purposes
    tagline: string;
    //
    //Name of the applivcation developer
    developer: string;
    //
    //The path from where this application was loaded
    path: string;
    //
    //This is the general template for displaying the user report
    report: string;
    //
    //This is the complete path for the login template
    login: string;
    //
    //The complete path of the welcome template
    welcome: string;

    //The crud's template
    crud: string;
    //
    //This is the general template for collecting simple user data.
    general: string;
    //
    lv1: string;
    //
    //This is the general template for merging contributions
    merge: string;
    //The maximum number of records that can be retrieved from
    //the server using one single fetch. Its value is used to modify
    //the editor sql by  adding a limit clause
    limit: number
}