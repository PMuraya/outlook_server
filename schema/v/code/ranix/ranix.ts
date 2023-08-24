//Resolve referenece mutall_error
import * as schema from '../schema.js';

//Resolve reference to the app
import * as app from '../../../../outlook/v/code/app.js';
//
//Allow access to the view methods
import * as outlook from '../../../../outlook/v/code/outlook.js';

//Resolve to the quetionnaire class in the registation module
import * as reg from  "./../registration/registration.js";

//Resolve references to the io
import * as io from "../io.js";

//To resolve references to layout
import * as quest from "../questionnaire.js";
//
//Allows access to teh server
import * as server from "../server.js";

export class ranix extends reg.questionnaire{
    //
    //The panels of the ranix interface
    static plan:HTMLElement;
    static interaction:HTMLElement;
    //
    //The html page being designed by ::George
    static filename = 'index.html';
    //
    //The template that holds the interaction elements for all the statements
    //used in Ranix
    static template:outlook.template; 
    //
    //The ranix home page
    static home:ranix;
    //
    //The date and time when this data colection session started. It is now, 
    //specified in the  correct Mysql fashion.YYYY-mm-dd hh:mm:ss
    //Consider using luxon library. Moment.js is legacy ::kangara
    public session_datetime: string;
    
    //
    constructor(mother:app.app){
        //
        //Assume we are creating a new record, rather than editing new ones
        super(mother, 'create', ranix.filename);
        //
        //Set the date and time of this session (using the luxon library to
        //format teh date and time to the Mysql standard)
        this.session_datetime = this.now();
        //
        //Save this view, to allo globa; access
        ranix.home=this;
    }
    
    //Execute the steps that are necessary for recording vehicle flows
    async show_panels():Promise<void>{
        //
        //Set the elements that represent pannels for this ranix terminal
        ranix.plan = this.get_element('plan');
        ranix.interaction= this.get_element('interaction');
        //
        //Prepare the template that holds the html elements of all the
        //statements used in this application
        ranix.template = new outlook.template('./template.html');
        await ranix.template.open();
        //
        //The statements to execute, in that order
        const statements = new Map<'open_stock'|'record_flows'|'close_stock', questionnaire>([
            ['open_stock', new stock('Opening')],
            ['record_flows', new flow()],
            ['close_stock', new stock('Closing')]
        ]);
        
        //Display the execution plan, by listing all the statments
        //in the teps panel and in the order of the execution
        for(const [key, statement] of statements){
            statement.list_in_steps_panel();
        }
        //
        //Run each questionre statement as a do loop. 
        for(const [key, statement] of statements){
            //  
            //The do loop
            do{
                //
                //Collect the stock record and wait for the user to press next
                await statement.run();
                //
                //Check whether its end of stock taking, by inspecting to see if the
                //stock is empty
                if (statement.is_empty()) {
                    //
                    //Create a question
                    const Question:question = new question(key);
                    //
                    //Ask the user to confirrm if this is the end of stock tajong
                    await Question.run();
                    //
                    //If it is the end, 
                    if (Question.response==='yes') statement.last = false;
                }
                
            }while (statement.last);
        }
    }
    
}

//Thus class models a programming statement; it extemds a view, this allowing us
//to access general view methods.
export abstract class statement extends outlook.view{
    //
    //The name that appears on the plan panel when this statement is executed
    public name:string; 
    //
    //The id of a statement is a unique name formed from its key, prefixed with 
    //word stmt, e.g., stmt, stmt2, etc.
    get id(){return `stmt${this.key}`}
    //
    constructor(name:string){
        super();
        //
        this.name = name;
    };
    //
    //Execute a statement and wait for the user to press the next button to proceed
    async run():Promise<void>{
        //
        //Get the compound element that matches this statement in the plan panel
        const anchor  = <HTMLDivElement> this.get_element(this.id);
        //
        //Highlight the element that matches this statement in the plan panel
        const span = anchor.querySelector('span');
        //
        //It is an error if there is no span tag under the anchor
        if (span===null)
            throw new schema.mutall_error('No span tag found under the anchor tag', anchor);
        //
        //Select the span element
        span.classList.add('selected');        
        //
        //Paint the interactions panel with elements related to this statement
        this.paint();
        //
        //Listen to the next button
        await new Promise(resolve=>{
            //
            //Get the next button from this page
            const next = this.get_element('next');
            //
            //Ad a click listener to teh button
            next.onclick = async()=>{
                //
                //Check the inputs. If they are valid, save them; only then can 
                //you resolve this process
                if (await this.check()) resolve(true);
            }
        });
        //
        //Check this statement in the plan panel
        //
        //Get the plan element that matches this statement
        const input = <HTMLInputElement|null>anchor.querySelector('input');
        //
        //If the input is not found, throw an exception
        if (input===null)
            throw new schema.mutall_error('No input element is found in the achor tag', anchor);
        //
        //Check the plane element
        input.checked = true;
    }
    //
    //Use the template desighed by ::kangara to paint this statement in the 
    //interactions panel
    paint():void{
        //
        //From kangara's template get the element that matches this statement
        //The id of the deired elements matches the name of the statements, e.g.,
        //stock, flow, question, etc.
        //
        //The name of the source of the template elements
        const from = this.constructor.name;
        //
        //The desctinamtion
        const to:[outlook.view, string] = [ranix.home, 'interaction'];
        //
        //Copy from the html elements the source to the destination, thus 
        //painting yhe intercations panel with content from the template
        ranix.template.copy(from, to);
        //
        //Initialize the ios on the ranix form, so that the data entry on the
        //form can be cchecked in real-time
        ranix.home.ios = ranix.home.get_ios();
    }
    //
    //List this statement in the steps panel, thus outlining the execution
    //plan.
    list_in_steps_panel():void{
        //
        //Get the plan's panel
        const plan:HTMLElement = ranix.plan;
        //
        //Create the anchor Div element identified by the id of this statement
        const div = this.create_element('div', plan);
        //
        //Add a read-only checkbox to the anchor tag
        this.create_element('input', plan, {type:'checkbox', disabled:true});
        //
        //Add a span tag with a friendly name of this step to the anchor
        this.create_element('span', plan, {textContent:this.name})
    }
    
    //The default check method, simply checks the inputs of the statement
    //on the ranix home page.
    async check():Promise<boolean>{
          //
          return await ranix.home.check_inputs();
    }
    
    //Collect layouts from the user inputs of the ranix form
    *collect_layouts():Generator<quest.layout>{
        yield* ranix.home.collect_layouts();
    }
    
    
}

//A statement for collecting car park data that can be saved to a database. 
//Flow and stock are questionnaires. Question is not.
export class questionnaire extends statement{
    //
    //When you initially create a stock (or flow), indicate that the stock
    //( or flow) lasts, until the user indicates otherwise
    public last:boolean=true;
    //
    constructor(name:string){
        super(name);
    }
    //
    //Tests if the current stock record is empty or not. It is empty when
    //there is no entry for a vehicle and that signals the end of the stock 
    //(or flow)taking process.
    is_empty():boolean{
        //
        //Access the car number registration io
        //
        //Get the registration anchor element
        const anchor: HTMLElement = ranix.home.query_selector('[data-cname="reg_no"]');
        //
        //Retrieve the car registration io
        let reg: io.io = io.io.get_io(anchor);
        //
        //If its value is null, the record is empty
        return (reg.value===null);
    };
    
    //Implement special checks for the questionnaire, i.e., stock or flow record. 
    //An empty form from a questionnaire statement is a signal to terminate the 
    //stock or flow  collection
    async check():Promise<boolean>{
      //
      //If the car registtaion is empty, then do not bother with input checks    
      if (this.is_empty()) return true;
      else{
          //The vehicle registration is not empty
          //
          //Check the inputs on the ranix form. If they fail, discontinue 
          //checks and return false
          if (!await ranix.home.check_inputs()) return false;
          //
          //Save the inputs and return the result
          return await this.save();
      }  
    }
    
    //Write the data in this questionnaire to a database
    async save(): Promise<boolean> {
        //
        //1.Get the layouts from the input questionnaire
        const layouts: Array<quest.layout> = [...this.collect_layouts()];
        //
        //2. Use the layout and the questionniare class to load the data to a
        //database returning the HTML error report or Ok.
        const result: 'Ok'|string = await server.exec(
                //
                //Use the questionnaire class to load the data
                "questionnaire",
                //
                //the only parameter required by the questionnaire is the array of
                //layouts
                [layouts],
                //
                //Use the more general version of load common that returns a html
                //output or Ok.
                "load_common",
                //
                //Calling the load common method with no input parameters
                []
        );
        //
        //3. Check the results on whether they were successful.If not successful,
        //report an error and return false to this method. If successful, return true
        if (result === "Ok") return true;
        //
        //Report the result as an error on the ranix form.
        ranix.home.report(true, result);
        //
        //The saving failed.
        return false;
    } 
    
    //Add to the user-input layouts, all those that are needed for safely
    //wring a flow or a stock to the database
    *collect_layouts():Generator<quest.layout>{
        //
        //Collect layouts from inputs defined on the ranix form
        yield *super.collect_layouts();
        //
        //Add the datetime layout of the entoty being considered
        const ename =this.constructor.name;
        yield ['ranix', ename, [], 'datetime', this.now()];
        //
        //Collect the layouts needed to link flows and stocks to a session,
        //an operator and the organization
        //
        //Collect the session; its time is defined when we start the data collection
        //excerice from teh ranix form
        yield ['ranix', 'session', [], 'datetime', ranix.home.session_datetime];
        //
        //Collect the operator. That depends on the user that is currently logged
        //in
        yield ['ranix', 'operator', [], 'username', app.app.current.user!.name];
        //
        //Yield the business; its part of the user defineition
        yield ['ranix', 'organizetion', [], 'name', app.app.current.user!.business!.id];
    }
    
}

//This class handles stock taking specific issues
export class stock extends questionnaire{
    //
    //Type of stock
    public  type:'Opening'|'Closing';
    //
    constructor(type:'Opening'|'Closing'){
        super(`Recording {type} Stock`);
        this.type= type;
    }
    
}

//This class handles flow specific issues
export class flow extends questionnaire{
    constructor(){
        super('Record Flow');
    }
} 

//
export class question extends statement{
    //
    //The question to ask
    public ask:string;
    //
    constructor(ask:string){
        super(ask);
        this.ask=ask;
    }
    //
    //The response; get it from the ranix form -- the io anchored at element
    //with id 'question'
    public get response():'yes'|'no'{
        //
        return <'yes'|'no'>ranix.home.get_value('question');
    }
}

