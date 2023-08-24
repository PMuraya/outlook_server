//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
//
//Added to allow access to a view
import * as view from "../../../outlook/v/code/view.js";
//Resolve the server functionality
import * as server from "../../../schema/v/code/server.js";
//
//Why this method? Because the Theme class is becoming too large. The io class 
//was conceived in an attempt to offload certain 'related' methods from Theme class  
export class io extends view.view {
    anchor;
    col;
    // 
    //This span tag is for displaying this io's content in normal mode 
    output;
    // 
    //Dictionary of looking up ios using the anchoring HTML element.
    static collection = new Map();
    //To support value restoration, save the orignal one here.
    original_value;
    //
    constructor(
    //
    //The parent element of this io, e.g., the td of a tabular layout.
    anchor, 
    //
    //One purpose for an io is to support CRUD services in a database.
    //But, an io without reference to a column, is also important. For instance
    //in the tree work. To support this duality, a column is optional (but
    //required in foreign and primary ios
    col) {
        //Initialize the parent view
        super();
        this.anchor = anchor;
        this.col = col;
        // 
        //Set the ouput span element
        this.output = this.create_element("span", anchor.element, { className: "normal" });
        //
        //Once an io is created, update the global dictionary for associating 
        //io's with their  corresponding tds
        io.collection.set(anchor.element, this);
    }
    // 
    //Returns the document to which the anchor is attached;
    get document() {
        return this.anchor.element.ownerDocument;
    }
    //
    //Restore the original value
    restore() {
        //
        //Restore the original value. It must be set. It is an error if it not
        if (this.original_value === undefined)
            throw new schema.mutall_error(`The original value of this io is not set`);
        //
        //Re-set the value to the original one.    
        this.value = this.original_value;
    }
    //
    //This method is called to mark this io's anchor (td) and its associated 
    //primary key td as edited. This is important for selecting the tds that 
    //should be considered for saving.
    //It also ensures that the io's input values are transferred to the output
    //tag to be visible to the user in the io's fashion
    mark_as_edited() {
        //
        //Mark the anchor of this io as edited
        this.anchor.element.classList.add("edited");
        //
        //Get primary key td (of the row that contains 
        //this td) and mark it as edited. It is the first td in the table row
        //than contains this io's anchor
        const pri = this.anchor.element.parentElement.children[0];
        pri.classList.add("edited");
        // 
        //Update the outputs of the io associated with the td
        //
        //Use the dictionary to get io that matches this anchor
        const Io = io.collection.get(this.anchor.element);
        //
        //Its an error if there is no io associated with this anchor
        if (Io === undefined) {
            throw new schema.mutall_error(`No io found at ${String(Io)}`);
        }
        //
        //Do the transfer to update inputs
        Io.update_outputs();
    }
    // 
    //A helper function for creating and showing labeled inputs element.
    show_label(
    // 
    //The header text of the label 
    text, 
    //
    //Child elements of the label
    ...elements) {
        // 
        //Create the label and attach it to the anchor.
        const Label = this.document.createElement("label");
        this.anchor.element.appendChild(Label);
        // 
        //Create a text node if necessary and attach it to the label.
        const header = text instanceof HTMLElement
            ? text : this.document.createTextNode(text);
        Label.appendChild(header);
        // 
        //Attach the labeled elements 
        elements.forEach(element => Label.appendChild(element));
        //
        return Label;
    }
    //
    //Setting and getting io values rely on the input's value 
    get value() {
        return this.input_value;
    }
    set value(v) {
        //
        //To supprt value restoration, save the original one here
        this.original_value = v;
        //
        //Depending on the io, set its input value
        this.input_value = v;
        //
        //Ensure that the output is updated from the inputs
        this.update_outputs();
    }
    // 
    //Show this io's elements in the desired order. For now this  
    //methods does nothing, implying that the order in which elements
    //are created is the same as that of displaying them. You override
    //this method if you want to change the order. See the file_io example
    show() { }
    //
    //Create an io instance using the optional io type. If the io type is not 
    //given, deduce it from the database column's data type.
    static create_io(
    // 
    //The parent of the input/output elements of this io. 
    anchor, 
    //
    //The type of io. If available, we use it to define the io; if not we 
    //deduce it from the column
    type, 
    // 
    //The column associated with this io, if availab,e. 
    col) {
        //
        //We must be able to defne the io type (or an actual io) from either
        //the type or the column.
        const result = io.get_io_type(anchor, type, col);
        //
        //If the result is an io, return it
        if (result instanceof io)
            return result;
        //
        //Use the resulting io type to formulate the  io instance
        switch (result) {
            //
            //For simple io types that use the standard HTML input element...
            case 'date':
            case 'number':
            case 'email': return new input(result, anchor, col);
            //
            //For the more sophisticated io types....
            //
            //A single checkbox used for representing a boolean io
            case 'checkbox': return new checkbox(anchor, col);
            //
            //Single or multiple choices implemented as a set of radio or 
            //checkbox inputs
            case 'checkboxes': return new choices(anchor, col, 'multiple');
            case 'radios': return new choices(anchor, col, 'single');
            //
            //Inputs collected using a textaera element
            case 'textarea': return new textarea(anchor, col);
            //
            //Read only fields
            case 'read_only': return new readonly(anchor);
            //
            //Take care of the text with size specifications
            default:
                if (
                //Text io are specified as an object...
                typeof result === "object"
                    //
                    //...that has a type field....
                    && result.type !== undefined
                    //
                    //...whose value is 'text'
                    && result.type === 'text') {
                    //
                    //Destructure the result to data type and size
                    const { type, size } = result;
                    //
                    return new input({ type, size }, anchor, col);
                }
                else {
                    //
                    //This io specification is not handled
                    throw new schema.mutall_error(`This io_type '${result}' is not handled`);
                }
        }
    }
    //Returns an io or its type. If both the type and column are define, the
    //type takes precedence. It is an error if  neither type nor colum is defined
    static get_io_type(anchor, type, col) {
        //
        //If the type is defined, return it
        if (type !== undefined)
            return type;
        //
        //If the database column is known, deduce the io type from it
        if (col !== undefined)
            return io.deduce_io(anchor, col);
        //
        //Neither the col nor the type is defined: it must be an error
        throw new schema.mutall_error(`Neither the io_type nor the dabase colum is defined `);
    }
    //Deduce and create an io from the given databse column. 
    static deduce_io(
    // 
    //The parent of the input/output elements of this io. 
    anchor, 
    // 
    //The column associated with this io. 
    col) {
        //
        //Read only collumns will be tagged as such.
        if (col.read_only !== undefined && col.read_only)
            return new readonly(anchor, col);
        //
        //Atted to the foreign and primary key columns
        if (col instanceof schema.primary)
            return new primary(anchor, col);
        if (col instanceof schema.foreign)
            return new foreign(anchor, col);
        //
        //Attend the attributes
        //
        //A column is a checkbox if...
        if (
        //
        //... its name prefixed by 'is_'....
        col.name.startsWith('is_')
            // 
            //...or its datatype is a tinyint.. 
            || col.data_type === "tinyint"
            //
            //...or the field length is 1 character long
            || col.length === 1)
            return new checkbox(anchor, col);
        //
        //If the length is more than 100 characters, then assume it is a textarea
        if (col.length > 100)
            return new textarea(anchor, col);
        //
        //If the column name is 'description', then its a text area
        if (col.name === 'description')
            return new textarea(anchor, col);
        //
        //Time datatypes will be returned as dates.
        if (["timestamp", "date", "time", "datetime"]
            .find(dtype => dtype === col.data_type))
            return new input("date", anchor, col);
        //
        //The datatypes bearing the following names should be presented as images
        // 
        //Images and files are assumed  to be already saved on the 
        //remote serve.
        if (["logo", "picture", "profile", "image", "photo"]
            .find(cname => cname === col.name))
            return new file(anchor, "image", col);
        //
        if (col.name === ("filename" || "file"))
            return new file(anchor, "file", col);
        //
        //URL
        //A column is a url if...
        if (
        // 
        //... its name matches one of the following ...
        ["website", "url", "webpage"].find(cname => cname === col.name)
            // 
            //...or it's taged as url using the comment.
            || col.url !== undefined)
            return new url(anchor, col);
        //
        //SELECT 
        //The io type is select if the select propety is set at the column level
        //(in the column's comment). 
        //Select requires column to access the multiple choices.
        if (col.data_type == "enum")
            return new select(anchor, col);
        //
        //String datatypes will be returned as normal text, otherwise as numbers.
        if (["varchar", "text"]
            .find(dtype => dtype === col.data_type))
            return new input({ type: "text" }, anchor, col);
        if (["float", "double", "int", "decimal", "serial", "bit", "mediumInt", "real"]
            .find(dtype => dtype === col.data_type))
            return new input("number", anchor, col);
        // 
        //The default io type is read only 
        return new readonly(anchor, col);
    }
    //Use the io collection to lookup the io associated with the given
    //html element (yypically a td). There must be one.
    static get_io(td) {
        //
        //Lookup the given td
        const Io = io.collection.get(td);
        //
        //The io must be defined
        if (Io === undefined)
            throw new schema.mutall_error(`No io found for this anchoring element`);
        //
        //Return the io
        return Io;
    }
    //
    //Returns the label layout for this io value. See the questiionnaire 
    //interface for label and table layouts. By default, the alias is empty
    get_label_layout(alias = []) {
        //
        //The value of the io, as teh expression for the desired label
        const exp = this.value;
        //
        //The column must be defined
        if (this.col === undefined)
            throw new schema.mutall_error('No column (col) property is found for this io');
        //
        //The database column name associate with this io. It must exist
        const cname = this.col.name;
        //
        //The name of the database entity in which the col is found
        const ename = this.col.entity.name;
        //
        //The datase name where the entity is found
        const dbname = this.col.entity.dbase.name;
        //
        //Return the complete label
        return [dbname, ename, alias, cname, exp];
    }
    //Check if an io's value is valid or not. If not, report it as close as 
    //possible to its origin; otherwise add it to a report tag if any. If there 
    //is no report tag, alert the user. Finally return its value. 
    check() {
        //
        //Get the io's value
        const value = this.value;
        //
        //Get the io's requirement. By default, all io's are required, unless
        //explicity stated using the data-optional attribute
        const is_required = 
        //
        //If the data-optional attribute is available...
        'data-optional' in this.anchor.element.dataset
            //
            //..then require is false; otherwise it is true
            ? false : true;
        //
        //Get the io's status:Error or basic value
        const status = 
        //
        //If the value is required and it is a null...
        is_required && value === null
            //
            //...then the status is error; 
            ? new Error('This value is required and it is empty')
            //
            //...otherwise the value is the status
            : value;
        //
        //If the status is erroneous, then add it to the error report
        if (status instanceof Error)
            this.error.textContent += status.message;
        //
        //Return the status            
        return status;
    }
    //The nameid of an io, if provided, is used for indexing its value, so that we
    //can easily access it for futher processing with an form. If not provided, 
    //and the io is  column-base, it is formed by combining the entity and 
    //column names; we don't we return undefined.
    //NB. Id is a property for identifybing a view
    get name() {
        //
        //Let id be the desired column name
        let id;
        //
        //Get and return the io's id, if it is present
        if ((id = this.anchor.element.id) !== null)
            return id;
        //
        //If the io is not column based, then the id id undefined
        if (this.col === undefined)
            return undefined;
        //
        //Formulate the id by joining ename to cname;
        return `${this.col.entity.name}_${this.col.name}`;
    }
    //Returns the error notification tag for this io. There must be one
    get error() {
        //
        //Get any error tag hat is a descendant of this element's io
        const tag = this.anchor.element.querySelector('.error');
        //
        //If not  found, throw an excepetion
        if (tag === null)
            throw new schema.mutall_error(`Cannot fine the error reporting tag for this io`, this);
        //
        return tag;
    }
}
// 
//This io class models a single choice selector from an enumerated list that is
//obtained from column type definition. 
export class select extends io {
    col;
    //
    //Save the value from the database since we are unable to set it at the 
    //selected option in the select tag.
    value_str;
    //
    //The selector element.
    input;
    // 
    constructor(anchor, 
    // 
    //The source of our selector choices 
    col) {
        super(anchor, col);
        this.col = col;
        // 
        //Set the input select element 
        this.input = this.create_element("select", anchor.element, {
            className: "edit",
            //
            //When the input chamges, then mark the current anchor(td) as edited
            onchange: () => this.mark_as_edited()
        });
        //
        //Get the choices from the column attribute.
        const choices = this.get_choices(col.type);
        // 
        //Add the choices to the selector 
        choices.forEach(choice => this.create_element("option", this.input, { value: choice, textContent: choice, id: choice }));
    }
    //
    //Extract the choices found in a column type.
    //The choices have a format similar to:- "enum(a, b, c, d)" and we are 
    //interested in the array ["a","b","c","d"]
    get_choices(choices) {
        //
        //Remove the enum prefix the leading bracket.
        const str1 = choices.substring(5);
        //
        //Remove the last bracket.
        const str2 = str1.substring(0, str1.length - 1);
        //
        //Use the comma to split the remaining string into an array.
        return str2.split(",");
    }
    //
    //The value of a select io is the value of the selected option 
    get input_value() { return this.input.value; }
    set input_value(i) {
        //
        //Get the option about to be set.
        this.input.value = String(i);
        //
        //
        this.value_str = String(i);
    }
    // 
    //The displayed output of a select is the text content 
    //of the selected option
    update_outputs() {
        // 
        //Transfer the input value to the output.
        this.output.textContent = this.value_str;
    }
}
// 
//This io class models an anchor tag.
export class url extends io {
    //
    //The output is an anchor tag overides the span output.
    output;
    // 
    //The input for the address(href)
    href;
    // 
    //The friendly component of an anchor tag
    text;
    // 
    // 
    constructor(anchor, col) {
        super(anchor, col);
        //
        this.output = this.create_element(`a`, anchor.element, { className: "normal" });
        // 
        //Create a the url label 
        const url_label = this.create_element(`label`, anchor.element, { className: "edit", textContent: "Url Address: " });
        // 
        //Attach the url input tag to the label
        this.href = this.create_element(`input`, url_label, {
            type: "url",
            //
            //When the input chamges, then mark the current anchor(td) as edited
            onchange: () => this.mark_as_edited()
        });
        // 
        //Create a text label
        const text_label = this.create_element(`label`, anchor.element, {
            className: "edit", textContent: "Url Text: "
        });
        // 
        //Add this text tag to the the label
        this.text = this.create_element(`input`, text_label, {
            type: "text",
            //
            //Add a listener to mark this text element as edited.
            onchange: () => this.mark_as_edited()
        });
    }
    // 
    //Setting the value as a url involves a parsing the value if it 
    //is not a null and initializing the url and text inputs.
    set input_value(i) {
        //
        //Convert the value  to a js object which has the following 
        //format '["address", "text"]'(taking care of a null value)
        const [address, text] = i === null
            ? [null, null]
            // 
            //The value of a url must be of type string otherwise 
            //there is a mixup datatype
            : JSON.parse(i.trim());
        //
        //Set the inputs 
        this.href.value = address;
        this.text.value = text;
    }
    // 
    //Updating the url involves transfering values from the
    //input tags to the anchor tags.
    update_outputs() {
        this.output.href = this.href.value;
        this.output.textContent = this.text.value;
    }
    // 
    //The value of a url is a string of url/text tupple
    get input_value() {
        // 
        //Return a null if the address is empty...
        const rtn = this.href.value === "" ? null
            //
            //... otherwise return  url/text values as a stringified
            //tupple.
            : JSON.stringify([this.href.value, this.text.value]);
        return rtn;
    }
}
//
//Read only class represents an io that is designed not  
//to be edited by the user directly, e.g., KIMOTHO'S 
//real estate, time_stamps, etc.
export class readonly extends io {
    //
    // The place holder for the read only value 
    output;
    // 
    constructor(anchor, col) {
        super(anchor, col);
        // 
        //Read only cells will be specially formated 
        this.output = this.create_element(`span`, anchor.element, { className: "read_only" });
    }
    // 
    //The read-only value come from the output tag 
    get input_value() { return this.output.textContent; }
    //A user cannot set a rea-only value, but, a programmer can...
    set input_value(i) {
        //
        //...by changing the text content of the output element
        this.output.textContent = i;
    }
    // 
    //The read only values do not change.
    update_outputs() { }
}
//The foreign key io class supports input/output function for foreign key 
//attributes. It is designed to improve the user's experience of capturing 
//foreign key data beyond what phpMyadmin does 
export class foreign extends io {
    col;
    use_explorer;
    //
    //The span tag that displays the friendly component of a foreign key
    friendly;
    //
    //The button used for evoking foreign key edit, i.e., reviewing and updating
    button;
    //
    //The constructor includes the element to anchor this io. Redclare the column
    //as public so that its a much richer type than the  io being extended
    constructor(
    //
    //The parent of the html elements that make up this io  
    anchor, 
    //
    //The column must be a foreign key
    col, 
    //
    //Previous use of a foreign key did not require explorer. Hence the 
    //default value 
    use_explorer = false) {
        super(anchor, col);
        this.col = col;
        this.use_explorer = use_explorer;
        //
        //Show the friendly name in a span tag. Note, the friendly class name
        //needed to allow us to identity this button, among others. Normal 
        //implies that this tag will be displayed not in the edit mode but in
        //the normal one 
        this.friendly = this.create_element(`span`, anchor.element, { className: "normal friendly" });
        //
        //Add to this foreign io, a button for initiating editing.
        this.button = this.create_element(`input`, anchor.element, {
            type: "button",
            //
            //This button should be visible only in edit mode and its locally
            //identified by the name 'button'if need be
            className: "edit button",
            //
            //Add the listener for initiating the editing operation using either
            //the modern explorer or the earlier crud.page.
            onclick: async (evt) => {
                alert('Not implemented');
            }
        });
    }
    //Setting the value of a foreign key attribute.
    set input_value(i) {
        //
        //Ignore the input if it is a null
        if (i === null)
            return;
        //
        //The input must be a simple json string
        if (typeof i !== "string")
            throw new schema.mutall_error(`The input to foreign key '${i}' is expected to a json string. '${typeof i}' was found`);
        //
        //Destructure the foreign key value to access the 2 components. 
        const [pk, friend] = JSON.parse(i);
        // 
        //Verify that the primary and friendly keys are defined
        if (pk === undefined || friend === undefined)
            throw new schema.mutall_error(`The foreign key json string '${i}' is not formatted as a [pk. friend pair]`);
        // 
        //The button's value is the friendly component
        this.button.value = friend;
        //
        //Save the primary key value in the buttons's pk attribute
        this.button.setAttribute("pk", pk);
    }
    //Get the value of a foreign key attribute from its pk attribute
    //(See above how the value is set)
    get input_value() {
        //
        //The value of a foreign key is the value if the primary key attribute
        return this.button.getAttribute("pk");
    }
    //
    //Transfer the primary key and its friend from the input button to the
    //friendly span tag
    update_outputs() {
        //
        //Get the primary key
        const pk = this.button.getAttribute("pk");
        //
        //Get the friendly component
        const friend = this.button.value;
        // 
        //The full friendly name is valid only when there is a primary key.
        this.friendly.textContent = pk === null ? "" : `${pk}-${friend}`;
    }
}
//The class of ios based on the simple input elemnt. 
export class input extends io {
    input_type;
    //
    //The element that characterises an input
    input;
    //
    constructor(
    //
    //The type of the input, e.g., text, number, date, etc.
    input_type, 
    //
    //The anchor/parent of this element, e.g., td for tabular layout
    anchor, 
    //
    //The database column assocuated with this io, if available
    col) {
        //
        //The 'element input type' of an 'input io' is the same as that
        //of the input tag
        super(anchor, col);
        this.input_type = input_type;
        //
        //Compile the input tag
        this.input = this.create_element("input", anchor.element, {
            type: this.to_string(input_type),
            //
            //In edit mode, this will be visible
            className: "edit",
            onchange: () => this.mark_as_edited(),
            //
            //Set the maximum charater length, for texts only
            max_character_length: typeof input_type === 'object' ? input_type.size : undefined
        });
    }
    //Convert the input type to string
    to_string(type) {
        //
        //If teh type is a simple text, the return it as it is
        if (typeof type === 'string')
            return type;
        //
        //The type is an object. Check if it is text
        if (type.type === 'text')
            return 'text';
        //
        //Any other input type object represents a type that must have been
        //forgoten
        throw new schema.mutall_error(`Input type ${String(type)} is not known`);
    }
    //
    //Setting and getting input values
    get input_value() { return this.input.value; }
    set input_value(v) {
        //
        //Convert the input value to string.
        let str = v === null ? "" : String(v);
        //
        //If the input is a date/time then package it in the format expectd
        //by Mysql database
        //??
        //
        //Assign the string to the input value. 
        this.input.value = str;
    }
    //
    //Updating of input based io is by default, simply copying the data from
    //the input element to to the output (span) tag
    update_outputs() {
        this.output.textContent = this.input.value;
    }
}
// 
//This io is for capturing local/remote file paths and including images 
export class file extends input {
    type;
    //
    //The selector for the file source remote/local
    source_selector;
    // 
    //This is an input of type file to allow selection of files on the 
    //local client 
    file_selector;
    // 
    //The home button for the click listerner that allows us to browse the server 
    //remotely
    explore;
    // 
    //This is a header for labeling the input element and the explorer buttom 
    input_header;
    // 
    //Home button for the click listener to upload this file from the local to the 
    //remote server. 
    upload;
    //
    //The tag for holding the image source if the type is an image.
    image;
    //
    //Default image sizes (in pixels) as they are being displayed on a crud page
    static default_height = 75;
    static default_width = 75;
    // 
    constructor(anchor, 
    // 
    //What does the file represent a name or an image
    type, col) {
        // 
        //Ensure the input is of type=text 
        super({ type: "text" }, anchor, col);
        this.type = type;
        // 
        //Select the remote or local storage to browse for a file/image
        this.source_selector = this.create_element(`select`, anchor.element, {
            className: "edit",
            //Show either the remote server or the local client as the 
            //source of the image. 
            onchange: (evt) => this.toggle_source(evt)
        });
        // 
        //Add the select options 
        this.create_element("option", this.source_selector, { value: "local", textContent: "Browse local" });
        this.create_element("option", this.source_selector, { value: "remote", textContent: "Browse remote" });
        // 
        //This is a local file or image selector. 
        this.file_selector = this.create_element(`input`, anchor.element, {
            //
            //For debugging purposes, hardwire this to a file rather than
            //the type variable, because the image input type does not 
            //behave as expected.
            type: "file",
            className: "edit local",
            value: "Click to select a file to upload"
        });
        // 
        //The home for the click listerner that allows us to browse the server 
        //remotely 
        this.explore = this.create_element(`input`, anchor.element, {
            className: "edit local",
            type: "button",
            value: "Browse server folder",
        });
        //
        //Upload this file after checking that the user has all the inputs.
        //i.e., the file name and its remote path.
        this.upload = this.create_element(`input`, anchor.element, {
            className: "edit local",
            type: "button",
            value: "Upload",
            onclick: async (evt) => await this.upload_file(evt)
        });
        //
        //The tag for holding the image source if the type is an image.
        if (type === "image") {
            this.image = this.create_element(`img`, anchor.element, {
                height: file.default_height,
                width: file.default_width
            });
        }
    }
    // 
    //Overide the show method to allow us to re-arrange the input/output 
    //elements of a file;
    show() {
        //
        //I think we should start by clearing the default order of the anchor's
        //children by removing them. Should we not?
        // 
        //Show the output elements, i.e., the filename and image
        this.anchor.element.appendChild(this.output);
        if (this.image !== undefined)
            this.anchor.element.appendChild(this.image);
        // 
        //Show the source selector
        this.show_label("Select source: ", this.source_selector);
        // 
        //Show the file selector
        //<Label>select image/file<input type="file"></label>
        this.show_label("Select file: ", this.file_selector);
        // 
        //Show the file/folder input and the server browser button
        // '
        //Create the header for that label
        this.input_header = this.document.createElement("span");
        this.show_label(this.input_header, this.input, this.explore);
        //
        //Reattach the upload button to force it to the last position
        this.anchor.element.appendChild(this.upload);
    }
    //
    //This is an event listener that paints the current page 
    //to allow the user to select an image/file
    //from either the remote server or the local client 
    toggle_source(evt) {
        //
        //Target element must match the source selector.
        if (evt.target !== this.source_selector)
            throw new Error("The source selector must be the same as the event target");
        //
        //Get the selected (and unselected) options.
        const selected = this.source_selector.value;
        const unselected = selected === "local" ? "remote" : "local";
        //
        //Get the link element; it must exist.
        const link = this.document.querySelector("#theme_css");
        if (link === null)
            throw new Error("Element #theme_css not found");
        //
        //Get the CSS stylesheet referenced by the link element; it must exist.
        const sheet = link.sheet;
        if (sheet === null)
            throw new Error("CSS stylesheet not found");
        //
        //Show the selected options, i.e., set hide to false.
        this.update_stylesheet(sheet, selected, false);
        //
        //Hide the unselected options, i.e., set hide to true.
        this.update_stylesheet(sheet, unselected, true);
        // 
        //Update the input header label to either a file or folder depending 
        //on the selected source.
        this.input_header.textContent =
            `Select ${selected === "remote" ? "file" : "folder"}`;
    }
    //
    //Update the stylesheet so that the given selection is either 
    //hidden or displayed; if hidden the display property of the 
    //matching CSS rule is set to none, otherwise it's removed.
    update_stylesheet(sheet, selection, hide) {
        //
        //Use the selection to find the relevant rule.
        //
        //Convert the rule list (in the stylesheet) to an array.
        const rules = Array.from(sheet.cssRules);
        //
        //Find the index of the rule that matches the selection.
        const index = rules.findIndex((rule1) => rule1.selectorText === `.${selection}`);
        if (index === -1)
            throw new Error(`Rule .${selection} not found`);
        //
        //Use the index to get the rule.
        const rule = rules[index];
        //
        //Add or remove the display property.
        if (hide)
            rule.style.setProperty("display", "none");
        else
            rule.style.removeProperty("display");
    }
    //
    //This is a button`s onclick that sends the selected file to the server
    //at the given folder destination, using the server.post method
    async upload_file(evt) {
        //
        //Test if all inputs are available, i.e., the file and its server path
        //
        //Get the file to post from the edit window
        //Get the only selected file
        const file = this.file_selector.files[0];
        //
        //Ensure that the file is selected
        if (file === undefined)
            throw new schema.mutall_error('Please select a file');
        //
        //Get the sever folder
        const folder = this.input.value;
        //
        //Post the file to the server
        const { ok, result, html } = await server.post_file(file, folder);
        //
        //Flag the td inwhich the button is located as edited.
        if (ok) {
            // 
            //Update the input tag 
            //
            //The full path of a local selection is the entered folder 
            //plus the image/file name
            this.input.value += "/" + file.name;
        }
        //
        //Report any errors plus any buffered messages. 
        else
            throw new schema.mutall_error(html + result);
    }
    // 
    //Overide the setting of the input value so as to extend the 
    //changing of the image source.
    set input_value(i) {
        super.input_value = i;
        if (this.type === "image") {
            //
            //Set the image to the defalt when it is null
            this.image.src = i === null
                ? "/pictures/default.jpeg"
                : String(i);
        }
    }
}
//The text area class is an io extension of a simple input to allow
//us to capture large amounts of text in an expandable box. 
export class textarea extends input {
    // 
    //The native textarea element.
    textarea;
    //
    constructor(anchor, col, size) {
        //
        //The element being extended is an input of type text
        super({ type: "text", size }, anchor, col);
        //
        //Set the native textarea element.
        this.textarea = this.create_element(`textarea`, anchor.element, {
            //
            //The text area is available only in edit mode
            className: "edit",
            //
            //
            //Even when the text area is aiable, it should show only when 
            //needed, i.e., when it is activatd via a click on the input element
            hidden: true,
            //
            //When we leave a text area, its value is transferred to 
            //the input element
            onblur: () => this.activate_input()
        });
        // 
        //Add the click event listener to the text input element, to initiate
        //the switch to the text area editor
        this.input.onclick = () => this.activate_textarea();
    }
    //
    //This is an onblur event listener of the textarea,
    //that updates the editted value to that of the input. 
    //It triggers the input`s onchange event so that the input can behave normally.
    activate_input() {
        //
        //Transfer the textarea content to the input value. Textext area content
        //can be null. input.value is always a string; hence....
        this.input.value = this.textarea.value;
        //
        //unhide the input element
        this.input.hidden = false;
        //
        //Hide the text area 
        this.textarea.hidden = true;
        //
        //Mark the anchor (td) as edited
        this.mark_as_edited();
    }
    //
    //This is an onclick event listener (of the input element) that activates 
    //the textarea for the user to start editing.
    activate_textarea() {
        //
        //Transfer the input value to the textarea text content 
        this.textarea.value = this.input.value;
        //
        //Hide the input element
        this.input.hidden = true;
        //
        //Unhide the text area 
        this.textarea.hidden = false;
        //
        //Transfer focus to the text area
        this.textarea.focus();
    }
}
//
//The checkbox io is charecterised by 3 checkboxes. One for output, 2 for inputs
export class checkbox extends io {
    //
    //The output checkbox that is shown as disabled
    output;
    //
    //The 2 input checkboxes: 
    nullify;
    input;
    //
    constructor(anchor, col) {
        super(anchor, col);
        //
        //The nomal mode for this io is the same as the edit.
        //The difference is that the output element is disabled
        this.output = this.create_element(`input`, anchor.element, {
            type: "checkbox",
            disabled: true,
            className: "normal"
        });
        // 
        //THis checkbox is used for differenting null from boolean 
        //values
        this.input = this.create_element(`input`, anchor.element, {
            type: "checkbox",
            //
            //This checkbox is used for recording non-null values
            className: "edit value",
            //    
            //Mark the parent td as edited if the input checkbox is clicked on
            onclick: () => this.mark_as_edited()
        });
        const label = this.create_element("label", anchor.element, {
            textContent: "NUll?: ",
            className: "edit"
        });
        //
        //Set the io taking care of the null data entry 
        this.nullify = this.create_element("input", label, {
            type: "checkbox", className: "nullable",
            //
            //Hide the input checkbox if the nullify  is checked and mark
            //the parent td as edited
            onclick: () => {
                this.input.hidden = this.nullify.checked;
                //
                //Mark the io as edited if clicking occurs
                this.mark_as_edited();
            },
        });
    }
    // 
    //The check boxes have no particula
    show() { }
    //
    //The value of a check box is the checked status of the input.
    get input_value() {
        return this.input.checked ? 1 : 0;
    }
    //
    //The value of a checkbox is a boolean or null.
    set input_value(i) {
        if (i === null) {
            this.nullify.checked = true;
        }
        else {
            this.nullify.checked = false;
            this.input.checked = i == 1;
        }
    }
    //
    //Update outputs from inputs.
    update_outputs() {
        //If nullify is on...
        if (this.nullify.checked) {
            //
            //...then hide the output...
            this.output.hidden = true;
        }
        else {
            //
            //...otherwise show the ouput with the same check status
            // as the input
            this.output.hidden = false;
            this.output.checked = this.input.checked;
        }
    }
}
//The primary key io has 2 components: the value and a checkbox
//to support multi-record selection
export class primary extends io {
    col;
    //
    //The primary key doubles up as a multi selector. The input
    //is of type checkbox
    multi_selector;
    //
    //Tag where to report  runtime errors that arise from a saving the record
    //(with this primary key) to the server
    errors;
    //
    //This will be activated to let the user see the error message.
    see_error_btn;
    //
    constructor(anchor, col) {
        super(anchor, col);
        this.col = col;
        //
        //The primary key doubles up as a multi selector
        this.multi_selector = this.create_element("input", anchor.element, {
            type: 'checkbox',
            //
            //This is useful for showing/hiding the selector
            className: "multi_select",
            //
            //This is used for data retrieval, e.g.,
            //querySelecttorAll("input[name='multi_selector]:checked")
            name: "multi_select"
        });
        //
        //Tag where to report runtime errors that arise from a saving the record
        // (with this primary key) to the server
        this.errors = this.create_element(`span`, anchor.element, 
        //
        //This is to distinguish this span for errors. as well as hiddinging 
        //it initially.
        { className: "errors", hidden: true });
        //
        //This will be activated to let the user see the error message.
        this.see_error_btn = this.create_element(`button`, anchor.element, {
            //
            //Helps us to know which button it is
            className: "error_btn error",
            hidden: true,
            onclick: (evt) => this.see_error(evt),
            textContent: 'Click to see error'
        });
        //
        //Mark the span where we shall place the primary key
        this.output.classList.add("pk");
        //
        //Ensure that the primary key is visible whether in normal 
        //or edit mode
        this.output.classList.remove("normal");
    }
    //
    //This is a error button event listener for toggling the user
    //error message after writing data to the database.
    see_error(evt) {
        //
        //Toggle the class to hide and unhide the error message.
        this.errors.hidden = !this.errors.hidden;
        //
        //Change the text content of the button to either 
        //see error or close error.
        evt.target.textContent =
            this.errors.hidden ? "see error" : "close error";
    }
    //
    //The value of the primary key autonumber is the content of the output tag
    get input_value() {
        // 
        //An empty primary key will be passed as a null
        const value = this.output.textContent === ""
            ? null
            : this.output.textContent;
        return value;
    }
    //
    //Set the input value of a primary key to the given basic value.
    set input_value(i) {
        //
        //Ignore the input if it is a null
        if (i === null)
            return;
        //
        //The input of a primary key must be a json string of type [pk, friend]. 
        if (typeof i !== "string")
            throw new schema.mutall_error(`Input of a primary key must be a (json) string. Value '${i}' of type '${typeof i}' found`);
        //
        //Destructure the primary key value 
        // 
        //The input must be a string of this shape, [10,"friendlyname"].
        const [pk, friend] = JSON.parse(i.trim());
        // 
        //Verify that both the primary key and the friendly components are defined.
        if (pk === undefined || friend === undefined) {
            throw new schema.mutall_error(`The foreign key value '${i}' is not correctly formatted (as tuple of 2 components, pk and friend)`);
        }
        //
        //Save the friendly component as an attribute of the output tag
        this.output.setAttribute('friend', friend);
        //
        //Show the pk in the output content.
        this.output.textContent = pk;
        //
        //Set the value multi-selector checkbox to the primary key value
        this.multi_selector.value = String(pk);
    }
    //
    //Update outputs from inputs does nothing because the input
    //is the same as the output.
    update_outputs() { }
}
//A multiple or single choice set of checkbox or radio buttons respectively. For
//multiple choice case, the values a stored in a json field comprising where
//the array of inputs is stringified. In output mode, the string is decoded to
//an array and the result used for checking the boxes.
class choices extends io {
    type;
    //
    constructor(anchor, col, type = 'multiple') {
        super(anchor, col);
        this.type = type;
    }
    //Use the given json string, encoded as an array, and use it to set the 
    //the check or radio buttons, depdin on the arays alements
    set input_value(value) {
        //
        //If the basic value is null, then we do nothing
        if (value === null)
            return;
        //
        //Convert the value to a string
        const str = String(value);
        //
        //Query select all the input choices of this io, converting them into
        //an array
        const choices = Array.from(this.anchor.element.querySelectorAll('input'));
        //
        //For the multiple choices...
        if (this.type === 'multiple') {
            //
            //Decode the json string to an array of values
            const values = JSON.parse(str);
            //
            //report an error if the values cannot be converted to an array
            if (!Array.isArray(values))
                throw new schema.mutall_error(`Input value '${str}', cannot be decoded to an array`);
            //
            //Loop through al the choices, checking each one if its value
            //is included in the json values
            choices.forEach(input => {
                if (values.includes(input.value))
                    input.checked = true;
            });
        }
        //
        //For the single choices....
        else {
            //Find the (the first) input choice whose value matches the input value.
            const input = choices.find(input => input.value === str);
            //
            //There must be one and only one; otherwise its an error (in the 
            //input form design
            if (input === undefined)
                throw new schema.mutall_error(`No radio has a value that matches ${str}`);
            //
            //Check the input
            input.checked = true;
        }
    }
    //
    //Returns the (json) encode string string as a basic value, by collecting
    //all the choices -- depending in the type -- into the string 
    get input_value() {
        //
        //Query select all the input choices of this io that are checked, 
        //converting them into an array
        const choices = Array.from(this.anchor.element.querySelectorAll('input:checked'));
        //
        //For the multiple choices...
        if (this.type === 'multiple') {
            //
            //Map the input choices to string values
            const values = choices.map(input => input.value);
            //
            //return the json encoded values
            return JSON.stringify(values);
        }
        //
        //For the single choices....
        else {
            //
            //If no value is checked, then return a null. Whether this is 
            //appropriate depends on the cicumstances. The user will needs to 
            //check his inputs and take appropriate action if this is not 
            //acceptable
            if (choices.length === 0)
                return null;
            //
            //If there is more tahn one choice, then the form is badly desiged
            //Perhaps the radio buttons are not named the same -- or checkboxes
            //have been used where radio buttons should have.
            if (choices.length > 1)
                throw new schema.mutall_error('This single choice input is producing multiple values. Check your design', this.anchor);
            //
            //Return its value
            return choices[0].value;
        }
    }
    //This is how we transfer multple or single choice valuesa from the input 
    //elements to the output span tag
    update_outputs() {
        //
        //Get the value of this io
        const value = this.value;
        //
        //If the value is null, then set the text content of the output element
        //ro an empty string
        if (value === null) {
            this.output.textContent = '';
            return;
        }
        //
        //Convert the value to a string
        const str = String(value);
        //
        //For single choices...
        if (this.type === 'single') {
            //Set the content of the output tag to the value string
            this.output.textContent = str;
        }
        //For multiple choices cases
        else {
            //Decode the json string to an array 
            const values = JSON.parse(str);
            //
            //Set the text content of the output elenent to a list of comma 
            //separated values
            this.output.textContent = values.join(', ');
        }
    }
}
