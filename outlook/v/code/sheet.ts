//Resolves reference to the asset.products data type
import {view, page} from '../../../outlook/v/code/view.js';

import * as io from "../../../schema/v/code/io.js";

//Import server.
import * as server from "../../../schema/v/code/server.js";

//Resolve references to a database
import * as schema from "../../../schema/v/code/schema.js";
import * as lib from "../../../schema/v/code/library"; 
//
//import * as query from  "./query.js";
import {region_type, crosstab, factors,summaries} from "./query.js"; 

//Fuel is already defined in schema
type fuel = schema.fuel

//A factor is a ...
//From a panel, the name of the factor is defined as
//this.factors[factor.region][factor.index];
type factor = {region:region_type, index:number}; 

//The a factor name is simply a string; the type is simply beig used here
//for documentation purposes
type factor_name = string;

//A cell is a map object that can be indexed by as many factor types as 
//necessary. It is equivalent to this ordinary objet definition
type cell_id = Map<factor_name, string>;

//The formal definition of a tagname
type tagname = keyof HTMLElementTagNameMap;
//
//Cell attributes
type attributes = Partial<{
    //
    //The span of a table cell element
    colSpan:number,
    //
    //The text content
    textContent:string,
    //
    //Th cell id
    id:string,
    //
    //The class name
    className:string,
    //
    io:io.io_type,
    //
    //Indicators of whether teh left and bottom margins are fixed or not
    //Top an dborrom margins are not important to fix as this can easily
    //be done using a css
    left:boolean,
    right:boolean
}>

//There are 2 ways to reference the element of a panel
type element_type =
    //
    //The element is known
    {type:'known', element:HTMLElement}
    //
    //The element is created from a tagname
    |{type:'create', tagname:tagname, parent:HTMLElement}
    //
    //The element exists in the HTML under the given id
    |{type:'id', id:string};

    

//The sheet is the overall container for all the areas of a worksheet. It is linked
//to Mutalldata (library) through the page class
export class sheet extends page{
    //
    //The query that drives this sheet
    public query:crosstab;
    //
    //The crown area
    public crown:crown;
    //
    //The matrix area comprising of the header and the body
    public matrix:matrix;
    //
    //The element of a sheet is the document root element of the inherited page
    public element:HTMLElement;
    //
    //The constructor arguments are desined to allow a user to alter the shape
    //of a worksheet, thus creating the most intuitive view from a user's 
    //perspective
    constructor(
        //
        //The query that drive this sheet. Note the query argument is captitalised
        //to avoid confusion with the query class, which we need to access
        //the static properties page.
        Query:crosstab
    ){
        //
        //Initializing the parent view 
        super();
        //
        //Set the sheet query
        this.query = Query;
        //
        //Initialize the crown
        this.crown = new crown(this);
        //
        //Initialiaize the matrix
        this.matrix= new matrix(this);
        
        //The element associated with a sheet is the document element. This is
        //important in the context of panels. Is a sheet a panel? No, its a page
        this.element = this.win.document.documentElement;
    }
    
    //Complete the construction of the sheet by setting all (optional) 
    //properties that may require visits to the server. This method must be
    //called before you can use a sheet. 
    async initialize(){
        //
        //Complete the construction of a query
        await this.query.initialize();
    }


     //Show all the regionss of a sheet: the crown, the header, the body and the 
     //the footer
     public async show():Promise<void>{
        //
        //Show the crown region; you will need to fetch the paginatiion data 
        //from the database; hence the asynchronous behaviour
        await this.crown.show();
        //
        //Show the matrix region, i.e., header, body and footer (with its 
        //associated data).
        await this.matrix.show();
     }

    //
    //Get factor levels to be associated with this panel  
    async get_factor_levels(region:region_type, ctes:string, cte:string):Promise<{[factor:string]:Array<lib.basic_value>}>{
        //
        //Get the factors of this region
        const factors:Array<factor_name> = this.query.factors[region];
        //
        //There must BE factors defined for the region, even if it is an empty list
        if (factors===undefined) throw new schema.mutall_error(`Region ${region} has no entry in teh levels map`);
        //
        //Start with an empty obhect of levels
        const levels:{[factor:string]:Array<lib.basic_value>} = {};
        //
        //For each factor, get its levels and assign it to the matching property
        for(const factor of factors) levels[factor]=await this.get_levels(factor, ctes, cte);
        //
        //Return the levels
        return levels;
    }

    //Retrieves the levels of the given factor
    private async get_levels(factor:factor_name, ctes:string, cte:string):Promise<Array<lib.basic_value>>{
        //
        //Measurements are  specially treated
        if (factor==='measurement'){
            const mlevels:Array<string> = Array.from(this.query.shape!.measurements.keys());
            return mlevels;
        }
        //For any other factor, use the base query to obtan the levels
        //
        //Compile the sql for retrieving the levels of the named factor
        //The query is base on the same table that we use for calculating
        //score percentages
        const sql = 
            `
            ${ctes}
            select distinct
                ${factor} as fname
            from ${cte};
            `;
        //
        //Execute the sql to levels of the named factor
        const data:Array<{fname:lib.basic_value}> = await server.exec(
            'database',
            //
            //Create the (incomplete, i.e., false parameter) database, execute the 
            //sql to return the data
            [this.query.dbname, false], 
            'get_sql_data',
            [sql]
        );
        //
        //The data will of the form:-
        //[{fname:2019}, {fname:2020}, {fname:2021} BUT whet we want is
        //[2019, 2020, 2121]
        //Convert the array of fname objects to an array of basic values
        return  data.map(({fname}) => fname);
    }

}

//A panel is an area of a sheet which can access the sheet through a parent/child
//hierarchy that is rooted at the sheet. 
class panel extends view{
    //
    //The element of a panel 
    public element:HTMLElement;
    //
    constructor(
        //
        type:element_type,
        //
        //The parent of a pael msy be aonther panel or sheet.
        public parent:panel|sheet,
        //
        //The panel's attributes. They
        attributes?:attributes
    ){
        super();
        //
        //Use the type to determine the element
        switch(type.type){
            case 'known':this.element = type.element; break;
            case 'id':this.element = this.get_element(type.id); break;
            case 'create': this.element = this.create_element(type.tagname, type.parent);
        }
        //
        //Set the attributes
        this.set_attributes(attributes);
    }

    //
    //The show method of a panel, when cell attributes take effect
    set_attributes(attr?:attributes){
        //
        //If there are no attributes, return
        if (attr ===undefined) return;
        //
        //Now set the attribute; its type determines what element p;ropertu to set 
        if (attr.textContent!==undefined) this.element.textContent=attr.textContent;
        if (attr.id!==undefined) this.element.id=attr.id;
        if (attr.className!==undefined) this.element.classList.add(attr.className);
        if ((attr.colSpan!==undefined) && this.element instanceof HTMLTableCellElement)
            this.element.colSpan = attr.colSpan;
        //
        //Get ready to fix the left and right margin panels by availing the
        //the left and right bounding positions
        ['left', 'right'].forEach(side=>this.fix_panel(attr, <keyof attributes>side));    
        //
        //Set the io type for this element
        if (attr.io!==undefined) io.io.create_io({element:this.element, page:this.sheet}, attr.io); 
    }

    //Get ready to fix the left and right margin panels by availing the
    //the left and right bounding rectangle positions
    fix_panel(attr:attributes, side:keyof attributes){
        //
        //Retirn if left or right is not defined
        if (attr[side]===undefined) return;
        //
        //Set the left pr right styling
        switch(side){
            case 'left':
                this.element.style.left = `${this.element.getBoundingClientRect().left}px`;
                break
            case 'right':
                this.element.style.right = `${this.element.getBoundingClientRect().right}px`;
                break;
            default:
                throw new schema.mutall_error(`Side '${side}' not known`);
        }
        //
        //Classify the element as a left or right side. This will help in fixing 
        //the left or right hand margins
        this.element.classList.add(side);
        //
        //Let the elements come to the fore. This is not working!
        this.element.style.zIndex='10';
    }
        
    //
    //Get the sheet associated with this panel
    get sheet():sheet{
        //
        //If the parent is a sheet, then return it as required
        if (this.parent instanceof sheet) return this.parent;
        //
        //The parent is not a shee, then try its sheet. This effectively 
        //call re-calls this method with this.parent as the panel instance 
        return this.parent.sheet;
    }
    //
    //The query and factors of a panel indirectly from the sheet.
    get query():crosstab{return this.sheet.query; }
    get factors():factors{return this.query.factors; }
    get summaries():summaries{return this.query.summaries; }
    
}

//Modelling the container for draggable elements in the crown region of a sheet
class crown extends panel{
    //
    //The paginator section
    public paginator:paginator;
    //
    //The panel that houses filters
    public chamber:chamber;
    //
    //Restore button is used for restoring a matrix to its last version, 
    //typically following a filter selection that produces no result 
    public  restore_button : HTMLButtonElement;
    //
    constructor(sheet:sheet){
        //
        //The crown area is already defined in the sheet witha matching crown id
        super({type:'id', id:'crown'}, sheet);
        //
        //Set the paginator
        this.paginator = new paginator(this);
        //
        //Create the panel that houses for filters
        this.chamber = new chamber(this);
        //
        //Add a listener to the 'save sheet sql ' button
        this.get_element('save_sql').onclick = ()=>this.save_sheet_sql();;
        //
        //Creat a button for restoring a sheet's past view
        this.restore_button = this.create_element('button',this.element,{
            textContent : "Restore Last Page with Data",
            hidden:true
        });
        //
        //Add the restore lister to the button
        this.restore_button.onclick= ()=>this.restore();
    }

    
    /*
    //The general ctes to use for compiling factor levels for this panel
    get ctes(){return this.query.base_ctes}
    //
    //The specific cte to use for compiling the factor levels asociated with
    //a crown. This every spefic to exam results!!!!
    get cte():string{return 'percent'}
    */

    //Save the current sheet sql to the clipboard, so that we can access it for
    //debugging purposes
    private save_sheet_sql(){
        //
        //Put the sheet sql into the clipboad
        //
        //Test if the clipboad service is available; report if not
        if (!navigator.clipboard) throw new schema.mutall_error('Clipboard service not available')
        //
        //Copy the sql to the cli[board and tell us if succesful or not
        navigator.clipboard.writeText(this.query.all_ctes)
        .then(() => alert("Text was copied to clipboard"))
        .catch(err => {throw new schema.mutall_error("Failed to copy text: ", err); });
            
    }
    

    //Restore the matrix last valid selectIndex of of the paginator in the crown
    //Section
    restore():void{
        //
        //Get the paginator (from the crown) and set its index to the last index.
        //The index must be known; otherwise do nothing
        if (this.paginator.last_index===undefined) return;;
        this.paginator.element.selectedIndex = this.paginator.last_index;
        //
        //Refresh the crown
        this.sheet.crown.show();
        //
        //Show the matrox
        this.sheet.matrix.show();
        //
        //Hide the restore button once the page is restored. The button is in the 
        //crown section
        this.restore_button!.hidden = true;
    }

    //Show the crown parts, viz., paginator, filters, mode etc. Each part is 
    //responsible for clearing itself where necessary
    public async show():Promise<void>{
        //
        //Show the paginator
        await this.paginator.show();
        //
        //Show the filters in the chamber
        await this.chamber.show();
        //
        //Show the mode that allows body editing
        this.show_edit_mode();
    }

    //Addi event listeners to the radio buttons for controlling mode.
    show_edit_mode():void{
        //
        //Get the style sheet element which controls the editing
        const style_sheet = <HTMLStyleElement>this.get_element('mode');
        //
        //Create a mode object
        const Mode = new mode(style_sheet);
        //
        //Get the edit mode button
        const edit = <HTMLInputElement>this.get_element('edit');
        //
        //Add a lstener to show the matrix body in edit mode
        edit.onclick  = () => Mode.execute('edit');
        //
        //Get the normal mode button
        const normal = <HTMLInputElement>this.get_element('normal');
        //
        //Add a listener to show the matrix body in normal mode
        normal.onclick  = () => Mode.execute('normal'); 
    }
}


//Modelling the matrix region as a panel containing for the header, body and 
//footer regions  of a sheet
class matrix extends panel {
    //
    //Define the header and body regions of a matrix
    public header:header;
    public body:body;
    //
    constructor(sheet:sheet){
        //
        //The element that defines a matrix is identified as such in the 
        //underlying document
        super({type:'id', id:'matrix'}, sheet);
        //
        //Create the header section
        this.header = new header(this);
        //
        //Create the body section. Pivots corespond to the cells in the bottom-most
        //row of the crown section. They are important for definwing the with
        //of the body 
        this.body = new body(this);
   }
   
   //Show the header and the body sections of the matrix. The body's data drives
   //the show
   async show(){
        //
        //Clear the matrix
        this.clear();
        //
        //Show the header data.
        await this.header.show();
        //
        //Show the body data 
        await this.body.show();
   }
   
   //Clearing a matrix is about clearing ite header and body
   clear(){
        this.header.element.innerHTML='';
        this.body.element.innerHTML='';
   }

}  

class header extends panel{
    //
    //Crumb cell ids, needed for creating the factor-driven table rows. The 
    //order of the factors is important. Hence the use of a Map (instead of 
    //a simple object)
    public crumb_cell_ids?:Map<factor_name, Array<cell_id>>;

    //
    //Factor levels for the crumb factors
    //The levels for each factor. It has a structure that looks like, e.g.,
    //{school:['kaps'], year:[1019, 2020, 2022}, subject:['kiswahili','maths',..] 
    public crumb_factor_levels?: {[factor:string]:Array<lib.basic_value>};
    //
    //Redfine a header element to be a table section
    declare element:HTMLTableSectionElement;
    //
    constructor(parent:matrix){
        //
        //The header element is identified by a matching name
        super({type:'id', id:'header'}, parent);
    }
    
    //Display the matrix header as a set of rows that comprise of 2 sections, viz., crest
    //and crumb. There are 3 types of rows:-
    //-the a top most row, a.k.a, a partition; 
    //-the bottom most row
    //-the intermediate rows
    async show(){
        //
        //1. Get the data required for populating a header
        //
        //Set the header/crumf factor levels. You require a general set of ctes 
        //and a specific one fit for the job.
        //The general ctes to use for extracting factor levels are all the ctes
        //in the sheet, comprising of the base, and the other 3*auto-derived ones.
        //The specific cte to use for extracting the factor levels is the crumb
        this.crumb_factor_levels = await this.sheet.get_factor_levels('crumb', this.query.all_ctes!, 'crown');
        //
        //Use the crumb factors to create a map of cell ids.
        //
        //Get the indexing actors and their cell_ids as keys
        const keys:Array<[factor_name, Array<cell_id>]> = this.query.factors.crumb.map((fname, index)=> this.get_crumb_cell_ids(fname, index));
        //
        //Use the keys to create the map of cell ids
        this.crumb_cell_ids = new Map(keys);
        //
        //2. Show the header rows
        //
        //Show the topmost row
        this.show_top_row();
        //
        //Show the intermediate rows
        //
        //Get the index of the last factor
        const last_index:number = this.query.factors.crumb.length-1; 
        //
        //Show the intermediate header rows; these are all teh rows with index
        //less than the last index
        for(let i=0; i<last_index; i++) this.show_intermediate_row(this.query.factors!.crumb[i], i);
        //
        //Show the bottom-most row, a.k.a, pivot, of the header region;
        //The last index is -1 if there are no crub factors. But the pivot row
        //must still exist.
        this.show_pivot_row(last_index);
    }

    //Show the topmost row in a header; it displays the general structure of 
    //a sheet. It is used for receiving dropped factors; this is important when
    //the crest or crumb factor is empty
    show_top_row(){
        //
        //Create the top row under the header element
        const tr:HTMLTableRowElement = this.element.insertRow();
        //
        //Create element type for crerating panels of the top row
        const type:element_type = {type:'create', tagname:'th', parent:tr};
        //
        //Add the margin cell whose value is 'label' spanning 1 left fixed column
        new panel(type, this, {textContent:'Label', io:'read_only', left:true});
        //
        //Add the crest cell using a span that is as big as the number of
        //crest factors. NB. The crest cell will show even when there are
        //no crests. This is by design, so that a drop region for crests is always
        //available even when there are no crests
        new droppable(type, {region:'crest'}, this, {
            colSpan:this.factors.crest.length,
            textContent:'Crest',
            left:true //It is left fixed
        });
        //
        //Add the crumb cell that is as wide as the number of cells in the
        //bottom-most row, a.k.a., pivot. See the crest cells as it 
        //behaves the same as this one
        new droppable(type, {region:'crumb'}, this, {
            colSpan:this.pivots.length,
            textContent:'Crumb'
        });
        //
        //Add the summary cell that as wide as the number of  summaries, if there
        //are summaries    
        if(this.query.summaries.right.length!==0)
            new panel(type, this, {
                colSpan:this.query.summaries.right.length, 
                textContent:'Summary',
                io:'read_only',
                right:true //It is right fixed 
            });
    } 

    //Show the i'th intermediate header row; the index is that of the factor
    //that matches this position in the crumb factors 
    show_intermediate_row(factor:string, index:number):void{
        //
        //Create the intermediate row under the header element
        const tr:HTMLTableRowElement = this.element.insertRow();
        //
        //Formulate the elenent type that defines panels of the intermediate row
        //in teh header section
        const type:element_type = {type:'create', tagname:'th', parent:tr};
        //
        //Create the crumb labeling draggable 'th' based on this header. It is 
        //left fixed 
        new droppable(
            type, 
            {region:'crumb', factor:index}, this,
            {textContent:factor, left:true}
        );
        //
        //Add one empty crest cell with a span as big as the number of
        //crest factors. This too shoukd be left fixed
        new panel(type, this, {
            colSpan:this.query.factors!.crest.length, 
            io:'read_only', 
            left:true
        });
        //
        //Add as many crumb cells as there are cell ids for the factor that 
        //matches this index
        Array.from(this.crumb_cell_ids!.values())[index].forEach(
            cell_id=>new header_crumb(index, cell_id, type, this)
        );
        //
        //Add an empty summary cell that as wide as the number of summaries
        new panel(type, this, {
            colSpan:this.query.summaries.right.length, 
            io:'read_only',
            right:true
        });
    }

    //Show the bottom-most row in the header. It pivots the header and body regions
    //of a matrix. Its row index is -1 if there are no crumb factors
    show_pivot_row(index:number):void{
        //
        //Create the pivot row under the header element
        const tr:HTMLTableRowElement = this.element.insertRow();
        //
        //Create rhe element type that defines panels of the top row
        const type:element_type = {type:'create', tagname:'th', parent:tr};
        //
        //Get the crumb factor at the given index and use it for 'labeling' crumb 
        //levels. NB. Labeling means, placing the factor name in the labels column
        new draggable(
            {region:'crumb', index}, //factor
            type, 
            this, //parent
            {textContent:this.factors.crumb[index], left:true} //attributes
        )
        //
        //If there are no crest factors... 
        if (this.factors.crest.length===0)
            //then add one empty cell to match the label of the topmost row 
            //in the header. Such an empty cell can act as a drop point for crest 
            //factors dragged from any other region
            new droppable(
                type,
                {region:'crest'}, //destination
                this, //parent
                {left:true} 
            );
        //
        //...otherwise add as many crest cells as there are such factors. 
        //They have text labels that match their ids.
        else this.factors.crest.forEach((factor, index)=>new draggable(
            {region:'crest', index}, //factor
            type,
            this,//parent
            {textContent:factor, id:factor, left:true}//attributes
        ));
        //
        //If there are no crumb factors...
        if (index===-1)
            //...add one empty cell with a unique id, __value. 
            new droppable(
                type, 
                {region:'crumb'}, //factor
                this, //parent
                {id:'__value'}//attributes
            );
        else
            //..otherwise add as many crumb cells as there are cell ids for the 
            //factor that matches this index.  
            Array.from(this.crumb_cell_ids!.values())[index].forEach(cell_id=>
                new header_crumb(index, cell_id, type, this));
        //
        //Add as many summary cells as there are right summaries
        this.query.summaries!.right.forEach(summary=>new panel(type, this, {id:summary, textContent:summary, io:'read_only'}))
    }

    //Pivots are the cell ids in the last row of the crumb cells. This row is 
    //also known as teh pivot row. The number of pivots is one of the 
    //determinat of the width of a sheet matrix
    get pivots():Array<cell_id>{
        //
        //the cerumb cell_ids must be set
        if (this.crumb_cell_ids===undefined) throw new  schema.mutall_error('header.crumb_cell_ids not set');
        //
        //There are not pivot cells, and theerfore no ids, if there are no crumb 
        //factors
        if (this.factors.crumb.length===0) return [];
        //
        //Let L be the index of the last crumb cell id.
        const L = this.crumb_cell_ids.size-1;
        //
        //Get the cell ids in the last entry of the cells map
        return Array.from(this.crumb_cell_ids.values())[L];
    }


    //
    //Get the cell ids of the given factor type and index.
    private get_crumb_cell_ids(factor:factor_name, index:number):[factor_name, Array<cell_id>]{ 
        //Compute the cells to which we wish to map each factor. Note the unique signature
        //of each cell.
        /*
        [
            f1 =>[
                {f1:'l11'}, 
                {f1:'l12'}, 
                {f1:'l13'}
            ]    
            f2 =>[
                {f2:'l11', f1:'l11'}, <-------------this is a cell's signature 
                {f2:'l11', f1:'l12'}, 
                {f2:'l11', f1:'l13'},

                {f2:'l12', f1:'l11'}, 
                {f2:'l12', f1:'l12'}, 
                {f2:'l12', f1:'l13'}
            ]
            f3=>[
                {f3:'l31', f2:'l11', f1:'l11'}, 
                {f3:'l31', f2:'l11', f1:'l12'}, 
                {f3:'l31', f2:'l11', f1:'l13'},
                {f3:'l31', f2:'l12', f1:'l11'}, 
                {f3:'l31', f2:'l12', f1:'l12'}, 
                {f3:'l31', f2:'l12', f1:'l13'},

                {f3:'l32', f2:'l11', f1:'l11'}, 
                {f3:'l32', f2:'l11', f1:'l12'}, 
                {f3:'l32', f2:'l11', f1:'l13'},
                {f3:'l32', f2:'l12', f1:'l11'}, 
                {f3:'l32', f2:'l12', f1:'l12'}, 
                {f3:'l32', f2:'l12', f1:'l13'}
            ]
        ]    
        */ 
       
        //Slice from factors, starting from 0 to i+1, to get ancestors. The ancestor
        //of f1 (including self) is [f1], of f2 are [f2,f1] and of f3 are [f3,f2,f1]
        //They are important in defining a cell's signature.
        const ancestors: Array<factor_name> = this.factors.crumb.slice(0, index+1);
        //
        //Reduce each ancestor of this factor to an array of its corresponding cells 
        //as illustrated above. Start with an empty list of cells. Note: there are
        //2 versions of reduce. The initial value must be provided to help typescript
        //pick the version we want
        const cell_ids:Array<cell_id> = ancestors.reduce((pv:Array<cell_id>, cv, i)=>this.generate_cells(pv, cv, i), []);
        //
        //Save the cells for this factor
        return [factor, cell_ids];
    }

    //Generate the cell ids a row, given the cell ids of the previous row and
    //the levels of the current factor. 
    generate_cells(previous_cells:Array<cell_id>, factor:factor_name, index:number):Array<cell_id>{
        //
        //Start with an empty list of cell ids
        const cell_ids:Array<cell_id> = [];
        //
        //The factors levels associated with a header must be defined before using 
        //them
        if (this.crumb_factor_levels===undefined) throw new schema.mutall_error('Initialize  header factor levels before using them');
        //
        //Get the levels for the given factors
        const levels:Array<lib.basic_value>|undefined = this.crumb_factor_levels[factor];
        //
        //Ensure that the levels for the given factors are set
        if (levels===undefined) 
            throw new schema.mutall_error('You are using factor levels before initializing them');
        //
        //If there are no previous cells...
        if (index===0){
            //
            //...then there are as many cells as there  are levels for this factor
            for(const level of levels){
                //
                //Create a new cell id from scratch
                const new_cell_id = new Map();
                //
                //Add the new factor and its level to the new cell
                new_cell_id.set(factor, String(level));
                //
                //Add the new cell to the collection
                cell_ids.push(new_cell_id);
            }
        }else{
            //...there are s many cells at this level as there are the product
            //of the (A) the number of cells in the previous rows and B) the 
            //levels of teh current factor. This is what the double loop helps 
            //to achieve 
            for(const cell_id of previous_cells){
                for(const level of levels){
                    //
                    //Create a new cell id, using the current one
                    const new_cell_id = new Map(cell_id);
                    //
                    //Add the new factor and its level to the new cell
                    new_cell_id.set(factor, String(level))
                    //
                    //Add the new cell to the collection
                    cell_ids.push(new_cell_id);
                }
            }
        }
        //
        //Return the cell id
        return cell_ids;
    }


}

//This class models the body region of a sheet's matrix
class body extends panel {
    //
    //Redefine the panels element as a table section
    declare element:HTMLTableSectionElement;
    //
    //The body needed the header
    constructor(matrix:matrix){
        super({type:'id', id:'body'}, matrix);
    }

    //Create the body section and filled in data
    public async  show():Promise<void>{
        //
        //Use the examiner query to get the body data
        const data:Array<schema.fuel> = await this.get_data(); 
        //
        //Create the empty table by adding as many rows (to the body element) 
        //as there are data rows
        data.forEach((row)=>this.create_empty_row(row)); 
        //
        //Use the empty table to fill it with the data
        data.forEach((data_row, rowIndex)=>this.populate_row(data_row, rowIndex))
    }
    
    //Create an empty row of body data (to be filled in later)
    private create_empty_row(row:schema.fuel):void{
        //
        //Create an empty row (tr)
        const tr:HTMLTableRowElement = this.create_element('tr', this.element);
        //
        //Create element type that defines panels of a body (th side)
        const type:element_type = {type:'create', tagname:'th', parent:tr};
        //
        //Create the body row selector, in the labels column. It is a panel
        //that is droppable for cells of the crest type. For now, its a simple
        //empty cell. In future we shall add a checkbox to support multi-row 
        //operations, e.g. merging, deleting, copying. It can be a drop area for
        //crest factors
        new droppable(type, {region:'crest'}, this, {io:'checkbox', left:true});
        //
        //If there are no crest factors...
        if (this.factors.crest.length===0)
            //
            //..then create one empty cell as a crest place marker. Mark it as
            //a droppable area for crest factors
            new droppable(type, {region:'crest'}, this, {io:'read_only', left:true});
        else
            //
            //...otherwise create as many draggable cells as there are crests
            this.factors.crest.forEach((crest, index)=>
                new draggable({region:'crest', index}, type, this, {io:'read_only', left:true})
         );
        //
        //Create the crumb cells under the body/crumb        
        //
        //Get the pivot cells from the bottommost row of the header
        const pivots:Array<cell_id> = this.sheet.matrix.header.pivots;
        //
        //If there are no pivots...
        if (pivots.length===0)
            //
            //...create a cell to be placed under a column that has no cell_id.
            //NB. cell_id is a Map
            new panel(
                {type:'create', tagname:'td', parent:tr},
                this, 
                {io:this.get_io_type(new Map(), row)}
            );
        else
            //
            //...othereise, create as many empty cells (under the crumb region of the 
            //bottom most row) as there are pivots, i.e., cell_ids in the row. 
            pivots.forEach(cell_id=>new panel(
                {type:'create', tagname:'td', parent:tr},
                this, {io:this.get_io_type(cell_id, row)}
            ));
        //
        //Create the summary cells in the body/summary 
        if (this.summaries.right.length===0)
            //
            //Return an error
            throw new schema.mutall_error('No summaries found');
        else
            //
            //...otherwise create as many cells as there are summaries
            this.summaries.right.forEach((right, index)=>
                new panel( type, this, {io:'read_only', right:true})
                
         );     
    }
    
    //Get the io type given a cell id. The strategy is to get the measurement name
    //that matches the cell_id; then use the crosstab query to look up its io.
    private get_io_type(cell_id:cell_id, row:schema.fuel):io.io_type{
        //
        //In which region is the measurement? This is important so that we can 
        //look for the name in either the cell_id components, the current data 
        //row or the amongsts the filter values
        const region: region_type = this.get_measurement_region();
        //
        //What is the actual measurement name? Search for it in the data that 
        //comes from the given region
        const name:string = this.get_measurement_name(region, cell_id, row); 
        //
        //Get the measurement's io (from the measurement map); it must exist.
        //(Why is measurements defined as a map? The order is not important, 
        //is it? Why not an indexed structy+ure such as e.g.
        //type measurements = {[name:string]:io.io_type} rather than
        //type measurements = Map<string, io.io_type}....
        const Io:io.io_type|undefined= this.query.measurements.get(name);
        if(Io===undefined)
            throw new schema.mutall_error(`The measurement named '${name}' is not found in the measurements`)
        //
        //Return the io
        return Io;
    }
    
    //Search for the measurement factor in all the region. Stop the search if
    //found; if not, report error
    get_measurement_region():region_type{
        //
        //Define the regions to search for measurements
        const regions:Array<region_type> = ['crown', 'crest', 'crumb','summary'] ; 
        //
        //Loop through all the regions...
        for(const region of regions){
            //
            //If the teh region has the measurement then return it
            if (this.query.factors![region].includes('measurement')) return region;
        }
        //
        //At theis point the measurement factor was not found. Report error
        throw new schema.mutall_error(`No measurement factor found in any region`);
    } 

    //Find the measurement name by searching the crown filters, current data 
    //row or cell_id, depending on the given region. 
    get_measurement_name(region:region_type, cell_id:cell_id, row:schema.fuel):string{
        //
        //Define the measurement name
        let mname:schema.basic_value|undefined;
        //
        //If the measurement is in the...
        switch(region){
            //
            //..crown region, then search for the name amongs the filter select 
            //elements
            case 'crown':
                //Get the measurement from one of the filters (named measurement)
                //This will throw exception if no selection is found
                return this.sheet.get_selected_value('measurement');
            //
            //...crest region, the search for the measurement name in the current 
            //data row.         
            case 'crest':
                //Get the measurement name from the data row
                mname = row['measurement'];
                //
                //Report an eror if the measurement name is not found in the data row
                if (mname!==undefined) return String(mname);
                // 
                throw new schema.mutall_error(`No measurement found in crest region`);
            //
            //If the measurement is in the crub, get its name from the cell_id        
            case 'crumb':
                //
                //Get the measurement name from the column cell id
                mname = cell_id.get('measurement');
                //
                //Report an eror if not found
                if (mname!==undefined) return mname;
                // 
                throw new schema.mutall_error(`No measurement found in the curent cell id`);
            default:
                //Somethin is unusual. Report errror
                throw new schema.mutall_error(`Region ${region} is not expected to hold measurement name`);
        }
    } 

//Returns the data for filling up the body
    async get_data():Promise<Array<schema.fuel>>{
        //
        //Compile complete sql code for getting the data for loading to the body
        //
        //Complete the query for getting the body dat. 
        //Limit the number of rows as this might get very large very easily.
        //In future, consider scrolling -- the same way we do with the CRUD
        //interface        
        const body_sql = `
            ${this.query.all_ctes}\n
            select * from crest limit ${this.query.limit} offset ${this.query.offset}`;          
        //
        //Create the (incomplete, i.e., false parameter) database, execute the 
        //sql to return the data
        return await server.exec('database', [this.query.dbname],'get_sql_data', [body_sql]);    
    }

     
    //
    //Fill the crest and crumb sections of a body row. The data is of the 
    //fuel type and the table row to fill has the given index
    private populate_row(data_row:fuel, row_index:number):void{
        //
        //Use the row index to retrieve the body row, i.e., the tr, to populate
        const tr: HTMLTableRowElement = (<HTMLTableSectionElement> this.element).rows[row_index];
        //
        //Populate the tr with the crest cells
        this.factors.crest.forEach(factor =>this.populate_cell(factor, data_row[factor], tr));
        //
        //Populate the tr with the crumb cells
        //
        //Get the crumb data; it is a json string in the raw_values column of
        //the data row. Convert it into an array
        const Ids:Array<{id:string, value:lib.basic_value}> = JSON.parse(String(data_row.raw_values));
        //
        //Destructure the id/value pairs to populate every crumb cell
        Ids.forEach(({id, value})=>this.populate_cell(id, value, tr)); 
        //
        //Populate the tr with the summary cells
        this.summaries.right.forEach(summary =>this.populate_cell(summary, data_row[summary], tr));
    }
        //
    //Populating a cell in the crest/crumb section of the body region. Note that
    //if there are no crumb factors, the id is null
    private populate_cells(
        id:string|null, 
        value:lib.basic_value|{[index:string]:lib.basic_value},
        tr:HTMLTableRowElement
    ):void{
        //
        //The case for no crest factors is special. The desired id as the unique 
        //name __value. See rationale in crest.show_pivot_row
        const desired_id:string = id ?? '__value';
        //
        //Look for a cell (in the bottomost of the header) whose id matches the
        //given one
        const td_header = <HTMLTableCellElement>this.get_element(desired_id);
        //
        //Get its column index
        const cellIndex:number = 11;
        //
        //Get the column, as a td,  that matches the index from the tr
        const td_body = tr.cells[cellIndex];
        //
        //Use the td to get the io that is associated with that it
        const Io = io.io.get_io(td_body);
        //
        //Set the value of the io to that of the pair. 
        //
        //That depends on the type of value
        if (typeof value === "object" && value !== null){
            //
            //When the value is an object assume that it has he value and color keys
            if (value.value!==undefined && value.color!==undefined){
                //
                //Set the value
                Io.value = value.value;
                //
                //Change the background colour
                Io.anchor.element.style.backgroundColor=String(value.color);
            }
            else{
                throw new schema.mutall_error('Value is not a property formated: value/color expected');
            }    
        }
        //When the value is basic....
        else{
            //Assign it directly to the Io
            Io.value=value;
        }        
        
    }
    
    //
    //Populating a cell in the crest/crumb section of the body region. Note that
    //if there are no crumb factors, the id is null
    private populate_cell(
        id:string|null, 
        value:lib.basic_value|{[index:string]:lib.basic_value},
        tr:HTMLTableRowElement
    ):void{
        //
        //The case for no crest factors is special. The desired id as the unique 
        //name __value. See rationale in crest.show_pivot_row
        const desired_id:string = id ?? '__value';
        //
        //Look for a cell (in the bottomost of the header) whose id matches the
        //given one
        const td_header = <HTMLTableCellElement>this.get_element(desired_id);
        //
        //Get its column index
        const cellIndex:number = td_header.cellIndex;
        //
        //Get the column, as a td,  that matches the index from the tr
        const td_body = tr.cells[cellIndex];
        //
        //Use the td to get the io that is associated with that it
        const Io = io.io.get_io(td_body);
        //
        //Set the value of the io to that of the pair. 
        //
        //That depends on the type of value
        if (typeof value === "object" && value !== null){
            //
            //When the value is an object assume that it has he value and color keys
            if (value.value!==undefined && value.color!==undefined){
                //
                //Set the value
                Io.value = value.value;
                //
                //Change the background colour
                Io.anchor.element.style.backgroundColor=String(value.color);
            }
            else{
                throw new schema.mutall_error('Value is not a property formated: value/color expected');
            }    
        }
        //When the value is basic....
        else{
            //Assign it directly to the Io
            Io.value=value;
        }        
        
    }
}
//
//A dropabble is an area of a sheet onto which factors can be droped. 
//Effectively it element has the ondrop and dragover event listeners defined
class droppable extends panel{
    //
    constructor(
        //
        type:element_type,
        //
        //The region (and optionally, factor) that we are dropping some (other) 
        //factor onto
        public destination:{region:region_type, factor?:number},
        //
        //The parent panel
        parent:panel,
        attributes?:attributes
    ){
        super(type, parent, attributes);
        //
        //Attach the ondrop event listener to the panel's element
        this.element.ondrop = (ev)=>this.on_drop(ev);
        //
        //Prevent the ordinary behaviour when a cell is being dragged over the
        //panel. This is what makes it droppable
        this.element.ondragover = (ev) => ev.preventDefault();
        //
        //Classfify droppable panels using the region that they match
        this.element.classList.add(this.destination.region)
    }

    //On dropping a factor, determine the sheet changes required; then effect them
    //We are dropping to the given region.
    async on_drop(ev:DragEvent){
        //
        //Stop the progation of this event so that its parent does not 
        //do another drop, which would re-insert the factor at the 0 index
        //position. It would be wrong.
        ev.stopPropagation();
        //
        //Extract the source factor and its region
        //
        //Get the data transfer object. There must be one 
        const transfer:DataTransfer|null = ev.dataTransfer;
        if (transfer===null) throw new schema.mutall_error('No data transfer object foundf')
        //
        //Get the dragged factor; there must be one
        const source_str:string = transfer.getData('factor');
        if (source_str==='') throw new schema.mutall_error('No factor data found in the data transfer object');
        //
        //Parse the string to get the factor index and its region
        const source:factor = JSON.parse(source_str);
        //
        //Update the query factors; those in that are dragged will be the reduced
        //while those that are dropped over will be expanded
        this.update_factors_ondrop(source); 
        //
        //If the source and destinations are the same, discontinue the transfer
        if (source===this.destination) return;
        //
        //The crown need not be repainted if it is not affected by the drop
        if (![source.region, this.destination.region].includes('crown')) await this.sheet.matrix.show();
        //
        //Refresh the entire sheet (WITHOUT INITIALIZING IT)
        else this.sheet.show();
    };

    //Update the factors structure on dropping the indexed factor to the named
    //region.
    update_factors_ondrop(source:factor){
        //
        //Let src be teh source and dest be the destination
        const src=source; const dest = this.destination;
        //
        //From the source factors, remove one element at the given source index
        const Sources:Array<factor_name> = this.factors[src.region].splice(src.index, 1);
        //
        //To the destination factors, add the removed sources at the destination index
        //
        //Let D be the destinatination index. It is either 0, or one step after 
        //the position of the destination factor. 
        const D = dest.factor ===undefined ? 0: dest.factor + 1;
        //
        //Insert the spliced sources to the destination region 
        this.factors[dest.region].splice(D, 0, ...Sources);
    }
}


//A special panel that is associated with a factor, and so can be dragged
//and dropped
class draggable extends droppable {
    //
    //A draggable has a parent (which too must be a panel). The top panel is the 
    //sheet. That is where the factors are actually 
    constructor(
        //
        //The factor being dragged
        public factor:factor,
        //
        //How to get the element type of the factor being dragged
        type:element_type,
        //
        //The location of the  draggable in the parent panel
        parent:panel,
        //
        //The region in which the the draggable factor is located
        attributes?:attributes
    ){
        //
        //Initialize the panel
        super(type, factor, parent, attributes);
        //
        //Mark the element of this panel as draggabble
        this.element.draggable=true;
        //
        //Convert the current factor to a string
        const factor_str = JSON.stringify(this.factor);
        //
        //Add the ondrag start listener
        this.element.ondragstart = (ev) => ev.dataTransfer!.setData('factor', factor_str);
    }
   
    //A draggable panel has a factor name associated with it
    get factor_name():factor_name{
        return this.factors[this.factor.region][this.factor.index];
    }
}



//This class represents a draggable cell in the crumb section of a header region
class header_crumb extends draggable{
    //
    //Redefine the span element to be a table cell
    declare element:HTMLTableCellElement; 
    //
    //Redfine teh paremt panel to be a header
    declare parent:header; 
    //
    constructor(
        public index:number,
        cell_id:cell_id,
        //
        type:element_type,
        parent:header,
    ){
        //Initialize the panel; 
        //
        //The draggable factor of this panel
        //Most of the panel attributes are set after the parent is initialized
        super({region:'crumb', index}, type, parent);
        //
        //Set the following elenent propertoes after the panel is created
        this.element.colSpan = this.get_colspan(index);
        this.element.textContent = this.get_text(cell_id);
        this.element.id = this.get_id(cell_id);
    }
    //
    //Show the cells for the  crumblet identified by the given index and factor  
    //number of crumblets below the current one
    //The span of each cell
    //(S) is a function of 2 variables, viz, 
    //- C: the number of cell ids for he given factor index
    //-B : the number of cells in the bottom most row 
    //S is B/C
    get_colspan(factor:number):number{
         //
        //Let a the number of cells in bottom most row, i.e., the width of the matrix
        const a = this.parent.pivots.length;

        //b is number of cells for the given factor
        const b = Array.from(this.parent.crumb_cell_ids!.values())[factor].length;
        //
        //The column span of a cruiblet cell ios the number of cvells ij the bottm
        //row divided by yje number celld for this factor
        const colspan = a / b;
        //
        //Create the crumblet cell
        return colspan;
    }
    
    //
    //Getting the id of the crumb cells
    get_id(cell_id:cell_id):string{
        //
        //Get the values from the cell_id map
        const id = Array.from(cell_id.values()).join("_")
        //
        //Return the id
        return id;
    }
    //
    //Get the text to be inserted in the crumb cells
    get_text(cell_id:cell_id):string{
        //
        //Use the factor of this cell to access the matching cell_id key
        //Its value is the required text
        const text:string|undefined = cell_id.get(this.factor_name);
        //
        if (text===undefined) 
            throw new schema.mutall_error(`No crumb factor with name '${this.factor_name}' found`);
        //
        //Return the text
        return text;
    }
} 

//The panel in the crown that hold filters; it is droppable for factors to 
//be associated with crown region
//
class chamber extends droppable{
    //
    //The levels associated with filters in the crowwn section
    public levels?:{[factor:string]:Array<lib.basic_value>};
    //
    //The filters in the chamber
    public filters:Array<filter>=[];
    //
    constructor(parent:crown){
        //
        //Chambe 
        super({type:'id', id:'chamber'}, {region:'crown'}, parent);
    }

    
    //Show all the filters in the chamber, by first etting their levels, then
    //displaying them
    async show(){
        //
        //Clear chamber, if dirty
        this.filters.forEach(filter => filter.clear());
        //
        //Create the filters in the chamber
        this.filters = this.factors.crown.map((_,i)=>new filter(i, this));
        //
        //Get/Set the crown region factor levels from the crosstab query
        this.levels = await this.sheet.get_factor_levels('crown', this.query.measurements_ctes, 'measurements');
        //
        //Get and show every filter in the crown region
        this.factors.crown.forEach((factor, index)=>this.filters[index].show());
    }    
}


//This class is for modelling filters in the crown section. Extending the library 
//view class allows us to access some commeon methods  
class filter extends draggable{
    //
    //The span element used for labeling the selector as well as  holding
    //drag/drop labels
    public span:HTMLSpanElement;
    //
    //The selector for filter values
    public select:HTMLSelectElement;
    //
    constructor(
        //
        //The index of the filter factor
        public index:number,
        //
        parent:chamber
    ){
        super(
            {region:'crown',index}, 
            {type:'create', tagname:'label', parent:parent.element}, 
            parent
        );
        //
        //Create the span element, including its drag/drop listeners
        this.span = this.create_span_element();
        //
        //Create the select element, including its onchange listener 
        this.select = this.create_select_element();
    }

    //Create teh span element of a filter and attach drag/drop events
    create_span_element():HTMLSpanElement{
        //
        const textContent = this.factors['crown'][this.index];
        //
        //Use the label element to add a span tag showing the name
        //of the item
        const span = this.create_element('span', this.element,{textContent});
        //
        return span;
    }
    
    //Create the filter selector element
    create_select_element():HTMLSelectElement{
        //
        const id = this.factors['crown'][this.index];
        //
        //Use the same label element to add the input element whose id is the
        // same as item
        const select:HTMLSelectElement = this.create_element('select', this.element, {id});
        //
        //Add the onchange event listener to repaint the entire matrix 
        //based on the change 
        select.onchange = async ()=>await this.on_change();
        //
        return select
    }
    
    //When a filter, it is equivalent to selection using the  page selector 
    //indirectly. Translate this  to an on-change event on the paginator.  NB. 
    //Chamging a select value programmatically does not automatcally raise the
    //onchange event. It has to be manually done 
    async on_change(){
        //
        //Update the paginator with the new filters combinations. Return true 
        //if successful, otherwise false
        const represented:boolean = this.sheet.crown.paginator.update_using_filters();
        //
        //If the filter selections have a match in the paginator, force a page
        //selector onchange
        if (represented) 
            await this.sheet.crown.paginator.on_change();
        else {
            //
            //Clear the sheet matrix, both header and body
            this.sheet.matrix.clear();
            //
            //Show the restore button, if the paginator has a valid index
            if (this.sheet.crown.paginator.last_index!==undefined)
                this.sheet.crown.restore_button.hidden = false;
        }
    }
    

    //Fill the given selector with options. The options are the levels associated
    //with the given factor
    async show():Promise<void>{
        //
        //Check that the levels are set before using them
        if (this.sheet.crown.chamber.levels===undefined) 
            throw new schema.mutall_error('Levels are not set');
        //
        //Add the filter options
        //For each factor level...
        for (const value of this.sheet.crown.chamber.levels[this.factor_name]){
            //
            //Create the option element for the selector
            this.create_element(
                //
                //The name of the element
                'option',
                //
                //Add the option to the selector parent
                this.select,
                //
                {
                    //
                    //Set Option id to the item selected 
                    id: String(value),
                    //
                    //Set the text content of the option to the result from the sql
                    textContent: String(value)
                }    
            )
        }
        //
        //Update the value of the filter to match that of the paginator
        this.update_value();
    }
    
    //To clear a filter is to detach its option elements from its parent
    clear(){
        //
        //Get the parent element of a filter.
        const parent:HTMLElement|null = this.element.parentElement;
        //
       //There must be a parent!
       if (parent===null) 
        throw new schema.mutall_error('A filter must have a parent');
        //
        //Detach the child element from the parent
        parent.removeChild(this.element);
    }
    
    //Update the filter value to synchronise it filter with the current selected 
    //paginator item. 
    update_value(){
        //
        //Get the current paginator selection index
        const paginator_index: number = this.sheet.crown.paginator.element.selectedIndex
        //
        //Get the paginator data that matches the index. The paginator data
        //must be set by now
        const data: fuel = this.sheet.crown.paginator.data![paginator_index];
        //
        //Get the fuel value that matches this filter's factor name
        const value:lib.basic_value = data[this.factor_name];
        //
        //Lookup this value in this filter's options
        const opt: HTMLOptionElement|null = this.select.namedItem(String(value));
        //
        //If the value cannot be found in the options, something must be wrong
        if (opt===null){
            
            //Lef f be the factr being considered. It has two keys: region and 
            //the index of the factor
            const f:factor = this.factor;
            //
            //Get the name of the factor for reporting purposes
            const fname:string = this.factors[f.region][f.index];
            //
            //Report the error
            throw new schema.mutall_error(`This value '${value}' is not among the options for filter '${fname}'`);
            
        }
        //
        //Get the index of the filter option
        const filter_index: number = opt.index;
        //
        //Set the current index of the filter to the filter index
        this.select.selectedIndex=filter_index;         
    }
} 


//The paginator is a panel in the crown region
class paginator extends panel {
    //
    //Redefine teh filter element as a selector
    declare element:HTMLSelectElement;
    //
    //The page data as selector options
    public data?:Array<fuel>;
    //
    //The last valid selected index of the paginator, used for restoring a matrix
    public last_index? :number;
    //
    //The paginatpr constructor only requires the parent crown panel
    constructor(private crown:crown){
        //
        //Initialize the parent panel
        super({type:'id', id:'paginator'}, crown);
        //
        //Add the onchange listener to the selector. Once changed, the entire 
        //sheet is repainted
        this.element.onchange = async () => await this.on_change();
    }
    
    //After clearing teh paginator, id necessary, get paginator data and show it
    public async show(){
        //
        //Clear the paginator select options
        this.element.innerHTML='';
        //
        //Get the paginator data  as selector options
        this.data  = await this.get_paginator_data();
        //
        //use the data to fill the selector with options. 
        this.data.forEach(page=>
            //
            //Create the option element for the page selector
            this.create_element(
                //
                //The name of the element
                'option',
                //
                //Add the option to the selector
                this.element,
                //
                {
                    //
                    //Set Option value to the page number 
                    value:this.get_page_condition(page),
                    //
                    //Set the text content of the option to the joint string
                    textContent: String(page.joint)
                }    
            )
        );
    }

    //
    //Get the data required for filling  the page selector with options
    private async get_paginator_data():Promise<Array<fuel>>{
        //
        //There is no paginator data if there are no filters
        if (this.factors.crown.length===0) return [];
        //
        //Compile the sql that exracts the page selector options. |Remember to 
        //use the 'measurements ctes' and the 'measurements cte' (note the plural)
        //The former is the set of base ctes and the measurement cte
        const sql=`
            ${this.query.measurements_ctes}
            select distinct
                ${this.factors.crown.join(',')},
                concat_ws('/', ${this.factors.crown.join(',')} ) as joint 
            from
                measurements`; 
        //
        //Execute the sql to retrieve the actual data
        let data= await server.exec(
            'database',
            //
            //Create the (incomplete, i.e., false parameter) database, execute the 
            //sql to return the data
            [this.query.dbname, false], 
            'get_sql_data',
            [sql]
        );
        //
        //Return the extracted data
        return data;
    }
    
    //Returns the condition for selecting one page. E.g.,
    //school='kaps' and year='2014' and class='8' and stream='R'... etc
    //The page data looks like:-
    //{school:'kaps', year:2014, class:8...}
    get_page_condition(page:fuel):string{
        //
        //Start with an empty result list of factor/value pairs
        const result:Array<factor_name>=[];
        //
        //For each filter factor...
        for(const key of this.factors.crown){
            //
            //Get the factor/value pair, formated in the way we would like it 
            //for the condition e.g. year='2014'
            const pair = `${key} ='${page[key]}'`;
            //
            //Add the factor/value pair into a result list
            result.push(<factor_name>pair);
        }
        //Use the result list to join the factor/value pairs using the 
        //'and' oparator
        return result.join(' and ');
    }

    //When a paginator changes, update the filters; then repaint the matrix
    async on_change(){
        //
        //Update the filters to synchronise them with the paginator
        this.sheet.crown.chamber.filters.forEach(filter=>filter.update_value());
        //
        //Repaint the matrix only. The crown need not be repainted.
        this.sheet.matrix.show();
    } 

    //Use the filters to update this paginator
    update_using_filters():boolean{
        //
        //1. Fomulate a new option value based on the current settings of all the
        //page items
        //
        //1.1 Construct a page fuel using the values of the curret filer settings
        const page: fuel = this.get_item_data();
        //
        //1.2 Converting the page fuel to an option value (using the same method
        //as the one using for constructing the paginator options)
        const value = this.get_page_condition(page);
        //  
        //2. Set the paginator value to the new option
        //
        //2.1 Set the paginator value to the new option value
        this.element.value = value;
        //
        //If teh current filter settings do not have a match in the paginator, 
        //then the selectIndex is -1.
        return this.element.selectedIndex==-1 ? false: true;
    }

    //Create an object with an array of factors and their values to be used for
    //formulating a  where clause that matches the crown filter settings
    private get_item_data():fuel{
        //
        //Start with an empty fuel
        const result:fuel = {};
        //
        //For each filter factor....
        for (const factor of this.factors!.crown){
            //
            //Get the factor's value
            const value:string = (<HTMLSelectElement>this.get_element(factor)).value;
            //
            //Add it to the empty fuel using the factor as a key(take the result
            // add the factor to the result and assign the factors result)
            result[factor]=value;
        }
        //
        //Return the completed fuel
        return result;
    }
    
}



//This class supports the viewinmg of a sheet in different modes, e.g. edit or
//normal modes 
class mode{
    //
    constructor(public style_sheet:HTMLStyleElement){}
    //
    //Show the matrix body in either normal or edit modes. Technically, this means
    //2 things:-
    //- If the mode selected is normal, look for the normal rule and set it to 
    //flex and edit to none
    //- If the mode selected is edit, look for the edit rule set it to flex and 
    //nomal to none
    execute( mode:'normal'|'edit'):void{
        //
        //Get your css declarations for controlling the view mode
        const edit :CSSStyleDeclaration = this.mode_get_css_style_declaration('.edit');
        const normal :CSSStyleDeclaration = this.mode_get_css_style_declaration('.normal');
        //
        switch(mode){
            
            //If the mode selected is normal...
            case 'normal':
                
                //...use the normal declararion to set its display property to 
                //flex 
                normal.setProperty('display','flex');
                //
                //...use for the edit declararion and set its display property to 
                //none 
                edit.setProperty('display','none');
                break;
            //    
            //If the mode selected is edit
            case 'edit':
                //...use  the edit declaration and set its display property to 
                //flex 
                edit.setProperty('display','flex');
                //
                //...use for the edit declaration set its display property to 
                //none 
                normal.setProperty('display','none');
                break;
        }
    }
    //
    //Get the given css declaration that matches the given rule rule selector
    /*
        .normal                     |    <-------------selector_text
        {                           |                   |
            display:none;           |Rule               |  <-----property/value
            textclor:black          |                   |Declaration
        }                           |                   |
    */
    private mode_get_css_style_declaration(selector_text:'.normal'|'.edit'):CSSStyleDeclaration{
        //
        //Get the style element that controls the view mode
        const style_element: HTMLStyleElement = this.style_sheet;
        //
        //Use the element to get the associated  Css stylesheet
        const css_stylesheet: CSSStyleSheet = style_element.sheet!;
        //
        //Get the css rulelist from the stylesheet
        const css_rulelist: CSSRuleList = css_stylesheet.cssRules;
        //
        //Get the css rule that matches the requested selector text
        const rule: CSSStyleRule = this.mode_get_rule(selector_text,css_rulelist);
        //
        //Get and return the css normal declaration
        const declaration: CSSStyleDeclaration = rule.style; 
        
        return declaration;
    }
    
    //Get the rule (from the given list of rules) whose selector text matches 
    //the given selector
    private mode_get_rule(selector:string, list:CSSRuleList):CSSStyleRule{
        //
        //Convert the list into an array so that we can use the for/of
        //methods for searching the selectpr text
        const list_array:Array<CSSRule> = Array.from(list);
        //
        //For each css style rule....
        for (const rule of list_array ){
            //
            //Cast the general rule to the specific CSSStyle rule
            const rule2= <CSSStyleRule>rule;
            //
            //Compare the selector text with the one we want and if it matches
            //then return the css rule otherwise go to the next rule
            if (rule2.selectorText===selector) return rule2;
         }
        //At this point there is no error that matches the selector text, 
        //so something must have gone wrong, stop this function and report an 
        //error to that effect
         throw `Cannot find a css rule with selector ${selector}`;
    }
}
 

