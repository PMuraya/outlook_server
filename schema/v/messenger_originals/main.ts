//
//Resolve the reference to the unindexed product(uproduct)
import * as outlook from "../../../outlook/v/code/outlook.js";
//
//Resolve the reference to the app class
import * as app from "../../../outlook/v/code/app.js";
//
//Resolve the reference to the server class
import * as server from "../../../schema/v/code/server.js";
//
//Resolve the reference to the imerge structure
import * as lib from "../../../schema/v/code/library";
//
//Resolve the reference to the merger class
import merger from "../../../outlook/v/code/merger.js";
//
//Resolve the interface reference to the outlook class
import * as mod from "../../../outlook/v/code/module.js";
//
//Resolve the reference to the schema
import * as schema from "../../../schema/v/code/schema.js";
//
//Resolve references to the questionnaire
import * as quest from "../../../schema/v/code/questionnaire.js";
//
//Resolve the reference to the theme
import * as theme from "../../../outlook/v/code/theme.js";
//
//This is to support the data collect for scheduling repetitive events using the
//crontab
//type cronjob = { minute: string, hour: string, day_of_month: string, month: string, day_of_week: string }
//
//A recursion is composed of data such as the minute,hour,day of the month,month,and
//the day of the week
// type recursion =
//     { repetitive: 'no', send_date: string } |
//     { repetitive: 'yes', start_date: string, end_date: string, frequency: string }
//
//Testing non-repetitive tasks
//
//A message has the following structure, the primary key,subject,text,date created, and the user
//the message originated from
// type message = {
// 	pk: string;
// 	subject: string;
// 	text: string;
// 	date: string;
// 	user: string;
// };
class test implements mod.questionnaire, mod.crontab {
	//
	constructor() {}
	//
	//Decide if we want to build a new crontab or not
	refresh_crontab(): boolean {
		return false;
	}
	refresh_atjobs() {
		return true;
	}
	//
	//Get the name of the job provided
	get_job_name(): string {
		return "";
	}
	//
	//Collect all "at" commands that are necessary for scheduling jobs
	get_at_commands(): Array<lib.at> {
		//
		const refresh: lib.at = {
			type: "message",
			datetime: "2022-11-18",
			message: "Hello This is a mutall at scheduler test",
			recipient: { type: "individual", user: ["1269"] }
		};
		//
		return [refresh];
	}
	//
	//Return a collection of layouts to be used by the questionnaire for saving
	get_layouts(): Array<quest.layout> {
		//
		const crontab: mod.recursion = {
			repetitive: "no",
			send_date: "2022-12-18"
		};
		console.log(JSON.stringify(crontab));
		return [
			[
				"mutall_users",
				"activity",
				[],
				"msg",
				"Hello This is a mutall at scheduler test"
			],
			["mutall_users", "activity", [], "name", "mutall_attest"],
			["mutall_users", "activity", [], "command", ""],
			["mutall_users", "activity", [], "recursion", JSON.stringify(crontab)]
		];
	}
}
//
//Main application that supports all the application, services, and tests, developed
//for this class
export default class main extends app.app {
	//
	public writer: mod.writer;
	public messenger: mod.messenger;
	public accountant: mod.accountant;
	public scheduler: mod.scheduler;
	public cashier: mod.cashier;
	//
	//Initialize the main application.
	constructor(config: app.Iconfig) {
		super(config);
		//
		this.writer = new mod.writer();
		this.messenger = new mod.messenger();
		this.accountant = new mod.accountant();
		this.scheduler = new mod.scheduler();
		this.cashier = new mod.cashier();
	}
	//
	//Returns all the inbuilt products that are specific to
	//this application
	get_products_specific(): Array<outlook.assets.uproduct> {
		return [
			{
				id: "contributions",
				title: "Manage Member Contributions",
				solutions: [
					//
					//Join a group.
					{
						title: "Manage an event",
						id: "event_manage",
						listener: ["crud", "event", ["review"], "+", "mutall_chama"]
					},
					//
					//Manage the members
					{
						title: "Membership management",
						id: "member_manage",
						listener: ["crud", "member", ["review"], "+", "mutall_chama"]
					},
					//
					//Edit any table in this application
					{
						title: "Super User Table Editor",
						id: "edit_table",
						listener: ["event", () => this.edit_table()]
					},
					//
					//Select a group or groups you belong to
					{
						title: "Select a group",
						id: "select_group",
						listener: ["event", () => this.group_selector()]
					},
					// //
					// //Select a group or groups you belong to
					// {
					//     title: "Register chama",
					//     id: "register_chama",
					//     listener: ["event", () => this.register_chama()]
					// },
					//
					//
					{
						title: "Tabulate Contributions",
						id: "cross_tab",
						listener: ["event", () => this.cross_tab()]
					},
					{
						title: "Merge Contributions",
						id: "merge_contribution",
						listener: ["event", () => this.merge_contributions()]
					},
					{
						title: "Merge General",
						id: "merge_general",
						listener: [
							"event",
							async () => {
								//Create a new object
								const consolidate = new merge_general(
									this,
									"merge_general.html"
								);
								//
								await consolidate.administer();
							}
						]
					}
				]
			},
			{
				id: "msg",
				title: "Messaging",
				solutions: [
					{
						title: "send a message",
						id: "create_new_msg",
						listener: ["event", () => this.new_message()]
					},
					{
						title: "reply to a message",
						id: "reply_msg",
						listener: ["event", () => this.reply_message()]
					}
				]
			},
			{
				id: "event_management",
				title: "Manage an Event",
				solutions: [
					{
						title: "Create an event",
						id: "create_event",
						listener: ["event", () => this.event_planner()]
					}
				]
			},
			{
				id: "testing",
				title: "Tests",
				solutions: [
					{
						title: "Repetitive Event",
						id: "repeat_event",
						listener: ["event", () => this.repetitive()]
					},
					{
						title: "Non-repetitive Event",
						id: "not_repeat_event",
						listener: ["event", () => this.non_repetitive()]
					},
					//
					// Test the messenger
					{
						title: "Test Messenger",
						id: "test_msg",
						listener: ["event", () => this.test_msg()]
					},
					//
					//
					{
						title: "View Messenger",
						id: "view_msg",
						listener: ["event", () => this.view_messenger()]
					}
				]
			}
		];
	}
	//
	//The message viewer for the current application
	public async view_messenger() {
		const Tester = new theme_tester(this);
		await Tester.administer();
	}
	//
	//Test the sending of messages
	public async test_msg() {
		//
		const msg: mod.message = {
			get_technology(): Array<"phpmailer" | "twilio" | "mobitech"> {
				return ["phpmailer"];
			},
			get_recipient(): lib.recipient {
				return { type: "individual", user: ["1269"] };
				// return {
				// 	type: "group",
				// 	business: this.get_business()
				// };
			},
			//
			get_business(): outlook.business {
				return {
					id: "mutall_data",
					name: "CSR Program of Mutall Investment Company"
				};
			},
			get_content(): { subject: string; body: string } {
				return {
					subject: "test",
					body: "This is a sample test using the mutall email sending technologies"
				};
			}
		};
		//
		const sent = await this.messenger.send(msg);
		if (sent) alert("sending was successful");
		else alert("sending failed");
	}
	//
	//Test a repetitive event that occurs immediately
	public async repetitive(): Promise<void> {
		//1.Construct the data assuming that the job has already been saved in
		//database.
		const data: mod.crontab = {
			refresh_crontab() {
				return true;
			},
			// get_at_commands() {
			// 	return [];
			// },
			get_job_name() {
				return "";
			},
			refresh_atjobs() {
				return false;
			}
		};
		//
		//2. Setup a crontab on the server using the crontab interface
		const success = await this.scheduler.execute(data);
		alert(` ${success} success`);
	}
	//
	//Test a non-repetitive event
	public async non_repetitive(): Promise<void> {
		//
		//1. Collect the data to test for the non-repetitive event
		const non_rep = new test();
		//
		//Write the database first
		const exec = await this.writer.save(non_rep);
		//
		//Test if we need to refresh the at commands or not

		//if (non_rep.needs_refresh()) await non_rep.refresh();
		//
		//2. Execute the scheduler...
		//const schedule = await this.scheduler.execute(non_rep);
		//
		//For debugging purposes
		//alert(`${schedule} :scheduling`);
		alert(`${exec} :success`);
	}
	//
	//Paint the messages with messages generated by the group.
	async populate_messages(): Promise<void> {
		//
		//Define the query to set the results
		const query = `
                        select
							user.
                            msg.date,
                            member.name as sender,
                            msg.text
                        from msg
                            INNER JOIN member on member.member= msg.member
                    `;
		//
		//Get the messages
		const msgs: Array<{ date: string; sender: string; text: string }> =
			await server.exec("database", ["mutall_chama"], "get_sql_data", [query]);
		//
		//Get the section to paint the messages
		const panel: HTMLElement = this.get_element("message");
		//
		for (let msg of msgs) {
			//
			//Destructure the msg array
			const { date, sender, text } = msg;
			//
			//Create the label to hold the messages panel as shown below.
			const texts = this.create_element(panel, "div", {
				className: "msg"
			});
			this.create_element(texts, "div", {
				className: "date",
				textContent: date
			});
			this.create_element(texts, "div", {
				className: "sender",
				textContent: sender
			});
			this.create_element(texts, "div", {
				className: "text",
				textContent: text
			});
		}
	}
	async populate_events(): Promise<void> {
		//
		//Create the events query
		const sql = `
            select 
                date,
                name
            from event
            ORDER by date DESC
            `;
		//
		//Get the events
		const events: Array<{ date: string; name: string }> = await server.exec(
			"database",
			["mutall_chama"],
			"get_sql_data",
			[sql]
		);
		//
		//Get the panel to paint the events
		const evt = this.get_element("event");
		//
		//Paint the events panel with the events as they arrive
		for (let event of events) {
			//
			//Destructure the events array
			const { date, name } = event;
			//
			//Create a label to paint the messages to messages panel
			const occasion = this.create_element(evt, "div", {
				className: "event"
			});
			this.create_element(occasion, "div", {
				className: "date",
				textContent: date
			});
			this.create_element(occasion, "div", {
				className: "name",
				textContent: name
			});
		}
	}
	//
	//Merge the contributions
	async merge_contributions(): Promise<void> {
		//
		//Create a new object
		const consolidate = new merge_contrib(this, "merge_contribution.html");
		//
		//Get the contribution data to paint it to the viewing area
		await consolidate.get_data();
		//
		await consolidate.administer();
	}
	//
	//Display the member contributions for all the group events
	async cross_tab(): Promise<void> {
		//
		//Create the view where we want to display the table
		const view: sql_viewer = new sql_viewer(this, this.config.general);
		//
		await view.get_data();
		//
		await view.administer();
	}
	//
	//Edit any table in the system
	async edit_table() {
		//
		//1. aGet all the tables from the system as key value pairs
		//
		//1.1 Get the application database
		const dbase = this.dbase!;
		//
		//1.2 Use the database to extract the entities
		const enames = Object.keys(dbase.entities);
		//
		//1.3 Map the entities to the required key value pairs
		const pairs = enames.map(ename => ({ key: ename, value: ename }));
		//
		//2. Use the pairs to create a new choices POPUP that returns a selected
		//table
		const Choice = new outlook.choices<string>(
			this.config.general,
			pairs,
			"table",
			undefined,
			"#content",
			"single"
		);
		//
		//3. Open the POPUP to select a table.
		const selected = await Choice.administer();
		//
		//4. Test whether the selection was aborted or not
		if (selected === undefined) return;
		//
		//5. Use the table to run the CRUD services.
		const subject: outlook.subject = [selected[0], this.dbname];
		const verbs: Array<outlook.assets.verb> = [
			"create",
			"review",
			"update",
			"delete"
		];
		this.crud(subject, verbs);
	}
	//
	//Adding the Business Selector
	async group_selector(): Promise<void> {
		//
		//1. List all available Chama
		const chama = await server.exec(
			"database",
			["mutall_chama"],
			"get_sql_data",
			["select `name` from `group`"]
		);
		//
		//Set the selected groups to accept multiple values
		const pairs = chama.map(pair => {
			return { key: "name", value: String(pair.name) };
		});
		//
		// 1.1 Use the listed chamas to create a popup
		const Choice = new outlook.choices<string>(
			"general",
			pairs,
			"chama",
			"",
			"#content",
			"single"
		);
		//
		//2. Select one or more groups
		const selected = Choice.administer();
		//
		//3. Update the Databases in both "user" and "application"
		//
		//4. Respect the business selector to all crud sql's
	}
	//
	//Start the new message instance
	async new_message(): Promise<void> {
		//
		//1. Get the new message class
		const Msg = new new_message(this);
		//
		//Administer the page
		await Msg.administer();
	}
	//
	//Reply to a selected message
	async reply_message(): Promise<void> {
		//
		//1. Save the selected message that will later on be replied to
		const pk: string = await this.get_selected_msg();
		//
		//2. Call the reply message class
		const reply = new reply_message(pk, this);
		//
		//3. Administer the page.
		reply.administer();
	}
	//
	//Save the selected message to later reply to that message
	async get_selected_msg(): Promise<string> {
		//
		//#message>div>.msg_holder
		//1. Get the selected message. A selected message is associated with the IO type
		const tr: HTMLTableRowElement =
			this.document.querySelector('[data-io="msg"]')!;
		//
		//When the user tries to reply to a message without a message, prompt
		//him/her to select a message. And stop the execution of the program
		if (tr === null)
			throw new schema.mutall_error(
				"NO MESSAGE was selected to reply. SELECT the message to and try again"
			);
		//
		//2. Get the primary key of the selected message
		const pk: string = tr.getAttribute("pk")!;
		//
		//3. Return the primary key of the selected message.
		return pk;
	}
	//
	//Open the message viewer panel upon double clicking of the selected message.??
	//
	//Launch the event_planner template
	async event_planner(): Promise<void> {
		//
		//1. Get the event planner class
		const Event = new event_planner(this, false);
		//
		//Administer the event planner
		await Event.administer();
	}
}
//
//This is a view is used for displaying sql data in a table
class sql_viewer extends app.terminal {
	//
	//
	//This is the structure of the cross tabulation records.
	public input?: Array<{
		member: number;
		email: string;
		events: { [index: string]: number };
	}>;
	//
	//The headers to populate the cross tab table with their headings
	public headers?: Array<{ name: string }>;
	//
	constructor(
		//
		//This popup parent page.
		mother: outlook.page,
		//
		//The html file to use
		filename: string
		//
	) {
		//
		//The general html is a simple page designed to support advertising as
		//the user interacts with this application.
		super(mother, filename);
	}
	//
	//Reporting does not require checks and has no results to return because
	// it is not used for data entry.
	async check(): Promise<boolean> {
		return true;
	}
	async get_result(): Promise<true> {
		return true;
	}
	//
	//Add the input buttons to each email column. Here, providing the checks is
	//dependent on whether the popup window has a merge button
	add_check_box(td: HTMLTableCellElement, member: number): void {}
	//
	//Display the report
	async show_panels() {
		//
		//Get the access to the content panel and attach the html
		const content = this.get_element("content");
		//
		//Hide the go button from the general html since it is not useful in the
		//the reporting
		this.get_element("go").hidden = true;
		//
		//Create a table and display the values in a proper format
		//Create the table element
		const table = this.create_element(content, "table", {});
		//
		//Create the thead element
		const thead = this.create_element(table, "thead", {});
		//
		//Create the table's body
		const tbody = this.create_element(table, "tbody", {});
		//
		//
		//Use the columns to create a th
		const th = this.create_element(thead, "tr", {});
		//
		//Populate the email th
		this.create_element(th, "th", { textContent: "email" });
		//
		//Populate the events th
		this.headers!.forEach(header => {
			//
			//events:{[index:string]:number}
			//Destructure the header
			const { name } = header;
			//
			//Create a header associated with each event
			this.create_element(th, "th", { textContent: name });
			//
		});
		//
		//Add the values as rows to the table's body
		this.input!.forEach(row => {
			//
			//Destructure the row
			const { member, email, events } = row;
			//
			//Use the row to create a tr
			const tr = this.create_element(tbody, "tr", {});
			//
			//Populate the email td
			const td = this.create_element(tr, "td", { textContent: email });
			//
			//Add the input buton at this point and it should be hidden by default
			//
			//Create an input button before the tr ***
			this.add_check_box(td, member);
			//
			//Add the input button before the email td's
			//.unshift('<input type="checkbox"> </input>');
			//
			//Populating the events
			this.headers!.forEach(header => {
				//
				//Destructure the header
				const { name } = header;
				//
				//
				const value = String(events[name] == undefined ? "" : events[name]);
				//
				//Use this header to create a td
				this.create_element(tr, "td", { textContent: value });
			});
		});
	}
	async get_data(): Promise<void> {
		//
		//Obtain the contribution values from the database
		//
		//Formulate the query to obtain the values
		const sql = `
                select
                    member.member,
                    member.email,
                    json_objectagg(event.id,contribution.amount) as events
                from 
                    contribution
                    INNER JOIN member on contribution.member= member.member
                    INNER JOIN event on contribution.event= event.event
                group by member`;
		//
		//Execute the query
		const values: Array<{ member: number; email: string; events: string }> =
			await server.exec("database", ["mutall_chama"], "get_sql_data", [sql]);
		//
		//Expected output
		//  [{
		//  member:125,
		//    email:"Aisha Gatheru",
		//   events: [{carol:500},
		//            {ndegwa:100},
		//            {mwihaki_dad:1000}
		//           ]
		//  }]
		//Define the suitable output of the data
		this.input = values.map(value => {
			//
			//
			const { member, email, events } = value;
			//
			//Convert the events string to an event array
			const events_array: { [index: string]: number } = JSON.parse(events);
			//
			//
			return { member, email, events: events_array };
		});
		//
		//Obtain the header values
		this.headers = <Array<{ name: string }>>(
			await server.exec("database", ["mutall_chama"], "get_sql_data", [
				"select event.id as name from event order by date"
			])
		);
	}
}
//
//Merging the group contributions
class merge_contrib extends sql_viewer {
	//
	//The email column obtained from the cross tab data
	public pk?: HTMLTableCellElement;
	//
	constructor(
		//
		//This popup parent page.
		mother: outlook.page,
		//
		//The html file to use
		filename: string
		//
		//The primary key columns,i,e the first records in the eHTMLTableCellElement
	) {
		//
		//The general html is a simple page designed to support advertising as
		//the user interacts with this application.
		super(mother, filename);
		//
	}
	//
	//Execute the merge process by first obtaining the merger data from the
	// current panel. i.e.,from the processed values.
	async merge(): Promise<void> {
		//
		//Set the database name
		const dbname = "mutall_chama";
		//
		//Set the entity name
		const ename = "member";
		//
		//Construct the members by reading off the checked values.
		//The checked values are needed to form the list of members to be merged.
		// These values are compiled in a structure and returned as values when
		// we form the members list to complete the imerge structure.
		//Get the checked values by identifying the text boxes associated with
		//the entry of each member.
		const inputs = document.querySelectorAll('input[type="checkbox]:checked');
		//
		//Convert the nodelist to an array
		const check: Array<Element> = Array.from(inputs);
		//
		//Move through each input button to check on whether it is clicked or not,
		const values = check.map(input => (<HTMLInputElement>input).value);
		//
		//Pass the collected members as an array
		const players = values.join();
		//
		//Define the members sql
		const members = `
                            select member.member 
                            from member 
                            where member.member 
                            in(${players})
                            `;
		//
		//Construct the imerge object
		const imerge: lib.Imerge = { dbname, ename, members };
		//Construct the merger object
		const Merger: merger = new merger(imerge, this);
		//
		//Execute the merge operation
		await Merger.execute();
	}

	//
	//Add a check box to the given td
	add_check_box(td: HTMLTableCellElement, member: number): void {
		//
		//Resolve the call to the inherited checks method
		super.add_check_box(td, member);
		//
		//Create an input button before
		this.create_element(td, "input", {
			type: "checkbox",
			value: String(member)
		});
	}
	//
	//Over ride the show panels to attach an event that triggers the merge class
	// for the merging process.
	async show_panels(): Promise<void> {
		//
		await super.show_panels();
		//
		//Get the merge button and add an event to it
		const button = <HTMLSelectElement>this.get_element("merge");
		button.onclick = () => this.merge();
	}
}
//
//
//
//Merging the group contributions
class merge_general extends app.terminal {
	//
	constructor(
		//
		//This popup parent page.
		mother: outlook.page,
		//
		//The html file to use
		filename: string
		//
		//The primary key columns,i,e the first records in the eHTMLTableCellElement
	) {
		//
		//The general html is a simple page designed to support advertising as
		//the user interacts with this application.
		super(mother, filename);
		//
	}
	//
	//Reporting does not require checks and has no results to return because
	// it is not used for data entry.
	async check(): Promise<boolean> {
		return true;
	}
	async get_result(): Promise<true> {
		return true;
	}
	//
	//Merging the general records
	async merge(): Promise<void> {
		//
		//Get the merger data
		//Get the database name
		const dbname = (<HTMLInputElement>document.getElementById("dbname")).value;
		//Get the entity name
		const ename = (<HTMLInputElement>document.getElementById("ename")).value;
		//
		const members = (<HTMLInputElement>document.getElementById("members"))
			.value;
		//
		//Construct the imerge object
		const imerge: lib.Imerge = { dbname, ename, members };
		//Construct the merger object
		const Merger: merger = new merger(imerge, this);
		//
		//Execute the merge operation
		await Merger.execute();
	}
	//
	//Over ride the show panels to attach an event that triggers the merge class
	// for the merging process.
	async show_panels(): Promise<void> {
		//
		await super.show_panels();
		//
		//Get the merge button and add an event to it
		const button = <HTMLSelectElement>this.get_element("merge");
		button.onclick = () => this.merge();
	}
}
//
//Use a baby to create a new message.
class new_message
	extends app.terminal
	implements mod.questionnaire, mod.message, mod.money
{
	//
	//Override the base mother property to be of type main(rather than page).
	public declare mother: main;
	//
	//The html textarea element used for retrieving the highlighted word and the
	//getting the last word typed
	public text_area?: HTMLTextAreaElement;
	//
	//The language selector
	public lang_label?: HTMLLabelElement;
	//
	//The type of recipient to receive the message
	public recipient?: lib.recipient;
	//
	//The planner obtained once an event is created
	public planner?: event_planner;
	//
	//Ensure that the recipient selector is filled only once
	private filled: boolean = false;
	//
	//The subject
	public subject?: string;
	//
	//The message text
	public message?: string;
	//
	//Get the last word typed by the user in the message
	public last_word?: string;
	//
	//Get the highlighted text by the user in the message input area
	public focus_word?: string;
	//
	//The date
	public date?: string;
	//
	//The event
	public event?: { event: event_planner };
	//
	//The name of the event
	public name?: string;
	//
	//The input selected when creating an event
	public plan_event?: "yes" | "no";
	//
	//The technology required to send the message to the recipient
	public technology?: Array<"phpmailer" | "twilio" | "mobitech">;
	//
	//For every application, we will need the business primary key and the user key.
	//it is reasonable to have them at this position
	public business_pk?: number;
	//
	//The user primary_key, used when saving user fk's in tables that contain it
	public user_fk?: number;
	//
	//The
	public recieve?: lib.recipient;
	//
	//The number of people contained in this group
	public grp_count?: Array<{ user: string; name: string }>;
	//
	//Get the number of people who are chosen to send the sms
	public chosen?: number;
	//
	//
	constructor(
		//
		//is mother???
		public app: main
	) {
		super(app, "../../../outlook/v/templates/create_message.html");
	}
	//
	//In future, check if a file json file containing Iquestionnaire is selected??
	//
	//Collect and check the data entered by the user sending the message.
	async check(): Promise<boolean> {
		//
		//1. Collect and check the data that the user has entered.
		//
		//1.1. Collect and check the recipient
		this.recipient = this.get_recipient();
		//
		//1.2 Get the message content
		const message = this.get_element("msg");
		this.message = (<HTMLInputElement>message).value;
		//
		//1.3.Collect the subject of the message
		this.subject = this.get_input_value("subject");
		//
		//1.4. Collect the technology to send the message with
		const technologies: Array<string> = this.get_input_choices("technology");
		//
		//Compile the technology to send the email
		this.technology = <Array<"phpmailer" | "twilio" | "mobitech">>technologies;
		//
		//2. Save the data to the database.
		const save = await this.mother.writer.save(this);
		//
		//Implement the accounting model.
		//
		//Implement the payment module.
		//
		//3. Send the message text to the user(s).
		const send = await this.mother.messenger.send(this);
		//
		return save && send;
	}
	//
	//Get the amount to pay from the invoice after the accounting has occurred
	get_amount(): number {
		return 500;
	}
	//
	//Get the address(phone_number) of the currently logged in user
	get_fullname(): string {
		//
		//the full name of the currently logged in user
		return this.app.user!.full_name!;
	}
	//
	//Get the selected technology to send the message with
	get_technology(): Array<"phpmailer" | "twilio" | "mobitech"> {
		return this.technology!;
	}
	//
	//
	//Get the business of the current logged in user
	get_business(): outlook.business {
		return this.app.user!.business!;
	}
	//
	//Get the body of a message
	get_content(): { subject: string; body: string } {
		return { subject: this.subject!, body: this.message! };
	}
	//
	//This method triggers the creation of events associated with a message.
	async create_event_planner(): Promise<void> {
		//
		//Call the event planner class
		const planner: event_planner = new event_planner(this.mother, true);
		//
		//Administer the page to the user
		const result = await planner.administer();
		//
		//Set the planner on the condition that the administration was successful
		if (result !== undefined) this.planner = planner;
	}
	//
	//This method creates the language selector after the level heading
	//for databases that have the language component. The parent element is passed
	//which decided the position at which the selector will be inserted.
	create_language_selector(element: string): HTMLLabelElement {
		//1. Check if the database contains the language entity name
		//
		//1.1 Get the entities for the current database
		const entities: Array<string> = Object.keys(this.mother.dbase!.entities);
		//
		//1.2 Check whether the language entity is present
		const lang: boolean = entities.includes("language");
		//
		//2.Create the language selector
		if (lang === true) {
			//
			//2.1. Get the point at which to create the language selector. It should
			//be after the h1 tag
			const elem = <HTMLElement>this.document.querySelector(element);
			//
			//2.2. Get the point at which to create the language label and its selector
			const point = <HTMLElement>elem.nextElementSibling;
			//
			//2.3.Create the label
			this.lang_label = this.create_element(point, "label", {
				textContent: "Language: "
			});
			//
			//2.4. Create the selector element
			this.create_element(this.lang_label, "select", { id: "language" });
		}
		//
		return this.lang_label!;
	}
	//
	//This sets the listener for the word that is typed in the listener and once
	//and gets the last word type as well as the non english words, and returns
	//the words. The only variable needed is the id of the input
	get_last_word(id: string): string {
		//
		//Get the text input element
		this.text_area = <HTMLTextAreaElement>this.get_element(id);
		//
		//Add a listener to the element to retrieve the word typed that are non
		//english and the last word typed
		this.text_area.oninput = (evt: Event) => {
			evt.stopPropagation();
			//
			//Get contents of the input field
			const text: string = (evt.target as HTMLTextAreaElement).value;
			//
			//Retrieve the last word typed
			this.last_word = text.match(/\w+$/g)![0];
		};
		//
		//return the last word typed
		return this.last_word!;
	}
	//
	//This method allows the user to highlight the selected word and it returns
	//the selected word from the text inserted.
	get_highlighted_word(): string {
		//
		//Check whether there is some text in the input area
		if (this.text_area !== undefined && "") {
			//
			//Set the event listener to listen to the mouse event provided
			this.text_area.onmouseup = evt => {
				//
				//Define the starting point of the selection.Hint,its an index.
				const start: number = this.text_area!.selectionStart;
				//
				//Define the ending point of the selection
				const end: number = this.text_area!.selectionEnd;
				//
				//Get the highlighted word
				this.focus_word = (evt.target as HTMLTextAreaElement).value.substring(
					start,
					end
				);
			};
		}
		//
		//Return the focused word
		return this.focus_word!;
	}
	//
	//Add the selected receivers to the list of recipients using the id of the receiving panel
	//as the input parameter.
	add_selected(id: string): void {
		//
		//Get all selected checkboxes in the all users panel
		const inputs = <Array<HTMLInputElement>>(
			Array.from(
				document.querySelectorAll('#all>label>input[type="checkbox"]:checked')
			)
		);
		//
		//Get the section that will be populated with the recipients once selected from the list
		const receive = <HTMLDivElement>this.get_element(id);
		//
		//For each selected name, remove it from the list of users
		inputs.forEach(input => {
			//
			//Remove it from the list of all users
			input.parentElement!.remove();
			//
			//Add it to the list of chosen users as a label
			//
			//Create the label
			const label = this.create_element(receive, "label", {});
			//
			//The input of type checkbox
			this.create_element(label, "input", {
				type: "checkbox",
				value: `${input.value}`
			});
			//
			//Add the value of the element
			label.innerHTML += `${(input.nextSibling! as Text).wholeText}`;
		});
	}
	//
	//Get each reciever and create a recivers array using the id of the selector
	//as the identifying parameter
	get_recipient(): lib.recipient {
		//
		//Get the type of recipient
		const type: string = this.get_checked_value("recipient");
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
		//Extract the number in the chosen panel
		this.chosen = values.length;
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
	//This method is used for controlling the web page by managing event listeners as many as they are,
	//to reduce the length of the show panels method,and make show panels method neater
	async make_responsive(): Promise<void> {
		//
		//Get the panel that will show the potential reach of the number of people
		const reach = <HTMLDivElement>this.get_element("count");
		//
		//Reveal the users panel and populates the all users in their panel
		this.get_element("individual").onclick = () => {
			//
			//Clear the contents the panel
			reach.innerHTML = "";
			//
			//1. Fill the receiver selector with names of the recipients
			this.populate_recipients("all");
			//
			//Reveal the panel
			this.show_panel("users", true);
			//
			//Get the potential reach of the message to be sent
			this.get_count();
		};
		//
		//Clear the users panel and remove it from view when choosing all recipients
		this.get_element("group").onclick = () => {
			//
			//Clear the contents the panel
			reach.innerHTML = "";
			//
			//clear the panel of users
			this.get_element("all").innerHTML = "";
			this.get_element("chosen").innerHTML = "";
			//
			//Hide the panel of all users
			this.show_panel("users", false);
			//
			//Paint the number of people the group contains
			this.create_element(reach, "p", {
				textContent: `${this.grp_count!.length}`,
				id: "count"
			});
		};
		//
		//Make the create event button inactive given when the value is No...
		this.get_element("event_no").onclick = () => {
			this.show_panel("create_event", false);
		};
		//
		//...and active when the value is Yes
		this.get_element("event_yes").onclick = () => {
			this.show_panel("create_event", true);
		};
		//
		//Allow the user to create an event from the messenger module
		this.get_element("create_event").onclick = () => {
			this.create_event_planner();
		};
	}
	//
	//Obtain the primary key of the logged in user, used when creating a message
	// async get_userpk(): Promise<void> {
	//     //
	//     //Formulate the query to retrieve the user primary key,using the user's current name
	//     const query: string = `select user.user from user where user.name="${this.app.user!.name!}" `;
	//     //
	//     //Run the query and retrieve the result
	//     const result: Array<schema.fuel> = await server.exec("database", ["mutall_users"], "get_sql_data", [query]);
	//     //
	//     //We expect just one user at this point
	//     this.user_pk = + result[0].user!;
	// }
	//
	//
	//Populate the language selector and program the create event button
	async show_panels(): Promise<void> {
		//
		//Execute the query to retrieve the number and the names of the people in the group
		//who will receive the message(s).
		this.get_reach();
		//
		//Make the page responsive
		this.make_responsive();
		//
		//Move the selected recipients to the panel of selected recipients
		this.get_element("all").onchange = () => {
			this.add_selected("chosen");
		};
		//
		//Move the selected recipients back to the list of all users
		this.get_element("chosen").onchange = () => {
			this.add_selected("all");
		};
		//
		//Fill the date input since it is disabled
		this.date = this.fill_date("date");
		//
		//Call the event planner class once the create_event button is clicked
		this.get_element("create_event").onclick = () =>
			this.create_event_planner();
		//
		//The the user and business primary keys
		this.get_primary_keys();
	}
	//
	//Extract the data that is needed for writing to the database as a label
	//where a label is a tuple of five elements
	//[dbname,ename,alias,cname,expression]
	get_layouts(): Array<quest.layout> {
		return [...this.yield_layout()];
	}

	*yield_layout(): Generator<quest.layout> {
		//
		//Get the user creating the message
		yield ["mutall_users", "user", [], "name", app.app.current.user!.name];
		//
		//Get the name of the organization. The name of an organization can be obtained
		//from the application at login time
		yield [
			"mutall_users",
			"business",
			[],
			"id",
			app.app.current.user!.business!.id
		];
		//
		//The different types of technologies used to send the message
		const technologies: { technology: string } = {
			technology: this.technology!.toString()
		};
		//
		//Compile the technologies used to send the message and save them to the database
		yield [
			"mutall_users",
			"msg",
			[],
			"technology",
			JSON.stringify(technologies)
		];
		//
		//The subject of the message
		yield ["mutall_users", "msg", [], "subject", this.subject!];
		//
		//The text associated with a message
		yield ["mutall_users", "msg", [], "text", this.message!];
		//
		//If applicable, get the event attached to that message
		if (this.planner !== undefined)
			yield ["mutall_users", "event", [], "name", this.planner.event_name!];
	}
	//
	//Get the list of members from the database.
	public async get_members(): Promise<string> {
		//
		//Get all member ids from the database.
		const members: Array<{ id: string }> = await server.exec(
			"database",
			["kentionary3"],
			"get_sql_data",
			["SELECT id FROM member"]
		);
		//
		//Formulate the options from the members=.
		const options: Array<string> = members.map(
			member => `<option value='${member.id}'>${member.id}</option>`
		);
		//
		//Convert the array of options into some text separated by a break statement.
		const options_str: string = options.join("\n");
		//
		//Return the text.
		return options_str;
	}
	//
	//Get the user's and business primary keys for support fk's for saving where the fk's
	//are not empty
	async get_primary_keys(): Promise<void> {
		//
		//The query to get the current user's primary key
		const user_query: string = `select user.user from user where user.name="${
			this.app.user!.name
		}"`;
		//
		//The query to get the current business's primary key
		const bus_query: string = `select business.business from business where business.id="${
			this.app.user!.business!.id
		}"`;
		//
		//Get the primary key for the user
		const user_pk: Array<{ user: string }> = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[user_query]
		);
		//
		//Get the business primary key
		const bus_pk: Array<{ business: string }> = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[bus_query]
		);
		//
		//Extract the user primary key
		this.user_fk = +user_pk[0].user;
		//
		//Extract the business primary key
		this.business_pk = +bus_pk[0].business;
	}
}
//
//A message is defined by the entire message, with the subject, sender,user,
//business,and the date it was created
type message = {
	business: string;
	msg: string;
	subject: string;
	text: string;
	technology: string;
	date: string;
	user: string;
	language: string;
	event: string;
	child_of: string;
};
//
//This class supports the reply of sent messages to support conversations
class reply_message
	extends app.terminal
	implements mod.questionnaire, mod.message
{
	//
	//Why declare? To allow us to access the modules currently defined in
	//the main class. NB: Mother is already a property that is of type Page and
	//page does not have the modules.
	public declare mother: main;
	//
	//The currently logged in user
	public user?: string;
	//
	//The primary key associated with this message.
	public pk: string;
	//
	//Language used.
	public language?: string;
	//
	//The message to reply
	public saved_message?: message;
	//
	//The reply to the message
	public message?: string;
	//
	//The business.
	public organization?: string;
	//
	//The event info.
	public contribution?: { event: event_planner; amount: string };
	//
	//create a new reply message class instance
	constructor(pk: string, mother: main) {
		//
		//1. Call the constructor of the parent class with the mother page and file name.
		super(mother, "../templates/rep_msg.html");
		//
		//2. The primary key of the message
		this.pk = pk;
	}
	//
	//Get the technology that was used to send the message
	get_technology(): Array<"phpmailer" | "twilio" | "mobitech"> {
		//
		//0. Initialize an empty array
		let tech: Array<"phpmailer" | "twilio" | "mobitech"> = [];
		//
		//1. Split the message sending technologies into their various subdivisions
		const sending_tech: { technology: string } = JSON.parse(
			this.saved_message!.technology
		);
		//
		//2. The array of values from the script
		const combined: Array<string> = sending_tech.technology.split(",");
		//
		//2. Combine the elements of the array
		const technology: string = combined.join("|");
		console.log(technology);
		return tech;
	}
	//
	//Get the sender of the message.
	get_sender(): string {
		//
		//Get the user who is replying to the message
		const sender = this.saved_message!.user;
		//
		//Ensure that a user is available.
		if (sender === undefined) throw new schema.mutall_error(`No user found!`);
		//
		//Return the sender name.
		return sender!;
	}
	//
	//Get the content of the message.
	get_body(): string {
		return this.message!;
	}
	//
	//Check that all the inputs are properly provided
	async check(): Promise<boolean> {
		//
		//1. Collect and check the data that the user has entered.
		//
		//1.0 Collect the user.
		this.user = this.mother.user!.name!;
		//
		//1.1 Collect and check the text of the message collected
		const text = <HTMLInputElement>this.get_element("message");
		//
		//1.2 Collect and check the text of the message collected
		if (text.value.length === 0)
			//
			//Show the error to the user
			throw new schema.mutall_error(
				`No Message provided, check the ${
					text.previousSibling!.textContent
				} section`
			);
		//
		//Set the message
		this.message = text.value;
		//
		//1.3 Extract the event information from the saved message.
		//If there is such an event, proceed to identify the event collect the contribution
		//associated with this event.
		if (this.saved_message!.event !== null) {
			this.contribution = this.get_contribution();
		}
		//
		//2. Save the data to the database.
		const save = await this.mother.writer.save(this);
		//
		//3. Reply the appropriate message from the user(s).
		const send = await this.mother.messenger.send(this);
		//
		//4. Decide whether the accounting module is necessary.
		//It is necessary if a contributory event is invoked, call the accountant class
		//to post the.
		if (this.contribution !== undefined) {
			//
			//1. Update the book of accounts
			//
			//1.0 Get the event.(Required in a new message)
			//  const evt = this.contribution.event;
			//
			//1.1 Get the amount contributed
			const amount = this.contribution.amount;
			//
			//1.2 Construct a journal from the amount.
			const je = new mod.accountant();
			//
			//2. Effect the payment.
			//
			//3. Post the journal.
			//const post = await this.mother.accountant.post();
			//
			//If the posting was successful,
			//return post;
		}
		//
		return save && send;
	}
	get_contribution(): { event: event_planner; amount: string } {
		//
		//Get the event related to this contribution.
		const event = this.contribution!.event;
		//
		//Get the amount and return the value.
		const amount = this.get_input_value("amount");
		//
		//Return the amount.
		return { event, amount };
	}
	//
	//Collect the layouts to complete the saving of the message to the database
	get_layouts(): Array<quest.layout> {
		return [...this.yield_layouts()];
	}
	//
	//Generate layouts for each record to be saved in the database
	*yield_layouts(): Generator<quest.layout> {
		//
		//The database name.
		const dbname: string = "mutall_users";
		//
		//The user replying the message
		yield [dbname, "user", [1], "name", this.mother.user!.full_name!];
		//
		//The subject of the message
		yield [dbname, "msg", [1], "subject", this.saved_message!.subject];
		//
		//The text associated with the message
		yield [dbname, "msg", [1], "text", this.message!];
		//
		//The technology used to send the message
		yield [dbname, "msg", [1], "technology", this.saved_message!.technology];
		//
		//The parent of the message being replied
		yield [dbname, "msg", [], "msg", this.saved_message!.msg];
		//
		//The business associated with the generated message
		yield [dbname, "business", [1], "id", this.mother.user!.business!.id];
		//
		//Event and the language layouts
	}
	//
	//Get the business of the user replying to the message
	get_business(): outlook.business {
		return this.mother.user!.business!;
	}
	//
	//Get the body of the message collected by the user
	get_content(): { subject: string; body: string } {
		return { subject: this.saved_message!.subject, body: this.message! };
	}
	//
	//Collect the recipient of the message. This should be the currently logged in user.
	get_recipient(): lib.recipient {
		return { type: "individual", user: [this.saved_message!.user] };
	}
	//
	//Populate the message reply panel with the message text,the date it was created,
	//the subject of the message
	async populate_sections(): Promise<void> {
		//
		//Get the business of the user who sent the message
		const business: schema.basic_value = await this.business_name();
		//
		//Get the user name of the user who sent the message
		const user_name: schema.basic_value = await this.user_name();
		//
		//Get the panel to add the subject
		const subject = <HTMLInputElement>this.get_element("subject");
		//
		//Add the subject to the subject panel
		subject.value = this.saved_message!.subject;
		//
		//Get the text message panel and populate it
		const text = <HTMLInputElement>this.get_element("prev_message");
		//
		//Add the message text to the message panel
		text.value = this.saved_message!.text;
		//
		//Display today's date
		this.fill_date("today");
		//
		//Provide additional information about the message
		const info = <HTMLDivElement>this.get_element("details");
		//
		//Set the user information
		this.create_element(info, "p", {
			textContent: `Sent On - ${this.saved_message!.date}`
		});
		//
		//Get the status of the message once it is replied. This checks whether and message
		//is replied to or not
		const replied: string =
			this.saved_message!.child_of !== "1"
				? "Awaiting Reply"
				: `Replied on ${this.saved_message!.date}`;
		//
		//Show the reply status of that message
		this.create_element(info, "p", {
			textContent: ` Response Status - ${replied}`
		});
		//
		//Set the user who created the message
		this.create_element(info, "p", {
			textContent: `Created By - ${user_name}`
		});
		//
		//Extract the sending technologies as a string
		const technologies: string = this.get_technologies();
		//
		//Set the technology used to send the message
		this.create_element(info, "p", {
			textContent: `Sent via :- ${technologies}`
		});
		//
		//If there is no event associated with the event,
		if (this.saved_message!.event === null) {
			//
			//Hide the contributory panel
			this.get_element("contribution").style.display = "none";
		}
		//
		//Show the contributory panel and the panel to pay, given that the event is contributory;
		else {
			//
			//Make the contribution panel responsive
			await this.make_responsive();
			//
			//Retrieve the information about the event
			const event: Array<schema.fuel> = await server.exec(
				"database",
				["mutall_users"],
				"get_sql_data",
				[`select * from event where event.event=${+this.saved_message!.event}`]
			);
			//
			//check whether the event is a contributory.
			const contributory = <"yes" | "no">event[0].contributory ? "yes" : "no";
			//
			//Check whether the contributory is mandatory
			const mandatory = <"yes" | "no">event[0].mandatory ? "yes" : "no";
			//
			//Display show the contribution checkbox, by now the panel to inquire for contribution is visible
			if (contributory || mandatory === "yes") {
				this.get_element("amount").hidden = false;
			}
		}
		//
		//Calculate the Number of days and hours since the message was sent
	}
	//
	//Get the email sending technologies
	get_technologies(): string {
		//
		let technologies: string;
		//
		//Extract the technologies used to send the message
		const technology: { technology: string } = JSON.parse(
			this.saved_message!.technology
		);
		//
		//Check that the technology is not null, and return it as none
		if (technology === null) {
			technologies = "Email";
		} else {
			//
			//If the sending technology is twilio or PHPMailer, assign a friendly name
			const tech =
				technology.technology === "phpmailer,mobitech" || "phpmailer,twilio"
					? "Email  and SMS"
					: "";
			//
			technologies = tech;
		}
		//
		//return the compiled technologies
		return technologies;
	}
	//
	//Get the name of the user who created the message
	async user_name(): Promise<schema.basic_value> {
		//
		//Construct the query to retrieve the user's name
		const query: string = `
			select
				user.name
			from user
			where user.user=${+this.saved_message!.user};
			`;
		//
		//Execute the query
		const user: Array<schema.fuel> = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[query]
		);
		//
		//Return the name of the user
		return user![0].name;
	}
	//
	//Get the business of the user who created the message
	async business_name(): Promise<schema.basic_value> {
		//
		//Construct the query to return the user who created the
		const sql: string = `
			select
				business.name
			from business
			where business.business=${+this.saved_message!.business}
		`;
		//
		//Execute the query
		const business_name: Array<schema.fuel> = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[sql]
		);
		//
		//Return the name of the business the user who created the message belonged to
		return business_name[0].name;
	}
	//
	//Extract the information about the saved message from the database
	//and compile the message metadata for later use.
	async extract_message_information(): Promise<void> {
		//
		//3. The query to retrieve the message using the selected primary key
		const sql: string = `
            select
                *
            from msg
            where msg.msg=${this.pk}
        `;
		//
		//4. Using the primary key, extract the message from the database
		const msg: Array<message> = await server.exec(
			"database",
			["mutall_users"],
			"get_sql_data",
			[sql]
		);
		//
		//The saved message contains the entire message, with the subject, sender,user,
		//business,and the date it was created
		this.saved_message = msg![0];
	}
	//
	//The show panels method allows the user to interact smartly with the page
	async show_panels(): Promise<void> {
		//
		//Extract the information regarding the saved message
		await this.extract_message_information();
		//
		//Add the message to reply, the date created, and the user who sent the message
		//to the page
		await this.populate_sections();
	}
	//
	//Make the contribution panel responsive
	make_responsive() {
		//
		//Add an event listener to the contribution panel
		this.get_element("yes_contribution").onclick = () => {
			//
			//Get the user selected choice
			this.show_panel("amount", true);
		};
		//
		//Hide the amount panel if the user does not want make a contribution
		this.get_element("no_contribution").onclick = () => {
			//
			//Get the user selected choice
			this.show_panel("amount", false);
		};
	}
}
//
//The event planner class that allows a user to create schedules for events to support event
//planning.The user has a double chance of completing this information
class event_planner extends app.terminal implements mod.questionnaire {
	//
	//Access the main class and all its properties
	public declare mother: main;
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
		public app: main,
		//
		//It shows if this event was initialized from a messenger or not
		public is_from_messenger: boolean
	) {
		//
		//The general html is a simple page designed to support advertising as
		//the user interacts with this application.
		super(app, "../templates/evsent_form.html");
		//
	}
	//
	//Get the sender of a message.
	get_sender(): string {
		return this.mother.user!.full_name!;
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
		const saved = await this.mother.writer.save(this);
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
		this.scheduled = await this.mother.scheduler.execute(cronjob);
	}
	//
	//Update the book of accounts once the payment has completed
	async update_accounts(): Promise<void> {
		//
		//Post to the accounting tables
		this.posted = await this.mother.accountant.post(
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
		this.paid! = await this.mother.cashier.pay(
			new payment(this.app.user!.full_name!, this.pay_amount!)
		);
	}
	//
	//Send a message to inform the members of the event given the business, the event_name,and the description
	//of the event as the body
	async send_messages(): Promise<void> {
		//
		//Send the message with
		this.informed! = await this.mother.messenger.send(
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
				const recipient = new collect_recipient(this.mother);
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
	public declare mother: main;
	//
	//The number of people contained in this group
	public grp_count?: Array<{ user: string; name: string }>;
	//
	//The function's constructor
	constructor(public app: main) {
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
//This is the class that supports testing of the firing of repetitive events
class repetitive extends app.terminal implements mod.crontab {
	//
	//Gain access to
	public declare mother: main;
	//
	//The start_date of the event
	public start_date?: string;
	//
	//The end_date of the event
	public end_date?: string;
	//
	//The body of the message collected
	public msg?: string;
	//
	//The frequency of the current job
	public frequency?: string;
	//
	//The job collected from the user
	public job?: mod.recursion;
	//
	//The class constructor, takes the file name and the mother to this page
	//as the only parameters
	constructor(mother: main, filename: string) {
		super(mother, filename);
	}
	//
	//The check method that checks that ensures that all inputs are properly formatted
	async check(): Promise<boolean> {
		//
		//Get the element containing the message
		const message: HTMLElement = this.get_element("message");
		//
		//Get the message text
		this.msg = (<HTMLInputElement>message).value;
		//
		//Throw an exception when no input is provided
		if (this.msg === undefined || "")
			throw new schema.mutall_error("No message is provided for this event");
		//
		//The start_date
		this.start_date = this.get_input_value("start_date");
		//
		//Throw an exception if no date is provided
		if (this.start_date === undefined || "")
			throw new schema.mutall_error("No start date is provided for this event");
		//
		//The end date
		this.end_date = this.get_input_value("end_date");
		//
		//Throw an exception if no end date is provided for this event
		if (this.end_date === undefined || "")
			throw new schema.mutall_error("No end date is provided for this event");
		//
		//and the frequency of the job
		const freq: HTMLElement = this.get_element("frequency");
		//
		//Retrieve the frequency of the job
		this.frequency = (<HTMLInputElement>freq).value;
		//
		//Throw an exception if no frequency is provided for the job
		if (this.frequency === undefined || "")
			throw new schema.mutall_error("No frequency is provided for this event");
		//
		//Execute the current job on the server
		const scheduled = await this.mother.scheduler.execute(this);
		//
		if (scheduled !== true)
			throw new schema.mutall_error("The event was not scheduled");
		//
		//return true
		return true;
	}
	//
	//Get the at commands
	get_at_commands(): Array<lib.at> {
		//
		//Initialize the array of at jobs
		const jobs: Array<lib.at> = [];
		//
		//Get the job type
		this.job = JSON.parse(this.frequency!);
		//
		//Get the event's start_date
		if (this.job!.repetitive === "yes") {
		}
		return jobs;
	}
	//
	//Get the status of when a job is said to repetitive or
	refresh_crontab(): boolean {
		//
		//Check whether a job is repetitive or not
		const repetitive = this.job!.repetitive === "yes" ? true : false;
		//
		//return repetitive
		return repetitive;
	}
	//
	//Get the status on whether to refresh the at jobs or not
	refresh_atjobs(): boolean {
		return false;
	}
	//
	//Get the name of the job, the non-repetitive job
	get_job_name(): string {
		//
		//Check whether the job is repetitive or not.
		const repetitive: boolean = this.refresh_crontab();
		//
		//If the job is non-repetitive, get the name of the job
		const job_name: string = !repetitive ? "" : "none";
		//
		//Return the job name;
		return job_name;
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
//
//
//To support the recursion of an event, the recursion button needs to event a popup
//page, that records the recursion specified from a user's template
class get_recursion extends outlook.popup<mod.recursion> {
	//
	//The recursion of a job
	public recursion?: mod.recursion;
	//
	//
	//The constructor function
	constructor() {
		super("../templates/events_firing.html");
	}
	//
	//Collect and check the recursion data and set the result.
	async check(): Promise<boolean> {
		//
		//1. Collect and check the recursion data
		//
		//2. Set the result property to be accessed later
		this.result = {
			repetitive: "yes",
			start_date: "2022-09-20",
			end_date: "2022-09-27",
			frequency: "00 12 * * *"
		};
		return true;
	}
	//
	//Return all inputs from a html page and show cases them to a page
	async get_result(): Promise<mod.recursion> {
		//
		//Return the result that was set during the check.
		return this.result!;
	}
	//
	//There is no implementation for this method
	async show_panels(): Promise<void> {}
}
//
//THis class allows a user who wants to create a new business to provide
// the business name and the business_id to support login incase the business is
//not among the ones listed.
class register_business extends outlook.popup<outlook.business> {
	//
	//constructor
	constructor(
		//
		//A business is defined by the business_name and the business_id
		public organization?: outlook.business,
		//
		//The business, after its saved to the database
		public business?: number
	) {
		super("./new_business.html");
		//
	}
	//
	//
	//Return all inputs from a html page and show cases them to a page
	async get_result(): Promise<outlook.business> {
		return this.result!;
	}
	//
	//Collect and check the recursion data and set the result.
	async check(): Promise<boolean> {
		//
		//Create the organization typeguard
		const business = this.organization!;
		//
		//If a business id or name is not provided, throw an error
		if ((business.id && business.name === null) || undefined)
			throw new schema.mutall_error(
				"Provide the business name and the business id"
			);
		//
		//1. Get and check the business name of the element
		const name: string = this.get_input_value("name");
		//
		//2. Get and check the business_id from the business
		const id: string = this.get_input_value("id");
		//
		//The result that consitst of the business name and the business id
		this.result = { id, name };
		//
		return true;
	}
	//
	//This method sends some feedback to the user once the user has successfully
	//registered a business
	async show_panels() {
		//
		//Show an alert if a user saved the data correctly
		if (this.business === 1)
			alert(
				"You have successfully created your business,\n\
         please relogin to select the business"
			);
	}
}
//
//A new class to test the thematic panel
class theme_tester extends outlook.terminal {
	declare mother: main;
	//
	//constructor
	constructor(mother: main) {
		super(mother, "../templates/event_viewer.html");
	}
	//
	//The show panels method
	public async show_panels(): Promise<void> {
		const present = new theme.partly(["msg", "mutall_users"], "message", this);
		//
		present.continue_paint();
	}
}
