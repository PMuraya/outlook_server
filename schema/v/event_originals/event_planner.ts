//
//Resolve the reference to the app class
import * as app from "./app.js";
//
//Resolve the interface reference to the outlook class
import * as mod from "./module.js";
//
//Resolve the reference to the unindexed product(uproduct)
import * as outlook from "./outlook.js";
//
//Resolve the reference to the schema
import * as schema from "../../../schema/v/code/schema.js";
//
//Resolve references to the questionnaire
import * as quest from "../../../schema/v/code/questionnaire.js";
//
//Resolve the reference to the imerge structure
import * as lib from "../../../schema/v/code/library";
//
//Resolve the reference to the server class
import * as server from "../../../schema/v/code/server.js";
//The event planner class that allows a user to create schedules for events to support event
//planning.The user has a double chance of completing this information
class event_planner extends app.terminal implements mod.questionnaire {
	//
	//Access the main class and all its properties
	public writer: mod.writer;
	public messenger: mod.messenger;
	public accountant: mod.accountant;
	public scheduler: mod.scheduler;
	public cashier: mod.cashier;
	//
	//The business of the current user
	public business?: outlook.business;
	//
	//The description of an event
	public description?: string;
	//
	//The start date of an event
	public start_date?: string;
	//
	//The end date of an event
	public end_date?: string;
	//
	//Is the event a contributory?
	public contributory?: string;
	//
	//Is the event mandatory?
	public mandatory?: string; //"yes"|"no"
	//
	//The mandatory or optional contribution
	public contribution?: string;
	//
	// The name of the event is also the subject of the event
	public event_name?: string;
	//
	//The text associated with a message
	public text?: string;
	//
	//The amount set for a contributory event that is mandatory
	public mandatory_amount?: number;
	//
	//The mode of payment for a selected user
	public mode?: Array<string>;
	//
	//The amount a user decides to pay for an event i.e.,when an event is neither
	//mandatory nor a contributory
	public pay_amount?: number;
	//
	//The recursion value created in the job table
	public recursion?: string;
	//
	//The recursion data once the input
	public recursion_data?: mod.recursion;
	//
	//The user input upon scheduling an event
	public schedule?: "yes";
	//
	//The return value once scheduling is done
	public scheduled?: boolean;
	//
	//Informing the members about the event
	public inform?: string;
	//
	//The choice of making a payment
	public payment?: string;
	//
	//The status once a payment is done
	public paid?: boolean;
	//
	//The status once the message is sent to all the users
	public informed?: boolean;
	//
	//The return value after successful or failed posting
	public posted?: boolean;
	//
	//The array of textarea elements that contain the message of the job and the
	//recursion
	public textareas?: Array<HTMLInputElement>;
	//
	//The recipient returned once a user launches the page to get the type of
	//recipient
	public recipient?: lib.recipient;
	//
	//The constructor
	constructor(
		//
		//This is the parent page.
		//mother: outlook.page,
		//
       public app: app.app,
		//
		//It shows if this event was initialized from a messenger or not
		public is_from_messenger: boolean
	) {
		//
		//The general html is a simple page designed to support advertising as
		//the user interacts with this application.
		super(app, "../templates/evsent_form.html");
		//
        this.writer = new mod.writer();
		this.messenger = new mod.messenger();
		this.accountant = new mod.accountant();
		this.scheduler = new mod.scheduler();
		this.cashier = new mod.cashier();
	}
	//
	//Get the sender of a message.
	get_sender(): string {
		return this.app.user!.full_name!;
	}
	//
	//Get the body of the message
	get_body(): { subject: string; text: string } {
		return { subject: this.event_name!, text: this.text! };
	}
	//
	//The check method validated whether the data collected from the form is formatted correctly
	//Show warnings and errors where appropriate
	async check(): Promise<boolean> {
		//
		//1.0. Get all available inputs
		const ok = this.check_inputs();
		//
		//Do not continue if there is a failure in the checks
		if (!ok) return false;
		//
		//2.0. Save the collected inputs. At the very minimum, an event should have a name,
		//description, start_date, and end_date.
		const saved = await this.writer.save(this);
		//
		//Do not run any component if the saving was not successful
		if (!saved) return false;
		//
		//3.0. Schedule the event if necessary
		if (this.schedule === "yes") await this.schedule_event();
		//
		//4.0. Inform the members if necessary
		if (this.inform === "yes") await this.send_messages();
		//
		//5.0. Make payments if necessary
		if (this.payment) await this.make_payment();
		//
		//6.0 Update the book of accounts if necessary
		if (this.paid) await this.update_accounts();
		//
		//7.0 Return true is all the above processes were successful otherwise false
		return this.scheduled, this.informed!, this.paid, this.posted!;
	}
	//
	//Get all jobs when an event is selected
	get_activities(): Array<activity> {
		//
		//The array of jobs
		const activities: Array<activity> = [];
		//
		//1. Collect all the tr of the jobs table
		const trs: Array<HTMLTableRowElement> = Array.from(
			this.document.querySelectorAll("#cron>tbody>tr")
		);
		//
		//2. Retrieve the text areas inside each row. Each row has
		//two text panels whereby the first contains the message, and the second one contains the job
		for (let tr of trs) {
			//
			//2.1. retrieve the job number of the table
			const activity_name: string = this.get_activity_name(tr);
			//
			//2.2. Retrieve the jobs message in that row
			const activity_msg: string = this.get_activity_message(tr);
			//
			//2.3. Retrieve the command to execute on the server
			const command: string = this.get_command(tr);
			//
			//2.3. Retrieve the recursion of the activity
			const recur: mod.recursion = this.get_activity_recursion(tr);
			//
			//2.4. Compile the activity
			const activity = {
				activity_name: activity_name,
				command: command,
				message: activity_msg,
				recursion: recur,
				recipient: this.recipient!
			};
			//
			//2.5 Add the compiled job to the array of jobs
			activities.push(activity);
		}
		//{job_number:number, message:string, recursion:recursion,recipient:recipient}
		//
		//Return the array of activities
		return activities;
	}
	//
	//Get the name of the activity described in the table
	get_activity_name(tr: HTMLTableRowElement): string {
		//
		let activity_name: string;
		//
		//Get the first data value in the row
		const name: string = (<HTMLInputElement>(
			tr.querySelector(".name>label>.activity_name")!
		)).value;
		//
		//Check that the the activity name is provided and if its not empty, return
		//the name of the activity
		if (name.length !== 0) {
			activity_name = name;
		}
		//
		//Otherwise throw an error to indicate a missing activity name
		else {
			throw new schema.mutall_error(
				`The activity name for the activity at row number ${
					tr.rowIndex + 1
				}is missing`
			);
		}
		//
		//return the name of the activity
		return activity_name;
	}
	//
	//Get the file to execute on the server as part of the recursion
	get_command(tr: HTMLTableRowElement): string {
		//
		let file: string;
		//
		//Get the name of the file that contains the text to execute as part of
		//server-side execution
		const command: string = (<HTMLInputElement>(
			tr.querySelector(".command>label>.activity_name")
		)).value;
		//
		//Check that there is a command provided and if none is provided, throw an error
		if (command.length !== 0) {
			file = command;
		} else {
			throw new schema.mutall_error(
				`No command is provided for the activity in row ${tr.rowIndex + 1}`
			);
		}
		//
		//Return the collected command
		return file;
	}
	//
	//Get the messages attached to an activity name
	get_activity_message(tr: HTMLTableRowElement): string {
		//
		let msg: string;
		//
		//Get the table's textarea elements
		this.textareas = Array.from(tr.querySelectorAll("td>label>textarea"));
		//
		//Check that the message associated with an activity is present and
		//if its not, show the error.
		if (this.textareas[0].value.length !== 0) {
			msg = this.textareas[0].value;
		} else {
			throw new schema.mutall_error(
				`The message for the activity in row ${tr.rowIndex + 1} is missing`
			);
		}
		//
		//Return the job message
		return msg;
	}
	//
	//Get the recursion of the job as described in the job
	get_activity_recursion(tr: HTMLTableRowElement): mod.recursion {
		//
		//
		//Get the jobs recursion as the second text area cell element
		let recursion: string;
		//
		//Check to confirm that a recursion is present, and if none is provided, throw
		//an error to indicate its absence.
		if (this.textareas![1].value.length !== 0) {
			recursion = this.textareas![1].value;
		} else {
			throw new schema.mutall_error(
				`The recursion for the activity in row ${tr.rowIndex + 1} is missing`
			);
		}
		//
		//Convert the job to an at type
		const recursive: mod.recursion = JSON.parse(recursion);
		//
		//return the recursive job
		return recursive;
	}
	//
	//Schedule the event using the recursion of the crontab, the text provided,
	//and the name of the event???
	async schedule_event(): Promise<void> {
		//
		//1. Collect all the jobs
		// const activities: Array<activity> = this.get_activities();
		// //
		// //2.Use the jobs to collect the at commands
		// for (let activity of activities) {
		// 	//
		// 	//Use the jobs to determine whether we need a refresh or not
		// 	const refresh: mod.recursion = activity.recursion;
		// 	//
		// 	//IF the event is of type refresh, we need the start_date
		// 	if (refresh.repetitive === "yes");
		// }

		// //
		// //3. Use the jobs to determine whether we need a refresh or not
		// //
		// //4. Use the result of 2 and 3 to construct the cronjob(which must
		// //implement the crontab interface).
		//
		//Create a cronjob. get_cronjob is a class that implements the crontab interface
		const cronjob = new get_activities(this);
		//
		//5. Call the scheduler to execute this cron job and save the results into
		//the scheduled variable
		this.scheduled = await this.scheduler.execute(cronjob);
	}
	//
	//Update the book of accounts once the payment has completed
	async update_accounts(): Promise<void> {
		//
		//Post to the accounting tables
		this.posted = await this.accountant.post(
			new journal(
				this.business!,
				this.event_name!,
				this.start_date!,
				this.pay_amount!
			)
		);
	}
	//
	//Make the payment using the user's full_name, and the amount to be paid
	async make_payment(): Promise<void> {
		//
		//The payment once it has been processed
		this.paid! = await this.cashier.pay(
			new payment(this.app.user!.full_name!, this.pay_amount!)
		);
	}
	//
	//Send a message to inform the members of the event given the business, the event_name,and the description
	//of the event as the body
	async send_messages(): Promise<void> {
		//
		//Send the message with
		this.informed! = await this.messenger.send(
			new messenger(this.business!, this.event_name!, this.description!)
		);
	}
	//
	//Get the business primary key of the currently logged in user
	get_business(): outlook.business {
		return (this.business = this.app.user!.business!);
	}
	//
	//Get the amount paid by the users in the database. From this
	check_inputs(): boolean {
		//
		//1. Retrieve the event's compulsory inputs such as the name,
		// the description,and the start and end dates
		//
		//1.1. Get the Name of the event
		this.event_name = this.get_input_value("name");
		//
		//1.1.1. Check that the name of the event is provided
		if (this.event_name === undefined || null)
			//
			//Throw an exception if there is no event name provided
			throw new schema.mutall_error(
				"The event name is missing, add the event name to continue"
			);
		//
		//Think about error reporting for future development
		// this.get_element("name").classList.add(".error")
		//
		//1.2.The description of the event from the text area defining it
		const description: HTMLElement = this.get_element("description");
		//
		//1.2.1 Retrieve the description of this event
		this.description = (<HTMLInputElement>description).value;
		//
		//1.2.2. Perform the check to the description of the event to ensure that it is
		//provided and if not, throw an error
		if (this.description === undefined || null)
			throw new schema.mutall_error(
				"The description for the event is not provided.Provide a description for the event to continue"
			);
		//
		//1.3. Get the event's start date
		this.start_date = this.get_input_value("start_date");
		//
		//1.3.1 Check that the start_date of the event provided
		if (this.start_date === undefined || null)
			throw new schema.mutall_error(
				"The start date for the event is not provided, Provide it and continue."
			);
		//
		//1.4. Get the event's end date
		this.end_date = this.get_input_value("end_date");
		//
		//1.4.1. Confirm that the end _date of the event is provided
		if (this.end_date === undefined || null)
			throw new schema.mutall_error(
				"The end date for the event is not provided, Provide it and continue."
			);
		//
		//
		//Get the event's optional requirements
		//
		//1.5 Get the event's contributory amount. The only time this is selected
		//is when the event is a contributory and it is mandatory
		//
		// Get the user input if the event is a contributory or not
		this.contributory = this.get_checked_value("contributory");
		//
		//If the event is a contributory event, get the mandatory value whether
		//it is provided or not
		if (this.contributory === "yes") {
			//
			//Collect the user selection of whether the event should be of type mandatory...
			this.mandatory = this.get_checked_value("mandatory");
			//
			//... and if the contributory mandatory, get the mandatory contributory amount
			if (this.mandatory === "yes") {
				//
				//Get the mandatory contribution for all group members
				const mandatory = this.get_input_value("mandatory_amount");
				//
				//The regular expression to check whether the amount inserted is a
				//number(to make sure that only numbers are picked)
				const regex: string = mandatory.match(/\d+/g)![0];
				//
				//Convert the returned value to a number
				this.mandatory_amount = +regex;
				//
				//Check that the mandatory amount for the event is provided and it is a
				//number and if its not a number, throw an exception
				if (this.mandatory_amount === null || undefined || !regex)
					throw new schema.mutall_error(
						"The mandatory contributory amount is not a valid number, Provide a valid number by removing characters"
					);
			}
		}
		//
		//1.6. Get the contribution a user is willing to make given that the event
		//is neither a contributory nor a mandatory
		this.payment = this.get_checked_value("payment");
		//
		//Collect the feedback from the user to say they want to make a payment
		if (this.payment === "yes") {
			//
			//1.6.1. Get the mode of payment a user needs to make a payment
			this.mode = this.get_input_choices("mode");
			//
			//1.6.2. Get the amount of money a needed to make a payment
			const amount: string = this.get_input_value("paid_amount");
			//
			//1.6.3. Check whether the amount inserted is a number
			const num: string = amount.match(/\d+/g)![0];
			//
			//1.6.4. Convert the amount provided into a number
			this.pay_amount = +amount;
			//
			//1.6.5 Throw an exception when the no number is provided, if the number is
			//undefined, and if the input provided is not a number
			if (this.pay_amount === null || undefined || !num)
				throw new schema.mutall_error(`The amount to be paid does not
                 exist. Provide a number and ensure that the number does not contain special characters`);
		}
		//
		//1.8. Schedule the event on the condition that the user wants to schedule
		//an event
		//
		//1.8.1. Get the selected radio button
		const schedule: string = this.get_checked_value("scheduler");
		//
		//1.8.2. Retrieve the schedule of an event, and do it in a row by row manner
		if (schedule === "yes") {
			//
			//Get all activities selected by the user
			this.get_activities();
		}
		//
		//Get the user selected input on whether to inform the members of the event
		this.inform != this.get_checked_value("message");
		//
		//The user must provide an input on whether to inform members of this event
		if (this.inform === undefined || "")
			throw new schema.mutall_error(
				"No selection is made to either inform the users or not"
			);
		//
		//Return true When all the above conditions are fulfilled
		return true;
	}
	//
	//Make the create events template responsive by setting event handlers to the
	//selected inputs
	make_responsive() {
		//
		//Make the contribution panel respond to clicks when the event is not
		//a contributory...
		this.get_element("no_contribution").onclick = () => {
			this.show_panel("mandatory", false);
			//
			//Hide the payment panel when the user does not want to make a payment
			this.show_panel("make_payment", false);
		};
		//...the event is a mandatory contribution.
		this.get_element("with_contribution").onclick = () => {
			this.show_panel("mandatory", true);
			//
			//Show the mode of payment panel when the event is a contributory:-
			this.show_panel("make_payment", true);
		};
		//
		//Make the payment interface visible when the user wants to make a payment
		this.get_element("yes_payment").onclick = () => {
			this.show_panel("payment_modes", true);
		};
		//
		//Hide the payment interface hidden when the user does not want to make a payment
		this.get_element("no_payment").onclick = () => {
			this.show_panel("payment_modes", false);
		};
		//
		//Make the mandatory contribution panel visible and the panel to make the payment when the event
		//is a mandatory contribution...
		this.get_element("is_mandatory").onclick = () => {
			//
			//..show the panel to set the amount for the event
			this.show_panel("set_amount", true);
			//
			// and show the panel to make the payment
			this.show_panel("make_payment", true);
		};
		//
		//... and when the event is not a mandatory contribution..
		this.get_element("not_mandatory").onclick = () => {
			//
			//..hide the panel that is needed to set the amount
			this.show_panel("set_amount", false);
			//
			//and show the panel to for making a payment
			this.show_panel("make_payment", true);
		};
		//
		//Show the event table when a user wants to schedule an event...
		this.get_element("yes_schedule").onclick = () => {
			this.show_panel("scheduler", true);
		};
		//
		//...and when a user does not want to schedule an event
		this.get_element("no_schedule").onclick = () => {
			this.show_panel("scheduler", false);
		};
		//
		//Add a new event when the user click on the add more button
		const add_event = <HTMLButtonElement>this.get_element("add_event");
		add_event.onclick = () => this.add_table_row(add_event);
	}
	//
	//Get the layouts to save to the database. Should be a generator function
	get_layouts(): Array<quest.layout> {
		//
		//Create the layouts for the event table
		const event: Generator<quest.layout> = this.collect_event_layouts();
		//
		//Collect layouts for the activities
		const activities: Generator<quest.layout> = this.collect_activity_layouts();
		//
		//Collect layouts for the messages
		//const msg
		//
		//Collect layouts to effect accounting
		//
		//Collect layouts to effect payment
		//
		//Return the compiled layouts
		return [...event, ...activities];
	}
	*collect_event_layouts(): Generator<quest.layout> {
		//
		//The name of the event
		yield ["mutall_users", "event", [], "name", this.event_name!];
		//
		//The description of the event
		yield ["mutall_users", "event", [], "description", this.description!];
		//
		//The start date of the event
		yield ["mutall_users", "event", [], "start_date", this.start_date!];
		//
		//The end date of the event
		yield ["mutall_users", "event", [], "end_date", this.end_date!];
		//
		//Is the event a contributory
		yield ["mutall_users", "event", [], "contributory", this.contributory![0]];
		//
		//Is the event a mandatory
		yield ["mutall_users", "event", [], "mandatory", this.mandatory![0]];
		//
		//The mandatory contribution of an event
		yield ["mutall_users", "event", [], "amount", this.mandatory_amount!];
		//
		//The amount paid by a user, preferred
		// yield ["mutall_users", "event", [], "amount", this.pay_amount!];
	}
	//
	//Collect Layouts for the activities defined in the table
	*collect_activity_layouts(): Generator<quest.layout> {
		//
		//The name of the mutall users database
		const dbname: string = "mutall_users";
		//
		//The activity table name
		const tname: string = "activity";
		//
		//Collect all activities defined in the table
		const activities: Array<activity> = this.get_activities();
		//
		//Iterate through each activity creating the relevant layouts
		for (let activity of activities) {
			//
			//The name of the job associated with this input
			yield [dbname, tname, [], "name", activity.activity_name];
			//
			//The command associated with an activity
			yield [dbname, tname, [], "command", activity.command];
			//
			//The recursion of the activity
			yield [
				dbname,
				tname,
				[],
				"recursion",
				JSON.stringify(activity.recursion)
			];
			//
			//The event associated with these activities
			yield [dbname, tname, [], "event", this.event_name!];
			//
			//The recipients of the message if any?????
			// yield [dbname, tname, [], "recipients"];
		}
	}
	//
	//The show panels method is used for painting an output to the user
	async show_panels(): Promise<void> {
		//
		//Make the page responsive by making sure that all buttons respond according
		//to how you would want each of them to respond.
		this.make_responsive();
		//
		//Wire the payment button to make payments
		//
		//Set an event listener for the recipient buttons
		const receivers: Array<HTMLButtonElement> = Array.from(
			this.document.querySelectorAll(".recipient_type")
		);
		//
		//For each click, open the recipient type page
		receivers.forEach(element => {
			element.addEventListener("click", async () => {
				//
				//Instantiate the class that supports the selection of the type of recipient
               const recipient = new collect_recipient(this.app);
				//
				//After the selection of the type of user, the type of result is collected here
				const result = recipient.administer();
				//
				//
				if (result === undefined)
					throw new schema.mutall_error("No recipients provided");
				//
				this.recipient = await result;
			});
		});
	}
}
//
//This class opens a popup to collect the recipient of the message associated
//with an event, and return with either a business or an array of users
class collect_recipient extends outlook.popup<lib.recipient> {
	//
	public declare mother: app.app;
	//
	//The number of people contained in this group
	public grp_count?: Array<{ user: string; name: string }>;
	//
	//The function's constructor
   constructor(public app: app.app) {
		super("../templates/collect_recipient.html");
	}
	//
	//Get the result from this page
	async get_result(): Promise<lib.recipient> {
		return this.get_recipient();
	}
	//
	//Collect and check the type of recipient and data collected from the user
	get_recipient(): lib.recipient {
		//
		//Get the type of recipient
		const type: string = this.get_checked_value("recipient");
		//
		//If no selected value is provided, throw an exception
		if (type === undefined)
			throw new schema.mutall_error(`No selection is made
         on the type of recipient`);
		//
		//Get the business
		const business: outlook.business = this.app.user!.business!;
		//
		//Get the user added to the list of chosen recipients
		//
		//Get the chosen recipients panel
		const panel = <HTMLDivElement>this.get_element("chosen");
		//
		//Get all selected inputs of type checkbox
		const values = Array.from(panel.querySelectorAll('input[type="checkbox"]'));
		//
		//Retrieve the user primary key as the value from the selected elements
		const user: Array<string> = values.map(pk => (<HTMLInputElement>pk).value);
		//
		//
		return type === "group"
			? { type: "group", business }
			: { type: "individual", user: user };
	}
	//
	//Collect and check the recipient data as provided by the user
	async check(): Promise<boolean> {
		//
		//Get and check the recipients
		this.result = this.get_recipient();
		//
		//
		return true;
	}
	//
	//Listen to changes to the individual and group panels and set the number of people
	//to recieve the message
	get_count() {
		//
		//Get the chosen recipient's panel
		const chosen = <HTMLDivElement>this.document.querySelector(".recipients");
		//
		//Get the panel that contains the potential reach of the recipients
		const reach = <HTMLDivElement>this.get_element("count");
		//
		//Listen to changes in the number recipients selected
		chosen.onchange = () => {
			//
			//Clear the contents the panel
			reach.innerHTML = "";
			//
			//Get all the inputs contained in the panel
			const recipients: Array<HTMLInputElement> = Array.from(
				this.document.querySelectorAll("#chosen>label>input")
			);
			//
			//Add the number of people who are selected
			this.create_element(reach, "p", {
				textContent: `${recipients.length}`
			});
		};
	}
	//
	//Make the recipient's panel responsive
	make_responsive() {
		//
		//Add click event listeners to each button
		this.get_element("individual").onclick = () => {
			//
			//Populate the all users panel with all the users
			this.populate_recipients("all");
			//
			//Reveal the all users panel
			this.show_panel("users", true);
		};
		//
		//Add a click event listener to the group type of user in order to hide
		//the all users and chosen users panel
		this.get_element("group").onclick = () => {
			this.show_panel("users", false);
		};
	}
	//
	//Get the names of the people to receive the message and their names
	async get_reach(): Promise<number> {
		//
		//The query to fetch all users and their primary key
		const query: string = `select
                            user.user,
                            user.name
                        from user
                            inner join member on member.user=user.user
                            inner join business on member.business= business.business
                        where business.id= '${this.app.user!.business!.id}'
                            and user.name is not null
                        `;
		//
		//Get the user name and the associated user primary key
		this.grp_count = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[query]
		);
		//
		//Extract the number of people in the group
		return this.grp_count.length;
	}
	//
	//Populate a fieldset with all users with checkboxes before their names to support
	//selection of individual recipients
	async populate_recipients(div_id: string): Promise<void> {
		//
		//Get the div to insert all the user names
		const div = this.get_element(div_id);
		//
		//Check if it is a valid div
		if (!(div instanceof HTMLDivElement))
			throw new Error(`The element identified by ${div_id} is not valid`);
		//
		//Go through the checkboxes and populate each one of them with a label followed by
		//an input of type checkbox
		for (let check of this.grp_count!) {
			//
			//Destructure to obtain the values
			const { user, name } = check;
			//
			//Create the label that will hold the input
			const label = this.create_element(div, "label", {});
			//
			//Create the check box
			this.create_element(label, "input", {
				type: "checkbox",
				value: `${user}`
			});
			//
			//Add the text beside the checkbox
			label.innerHTML += name;
		}
	}
	//
	//The show panels method allows the user to interact smartly with this page
	async show_panels(): Promise<void> {
		//
		//Make the panel respnsive
		this.make_responsive();
	}
}
//
//Create the messenger needed to get the optional message interface in the event
//planner for sending messages.
class messenger implements mod.message {
	//
	//the body of the message is the description to the event
	public description: string;
	//
	//The subject of the message is the event's name
	public event_name: string;
	//
	//The business
	public business: outlook.business;
	constructor(
		business: outlook.business,
		description: string,
		event_name: string
	) {
		this.description = description;
		this.event_name = event_name;
		this.business = business;
	}
	//
	//Get the technology to send the event's message
	get_technology(): Array<"phpmailer" | "twilio" | "mobitech"> {
		return ["phpmailer"];
	}
	//
	//The contents of the message before sending the message
	get_content(): { subject: string; body: string } {
		return { subject: this.event_name, body: this.description };
	}
	//
	//The business of the logged in user
	get_business(): outlook.business {
		return app.app.current.user!.business!;
	}
	//
	//Get the recipient of the message
	get_recipient(): lib.recipient {
		//
		//Get the type of the user currently selecting the message
		return { type: "group", business: this.business };
	}
}
//
//Create the payment class to get the optional payments set in the event planner
class payment implements mod.money {
	//
	//The amount of money to be paid from the event
	public pay_amount: number;
	//
	//The full name of the user in order to extract the telephone number from the database
	public full_name: string;
	//
	//Constructor
	constructor(full_name: string, pay_amount: number) {
		this.full_name = full_name;
		this.pay_amount = pay_amount;
	}
	//
	//Get the amount associated with a transaction
	get_amount(): number {
		return this.pay_amount;
	}
	//
	//Get the user's name
	get_fullname(): string {
		return this.full_name;
	}
}
//
//Collect all metadata associated with an activity, namely, its name, command, message
//recursion, and recipient.
interface activity {
	//
	activity_name: string;
	command: string;
	message: string;
	recursion: mod.recursion;
	recipient: lib.recipient;
}
//
//The scheduler class that creates the optional scheduler when creating an event
class get_activities implements mod.crontab {
	//
	//Rebuild the at jobs based on the users choice to have non-repetitive activities
	private rebuild?: boolean;
	//
	//Activities extracted from the planner
	public activities: Array<activity>;
	//
	//constructor
	constructor(public planner: event_planner) {
		this.activities = planner.get_activities();
	}
	//
	//Refresh the crontab from the user selected input.We need a refresh if
	//there is at least one cron job whose start is earlier
	//than today or equal to now and the end_date must be greater than now
	refresh_crontab(): boolean {
		//
		//
		//Get the current date and find whether we have a crontab that is
		//0repetitive
		return true;
	}
	//
	//Get the at commands from all the current jobs.NB: A non-repetitive job yields
	//only one at command and a repetitive job yields two at commands.The dates
	//for all at commands must be greater than now.
	get_at_commands(): Array<lib.at> {
		//
		//
		return [...this.collect_at_commands()];
	}
	//
	//Use a generator function to collect the at commands needed for the execution of
	//of one-off events.
	*collect_at_commands(): Generator<lib.at> {
		//
		//From the array of collected jobs,find the repetitive and non-repetitive jobs
		for (let activity of this.activities) {
			//
			//Check that the type of at command originates from a...
			switch (activity.recursion.repetitive) {
				//
				//Message and compile the date,message, and the type of recipient
				case "no":
					//
					//Compile the output to an object
					yield {
						type: "message",
						datetime: activity.recursion.send_date,
						message: activity.message,
						recipient: activity.recipient
					};
					break;
				//
				// Refresh and compile the start_date and the end_date
				case "yes":
					//Compile the cronjob refresh at jobs
					yield {
						//
						//the event type
						type: "refresh",
						//
						//The start date of the event
						datetime: activity.recursion.start_date
					};
					yield {
						//
						//the event type
						type: "refresh",
						//
						//The end date of the cronjob
						datetime: activity.recursion.end_date
					};
					//
					break;
			}
		}
	}
	//
	//Check the collected at jobs and if there is some non repetitive job, refresh it
	refresh_atjobs(): boolean {
		//
		//From the array of collected jobs, check for non-repetitive activities
		for (let activity of this.activities) {
			//
			//Check that there is at least one activity that is present and
			//if none of the activities is non-repetitive,don't collect the at jobs
			this.rebuild = activity.recursion.repetitive === "no" ? true : false;
		}
		//
		//Return the status needed to rebuild the atjobs
		return this.rebuild!;
	}
	//
	//Get the name of the job given that the job name is non-repetitive
	get_job_name(): string {
		//
		//Analyze all the jobs and for the repetitive non-repetitive jobs, retrieve the name of
		//the job
		const name: Array<string> = this.activities.map(activity => {
			//
			//Retrieve the name of the selected job
			const name: string = activity.activity_name;
			//
			//Return the job name
			return name;
		});
		//
		//Return the name of the listed job
		return name[0];
	}
}
//
//The journal class that implements the optional posting in the event planner
class journal implements mod.journal {
	//
	//The business of the current user
	public business: outlook.business;
	//
	//The purpose of the transaction is the event's subject
	public event_name: string;
	//
	//The date of the payment is the date while setting the event??
	public start_date: string;
	//
	//The amount is the input provided on the amount
	public pay_amount: number;
	//
	//constructor
	constructor(
		business: outlook.business,
		event_name: string,
		start_date: string,
		pay_amount: number
	) {
		this.business = business;
		this.event_name = event_name;
		this.start_date = start_date;
		this.pay_amount = pay_amount;
	}
	//
	//Get the id of the current business
	get_business_id(): string {
		return this.business.id;
	}
	//
	//Define the journal entry of the transaction by defining the refrence number,
	//purpose of the transaction, the date, and the amount involved in the transaction
	get_je(): {
		ref_num: string;
		purpose: string;
		date: string;
		amount: number;
	} {
		//
		//Create the reference number as a concatenation of start_date and the amount paid
		const ref: string = this.start_date + this.pay_amount;
		//
		//return the obtained value
		return {
			ref_num: ref,
			purpose: this.event_name,
			date: this.start_date,
			amount: this.pay_amount
		};
	}
	//
	//Credit the account set to be credited
	get_credit(): string {
		return this.event_name;
	}
	//
	//Debit the account needed for the transaction
	get_debit(): string {
		return this.event_name;
	}
}
