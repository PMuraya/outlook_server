//
import * as library from "../../../schema/v/code/library.js";
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c.
import * as schema from "../../../schema/v/code/schema.js";
//
//
import * as server from '../../../schema/v/code/server.js'
//
//These are the components of the subject.
//The ename and dbname are defined in the library.d.ts,
//so we dont need to re-define them here.
export type subject = [library.ename, library.dbname];

//A view is the home of all methods that need to be accessible from
//the fron end.
export class view {
    //
    //This is used for indexing a view object to support implementation of the
    //static 'current' property, as well as associateing this view with a state
    //object in the management of sessions. It is set when this view is
    //constructed. See onpopstate
    public key: number;
    //
    //Lookup storage for all views created by this application.
    static lookup: Map<number, view> = new Map();
    //
    //The current active view where the events (on a html page) are wired. E.g.
    //<button onclick=view.current.open_dbase()>Ok</button>
    static current: view;
    //
    //A view is associated with a win property. Typically it is the current
    //window, when the view is created. This variable is protected so that
    //it accessible only via getters and setters. This is important because
    //other derivatives of this class access the window property in different
    //ways. For instance, a baby page gets its window from its mother
    protected win__: Window = window
    //
    //These are getter and setter to access the protected win variable. See
    //documention for propertu win__ above to appreciate the reason for using
    //of getters and setters in derived classes
    get win() {return this.win__;}
    set win(win: Window) {this.win__ = win;}
    //
    //The document of a view is that of its the window
    get document() {
        return this.win.document;
    }
    //
    //Friendly id of a view, for debugging purposes.
    public id = 'view';
    //
    //The children nodes of the root document element of this page
    //to support restoring of this page in response to the on pop state event.
    //The ordinary programmer is not expected to interact with this property,
    //so it is protected
    protected child_nodes: Array<ChildNode> = [];

    //
    constructor(
        //
        //The address  of the page. Some popup pages don`t have
        //a url that`s why it`s optional.
        public url?: string
    ) {
        //
        //Register this view identified by the last entry in the lookup table for views.
        //
        //The view's key is the count of the number of keys in the lookup.
        this.key = view.lookup.size;
        view.lookup.set(this.key, this);
    }


    //Returns the values of the currently selected inputs
    //from a list of named ones
    public get_input_choices(name: string): Array<string> {
        //
        //Collect the named radio/checked inputs
        const radios = Array.from(this.document.querySelectorAll(`input[name="${name}"]:checked`));
        //
        //Map teh selected inputs to thiier values and return the collection
        return radios.map(r => (<HTMLInputElement> r).value);
    }

    //Returns the value from an identified input or textarea element.
    //The function will fail if there is no input value.
    public get_input_value(id: string): string {
        //
        //Get the identified element.
        const elem = this.get_element(id);
        //
        //It must be an input  element or textarea.
        if (!(elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement))
            throw new schema.mutall_error(`'${id}' is not an input or textarea element`);
        //
        //There must be a value in the element.
        if (elem.value === "") 
            throw new schema.mutall_error(`No value found for element '${id}'`);
        // 
        //Return the input element value.
        return elem.value;
    }
    //
    //Returns the value of the checked radio button that have this given name.
    //There must be atleast one checked value.
    public get_checked_value(name: string): string {
        //
        //Get the radio button that is checked.
        const radio = document.querySelector(`input[name='${name}']:checked`);
        //
        //There must be atleast one checked value under the given name.
        if (radio === null) alert(`No checked value found under this name '${name}'`);
        //
        //Ensure that the radio element is a HTMLInputElement.
        if (!(radio instanceof HTMLInputElement)) 
            throw new schema.mutall_error(`The input named '${name}' is not a HTMLInputElement`);
        //
        //The radio button value must be set.
        if(radio.value === "") 
            throw new schema.mutall_error(`No value found for input named '${name}'`);
        //
        //Return the checked value.
        return radio.value;
    }
    //
    //Get the selected value from the identified selector.
    //There must be a selected value.
    get_selected_value(id: string): string {
        //
        //Get the Select Element identified by the id.
        const select = this.get_element(id);
        //
        //Ensure that the select is a HTMLSelectElement.
        if (!(select instanceof HTMLSelectElement))
            throw new schema.mutall_error(`The element identified by '${id}' is not a HTMLSelectElement.`);
        //
        //Ensure that the select element value is set.
        if(select.value === "") 
            throw new schema.mutall_error(`The value of the select element identified by '${id}' is not set.`);
        //
        //Return the selected value
        return select.value;
    }
    //
    //Create a new element from  the given tagname and attributes
    //we assume that the element has no children in this version.
    public create_element<
        //
        //The tagname is the string index of the html map.
        tagname extends keyof HTMLElementTagNameMap,
        //
        //Collection of attributed values. The typescript Partial  data type
        //is a short form of
        //attribute_collection extends {[key in attribute_name]?:HTMLElementTagNameMap[tagname][key]}
        attribute_collection extends Partial<HTMLElementTagNameMap[tagname]>
    >(
        //
        //The parent of the element to be created
        anchor: HTMLElement,
        //
        //The elements tag name
        tagname: tagname,
        //
        //The attributes of the element
        attributes: attribute_collection | null
    ): HTMLElementTagNameMap[tagname] {
        //
        //Create the element holder based on the td's owner documet
        const element = anchor.ownerDocument.createElement(tagname);
        //
        //Attach this element to the anchor
        anchor.appendChild(element);
        //
        //Loop through all the keys to add the atributes
        for (let key in attributes) {
            const value: any = attributes[key];
            //
            // JSX does not allow class as a valid name
            if (key === "className") {
                //
                //Take care of multiple class values
                const classes = (value).split(" ");
                classes.forEach((c: string) => element.classList.add(c));
            }
            else if (key === "textContent") {
                element.textContent = value;
            }
            else if (key.startsWith("on") && typeof attributes[key] === "function") {
                element.addEventListener(key.substring(2), value);
            }
            else {
                // <input disable />      { disable: true }
                if (typeof value === "boolean" && value) {
                    element.setAttribute(key, "");
                } else {
                    //
                    // <input type="text" />  { type: "text"}
                    element.setAttribute(key, value);
                }
            }
        }
        return element;
    }
    //
    //Return the identified element
    get_element(id: string): HTMLElement {
        //
        //Get the identified element from the current browser context.
        const element: HTMLElement | null =
            this.document!.querySelector(`#${id}`);
        //
        //Check the element for a null value
        if (element === null) {
            const msg = `The element identified by #${id} not found`;
            alert(msg);
            throw new Error(msg);
        }
        return element;
    }


    //Show or hide the identified a window panel. This method is typeically
    //used for showing/hiding a named grou of elements that must be shown
    //or hidden as required
    public show_panel(id: string, show: boolean): void {
        //
        //Get the identified element
        const elem = this.get_element(id);
        //
        //Hide the element if the show is not true
        elem.hidden = !show;
    }


}

//A page is a view with panels. It is an abstract class because
//the show panels method needs to be implemented by all classes
//that extend this one
export abstract class page extends view {
    //
    //A page has named panels that the user must ensure that they
    //are set before are shown.
    protected panels: Map<string, panel>;

    //
    constructor(url?: string) {
        super(url);
        //
        //Initialize the panels dictionary
        this.panels = new Map();
    }

    //
    //The user must call this method on a new application object; its main
    //purpose is to complete those operations of a constructor that require
    //to function synchronously
    async initialize(): Promise<void> {
        //
        //Set the window for this page
        this.win = await this.open();
        //
        //Add the pop state listener to ensure that if a history back button
        //is clicked on, we can restore this page
        this.win.onpopstate = (evt) => this.onpopstate(evt);
    }
    //Handle the on pop state listener by saving the current state and
    //restoring the view matching the event's history state
    protected onpopstate(evt: PopStateEvent) {
        //
        //Ignore any state that has no components to restore. Typically
        //this is the initial state placed automatically on the history
        //stack when this application loaded initially. For this version, the
        //null state is never expected because we did replace it in this
        //application's initializetion
        if (evt.state === null)
            throw new schema.mutall_error("Null state unexpected");
        //
        //Get the saved view's key
        const key = <number> evt.state;
        //
        //Use the key to get the view being restored. We assume that it must be
        //a baby of the same type as this one
        const new_view = <page> view.lookup.get(key);
        //
        //It is an error if the key has no matching view.
        if (new_view === undefined)
            throw new schema.mutall_error(`This key ${key} has no view`);
        //
        //Restore the components of the new view
        new_view.restore_view(key);
    }

    //
    //The default way a quiz view shows its content is
    //by looping through all its panels and painting
    //them. A quiz view without panels can override this method
    //to paint their contents.
    //This used to be the default implementation.
    /*
     public async show_panels(): Promise<void> {
        //
        //The for loop is used so that the panels can throw
        //exception and stop when this happens
        for (const panel of this.panels.values()) {
            await panel.paint();
        }
    }
    */
    //
    //The definition has been revised to abstract
    abstract show_panels(): Promise<void>;
    //Restore the children nodes of this view by re-attaching them to the
    //document element of this page's window.
    public restore_view(key: number): void {
        //
        //Get the view of the given key
        const View = view.lookup.get(key);
        //
        //It's an error if the view has not been cached
        if (View === undefined)
            throw new schema.mutall_error(`This key ${key} has no matching view`);
        //
        //Get the root document element.
        const root = View.document.documentElement;
        //
        //Clean the root before restoring it -- just in case the view
        //is attached to an old window;
        Array.from(root.childNodes).forEach(node => root.removeChild(node));
        //
        //Attach every child node of this view to the root document
        this.child_nodes.forEach(node => root.appendChild(node));
    }


    //Opening a page makes visible in the users view. All pages return the
    //current window. Only popups create new ones.
    async open(): Promise<Window> {
        return window;
    }

    //Remove a quiz page from a users view and wait for the base to rebuild.
    //In popups we simply close the window; in babies we do a history back,
    //and wait for the mother to be reinstated. In general, this does
    //nothing
    async close(): Promise<void> {}

    //Save the children of the root document element of this view to the history
    //stack using the 'how' method
    public save_view(how: "pushState" | "replaceState"): void {
        //
        //Get the root document element
        const root = this.document.documentElement;
        //
        //Save the child nodes to a local property
        this.child_nodes = Array.from(root.childNodes);
        //
        //Save (by either pushing or replacing) this view's state to the
        //windows session history indirectly -- indirectly because we don't
        //acutally save this view to the session history but its unique
        //identification key -- which then is used for looking up the view's
        //details from the static map, view.lookup
        this.win.history[how](
            //
            //The state object pushed (or replaced) is simply the key that
            //identifies this view in the static look for views, view.lookup
            this.key,
            //
            //The title of this state. The documentation does not tell us what
            //it is really used for. Set it to empty
            "",
            //
            //This browser bar info is not very helpful, so discard it
            ""
        );
    }


    //Show the given message in a report panel
    async report(error: boolean, msg: string) {
        //
        //Get the report node element
        const report = this.get_element('report');
        //
        //Add the error message
        report.textContent = msg;
        //
        //Style the report, depending on the error status
        if (error) {
            report.classList.add('error');
            report.classList.remove('ok');
        }
        else {
            report.classList.add('ok');
            report.classList.remove('error');
        }
        //
        //Hide the go button
        const go = this.get_element('go');
        go.hidden = true;
        //
        //Change the value of the cancel button to finish
        const cancel = this.get_element('cancel');
        cancel.textContent = 'Finish';
        //
        //Wait for the user to close the merge operation
        await new Promise(
            (resolve) => cancel.onclick = () => {
                this.close();
                resolve(null);
            }
        );
    }
    //Fills the identified selector element with options fetched from the given
    //table name in the given database
    async fill_selector( ename: string,dbname: string, selectorid: string): Promise<HTMLSelectElement> {
        //
        //1. Get the selector options from the database
        const options: library.Ifuel
            = await server.exec("selector", [ename, dbname], "execute", []);
        //
        //2. Fill the selector with the options
        //
        //2.1. Get the selector element
        const selector = this.get_element(selectorid);
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
            // const pk = option[key];
            const pk = option[key];
            //
            //2.3.2. Get the friendly component from the option
            const friend = option.friend__;
            //
            //Create the selector option.
            this.create_element(selector, 'option', {value: `${pk}`, textContent: `${friend}`});
        }
        return selector;
    }

}

//A panel is a targeted setction of a view. It can be painted
//independently
export abstract class panel extends view {
    //
    //The panels target element is set (from css in the constructor arguments)
    // when the panel is painted
    public target?: HTMLElement;
    //
    constructor(
        //
        //The CSS to describe the targeted element on the base page
        public css: string,
        //
        //The base view on that is the home of the panel
        public base: view
    ) {
        //The ur is that of the base
        super(base.url);
    }
    //
    //Start painting the panel
    async paint(): Promise<void> {
        //
        //Get the targeted element. It must be only one
        const targets = Array.from(
            this.document.querySelectorAll(this.css));
        //
        //There must be a target
        if (targets.length == 0) throw new schema.mutall_error(
            `No target found with CSS ${this.css}`);
        //
        //Multiple targets is a sign of an error
        if (targets.length > 1) throw new schema.mutall_error(
            `Multiple targets found with CSS ${this.css}`);
        //
        //The target must be a html element
        if (!(targets[0] instanceof HTMLElement)) throw new schema.mutall_error(`
        The element targeted by CSS ${this.css} must be an html element`)
        //
        //Set the html element and continue painting the panel
        this.target = targets[0];
        //
        //Continue to paint the pannel. This method is implemented differently
        //depending the obe extending class
        await this.continue_paint();
    }
    //
    //Continue painting the this pannel -- depending on its nature.
    public abstract continue_paint(): Promise<void>;
    //
    //The window of a panel is the same as that of its base view,
    //so a panel does not need to be opened
    get win() {
        return this.base.win;
    }
}
//
//A quiz extends a view in that it is used for obtaining data from a user. The
//parameter tells us about the type of data to be collected. Baby and popup
//pages are extensions of a view.
export abstract class quiz<o> extends page {
    //
    //These are the results collected by this quiz.
    public result?: o;

    constructor(public url?: string) {
        super();
    }

    //To administer a (quiz) page is to  managing all the operations from
    //the  moment a page becomes visisble to when a result is returned and the
    //page closed. If successful a response (of the user defined type) is
    //returned, otherwise it is undefined.
    async administer(): Promise<o | undefined> {
        //
        //Complete constrtuction of this class by running the asynchronous
        //methods
        await this.initialize();
        //
        //Make the logical page visible and wait for the user to
        //succesfully capture some data or abort the process.
        //If aborted the result is undefined.
        return await this.show();
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
    async paint(): Promise<void> {};

    //The following abstract methods support the show process
    //
    //Check the inputs
    abstract check(): Promise<boolean>;

    //Returns a result of the requested type
    abstract get_result(): Promise<o>;
}
//
//The baby class models pages that share the same window as their mother.
//In contrast a popup does not(share the same window as the mother)
export abstract class baby<o> extends quiz<o>{
    //
    constructor(public mother?: page, url?: url) {
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
    async close(): Promise<void> {
        //
        return new Promise(resolve => {
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

    //Open a window, by default, reurns the current window and sets the
    //title
    public async open(): Promise<void> {
        //
        //Open the page to let the server interprete the html
        //page for us. The window is temporary
        const win = window.open(this.url)!;
        //
        //Wait for the page to load
        await new Promise(resolve => win.onload = resolve);
        //
        //Retrieve the root html of the new documet
        this.win = win;
    }
    //
    //Transfer the html content from this view to the specified
    //destination and return a html element from the destination view.
    copy(src: string, dest: [view, string]): HTMLElement {
        //
        //Destructure the destination specification
        const [Page, dest_id] = dest;
        //
        //1 Get the destination element.
        const dest_element: HTMLElement = Page.get_element(dest_id);
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

}

//This class represents the view|popup page that the user sees for collecting
//inputs
export abstract class popup<o> extends quiz<o>{
    //
    constructor(
        url: string,
        //
        //The popoup window size and location specification.
        public specs?: string
    ) {super(url);}

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
        ["crud", ename, Array<verb>, xor, library.dbname?]
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
    //This is a collection of solutions indexed by an id.
    export type solutions = {[solution_id: string]: solution}
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
        //is global if t is not associated with any application via the
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
    export type lookup = {[product_id: string]: product};
    //
    //A product where the solution is not indexed. This simplifies the
    //specficication of new products from a users perspective
    export interface uproduct {
        id: string,
        title: string,
        solutions: Array<assets.solution>
    };

}
//This is a general structure for handling  key value pair situations.
export type key_value<i> = {key: i, value: string}
//
//This is a generalised popup for making selections from multiple choices
//The choices are provided as a list of key/value pairs and the output is
//a list keys.
export class choices<i> extends popup<Array<i>>  {
    //
    //These are the selected choices they are set during the check method
    //and returned at the get result. This property is private since its
    //value is only supposed to be retrieved using the get result method.
    private output?: Array<i>;
    //
    constructor(
        //
        //The html file to use for the popup
        filename: string,
        //
        //The key value pairs that are to be painted as checkboxes
        //when we show the panels.
        public inputs: Array<key_value<i>>,
        //
        //This is a short code that is used
        //as an identifier for this general popup
        public id: string,
        //
        //The popoup window size and location specification.
        specs?: string,
        //
        //The css that retrieves the element on this page where
        //the content of this page is to be painted. If this css
        //is not set the content will be painted at the body by default
        public css: string = '#content',
        //
        //Indicate whether multiple or single choices are expected
        public type: 'single' | 'multiple' = 'multiple',
    ) {
        super(filename, specs);
    }
    //
    //Check that the user has selected  at least one of the choices
    async check(): Promise<boolean> {
        //
        //Extract the marked/checked choices from the input checkboxes
        const result = <unknown> this.get_input_choices(this.id);
        //
        //Cast this result into the desired output
        this.output = <Array<i>> result;
        //
        //The ouput is ok if the choices are not empty.
        const ok = this.output.length > 0;
        if (!ok) {
            alert(`Please select at least one ${this.id}`);
            return false
        }
        //
        return true;
    }
    //
    //Retrive the choices that the user has filled from the form
    async get_result(): Promise<Array<i>> {
        return this.output!;
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
        //Attach the choices as the children of the panel
        this.inputs.forEach(option => {
            //
            //Destructure the choice item
            const {key, value} = option;
            //
            // Use radio buttons for single choices and checkbox for multiple
            // choices
            const type = this.type === 'single' ? "radio" : "checkbox"
            //
            // Compile the HTML option
            const html = `
                <label>
                 <input type='${type}' value= '${key}' name="${this.id}" >:
                 ${value}
                </label>`;
            //
            //Attach the label to the pannel
            const label = this.document.createElement("temp");
            (<HTMLElement> panel).appendChild(label);
            label.outerHTML = html;
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
    async check(): Promise<boolean> {return true;}
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
//
//A class to be implemented when creating a new class to avoid repetition.
//Once the class is called, one does not need to do anything else.
export abstract class terminal extends baby<true>{
    constructor(
        //
        //The mother view to the application.
        mother: page,
        //
        //The html page to load
        html: string
    ) {
        super(mother, html)
    }
    //
    //This method does nothing other than satisfying the contractual
    // obligation of a baby class.
    async get_result(): Promise<true> {
        return true;
    }   
}
//
//The are two ways of identifying a business.
export type business = 
    //
    //The first is when a business is picked from a selector in which case 
    //the primary key is needed.
    {source: 'selector', pk:string} 
    //
    //or when the user directly provides the data, in which case the identifiers
    //of a business are required.
    | {source: 'user', id: string, name:string};
//
//Represents a person/individual that is providing
//or consuming a services we are developing.
export class user {
    //
    //The provider supplied data
    public name: string | null;
    //
    //The type of this user.
    //A user is a visitor if he has never been registered before
    //otherwise regular. This property is set on app.login
    public type?: "regular" | "visitor";
    //
    //Optional provider supplied data
    public first_name?: string | null;
    public full_name?: string | null;
    public picture?: string | null;
    //
    //These are the roles that this user plays in the application that he`s
    //logged in.
    public role_ids?: Array<string>;
    //
    //The products that this user is assigned to.
    public products?: Array<assets.uproduct>
    //
    //The business
    public business?: business;
    //
    //The minimum requirement for authentication is a username and
    //password
    constructor(name: string | null = null) {
        //
        this.name = name;
    }

    //A user is a visitor if the name is not defined
    //otherwise his a regular user.
    is_visitor(): boolean {
        if (this.name === undefined) return true;
        else return false;
    }

}
