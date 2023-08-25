//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
//A view is the root of all classes in the outlook library, so, it holds methods 
//that and properties that all outlook users can access
class view {
    url;
    // 
    //This is used for indexing a view object to support implementation of the 
    //static 'current' property, as well as associateing this view with a state
    //object in the management of sessions. It is set when this view is 
    //constructed. See onpopstate 
    key;
    // 
    //Lookup storage for all views created by this application.
    static lookup = new Map();
    // 
    //The current active view where the events (on a html page) are wired. E.g.
    //<button onclick=view.current.open_dbase()>Ok</button>
    static current;
    //
    //A view is associated with a win property. Typically it is the current
    //window, when the view is created. This variable is protected so that
    //it accessible only via getters and setters. This is important because
    //other derivatives of this class access the window property in different
    //ways. For instance, a baby page gets its window from its mother
    win__ = window;
    // 
    //These are getter and setter to access the protected win variable. See 
    //documention for propertu win__ above to appreciate the reason for using 
    //of getters and setters in derived classes   
    get win() { return this.win__; }
    set win(win) { this.win__ = win; }
    //
    //The document of a view is that of its the window
    get document() {
        return this.win.document;
    }
    //
    //The id of a view is a unique name formed from its key, prefixed with 
    //word view, e.g., view1, view2, etc.
    //Id is used in so many waus n a view. It is not useful to define it at this
    //level
    //public get id(){return `view${this.key}`}
    //
    //The children nodes of the root document element of this page
    //to support restoring of this page in response to the on pop state event.
    //The ordinary programmer is not expected to interact with this property, 
    //so it is protected
    child_nodes = [];
    //
    //The end of time date is the highest valid date that the relational 
    //databases can accommodate
    static end_of_time = '9999-12-31';
    //
    constructor(
    //
    //The address  of the page. Some popup pages don`t have 
    //a url that`s why it`s optional.
    url) {
        this.url = url;
        // 
        //Register this view identified by the last entry in the lookup table for views.
        // 
        //The view's key is the count of the number of keys in the lookup.
        this.key = view.lookup.size;
        view.lookup.set(this.key, this);
    }
    //Returns an attribute's value, if it is available; otherwise an error
    get_attribute_value(element, name) {
        //
        //Get the named attribute from the given element
        const value = element.getAttribute(name);
        //
        //The attribute must be set; otherwise its an error
        if (value === null) {
            //
            //Report teh error
            throw new schema.mutall_error(`This element (see the console.log) has no attribute named ${name}.`, element);
        }
        //
        return value;
    }
    //Returns the values of the currently selected inputs 
    //from a list of named ones 
    get_input_choices(name) {
        //
        //Collect the named radio/checked inputs
        const radios = Array.from(this.document.querySelectorAll(`input[name="${name}"]:checked`));
        //
        //Map teh selected inputs to thiier values and return the collection
        return radios.map(r => r.value);
    }
    //
    //Returns the value from an identified input or textarea element.
    //The function will fail if there is no input value.
    get_input_value(id) {
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
    get_checked_value(name) {
        //
        //Get the radio button that matches the given name and is checked.
        const radio = document.querySelector(`input[name='${name}']:checked`);
        //
        //There must be at least one checked value under the given name.
        if (radio === null)
            alert(`No checked value found under this name '${name}'`);
        //
        //Ensure that the radio element is a HTMLInputElement.
        if (!(radio instanceof HTMLInputElement))
            throw new schema.mutall_error(`The input named '${name}' is not a HTMLInputElement`);
        //
        //The radio button's value must be set.
        if (radio.value === "")
            throw new schema.mutall_error(`No value found for input named '${name}'`);
        //
        //Return the checked value.
        return radio.value;
    }
    //
    //Get the selected value from the identified selector.
    //There must be a selected value.
    get_selected_value(id) {
        //
        //Get the Select Element identified by the id.
        const select = this.get_element(id);
        //
        //Ensure that the select is a HTMLSelectElement.
        if (!(select instanceof HTMLSelectElement))
            throw new schema.mutall_error(`The element identified by '${id}' is not a HTMLSelectElement.`);
        //
        //Ensure that the select element value is set.
        if (select.value === "")
            throw new schema.mutall_error(`The value of the select element identified by '${id}' is not set.`);
        //
        //Return the selected value
        return select.value;
    }
    //Create a new element from  the given tagname and attributes 
    //we assume that the element has no children in this version.
    create_element(
    //
    //The element's tag name
    tagname, 
    //
    //The parent of the element to be created.
    anchor, 
    //
    //The attributes of the element
    attributes) {
        //
        //Create the element holder based on the td's owner document
        const element = this.document.createElement(tagname);
        //
        //Attach this element to the anchor, if the anchor is defined 
        if (anchor !== undefined)
            anchor.appendChild(element);
        //
        //Loop through all the keys to add the atributes, if they are defoned
        if (attributes !== undefined)
            for (let key in attributes) {
                const value = attributes[key];
                // 
                // JSX does not allow class as a valid name
                if (key === "className") {
                    // 
                    //Take care of multiple class values
                    const classes = value.split(" ");
                    classes.forEach(c => element.classList.add(c));
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
                    }
                    else {
                        //
                        // <input type="text" />  { type: "text"}
                        element.setAttribute(key, value);
                    }
                }
            }
        //
        //Rteurn the element
        return element;
    }
    //
    //Return the identified element, if it exists. If it does not, then throw an
    //exception 
    get_element(id) {
        //
        //Get the identified element from the current browser context.
        const element = this.document.querySelector(`#${id}`);
        //
        //Check the element for a null value
        if (element === null)
            throw new schema.mutall_error(`The element identified by #${id} not found`);
        //
        //Return (found) the element       
        return element;
    }
    //Search and return the the only element selected by the gigen css
    //css selector; it is an error if more than 1 or none is found.
    query_selector(css) {
        //
        //Get the identified element from the current browser context.
        const elements = Array.from(this.document.querySelectorAll(css));
        //
        //If there is more than one element, warn the user
        if (elements.length > 1)
            throw new schema.mutall_error(`There are ${elements.length} elements selected by ${css}`);
        //
        //Check the elements is empty
        if (elements.length === 0)
            throw new schema.mutall_error(`The element with selector ${css} not found`);
        //
        //Return (the only found) the )HML) element       
        return elements[0];
    }
    //Show or hide the identified a window panel. This method is typeically 
    //used for showing/hiding a named grou of elements that must be shown
    //or hidden as required
    show_panel(id, show) {
        //
        //Get the identified element
        const elem = this.get_element(id);
        //
        //Hide the element if the show is not true
        elem.hidden = !show;
    }
    //Use the Luxon library to return the date and time for now() formated in 
    //the way  MYsql expects it. 
    now() {
        //
        //Discontinue the lusxon library
        //return luxon.DateTime.now().toFormat('YYYY-MM-DD hh:mm:ss');
        //
        //se the alternative method to get a mysql-compatible date strin for 
        //now();
        return view.standardise_date(new Date());
    }
    //
    //This is a general procedure for standardising conversion of dates to mySQL
    //compatible string format. I still a problem importing from a node_modules
    //library. Js won't understand import * as y from "x". It only understands
    //paths of the form: "./x.js" "../x.js", "/a/b/c/x.js". Perhaps its time to
    //learn how to use webpack. For now, use the native Js metod of convering the
    //date to a ISOstring, then replacing the T with a space and Z with noting
    static standardise_date(date) {
        //
        //Discontinue using the lucon libray
        //return luxon.DateTime.fromJSDate(date).toFormat('YYYY-MM-DD hh:mm:ss');
        //
        //Use the given date to bject and ...
        const str = date
            //
            //Convert the date ISO string, e.g., "2023-01-27T00:12:00.0000Z"
            .toISOString()
            //
            //Replace the T with a space
            .replace("T", " ")
            //
            //Remove the trailing Z for Zulu zone
            .replace("Z", "");
        //
        //Return the result as, e.g. "2023-01-27 00:12:00.0000" Will Mysql 
        //accept the .0000 bit? Not sure.
        return str;
    }
}
export { view };
//A page is a view with display panels
export class page extends view {
    //
    //A page has named panels that the user must ensure that they 
    //are set before they are shown.
    panels;
    constructor(url) {
        super(url);
        // 
        //Initialize the panels dictionary
        this.panels = new Map();
    }
    //
    //The user must call this method on a new application object; its main 
    //purpose is to complete those operations of a constructor that require
    //to function synchronously
    async initialize() {
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
    onpopstate(evt) {
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
        const key = evt.state;
        // 
        //Use the key to get the view being restored. We assume that it must be 
        //a baby of the same type as this one
        const new_view = view.lookup.get(key);
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
    async show_panels() {
        //
        //The for loop is used so that the panels can throw 
        //exception and stop when this happens  
        for (const panel of this.panels.values()) {
            await panel.paint();
        }
    }
    //Restore the children nodes of this view by re-attaching them to the 
    //document element of this page's window.  
    restore_view(key) {
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
    async open() {
        return window;
    }
    //Remove a quiz page from a users view and wait for the base to rebuild. 
    //In popups we simply close the window; in babies we do a history back, 
    //and wait for the mother to be reinstated. In general, this does 
    //nothing
    async close() { }
    //Save the children of the root document element of this view to the history
    //stack using the 'how' method
    save_view(how) {
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
        "");
    }
    //Show the given message in a report panel, Depending on the nature of the 
    //resport, the appropriate styling is applied
    async report(error, msg) {
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
    }
}
//A panel is a targeted section of a view. It can be painted 
//independently
export class panel extends view {
    css;
    base;
    //
    //The panel's target element is set (from css in the constructor arguments)
    //when the panel is painted
    target;
    //
    constructor(
    //
    //The CSS to describe the targeted element on the base page
    css, 
    //
    //A base view is the home of the panel
    base) {
        //The ur (required to initialize a view) is that of the base
        super(base.url);
        this.css = css;
        this.base = base;
    }
    //
    //Start painting the panel
    async paint() {
        //
        //Get the targeted element. It must be only one
        const targets = Array.from(this.document.querySelectorAll(this.css));
        //
        //There must be a target    
        if (targets.length == 0)
            throw new schema.mutall_error(`No target found with CSS ${this.css}`);
        //
        //Multiple targets is a sign of an error
        if (targets.length > 1)
            throw new schema.mutall_error(`Multiple targets found with CSS ${this.css}`);
        //
        //The target must be a html element
        if (!(targets[0] instanceof HTMLElement))
            throw new schema.mutall_error(`
        The element targeted by CSS ${this.css} must be an html element`);
        //
        //Set the html element and continue painting the panel
        this.target = targets[0];
        //
        //Continue to paint the pannel. This method is implemented differently
        //depending the obe extending class    
        await this.continue_paint();
    }
    //
    //The window of a panel is the same as that of its base view, 
    //so a panel does not need to be opened
    get win() {
        return this.base.win;
    }
}
