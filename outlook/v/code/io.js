//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
import * as crud from "./crud.js";
//
//Added to allow access to a view
import * as outlook from "./outlook.js";
// 
//Resolve the tree methods needed for browser
import * as tree from "./tree.js";
// 
//Resolve the server functionality
import * as server from "../../../schema/v/code/server.js";
//
/*
 * Sample from stack overflow of how to get Typescript types from
 * array of strings
    export const AVAILABLE_STUFF = <const> ['something', 'else'];
    export type Stuff = typeof AVAILABLE_STUFF[number];
 */
//Types of io based on the input element
const input_types = ["date", "text", "number", "file", "image", "email", "name"];
//
//Other Non-input types
const other_types = ["read_only", "checkbox", "primary", "foreign",
    "textarea", "url", "select"];
//
//Why this method? Because the Theme class becoming too large. The io class was 
//conceived ofload related methods from Theme class  
class io extends outlook.view {
    anchor;
    // 
    //This span tag is for displaying this io's
    //content in normal mode 
    output;
    // 
    //Dictionary of looking up ios using the anchoring td. 
    static collection = new Map();
    //
    //Default image sizes (in pixels) as they are being displayed
    // on a crud page 
    static default_height = 75;
    static default_width = 75;
    //
    constructor(
    //
    //The parent element of this io, e.g., the td of a tabular layout.
    anchor) {
        //Initialize the parent view
        super();
        this.anchor = anchor;
        // 
        //Set the ouput span element
        this.output = this.create_element(anchor, "span", { className: "normal" });
        //
        //Once an io is created, update the global dictionary for associating 
        //io's with their  corresponding tds
        io.collection.set(anchor, this);
    }
    // 
    //Returns the document to which the anchor is attached;
    get document() {
        return this.anchor.ownerDocument;
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
        this.anchor.classList.add("edited");
        //
        //Get primary key td (of the row that contains 
        //this td) and mark it as edited. It is the first td in the tale row
        //than contains this io's anchor
        const pri = this.anchor.parentElement.children[0];
        pri.classList.add("edited");
        // 
        //Update the outputs of the io associated with the td
        //
        //Use the dictionary to get io that matches this anchor
        const Io = io.collection.get(this.anchor);
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
        this.anchor.appendChild(Label);
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
    //Setting and geting io values relies on the input's value 
    get value() {
        return this.input_value;
    }
    set value(v) {
        this.input_value = v;
        this.update_outputs();
    }
    // 
    //Show this io's elements in the desired order. For now this  
    //methods does nothing, implying that the order in which elements
    //are created is the same as that of displaying them. You override
    //this method if you want to change the order. See the file_io example
    show() { }
    //Restore the html properties of this io. This method is required for 
    //copying in io to a new td, when a table row is inserted
    restore() {
        //
        //Restore every dom property on this io
        for (let name in this) {
            //
            //Get the old element
            const old_element = this[name];
            //
            //Skip non-hmtl properties
            if (!(old_element instanceof HTMLElement))
                continue;
            //
            //Get the id associated with the named property
            const id = old_element.getAttribute('data-id');
            //
            //All the elements partipating in an io must be identfied
            if (id === undefined || id === null)
                throw new schema.mutall_error(`This property ${name} points to an unidentified element`);
            //
            //Retrieve new element from the current document that matches
            //the old version. NB: The Any type for the elment, to allow us 
            //re-asign this element in step .....2 below
            const new_element = this.document.querySelector(`[data-id='${id}']`);
            //
            //The identified element must exist
            if (new_element === null)
                throw new schema.mutall_error(`No element found with data-id ${id}`);
            //
            //Update the named property on this panel........2
            this[name] = new_element;
        }
    }
}
export { io };
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
        super(anchor);
        this.col = col;
        // 
        //Set the input select element 
        this.input = this.create_element(anchor, "select", {
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
        choices.forEach(choice => this.create_element(this.input, "option", { value: choice, textContent: choice, id: choice }));
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
    constructor(anchor) {
        // 
        super(anchor);
        // 
        //
        this.output = this.create_element(anchor, `a`, { className: "normal" });
        // 
        //Create a the url label 
        const url_label = this.create_element(anchor, `label`, { className: "edit", textContent: "Url Address: " });
        // 
        //Attach the url input tag to the label
        this.href = this.create_element(url_label, `input`, {
            type: "url",
            //
            //When the input chamges, then mark the current anchor(td) as edited
            onchange: () => this.mark_as_edited()
        });
        // 
        //Create a text label
        const text_label = this.create_element(anchor, `label`, {
            className: "edit", textContent: "Url Text: "
        });
        // 
        //Add this text tag to the the label
        this.text = this.create_element(text_label, `input`, {
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
    constructor(anchor) {
        super(anchor);
        // 
        //Read only cells will be specialy formated 
        this.output = this.create_element(anchor, `span`, { className: "read_only" });
    }
    // 
    //
    get input_value() { return this.output.textContent; }
    set input_value(i) { this.output.textContent = i; }
    // 
    //The read only values do not change.
    update_outputs() { }
}
//The foreign key io class supports input/output functiions for foreig key 
//attributes. Its designed to improve the user's experience of capturing 
//foreign key data beyond phpMyadmin 
export class foreign extends io {
    //
    //The span tag that displays the ouptut friendly name
    friendly;
    //
    //The button used for evoking foreign key edit
    button;
    //
    //The constructor includes the page from which this io was created
    constructor(anchor) {
        super(anchor);
        //
        //Show the friendly name in a span tag. Note, the friendly class name
        //needed to allow us to identity this button, among others.
        this.friendly = this.create_element(anchor, `span`, { className: "normal friendly" });
        //
        //Add to the foreing io, a button for initiating editing.
        //Note the class name button to allow us to identify this button
        //for restoration at a later time
        this.button = this.create_element(anchor, `input`, {
            type: "button",
            className: "edit button",
            //
            //Add the listener for initiating the editing operation.
            onclick: async (evt) => {
                //
                //For amulti-panelled page, this will not work. A button 
                //needs to know its base view. The anchor is not enough
                await crud.page.current.edit_fk(evt);
                this.mark_as_edited();
            }
        });
    }
    //Setting the value of a foreign key attribute.
    set input_value(i) {
        //
        //Destructure the foreign key value if it is a string. 
        if (typeof i === "string") {
            const [pk, friend] = JSON.parse(i);
            // 
            //Verify that the primary and friendly keys are defined
            if (pk === undefined || friend === undefined) {
                throw new schema.mutall_error(`THe foreign key value '${i}' is not correctly formatted`);
            }
            // 
            //The button's value is the friendly component
            this.button.value = friend;
            //
            //Save the primary key value in the buttons+'s pk attribute
            this.button.setAttribute("pk", pk);
        }
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
        //Get the triendly component
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
    //The anchor of this element, e.g., td for tabulular layout
    anchor, 
    //
    //The value of the input if available during construction time
    value) {
        //
        //The 'element input type' of an 'input io' is the same as that
        //of the input tag
        super(anchor);
        this.input_type = input_type;
        //
        //Compile the input tag
        this.input = this.create_element(anchor, "input", {
            type: input_type,
            //
            //In edit mode, this will be visible
            className: "edit",
            onchange: () => this.mark_as_edited()
            //
            //Set the maximum charater length
        });
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
    constructor(anchor, 
    // 
    //What does the file represent a name or an image
    type) {
        // 
        //Ensure the input is of type=text 
        super("text", anchor);
        this.type = type;
        // 
        //Select the remote or local storage to browse for a file/image
        this.source_selector = this.create_element(anchor, `select`, {
            className: "edit",
            //Show either the remote server or the local client as the 
            //source of the image. 
            onchange: (evt) => this.toggle_source(evt)
        });
        // 
        //Add the select options 
        this.create_element(this.source_selector, "option", { value: "local", textContent: "Browse local" });
        this.create_element(this.source_selector, "option", { value: "remote", textContent: "Browse remote" });
        // 
        //This is a local file or image selector. 
        this.file_selector = this.create_element(anchor, `input`, {
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
        this.explore = this.create_element(anchor, `input`, {
            className: "edit local",
            type: "button",
            value: "Browse server folder",
            //
            //Paparazzi, please save the folder/files path structure here
            //after you are done.
            onclick: async () => await this.browse(String(this.value))
        });
        //
        //Upload this file after checking that the user has all the inputs.
        //i.e., the file name and its remote path.
        this.upload = this.create_element(anchor, `input`, {
            className: "edit local",
            type: "button",
            value: "Upload",
            onclick: async (evt) => await this.upload_file(evt)
        });
        //
        //The tag for holding the image source if the type is an image.
        if (type === "image") {
            this.image = this.create_element(anchor, `img`, {
                height: io.default_height,
                width: io.default_width
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
        this.anchor.appendChild(this.output);
        if (this.image !== undefined)
            this.anchor.appendChild(this.image);
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
        this.anchor.appendChild(this.upload);
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
    //This is called by the event listener for initiating the browsing of 
    //files/folders on the remote server.
    async browse(
    //
    //Displaying the initial look of the browser
    initial) {
        //
        //It tells us whether the initial path is a file or a folder.
        //This is important for controlling the browser behaviour i.e for 
        //quality control purposes
        const target = this.source_selector.value === "local"
            ? "folder" : "file";
        //
        //Assuming we have set up a tree structure in php 
        //
        //THe constructor arguments of a node 
        //
        //Get the static node data ($Inode) from the server 
        const Inode = await server.ifetch("node", "export", [initial, target]);
        //
        //The url is the reference to the paparazzi project.
        const url = "browser.php";
        // 
        //Create and show the browser to retrieve the selected path
        const path = await (new tree.browser(target, url, Inode, initial))
            .administer();
        //
        //Only update the td if the selection was successful
        if (path == undefined)
            return;
        //
        //Store the $target into the appropriate input tag guided by the 
        //given button
        this.input.value = path;
        // 
        //Update the image tag.
        if (this.type === "image")
            this.image.src = path;
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
            throw new crud.crud_error('Please select a file');
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
            throw new crud.crud_error(html + result);
    }
    // 
    //Overide the setting of the input vakue so as to extend the 
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
    constructor(anchor) {
        //
        //The element being extended is an input of type text
        super("text", anchor);
        //
        //Set the native textarea element.
        this.textarea = this.create_element(anchor, `textarea`, {
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
    constructor(anchor) {
        super(anchor);
        //
        //The nomal mode for this io is the same as the edit.
        //The difference is that the output element is disabled
        this.output = this.create_element(anchor, `input`, {
            type: "checkbox",
            disabled: true,
            className: "normal"
        });
        // 
        //THis checkbox is used for differenting null from boolean 
        //values
        this.input = this.create_element(anchor, `input`, {
            type: "checkbox",
            //
            //This checkbox is used for recording non-null values
            className: "edit value",
            //    
            //Mark the parent td as edited if the input checkbox is clicked on
            onclick: () => this.mark_as_edited()
        });
        const label = this.create_element(anchor, "label", {
            textContent: "NUll?: ",
            className: "edit"
        });
        //
        //Set the io taking care of the null data entry 
        this.nullify = this.create_element(label, "input", {
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
    constructor(anchor) {
        super(anchor);
        //
        //The primary key doubles up as a multi selector
        this.multi_selector = this.create_element(anchor, "input", {
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
        this.errors = this.create_element(anchor, `span`, 
        //
        //This is to distinguish this span for errors. as well as hiddinging 
        //it initially.
        { className: "errors", hidden: true });
        //
        //This will be activated to let the user see the error message.
        this.see_error_btn = this.create_element(anchor, `button`, {
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
    //Set the input value of a primary key given the basic string value.
    set input_value(i) {
        //
        //Destructure the primary key value if it is a string. 
        if (typeof i === "string") {
            // 
            //The input must be a string of this shape, [10,"friendlyname"].
            const [pk, friend] = JSON.parse(i.trim());
            // 
            //Verify that both the primary key and the friendly components are defined.
            if (pk === undefined || friend === undefined) {
                throw new schema.mutall_error(`The foreign key value '${i}' is not correctly formatted`);
            }
            //
            //Save the friendly component as an attribute
            this.output.setAttribute('friend', friend);
            //
            //Show the pk in the output content.
            this.output.textContent = pk;
            //
            //Set the value multi-selector checkbox to the primary key value
            this.multi_selector.value = String(pk);
        }
    }
    //
    //Update outputs from inputs does nothing because the input
    //is the same as the output.
    update_outputs() { }
}
