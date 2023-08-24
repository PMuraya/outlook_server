import * as outlook from "./outlook.js";
//
//Allows methods on this page to talk to the server
import * as server from "../../../schema/v/code/server.js";
//
//Resolve the schema classes, viz., database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
//
//To allow access to the io system
import * as io from "../../../schema/v/code/io.js";
//
import * as app from './app.js';

//
//Resolve the schema classes, viz., database, columns, mutall e.t.c. 
import * as lib from "../../../schema/v/code/library";

//
//This interface helps us to control the data we retrieve from the server
//to support scrolling
interface outcome {
    type: "nothing" | "adjust" | "fresh" | "out_of_range";
}
//
//We don`t need to retrieve new records from the server since the request
//can be met with the available data...ie.,desired offset is 
//within view boundaries
interface nothing extends outcome {}
//
//We require to adjust the top/bottom view boundaries to accomodate 
//the scroll request
interface adjust extends outcome {
    //
    //Indicator of which boundary we are adjusting i.e.,top/bottom
    dir: direction,
    //
    //This is the offset from where to retrieve the data
    start_from: offset,
    //
    //The amount by which to adjust the top/bottom boundaries
    adjusted_view: number
}
//
//This ouitcome arises when the request is:-
//- within extremes, 
//- and outside the joint boundaries
//In that case, we need to load a fresh set of table rows i.e., 
// -clear current tbody, 
// -load new rows 
// -and adjust the views.
interface fresh extends outcome {
    //
    //This value constrains the top boundary of the fresh view.
    view_top: offset,
    //
    //This value constrains the bottom boundary of the same view.
    view_bottom: number
}
//
//This outcome arises from a request that is outside/beyond  the 
//extreme boundaries
interface out_of_range extends outcome {
    //
    //Illegal request.(Used in formulating the error message)
    request: offset
}
//
//This a positive number i.e., above 0 that is less than 
//the maximum number of records in the subject. It is important for 
//paginating crud.
type offset = number;
//
//This represents the td from which we initiated the administration.
//It is also used for updating a td after a foreign key edit
export type crud_selection = {
    //
    //The td position where the original primary key came from. 
    position: lib.position,
    //
    //The primary key auto number represented as a string
    //because we are mostly using it as such. It may be missing for a new record  
    pk? : lib.pk,
}
// 
//A theme view boundary has two extremes, the top and the bottom 
export interface boundary{
    // 
    //The top extreme is an offset number that represents the upper limit 
    //of this boundery.
    top: number,
    // 
    //The bottom extreme is an offset that represents lower limit 
    //of this boundery
    bottom:number
}
// 
//Boundary markers    
export type direction = "top" | "bottom";
//
//The scroll outcomes depending on the pressed key. 
type key_outcome = {
    //
    //Movement may be between rows, pages or across the whole table. 
    move: "row" | "page" | "table";
    //
    //The key movement may be in the up or down direction.
    dir: "up" | "down";
    //
    //The tr that becomes the current selection. The number is the offset to
    //the first or last row in the current dataset.
    tr: HTMLTableRowElement | number;
}
//
//A theme is a panel for display subject related data in a scrollable fashion
export class theme extends outlook.panel {
    /** 
     * THE SQL (view in our class schema class model) METADATA 
     * OF THE QUERY USED TO RETRIEVE DATA PAINTED IN THE CONTENT 
     * PANEL INCLUDE....
     */
    // 
    //1...The sql used to extract information painted in this 
    //in the content section of this theme
    sql?: string
    // 
    //2...The column names involved in the above named sql
    col_names?: Array<schema.cname>;
    // 
    //3...The maximum possible records that are available to paint
    //the content pannel. they are required in adjusting the boundaries
    max_records?: number;
    //
    //4....The database where this subject entity is housed 
    dbase?: schema.database;
    /** 
     * The scrolling variables
     */
    //
    //The offset of the records that are visible in the page 
    //both top and bottom i.e within scrolling without loading 
    //more data in the purple part of our boundary diagram
    view: boundary={top:0, bottom:0};
    // 
    //This is the limit number of records that can be retrieved and 
    //constrained by the extreme boundery the blue part of the 
    //blue region of our map
    joint:boundary={top:0, bottom:0};
    //
    //This is the offset that indicates the last retrievable record 
    //i.e., the green part of our scroll diagram.
    get extreme():boundary{
        return {top: 0, bottom: this.max_records!};
    }
    //
    //
    //The database and entity name that is displayed in this 
    //theme panel.
    public subject: schema.subject;
    //
    //Track the original sql for supporting the review service.
    public original_sql: string | null = null;
    //
    //Display mode to be used in controlling the usage of the scrolling keys.
    public display_mode: "edit" | "normal" = "normal";
    //
    //Sheet for styling whole columns of this panel
    public stylesheet?:CSSStyleSheet;
    //
    constructor(
        //
        //The database and entity name that is displayed in this 
        //theme panel. If null, we take the subject of the current application
        subject: schema.subject|null,
        // 
        //The css for retrieving the html element where to display 
        //the theme's subject record.
        public css: string,
        // 
        //The view page that is the home of this panel 
        public base: outlook.page,
        // 
        //The first record that is marked as selected -- if any
        public selection?: crud_selection
        
    ) {
        super(css, base);
        //
        //Set the subject (if it is null) to that of the application,
        this.subject = subject === null ? app.app.current.subject : subject;
    }
    //
    //Paint this theme panel with editable records of the current application's
    //subject 
    public async continue_paint() {
        //
        //Add the scroll listener to the target element
        this.target!.onscroll = ()=>this.myscroll();
        //
        //Get the editor description.
        const metadata = await server.exec(
            //
            //The editor class is an sql object that was originaly designed 
            //to return rich content for driving the crud page.
            "editor",
            //
            //Constructor args of an editor class are ename and dbname 
            //packed into a subject array in that order.
            [this.subject.ename, this.subject.dbname],
            //
            //Method called to retrieve editor metadata on the editor class.
            "describe",
            //
            //There are no method parameters
            []
        );
        //
        //Destructure the metadata
        const [idbase, col_names, sql, max_record] = metadata;
        //
        //Set the metadata properties
        this.sql = sql; this.col_names = col_names; 
        this.max_records = parseInt(max_record);
        //
        //Activate the static php database.
        this.dbase = new schema.database(idbase);
        //
        //Add the table element to this panel's target
        this.target!.innerHTML = 
            `<table>
                <thead>
                </thead>
                <tbody></tbody>    
             </table>`
        //
        //Initialize the crud style for managing the hide/show feature 
        //of columns
        this.initialize_styles();
        //
        //Query the table header under the panel's target
        const thead = this.target!.querySelector("thead")!;
        //
        //Show the header
        this.show_header(thead);
        //
        //Retrieve and display $limit number of rows of data starting from the 
        //given offset/request -- if both the selection and primary keys are
        //defined.
        if (this.selection!==undefined && this.selection.pk!==undefined){
            //
            //Get the primary key
            const pk = this.selection.pk;
            //
            //Paint the theme panel
            await this.goto(parseInt(pk));
            //
            //Select the matching row and scroll it into view.
            this.select_nth_row(pk);
        }else{
            //
            await this.goto(0);
        }
    }
    //
    //Initialize the crud style for managing the hide/show feature 
    //of columns
    protected initialize_styles() {
        //
        //Add a columns style sheet to the base view's head element
        //
        //Get the head element
        const head = this.base.document.querySelector('head');
        if (head===null) 
            throw new schema.mutall_error('Head element not found');
        //
        //Create the style element and add it to the head.
        const style:HTMLStyleElement = this.create_element('style', head,{id:`cols${this.key}`})         
        //
        //Get/set the columns style sheet for this theme panel
        this.stylesheet  = style.sheet!;
        //
        //Loop through all the columns and set the styling for each column
        this.col_names!.forEach((_col, k) => {
            //
            //Create the rule for supporting styling of a header and its matching
            //fields the same way. For instance, to hide the second column and 
            //is cells, the desired rule is:- 
            //th:nth-child(2), td:nth-child(2){ display:none}
            //
            //Node that column indices(k) are 0 base, ut child numbering are one 
            //base (j)
            const j = k+1;
            //
            const rule = 
                //
                //The j'th table header descending(note the space combinator) 
                //from the target css...
                `${this.css} th:nth-child(${j})` 
                //
                //...and the j'th cell element also descending from the same 
                //target css...
                +`,${this.css} td:nth-child(${j})`
                //
                //..should get ready to be styles the same. E.g., to hide
                //a column and its associeted cells, the display is set to none 
                +`{}`;
            //
            //Insert the k'th rule to the style sheet.
            this.stylesheet!.insertRule(rule, k);
        });

    }
    //
    //Construct the header row and append it to the thead.
    //
    //Header should look like this:-
    //<tr>
    //  <th id="todo" onclick="select_column(this)">Todo</th>
    //        ...
    //</tr>
   //The primary key column will also serve as the multi line selector
    protected show_header(thead: HTMLElement) {
        //
        //Construct the tr and attach it to the thead.
        const tr = this.create_element("tr", thead, {});
        //
        // Loop through all the columns to create the table headers
        //matching the example above.
        this.col_names!.forEach((col_name, index) =>{ 
            //
            //Create the th element using this panel's document and attach to 
            //the current tr.
            const th = this.create_element("th", tr, {
                id:`'${col_name}'`,
                textContent:col_name
            });
            //
            //Add the th selector listener
            th.onclick = ()=> this.select_column(th, index); 
        });
    }
    //
    //Mark the current column as selected.
    private select_column(th: HTMLTableCellElement, index:number){
        //
        //2. De-highlight any column that is currently selected.
        //2.1 Get the currently selected column (there may be none).
        const selected_column = this.target!.querySelector(".TH");
        //
        //2.2 If there's one ...
        if (selected_column !== null) {
            //
            //2.2.1 Get its index. 
            const oldindex = 
                (<HTMLTableCellElement>selected_column).cellIndex;
            //
            //2.2.2 Use the index to remove the background color from the
            //matching rule. NB: There are as many CSS rules as there are columns.
            //a. Get the rule that matches the index.
            const rule = <CSSStyleRule>this.stylesheet!.cssRules[oldindex];
            //
            //b. Remove the background-color property.
            rule.style.removeProperty("background-color");
        }
        //
        //3. Select the given th, in the current standard version, i.e.,  
        //using the TH class selector.
        this.select(th);
        //
        //4. Highlight the td cells below the th.
        //
        //a. Use the incoming index to get the CSS rule from the column 
        //stylesheet.
        const rule2 = <CSSStyleRule>this.stylesheet!.cssRules[index];
        //
        //b. Set the background color of the rule to lightgreen.
        rule2.style.setProperty("background-color", "lightgreen");
    }
    
    //
    //Load the table rows and adjust the  boundaries depending
    //on the outcome type.
    private async execute_outcome(outcome: outcome, request: offset) {
        //
        switch (outcome.type) {
            //
            //The request is within view so no loading
            //and no view boundary adjustment.
            case "nothing":
                //this.scroll_into_view(request,"center")
                break;
            //
            //We need to adjust the relevant view 
            //boundary to the given value          
            case "adjust":
                //
                //This must be an 
                const adjust = <adjust>outcome;
                //
                //Load the body from the offset and in the outcome direction.
                await this.load_body(adjust.start_from, adjust.dir);
                //
                //Now adjust the view direction to the outcome value.
                this.view[adjust.dir] = adjust.adjusted_view;
                //this.scroll_into_view(request,"start")
                break;
            case "fresh":
                //
                //Cast the outcome to a fresh view
                const fresh = <fresh>outcome;
                //
                //Clear the table body and reset the view 
                //boundaries
                // 
                //Get the table body.
                const tbody =this.document.querySelector("tbody");
                // 
                //There must be a table on this page.
                if (tbody === null)
                    throw new schema.mutall_error("tbody not found");
                // 
                //Empty the table body.
                tbody.innerHTML = "";
                // 
                //Reset the view boundaries to {0,0} before 
                //loading a fresh page.
                this.view={top:0,bottom:0};
                //
                //Load the new page starting from the view top, 
                //in the forward direction.
                await this.load_body(fresh.view_top, "bottom");
                //
                //Reset the boundaries after loading a fresh 
                //page.
                this.view.top = fresh.view_top;
                this.view.bottom = fresh.view_bottom;
                break;
            case "out_of_range":
                //
                //Show the request if it is not 0
                if (request!==0)
                
                    alert(
                        `The requested record ${request} is out of range, i.e.,
                        ${this.extreme.top} <=${request} < ${this.extreme.bottom}. 
                        This commonly arises when there has been so numerous 
                        deletions that that the current record autonumbers
                        do not match the relative row positions. In that case
                        the current selection will not be shown automatically.
                        It is not a problem. The user has to look for (and 
                        select it) manually.`
                    );
                break;

            default:
                throw new schema.mutall_error(`The outcome of type 
                       ${outcome.type} is not known`);
        }
    }
    //
    //Populate our table body with new rows 
    //starting from the given offset and direction.
    protected async load_body(offset: offset/*:int*/, dir: direction/*:mytop | bottom*/) {
        //
        //Range-GUARD:Ensure that offset is outside of the view for loading to be valid.
        if (this.within_view(offset))
            throw new schema.mutall_error(
                `The requested offset ${offset} 
                is already in view 
                ${this.view.top} -- ${this.view.bottom}, 
                so a new load is not valid.`
            );
        //
        //Calculate a constrained limit to prevent negative offsets.
        //
        //Get the height from extreme[top] to view[top] boundaries.
        const h = Math.abs(this.view![dir] - this.extreme![dir]);
        //
        //Use h to constrain the limit
        const constrained_limit = h < app.app.current.config.limit ? h : app.app.current.config.limit;
        //
        //Query the database 
        const result: Array<schema.fuel> = await this.query(offset, constrained_limit);
        //
        //   
        //Display the results on the table`s body.
        //
        //Get the tbody for appending records 
        const tbody = this.target!.querySelector("tbody")!;
        //
        //Loop through the results loading each tr 
        //based on the dir
        result.forEach((fuel, i) => {
            //
            //The index where this tr should  be inserted 
            //into the tbody
            const index = dir ==="top"
                //
                //Counting from the top
                ? i
                //
                //Counting from the bottom
                : this.view.bottom - this.view.top+ i;
            //
            //Insert row.
            const tr = tbody.insertRow(index);
            // 
            //Use the fuel to populate the tr
            this.load_tr_element(tr,fuel);
        });
    }
    //
    //This is a scroll event listener to retrive the previous or next 
    //page of data depending in the position of the scroll button.
    public myscroll() {
        //
        //The target of this theme is the scrollable element
        const target = this.target!;
        //
        //Get the scroll top as a rounded integer (not truncated)
        //to ensure that the scroll height and the client height are 
        //always equal to or greater than the scroll height when we are at 
        //the bottom of the scroll. 
        const scrollTop = Math.round(target.scrollTop);
        //
        //Decide whether to retrieve new records or not
        if (scrollTop < 3) {
            //
            //Retrieve records that are above the top view boundary 
            //This is equivalent to clicking the previous button
            this.retrieve_records("top");
        }else if (scrollTop + target.clientHeight>= target.scrollHeight) {
            //
            //Retrieve records that are below the bottom view boundary
            //This is equivalent to clicking the next button 
            this.retrieve_records("bottom");
        }else{
            //
            //Ignore the scrolling
        }
    }
    //
    //This is an event listener that retrieves limit number of 
    //records from the server depending on the given direction.
    //The retrieved records are in the blue area of our scroll map.
    async retrieve_records(dir: direction) {
        //
        //Set the offset value depending on the direction of scrolling.
        let offset;
        //
        //If the direction is away from the top view boundary, 
        //the offset becomes joint 
        if (dir === "top") {
            //
            //The offset is the joint top boundary if we are scrolling upwards.
            offset = this.get_joint("top");
        }
        //
        else {
            //
            //The offset is the bottom view boundary if we are 
            //scrolling downwards.
            offset = this.view.bottom;
        }
        //
        //Retrieve and display $limit rows of data starting from the 
        //given offset/request subject to the available data.
        await this.goto(offset);
    }
    //
    //Test if offset is within joint boundaries
    private within_joint(request: offset): boolean {
        //
        //We are within the joint boundaries if...
        const condition =
            //
            //.. offset is between the top and 
            //bottom joint boundaries.
            request >= this.get_joint("top")
            && request < this.get_joint("bottom");
        return condition;
    }
    // 
    //Test if offset is within extremes and return true otherwise false.
    private within_extreme(request: offset): boolean {
        //
        //extreme top condition should always 
        //be set otherwise you get a runtime error.
        //if extreme top is undefined throw an error.
        return request >= this.extreme.top
            && request < this.extreme.bottom;
    }
    //
    //Test if offset is within view boundaries
    private within_view(req: offset): boolean {
        //
        //We are within  view if...
        return true //true is for appeasing the IDE.
            //
            //...the top view is set...
            && this.view.top !== null
            //
            //...and the offset is between the top 
            //and bottom view boundaries.
            && req >= this.view.top
            && req < this.view.bottom;
    }
    //
    //Return the joint boundary given the direction The top joint boundary
    // is a maximum of limit records from the top view boundary. The 
    // bottom joint boundary is a maiximum of limit records from the 
    // view[bottom]. see the scroll map 
    // http://206.189.207.206/pictures/outlook/scroll_2020_10_10.ppt
    private get_joint(dir: direction/*top|bottom*/): offset {
        //
        //
        let raw_boundary =
            //
            //The referenced view boundary
            this.view[dir]
            //
            //The maximum range
            + app.app.current.config.limit
            //
            //Accounts for the direction 
            * (dir === "top" ? -1 : +1);
        //
        //Return a constrained boundary
        return this.within_extreme(raw_boundary)
            ? raw_boundary : this.extreme[dir];
    }
    //
    //
    //Fetch the real data from the database as an array of table rows.
    private async query(offset: offset, limit: number): Promise<Array<schema.fuel>>{
        // 
        //The entity name that drives this query comes from the subject of this 
        //application
        const ename = `\`${this.subject.ename}\``;
        //
        //Complete the sql using the offset and the limit.
        const complete_sql =
            //
            //Paginate results.
            this.sql + ` LIMIT ${limit} OFFSET ${offset}`;
        //
        //Use the sql to query the database and get results as array of row objects.
        return  await server.exec(
            "database",
            //
            //dbase class constructor arguments
            [this.subject.dbname],
            //
            "get_sql_data",
            //
            //The sql stmt to run
            [complete_sql]
        );
        
    }
    //
    //Convert the row object obtained from the server to a tr element.
    //It's public because it's called by create (in crud), to create a blank row.
    public load_tr_element(
        //
        //Tee table row to load data to. 
        tr:HTMLTableRowElement,
        //
        //The row of data to load to the tr. There may be none for newly
        //created rows
        row?: {[index:string]:schema.basic_value}
    ):void {
        //
        //Convert the row object into key-value pairs where the
        //key is the column name. Take care of those cases where row 
        //is undefined, e.g., new rows.
        const pairs: Array<[string, schema.basic_value]> = row === undefined
            ? this.col_names!.map(cname => [cname, null])
            : Object.entries(row);
        //
        //Enrich the tr with the id, pk and the friendly attributes
        // 
        //Prepare to collect the primary key and the friendly components
        //value
        let pk: string, friend: string;
        //
        //
        //Use empty value strings for pk and friend when there is no value
        if (row === undefined){ pk = ""; friend = ""; }
        else{
            //Get the primary key column; It is indexed using this theme's
            // subject name.
            const column = <string>row[this.subject.ename];
            //
            //The primary key column is a tupple of two values: the autonumber 
            //and the friendly components packed as a single string.
            //e.g., '[1, "kamau/developer"]'
            //Prepare to convert the string value to an object  and 
            //destructure it into its primary key and friendly component
            [pk, friend] = JSON.parse(column);
            //
            //Make the pk a valid id by preffixing it with letter r
            tr.id = `r${pk}`;
        }
        //
        //Append the id and the primary key attributes to the tr
        tr.setAttribute("pk", pk);
        tr.setAttribute("friend", friend);
        //
        //Make the tr focusable to allow it to receive keystrokes for 
        //scrolling purposes.
        tr.setAttribute("tabindex", "0");
        //
        //Listen for click operation.
        tr.onclick = () => this.select(tr);
        //
        //Loop through all the pairs outputting each one
        //of them as a td. 
        pairs.forEach(([key, value]) => {
            //
            //Create a td and append it to the row.
            const td = this.create_element("td", tr, {});
            //
            //Set the click event listener of the td
            td.onclick =()=> this.select(td);
            //
            //Set the column name to be associated with this td
            td.setAttribute('data-cname', key);
            //
            //Set the td's io value
            //
            //Create the td's io. (this is a local create_io that uses the 
            //io.create_io version 
            const Io = this.create_io(td);
            //
            //Paint the io
            Io.show();
            //
            //Set the io's value (this must come after the show, thus ensuring
            //that the io's elements are in place)
            Io.value = value;
        });
    }
    //
    //Return the io structure associated with the given td
    private create_io(td: HTMLTableCellElement): io.io {
        // 
        //Get the column position of this td 
        const cellIndex = td.cellIndex;
        //
        //Destructure the subject to get the entity name; its the 
        //first component. 
        const ename = this.subject.ename;
        // 
        //Get the column name that matches this td. 
        const col_name = this.col_names![cellIndex];
        //
        //Get the actual column from the underlying database.
        const col = this.dbase!.entities[ename].columns[col_name];
        //
        //Get the anchor for the io
        const anchor: io.anchor = {element: td, page: this.base};
        //
        //Create and return the io for this column when we dont know
        //its io type.
        const Io = io.io.create_io(anchor, undefined, col);
        // 
        return Io;
    }
    
    //Select the row whose primary key is the given one.
    //and make sure that it is brought into the view 
    protected select_nth_row(pk?: lib.pk) {
        // 
        //Row selection is valid only when the pk is set
        if (pk === undefined) return;
        //
        //1. Get the row identified by the primary key. 
        const tr = <HTMLElement>this.target!.querySelector(`#r${pk}`);
        //
        //Ensure that a row with this pk exists
        if (tr === null) {
            alert(`No tr found with row id ${pk}`);
            return;
        }
        //
        //2. Select the row.
        this.select(tr);
        //
        //3.Bring the selected row to the center of the view.
        tr.scrollIntoView({ block: "center", inline: "center" });
    }
    //
    //
    private scroll_into_view(request:offset,position:"start"|"center"):void {
        // 
        //Get the row index 
        const rowIndex: offset = request - this.view.top;
        // 
        //Use the index to retrieve the row 
        const table =<HTMLTableElement> this.target!.querySelector("table"); 
        const tr = table.rows[rowIndex];
        //
        //Ensure that a row with this pk exists
        if (tr === null) {
            alert(`No tr found with rowIndex ${rowIndex}`);
            return;
        }
        
        //
        //Bring the selected row to the top of the view.
        tr.scrollIntoView({ block: position, inline: "center" });
    }

    //
    //Ensure that the given tag is the only selected one 
    //of the same type
    protected select(tag:HTMLElement):void {
        //
        //Get the tagname 
        const tagname = tag.tagName;
        //
        //1. Declassifying all the elements classified with 
        //this tagname.
        const all = this.target!.querySelectorAll(`.${tagname}`);
        Array.from(all).forEach(element =>
            element.classList.remove(tagname)
        );
        //
        //3.Classify this element 
        tag.classList.add(tagname);
    }
    
       
    //
    //
    //Retrieve and display $limit rows of data starting from the 
    //given offset/request, subject to the available data.
    async goto(request?: offset) {
        //
        //Get the requested record offset if it is not specified
        let goto_element;
        if (request === undefined) {
            // 
            //Check whether a request is specified in the goto element 
            if((goto_element=document.querySelector('#goto'))!==null){
                //
               //
               //Get the offset from the user from the user
               //
               //Get the goto input element
               const value = (<HTMLInputElement> goto_element).value;
               //
               //Get the users request as an integer
               request = parseInt(value);   
            }
            else{
                //
                //Set it to 0
                request = 0;
            }            
        }
        //
        //It is an error if the request is above the top extreme boundary.
        if (request < this.extreme.top)
            throw new schema.mutall_error(`Goto: A request ${request}
             must be positive`);
        //
        //Determine what kind of scroll is required for the current situation. 
        const outcome /*:"nothing"|"adjust"|"fresh"*/ = this.get_outcome(request);
        //
        //Load the table rows and use the scrolling outcome to update the 
        //boundaries
        await this.execute_outcome(outcome, request);
    }
    
    //
    //Determine which scrolling outcome we need depending on the requested offset.
    private get_outcome(request: offset): outcome {
        //
        //NOTHING: If the request is within view, do 
        //nothing.i.e., no loading of new rows or adjusting 
        //current view boundaries.
        if (this.within_view(request))
            return <nothing> {type: "nothing"};
        //
        //ADJUST: If request is within the joint boundaries, 
        //load a fresh copy and adjust either the top or bottom
        //boundaries depending on the request direction.
        if (this.within_joint(request)) {
            //
            //The direction is top if the 
            //request is above the top boundary.
            const dir = request < this.view.top
                ?"top" : "bottom";
            //
            //The top or bottom boundaries 
            //should be adjusted to this value.
            const adjusted_view = this.get_joint(dir);
            //
            //Adjust the top boundary
            const start_from = dir === "top"
                ? this.get_joint(dir) : this.view[dir];
            //
            //Return the view boundary adjustment outcome.
            return <adjust> {type: "adjust", dir, start_from, adjusted_view};
        }
        //
        //FRESH: If the request is within extremes, 
        //load a fresh outcome, i.e., clear current tbody, 
        //load new rows and adjust the views.
        if (this.within_extreme(request)) {
            //
            //Constrain  the request to the extreme top.
            const view_top = request < this.extreme.top
                ? this.extreme.top : request;
            //
            //The bottom is always $limit number of rows
            //from the top, on a fresh page.
            const y = view_top + app.app.current.config.limit;
            //
            //Constrain the bottom to the extreme bottom. 
            const view_bottom = y > this.extreme.bottom
                ? this.extreme.bottom: y;

            return <fresh> {type: "fresh", view_top, view_bottom};
        }
        //
        //OUT OF RANGE: The request is out of range.
        return <out_of_range> {type: "out_of_range", request};
    }
       
}