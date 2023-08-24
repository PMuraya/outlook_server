import * as lib from "../../../schema/v/code/library";

//Resolve the reference to the server
import * as server from "../../../schema/v/code/server.js";

import {view, page, panel} from "./view.js";

//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";

//re-export the view modules
export {view, page, panel} from "./view.js";



//Working with dates made easier by the Luxon library. Condider using Webpark to
//solve the javsacript failure to recognise the node_modules
//import * as luxon from "luxon";

//
//A quiz extends a page in that it is used for obtaining data from a user. The
//class parameter tells us about the type of data to be collected. Baby and popup 
//pages are extensions of a quiz.
export abstract class quiz<o> extends page{
    // 
    //These are the results collected by this quiz. 
    public result?: o;
    //
    //NB. The URL of a page is optional; if not defines, then a page is 
    //constructed from scratch.... 
    constructor(public url?: string) { 
        super(); 
    }

    //To administer a (quiz) page is to  managing all the operations from 
    //the  moment a page becomes visisble to when a result is returned and the
    //page closed. If successful a response (of the user defined type) is 
    //returned, otherwise it is undefined.
    async administer(): Promise<o | undefined>{
        //
        //Complete constrtuction of this class by running the asynchronous 
        //methods
        await this.initialize();
        //
        //Make the logical page visible and wait for the user to
        //succesfully capture some data or abort the process.
        //If aborted the result is undefined.
        return  await this.show();
    }
    
    //
    //This is the process which makes the page visible, waits for 
    //user to respond and returns the expected response, if not aborted. NB. The 
    //return data type is parametric
    private async show(): Promise<o | undefined> {
        //
        //Paint the full page. The next step for painting panels may need to
        //access elements created from this step. In a baby, this may involve
        //carnibalising a template; in a pop this does nothing
        await this.paint();
        // 
        //Paint the various panels of this page in the default 
        //way of looping over the panels. A page without the panels can 
        //overide this method with its own.
        await this.show_panels();
        //
        //Wait for the user to ok or cancel this quiz, if the buttons are 
        //provided
        const response = await new Promise<o | undefined>(resolve => {
            //
            //Collect the result on clicking the Ok/go button.
            const okay = <HTMLButtonElement> this.get_element("go");
            okay.onclick = async () => {
                //
                //Check the user unputs for errors. If there is
                //any, do not continue the process
                if (!await this.check()) return;
                //
                //Get the results
                const result = await this.get_result();
                //
                //Resolve the only when the result is ok
                resolve(result);
            };
            // 
            //Discard the result on Cancel (by returning an undefined value).
            const cancel = <HTMLButtonElement> this.document.getElementById("cancel");
            cancel.onclick = () => resolve(undefined);
        });
        //
        //Remove the popup window from the view (and wait for the mother to be 
        //rebuilt
        await this.close();
        //
        //Return the promised result.
        return response;
    }
    
    //
    //Paint the full page. The next step for painting panels may need to
    //access elements crrated from this step. In a baby, this may involve
    //carnibalising a template; in a pop this does nothing
    async paint():Promise<void>{};

    //The following abstract methods support the show process
    //
    //Check the inputs and return true if they are all valid
    abstract check():Promise<boolean>;
    
    //Returns a result of the requested type
    abstract get_result(): Promise<o>;
    
}
//
//The baby class models pages that share the same window as their mother.
//In contrast a popup does not(share the same window with the mother)
export abstract class baby<o> extends quiz<o>{
    //
    constructor(public mother?:page, url?: url) {
        super(url);
    }

    //Paint the baby with with its html content (after saving the  mother's view) 
    async paint(): Promise<void> {
        //
        //Get the baby template
        const Template = new template(this.url!);
        //
        //Open the template
        await Template.open();
        //
        //Replace the entire current document with that of the template
        this.document.documentElement.innerHTML = Template.win.document.documentElement.innerHTML;
        //
        //Close the baby template
        Template.win.close();
        //
        //Save this page's view, so that it can be resored when called upon
        //NB. The mother's view is already saved
        this.save_view("pushState");
        
    } 
    
    //
    //The opening of returns the same window as the mother
    public async open(): Promise<Window> {return this.mother!.win}

    //Close a baby page by invoking the back button; in contrast a popup does 
    //it by executing the window close method.
    async close():Promise<void> {
        //
        return new Promise(resolve=>{
            //
            //Prepare for the on=pop state, and resole when the mother has been 
            //restored
            this.win.onpopstate = (evt) => {
                //
                //Attend to ompop state event, thus restoring the mother
                this.onpopstate(evt);
                //
                //Now stop waiting
                resolve();
            };
            //
            //Issue a history back command to evoke the on pop state
            this.win.history.back();
        })
        
    }
    //
	//Fills the indentified selector element with options fetched from the given
	//table name in the given database
	async fill_selector(ename: string, dbname: string, selectorid: string) {
		//
		//1. Get the selector options from the database
		//
		//
		//1.1 Get the options of the first and second column names
		const options: Array<schema.fuel> = await server.exec(
			"selector",
			[ename, dbname],
			"execute",
			[]
		);
		//
		//2. Fill the selector with the options
		//
		//2.1. Get the selector element
		const selector = document.getElementById(selectorid);
		//
		//2.2. Check if the selector is valid
		if (!(selector instanceof HTMLSelectElement))
			throw new Error(`The element identified by ${selectorid} is not valid`);
		//
		//2.3 Go through the options and populate the selector with the option elements
		for (let option of options) {
			//
			//2.3.1. Get the primary key from the option
			//
			//Formulate the name of the primary key.
			const key = `${ename}_selector`;
			//
			const pk = option[key];
			//
			//2.3.2. Get the friendly component from the option
			const friend = option.friend__;
			//
            //
			this.create_element( "option", selector, {
				value: `${pk}`,
				textContent: `${friend}`
			});
		}
	}
}

//A template is a popup window used for canibalising to feed another window.
//The way you open it is smilar to  popup. Its flagship method is the copy 
//operation from one document to another 
export class template extends view {
    //
    //A template must have a url
    constructor(public url: string) {
        super(url)
    }

    //Opening a window, by default, returns the current window and sets the
    //title
    public async open(): Promise<void> {
        //
        //Open the page to let the server interprete the html 
        //page for us. The window is temporary 
        const win = window.open(this.url)!;
        //
        //Divert attention from the window, in an attempt to crontrol the flashing
        //win.blur doe does not work; consider using DOM to pen the html
        
        //
        //Wait for the page to load 
        await new Promise(resolve => win.onload = () => resolve(true));
        //
        //Set the win property for this page
        this.win = win;
    }
    //
    //Transfer the html content from this view to the specified
    //destination and return a html element from the destination view. 
    copy(src: string, dest: [view, string]): HTMLElement {
        //
        //Destructure the destination specification
        const [View, dest_id] = dest;
        //
        //1 Get the destination element.
        const dest_element: HTMLElement = View.get_element(dest_id);
        //
        //2 Get the source element.
        const src_element: HTMLElement = this.get_element(src);
        //
        //3. Transfer the html from the source to the destination. Consider
        //using importNode or adoptNode methods instead.
        dest_element.innerHTML = src_element.innerHTML;
        //
        //Return the destination painter for chaining
        return dest_element;
    }
    
    //Close the template after copying
    close():void{
        this.win.close();
    }    

}

//This class represents the view|popup page that the user sees for collecting
//inputs
export abstract class popup<o> extends quiz<o>{
    //
    constructor(
        //
        //Url to a HTML file that has the content for pasting into the popup
        url: string,
        // 
        //The popoup window size and location specifications.
        public specs?: string
    ) { super(url); }

    //
    //Open a pop window returns a brand new window with specified dimensions.
    public async open(): Promise<Window> {
        //
        //Use the window size and location specification if available.
        const specs = this.specs === undefined ? this.get_specs() : this.specs;
        //
        //Open the page to let the server interprete the html 
        //page for us.  
        const win = window.open(this.url, "", specs)!;
        //
        //Wait for the window to load
        await new Promise<Window>(
            resolve => win.onload = () => resolve(win)
        );
        //
        //Update this pop's win property
        return win;
    }
    
    //
    //Get the specifications that can center the page as a modal popup
    //Overide this method if you want different layout
    public get_specs(): string {
        //
        //Specify the pop up window dimensions.
        //width
        const w = 500;
        //height
        const h = 500;
        //
        //Specify the pop up window position
        const left = screen.width / 2 - w / 2;
        const top = screen.height / 2 - h / 2;
        //
        //Compile the window specifictaions
        return `width=${w}, height=${h}, top=${top}, left=${left}`;
    }
    
    //Close this popup window 
    async close(): Promise<void> {this.win.close();}
}
//)
// A string that represents urls for retrieving html files and templates.
export type url = string;
//
//Text that can be painted in on a page
export type html = string;
// 
//The response you get using aa popup or an ordinary page 
//export interface response { }
//
//
//Namespace for handling the roles a user plays in an application
export namespace assets {
    //
    //Title is a descriptive piece of text
    type title = string;
    //
    //Role id and entity ames at the application level are simply strings
    export type role_id = string;
    export type ename = string;

    //Verbs for crud operations
    export const all_verbs = ['create', 'review', 'update', 'delete'] as const;
    //
    //All possible operations that a user can to to an entity 
    //type verb = 'create'|'review'|'update'|'delete';
    export type verb = typeof all_verbs[number];
    //
    //Add/or remove an operation from all the 4 possible ones
    type xor = "-" | "+";
    // 
    //A listener is either a...
    export type listener =
        // 
        //...call to the inbuilt crud function...
        ["crud", ename, Array<verb>, xor, lib.dbname?]
        // 
        //...or a user defined function implemented directly in this code...
        | ["event", (...n: any) => void]
        // 
        //...or a user defined function specified as a string to be attached
        //to an element using the set attribute
        | ["string", string];
    // 
    //A solution in a product is implemented as a listener to some
    //executable code. 
    export interface solution {
        id: string,
        title: string,
        listener: listener
    }
    // 
    //This is a collection of solutions indexed by an id. Not how solutions
    //and produts build into a tree structure
    export type solutions = { [solution_id: string]: solution}
    // 
    //A product is a set of named solutions. The solutions are indexed to allow 
    //merging from different sources: shared inbuilts, inbuilt application 
    //specifics and database asset sub-system
    export interface product {
        //
        //Short name for the product.
        id: string,
        //
        //Longer descriptive name of the product.
        title: title,
        //
        //Mark products that are subscribed by a user.
        //They are accessed throught the product-asset-player route.
        is_subscribed?: boolean,
        //
        //Indicated if this is a globally accessible product or not. A product
        //is global if it is not associated with any application via the 
        //execution path.
        is_global: 'yes' | 'no',
        //
        //Products customized for a specific role.
        //They are accessed through the product-custom-role route of
        //the products model.
        customed?: Set<string> | null,
        //
        //Cost($) of subscribing to this product.
        //Null means it's free.
        cost?: number | null,
        //
        //Solutions associated with this product.
        solutions: solutions
    }
    //
    //The products are indexed by a product id of type string
    export type lookup = { [product_id: string]: product };
    //
    //A product where the solution is not indexed. This simplifies the
    //specficication of new products from a users perspective
    export interface uproduct {
        id: string,
        title: string,
        //
        //Solutions has been expanded to allow for recurssion
        solutions: Array<assets.solution>
    };

}
//This is a general structure for handling  key value pair situations. We use 
//this structure for making selections. The user sees the option's name; the value
//term is typically what we are interested in. Its type is user defined. Hence 
//the parametrization  
export type option<i> = { name: string, value:i}
//
//This is a generalised popup for making selections from multiple choices  
//The choices are provided as a list of key/value pairs and the output is 
//a either a single choice or a list of them.  
export class choices<
    //
    //Let 'i' be the user defined type of element of the array making up the 
    //input choices
    i,
    //
    //Let 'a' be the type of desired output constrained, i.e., single or multiple
    a extends 'single'|'multiple',
    //
    //Let 'r' be the data being returned by this popup. Its either a singe i or 
    //its array depending on the 'a' parameter
    r extends (a extends 'single' ? i: a extends 'multiple' ? Array<i>: never)
> extends popup<r>  {
    //
    constructor(
        //
        //The html file to use for the popup
        filename: string,
        // 
        //The option/term pairs that are to be painted as checkboxes
        //when we show the panel. 
        public options: Array<option<i>>,
        //
        //Indicate whether multiple or single choices are expected
        public type: a,
        // 
        //This is a short code that is used as a name for the checkbox
        //or radio buttons
        public id: string='temp',
        // 
        //The popoup window size and location specification.
        specs?: string,
        // 
        //The css that retrieves the element on this page where 
        //the content of this page is to be painted. If this css 
        //is not set the content will be painted at the body by default 
        public css: string = '#content'
        
    ) {
        super(filename, specs);
    }
    //
    //Check that the user has selected  at least one of the choices
    async check():Promise<boolean> {
        //
        //Get the user selections as array indices (of type text)
        const indices:Array<string>= this.get_input_choices(this.id);
        //
        //It's a user error if there is no choice made
        if (indices.length===0) {
            alert(`Please select at least one ${this.id}`);
            return false;
        }//
        //
        //Set the global property result, depending on this type specified in
        //the constructor
        switch(this.type){
           //
           //For single choices, return i 
           case 'single':
                //
                //Its a system error if more than one choice is made
                if (indices.length!==1) 
                    throw new schema.mutall_error('A single selection cannot be more than one');
                //
                //Set the result. (The constraining was suggested by Typescript)
                this.result = <r|undefined>this.options[+indices[0]].value;            
           break
           //
           //For multiple choices, return an array of i
           case 'multiple':
                //
                this.result = <r|undefined>indices.map(index=>this.options[+index].value);
           break;
           default:
                throw new schema.mutall_error(`Unknown type ${this.type}`); 
               
        }
        //
        //The selection was successful
        return true;
    }
    //
    //Retrive the choices that the user has filled from the form
    async get_result(): Promise<r> {
        //
        //Throw an exception if the result is not set
        if (this.result===undefined) throw new schema.mutall_error('You forgot to set the result');
        //
        return this.result;
    }
    //
    //Overide the show panels method by painting the css referenced element or 
    //body of this window with the inputs that were used to create this page 
    async show_panels() {
        //
        //Get the element where this page should paint its content, 
        //this is at the css referenced element if given or the body.
        const panel = this.document.querySelector(this.css);
        if (panel === null)
            throw new schema.mutall_error("No hook element found for the choices");
        //
        //The panel must be a html element. This test hs failed!!!! Is a HTMLDivElement
        //not a HTML Element? Ignore the test, and force panel to be a HTML element    
        //if (!(panel instanceof HTMLElement)) throw new schema.mutall_error(`The css '${this.css}' for hooking a choices panel must refer to a HTML element`);
        //
        // Use radio buttons for single choices and checkbox for multiple 
        // choices
        const choice_type = this.type === 'single' ? "radio" : "checkbox"
        //
        //Create a field set to contain the options, anchored in the panel
        const fs = this.create_element('fieldset', <HTMLElement>panel);
        //
        //Add teh legend
        this.create_element('legend', fs, {textContent: this.id});
        //
        //Attach the choices as the children of the field set
        this.options.forEach((option, index) => {
            //
            // Compile the HTML option element
            const label = this.create_element('label', fs, {
                textContent:`${option.name}`,
            });
            //Attach the checkbox/radio button to the label
            this.create_element('input', label, {
                type:choice_type,
                value:String(index),
                name:this.id
            });
        });
    }
}
// 
//This is a view displayed as a baby but not used for collecting data 
//It is used in the same way that we use an alert and utilises the general
//html.
export class report extends baby<void>{
    // 
    //
    constructor(
        // 
        //This popup parent page.
        mother: page,
        // 
        //The html text to report.
        public html: string,
        //
        //The html file to use
        filename: string
    ) {
        // 
        //The general html is a simple page designed to support advertising as 
        //the user interacts with this application.
        super(mother, filename);
    }
    // 
    //Reporting does not require checks and has no results to return because 
    // it is not used for data entry.
    async check():Promise<boolean>{return true;}
    async get_result(): Promise<void> {}
    // 
    //Display the report 
    async show_panels() {
        // 
        //Get the access to the content panel and attach the html
        const content = this.get_element('content');
        // 
        //Show the html in the content panel. 
        content.innerHTML = this.html;
        //
        //Hide the go button from the general html since it is not useful in the 
        //the reporting
        this.get_element("go").hidden = true;
    }
}
