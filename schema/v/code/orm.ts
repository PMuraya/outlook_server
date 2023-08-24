//The auto-generated file from mutall_users database
//
import * as outlook from "../../../outlook/v/code/outlook.js";
//
//Support for javascript/php communication
import * as server from "./server.js";
//
//Support for database writing
import * as quest from "./questionnaire.js";
//
//Access to the database schema
import * as schema from "./schema.js";
//
//Access to the tuple system for shared methods 
import * as tuple from "./tuple.js";

//Extend the messaging system with a sheduler
import * as scheduler from "./event/event.js";

//Get the static structure of a database
const Itracker = await server.exec('database', ['mutall_tracker'],'export_structure', []);

//The one point from which we can access the auto-generated object-relational 
//mapping. This is important for supporting pointers
export namespace databases{   
    //
    //To support management of all users of  mutall applications  
    export namespace mutall_user{

        class business extends tuple.tuple{
            //
            public ready:keyof typeof this.columns='names';
            //
            //Business construction
            constructor(public name:string, public id:string){
                super(mutall_user, 'business');
            }
        }

        //The user auto-generated class
        export class user extends tuple.tuple{
            
            //The coonstrucor arguments are derived fom teb relational model
            constructor(public name:string, public email:string){
                //
                //Compile the feed for the parent tuple from the inputs
                const feed:tuple.feed<user> = {type:'ready', data:{name, email}};
                //
                //Initialize the tuple  
                super('mutall_users', 'user', feed);
            }
            //
            *collect_layouts():Generator<quest.layout>{
                //
                yield [this.dbname, this.ename, [], 'name', this.name];
                yield [this.dbname, this.ename, [], 'email', this.email];
            }

            //Convert the ready feed for this tuple to scalars
            convert_2_writer():tuple.writer<tuple.tuple>{
                //
                //The ready forms of a business are the same as the basic version
                return {name:this.name, email:this.email}
            }
            
            //
            convert_reader_2_edit(b:tuple.reader<user>):tuple.edit<user>{
                //
                return {
                    name: b.name,
                    email: b.email
                }
            }
        }

        //The msg class supports management of a nessage tuplke filed with data from
        //one record
        export class msg extends tuple.tuple{
            //
            //The primary key
            msg:tuple.pk|null=null;
            //
            //Mandatory properties
            subject:string|null=null;
            text:string|null=null;
            date:Date|null=null;//Note that Date is not a basic type
            user:user|null=null;//Note that user is a tuple
            business:business|null=null;
            //
            //Optional properties
            child_of?:msg|null;//When this message is a reply, here is the original one
            language?:string|null; //The language of communication (reuired for some apps)
            event?:event|null=null //The event, if any, associated with the message
            //
            constructor(feed:tuple.feed<msg>){
                //
                //Construct the parent tuple. use the globally available mutall user 
                //dataabse to get the desired entity
                super('mutall_users', 'msg', feed);
            }

            //Convert a ready msg to scalars (for saving to a database)
            convert_2_writer():tuple.writer<msg>{
                //
                //Check whether the priperteis of this tuple are set
                if (
                    (this.subject===null) 
                    || (this.text===null)
                    ||(this.date===null)
                    ||(this.user===null)
                    ||(this.business === null)
                )    
                    throw new schema.mutall_error('The properties of this tuple are not set yet. Consider calling fetch()');
                //
                //The ready forms of a business are the same as the basic version
                return {
                    msg:this.msg===null ?  undefined : this.msg.value,
                    //
                    subject:this.subject, 
                    text:this.text,
                    //
                    //
                    //Convert date to a format suitable for saving in Mysql 
                    date:outlook.view.standardise_date(this.date),
                    //
                    //The user and bsuiness are foreign keys. If their primary keys are
                    //erroneous, then throe the error; otherwise retitn their primary
                    //key values. Note how throw in an IIFE function is treated as an 
                    //expression
                    user:(this.user.pk instanceof Error) ? (()=>{throw this.user.pk})() : this.user.pk.value, 
                    business:(this.business.pk instanceof Error) ? (()=>{throw this.business.pk})() : this.business.pk.value 
                }
            }

            //
            //Be guided by the entity columns to collect the layouts
            *collect_layouts():Generator<quest.layout>{
                //
                //Yielding from the mandatory attributes
                yield [this.dbname, this.ename, [], 'subject', this.subject];
                yield [this.dbname, this.ename, [], 'text', this.text];
                //
                //Convert dates before you can use them
                const date: string = outlook.view.standardise_date(this.date!); 
                //
                yield [this.dbname, this.ename, [], 'date', date];
                //
                //Yielding from the foreign keys
                yield *this.user!.collect_layouts();
                yield *this.business!.collect_layouts();
                //
                //Yield from optional columns
                if (this.child_of !==undefined) yield *this.child_of!.collect_layouts();
                if (this.language!==undefined) yield [this.dbname, this.ename, [], 'language', this.language];
                //if (this.event!==undefined) yield *this.event.collect_layouts();
            }
            
            //Convert a basic message to a ready version
            async convert_reader_2_edit(b:tuple.reader<msg>):Promise<tuple.edit<msg>>{
                //
                //Compile and return the ready feed
                return {
                    msg:this.decode_pk_str(b.msg),
                    subject: b.subject,
                    text: b.text,
                    //
                    //Special case of date conversion
                    date: new Date(String(b.date)),
                    //
                    //See how pointers ar handled. Note the casting of the data: key
                    user:new user({type:'friend', data:b.user!}),
                    business: new business({type:'friend', data:b.business!}),
                    //
                    //The language of communication (is required for some apps)
                    language: b.language,
                    //
                    //The original message (in the case of a reply)
                    child_of: b.child_of===undefined ? undefined: new msg({type:'friend', data:b.child_of!}),
                    //
                    //The event, if any, associated with the message
                    event: b.event===undefined ? undefined: new event({type:'friend', data:b.event}) 
                }
            }
        }

        //The root class of all events and activities
        export abstract class plan extends tuple.tuple{
            //
            //The identify of the business that this plan is linked to.
            business_id:string|null=null;
            //
            //The (local) plan name identifier
            name:string|null = null;
            //
            //Use a unique identifier (for referencing this plan in a database) to create
            //a plan.
            constructor(ename: schema.ename, feed:tuple.feed<plan>){
                //
                //Initialize a tuple requires the user datanse, the entity name, and the
                //the input data, i.e., feed.
                super('mutall_users', ename, feed);
            }
            
            
            //Initiating an even plan. This is not an auto-generated method
            //If a plan is previously saved (indirectly), then, re-saving is not 
            //necessary. The default is that it is necessary
            async initiate(saved:boolean=true): Promise<void>{
                //
                //Save the activity to the database, if necessary
                if (!saved) await  this.save();
                //
                //Collect all the scheduling entries of this plan
                const entries:Array<scheduler.entry> = [...this.collect_entries()]; 
                //
                //Create the at and crontab schedulers
                const schedulers:Array<scheduler.scheduler> = [
                    new scheduler.at_scheduler(entries), 
                    new scheduler.crontab_scheduler(entries)
                ];
                //
                //For each one of the schedulers:-
                for(const scheduler of schedulers){
                    //
                    //Test if it is necessary to refresh the scheduler. If it is, then rebuild
                    //the crontab files or re-issue at commands on the server.
                    if (scheduler.refresh_is_necessary()) await scheduler.refresh();
                }
            }

            //Collect crontab and at entries for scheduling a plan
            abstract collect_entries():Generator<scheduler.entry>;
            
            //Collect the identifier layouts that are defined in this plan
            *collect_layouts(): Generator<quest.layout>{
                //
                //Yield the bsuiness id
                yield [this.dbname, 'business', [], 'id', this.business_id];
                //
                //Yield the acitvity name
                yield [this.dbname, this.ename, [], 'name', this.name];
            }
            
            
            //Cancel suspends the identified plan from execution, to be re-initiated at 
            //a later time. It is an error if the identified plan is not running. 
            //Cancelling simply means marking this plan as canceled (in teh database) and 
            //re-initiating it.
            async cancel(pk:number):Promise<void>{
                //
                //Mark (in the database) the identified plan as canceled
                await this.mark_as_canceled(pk);
                //
                //Initiate scheduling, without having to save this plan
                await this.initiate(false);
            }
            
            //Mark this plan as canceled
            async mark_as_canceled(pk:number):Promise<void>{
                //
                //Get the 'cancel' column
                const cancel:schema.column = this.entity.columns['canceled'];
                //
                //Formulate the sql for performing an update
                const sql:string = `
                    update
                        #The fully qualified name of the entity
                        ${this}
                    set
                        ${cancel}=1
                    where    
                        ${this}=${pk}
                `;
                //
                //Execute the update sql
                await server.exec(
                    //
                    //Database is the class to use for executing the sql
                    'database',
                    //
                    //The database to acces is mutall users
                    [this.dbname],
                    //
                    //The method to exceute is 'query'
                    'query',
                    //
                    //The sql to run
                    [sql]
                );
            }
        }

        //This class represents the actvities planned to take place within an event.
        export abstract class activity extends plan{
            //
            //The Unix command to execute
            cmd:string|null = null;
            //
            constructor(ename:schema.ename, feed:tuple.feed<activity>){
                super(ename, feed);
            }
            
            //Collect as many the layouts of an activity as the constructor suggests
            *collect_layouts():Generator<quest.layout>{
                //
                //Collect the activity name. Use the this activity's name as teh alias
                yield [this.dbname, this.ename, [this.name], 'name', this.name];
                //
                //Collect the linux command
                yield [this.dbname, this.ename, [this.name], 'cmd', this.cmd];
            }
            
        }

        //This represents a plan of an activity that is executed only once, on the 
        //given date and venue
        export class once extends activity{
            //
            //The primary key value must be generated for non-abstract tuples
            once:tuple.pk|null=null;
            //
            //What is the date of the event
            date:Date|null=null;
            //
            //The venue, if any, where the event will take place
            venue?:string|null;
            //
            constructor(feed:tuple.feed<once>){
                super('once', feed);
            }

            //Convert the ready feed for this tuple to scalars for purpose of saving to
            //a database
            convert_2_writer():tuple.writer<once>{
                //
                //Check whether the ready properties of this tuple are set
                if (
                    //Properties from ancestors
                    (this.name===null)
                    || (this.business_id===null)
                    || (this.cmd===null)
                    //
                    //Local properties
                    || (this.date===null) 
                    || (this.venue===null)
                )
                    throw new schema.mutall_error('The properties of this tuple are not set yet. Consider calling fetch()');
                //
                return {
                    //
                    //The special case of the primary key. If it is known, then return 
                    //its value; otherwise it is undefiend
                    once:this.once===null ?  undefined : this.once.value,
                    name:this.name,
                    business_id:this.business_id,
                    cmd:this.cmd,
                    date:outlook.view.standardise_date(this.date), 
                    venue:this.venue
                }
            }


            //Collect layouts for this plan
            *collect_layouts():Generator<quest.layout>{
                //
                //Collect the layouts for the parent activity
                yield *super.collect_layouts();
                //
                //Ensure thyat the date is a suitable for writing
                //to the mysql  database. Hint:use teh Luxon library
                const date: string = outlook.view.standardise_date(this.date!);
                //
                //Yield the start date. 
                yield [this.dbname, this.ename, [this.name], 'date', date];
                //
                //Collect the venue, if it is defined
                if (this.venue!==undefined)
                    yield [this.dbname, this.ename, [this.name], 'venue', this.venue];
                        
            }    
            
            //A perform once activity yields only one entry, if the date is creater or 
            //equal to now
            *collect_entries():Generator<scheduler.entry>{
                //
                if (this.date!.getDate()>=Date.now())
                    yield new scheduler.at_entry(this.cmd!, this.date!);
            }
            //
            //Convert a basic to a ready one feed
            convert_reader_2_edit(data:tuple.reader<once>):tuple.edit<once>{
                //
                //Get the primary key. What if this is a new record?
                const once = this.once!;
                //
                const business_id: string = data.business_id;         
                //
                const name:string = data.name;
                //
                const cmd:string= data.cmd;
                //
                //The (mysql) date string must be converted to the Js format
                const date:Date = new Date(data.date);
                //
                //Note how (basic) null values are converted to raedy (undefined) versions
                const venue:string|undefined = data.venue===null ? undefined: data.venue;
                //
                //Compile and return the ready 'once' feed
                return {once, business_id, name, cmd, date, venue};
            }
            
        }

        //This represents an activity planned to repeat at desired intervals that are
        //specified using a crotab style.
        export class repetitive extends activity{
            //
            //The primary key value
            repetitive:tuple.pk|null=null;
            //
            //A coded description of when the activity planed to be repeated, 
            //captured as a crontab entry. E.g., 
            //  1 * * * *
            //describes an activity repeats daily in the 1st minute of every hour
            frequency:string|null=null;
            //
            //The date/time when the activity is planned to start. The default is now
            start_date:Date|null=null;
            //
        //The end date/time when the activity is planned to end. The defaut is end of time
            end_date:Date|null = null;
            //
            constructor(feed: tuple.feed<repetitive>){
                super('repetitive', feed);
            }

            //Convert the ready feed for this tuple to scalars for purpose of saving to
            //a database
            convert_2_writer():tuple.writer<repetitive>{
                //
                //Check whether the ready properties of this tuple are set
                if (
                    //Properties from ancestors
                    (this.name===null)
                    || (this.business_id===null)
                    || (this.cmd===null)
                    //
                    //Local properties
                    || (this.start_date===null)
                    || (this.end_date===null) 
                    || (this.frequency===null)
                )
                    throw new schema.mutall_error('The properties of this tuple are not set yet. Consider calling fetch()');
                //
                return {
                    //
                    //The special case of the primary key. If it is known, then return 
                    //its value; otherwise it is undefiend
                    repetitive:this.repetitive===null ?  undefined : this.repetitive.value,
                    name:this.name,
                    business_id:this.business_id,
                    cmd:this.cmd,
                    start_date:outlook.view.standardise_date(this.start_date), 
                    end_date:outlook.view.standardise_date(this.end_date), 
                    frequency:this.frequency
                }
            }
            //Collect layouts for this repetitive activity
            *collect_layouts():Generator<quest.layout>{
                //
                //Collect the layouts for the parent activity
                yield *super.collect_layouts();
                //
                //Ensure thyat the start and dates are a suitable for writing
                //to the mysql  database before yileding them. Hint:use the Luxon library
                const start_date: string = outlook.view.standardise_date(this.start_date!);
                yield [this.dbname, this.ename, [this.name], 'start_date', start_date];
                //
                const end_date: string = outlook.view.standardise_date(this.end_date!);
                yield [this.dbname, this.ename, [this.name], 'end_date', end_date];
            }
            
            //Convert a repetive basic event to an editable version
            convert_reader_2_edit(record: tuple.reader<repetitive>):tuple.edit<repetitive>{
                //
                //set the primary key
                const repetitive:tuple.pk = this.decode_pk_str(record.repetitive);
                //
                //The business id needs no conversion
                const business_id: string = record.business_id;
                //
                //The first 3 parameters need no conversion        
                const name:string = record.name;
                const cmd:string = record.cmd;
                const frequency:string = record.frequency;
                //
                //Date (strings) do need conversion to JS equivalents
                //
                const start_date:Date = new Date(record.start_date);
                const end_date:Date = new Date(record.end_date);
                //    
                //Return the repetitive entity
                return {repetitive, business_id, name, cmd, frequency, start_date, end_date};
            }

            //A repetitive event yields at most 3 entries: 2 at and one crontab
            //entries
            *collect_entries():Generator<scheduler.entry>{
                if (this.start_date!>=new Date()) 
                    yield new scheduler.at_entry('refresh_crontab.php', this.start_date!);
                //    
                if (this.end_date!>=new Date()) 
                    yield new scheduler.at_entry('refresh_crontab.php', this.end_date!);
                //    
                if (this.start_date!<new Date() && this.end_date!>new Date()) 
                    yield new scheduler.crontab_entry(this.cmd!, this.frequency!);
            }
        }

        //The plan of an event
        export class event extends plan{
            //
            //Simple attributes owned by event
            //
            //When the event starts; the default value is today
            start_date:Date|null=null;
            //
            //The end date is, end_of_time, i.e., 9999-12-31 00:00
            end_date:Date|null=null;
            //
            //The special case of pointer; they are not part of the basic system. They 
            //are initialized in teh constructor  
            activity:tuple.pointer<activity>;
            //
            constructor(feed:tuple.feed<event>){
                super('event', feed);
                //
                //Initialize the activity pointer.
                this.activity = new tuple.pointer(activity, this);
            }

            //Convert this ready event to a scalar fit for saving to a database
            convert_2_writer():tuple.writer<event>{
                //
                //Check whether the scalar properteis of scalar tuple are set
                if (
                    (this.name===null)
                    ||(this.business_id===null)
                    ||(this.start_date===null) 
                    ||(this.end_date===null)
                )
                    throw new schema.mutall_error('The properties of this tuple are not set yet. Consider calling fetch()');
                //
                //The ready forms of a business are the same as the basic version
                return {
                    name:this.name, 
                    business_id:this.business_id,
                    start_date:outlook.view.standardise_date(this.start_date), 
                    end_date:outlook.view.standardise_date(this.end_date)
                }
            }
            
            //
            //Convert the basic to ready feed for an event. Note: pointers do not 
            //feature in the basic data
            convert_reader_2_edit(data:tuple.reader<event>):tuple.edit<event>{
                //
                //One of the external fields needed for identifying an event
                const business_id:string = data.business_id;
                //
                //The name of the event
                const name:string = data.name;    
                //
                //Convert date strings, e.g., '2022-05-01 00:00' to a Javascript date
                //objects
                const start_date: Date = new Date(data.start_date);
                const end_date: Date = new Date(data.end_date);
                //
                //Compile all the properties of a ready event
                return {business_id, name, start_date, end_date};
            }
            
            //
            //Collect plan entries for scheduling tasks of this event
            *collect_entries():Generator<scheduler.entry>{
                //
                //If the activity is null, it means we have not set it to any value since
                //we started. This implies that the user needs to fetch the pointer's data
                if (this.activity.members===undefined) 
                    throw new schema.mutall_error('Fetch the pointer data befoer you can use its members')
                //
                //Loop through all the (populated)activities to yield scheduling entries
                for(const activity of this.activity.members){
                    yield *activity.collect_entries();
                }
            }
            
            //Collect the layouts of an event (including those of the activities under
            //that event)
            *collect_layouts():Generator<quest.layout>{
                //
                //Collect the layouts of the ANCESTOR (plan)
                yield *super.collect_layouts();
                //
                //Yield the layouts that are specific to THIS plan
                //
                //Ensure thyat the start and dates are a suitable for writing
                //to the mysql  database before yileding them. Hint:use the Luxon library
                const start_date: string = outlook.view.standardise_date(this.start_date!);
                yield [this.dbname, this.ename, [this.name], 'start_date', start_date];
                //
                const end_date: string = outlook.view.standardise_date(this.end_date!);
                yield [this.dbname, this.ename, [this.name], 'end_date', end_date];
                //
                //Yield the layout associated with a pointer
                yield this.activity.get_table_layout();
                
            }
        }

    }

    //Database for tracking interns: their personal details, annual plans and accounts
    export namespace mutall_tracker{
        //
        //Construct the tracker datanase in the schema namsepace
        const dbase = new schema.database(Itracker);
        //
        //The intern's personal details
        export class intern extends tuple.tuple{
            //
            declare calc:{
                name:string,
                email:string
            };
            //
            constructor(feed:tuple.feed<intern>){
                super(dbase, databases, 'intern', feed);
            }

        }
    }
}