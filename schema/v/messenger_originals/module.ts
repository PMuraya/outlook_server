//
//Resolve reference to the server
import * as server from "../../../schema/v/code/server.js";
//
//Resolve reference to the library
import * as lib from "../../../schema/v/code/library";
//
//Resolve references to the questionnaire that facilitates saving data to the files
import * as quest from "../../../schema/v/code/questionnaire.js";
//
//Resolve references to the schema
import * as schema from "../../../schema/v/code/schema.js";
//
//Resolve references to the application
import * as app from "./app.js";
//
//Resolve the references to the outlook class
import * as outlook from "../../../outlook/v/code/outlook.js";
//
//A recursion is composed of data such as the minute,hour,day of the month,month,and
//the day of the week
export type recursion =
	| { repetitive: "no"; send_date: string }
	| {
			repetitive: "yes";
			start_date: string;
			end_date: string;
			frequency: string;
	  };
//
//A command is made up of a command or a message.
export type command =
	//
	//The command to be executed internally in the server. The common practice is executing classes
	//from the client and this structure allows the execution of commands from the client
	| { action: "execute"; command: string }
	//
	//The message to send to the user,given the specified text exists.
	| { action: "send"; text: string };
//
//The module class for all our developed modules
abstract class component {
	//
	//The class constructor
	constructor() {}
	//
	//Report errors this should be a popup to display the errors obtained.
	report_errors(errors: Array<string>): void {
		//
		//Get the section that will hold the errors
		const section = document.getElementById("report");
		//
		//If there is no reporting panel,use a dialog box for error reporting
		if (section === null) {
			//
			//Convert the errors into a well formatted message string
			const str: string = errors.join("\n");
			//
			//Show a dialog box of errors.
			alert(str);
			//
			//Do not continue with the process
			return;
		}
		//
		//Loop through the array of errors creating a unique error
		errors.forEach(error => {
			//
			//Add the error obtained to the section panel of the page
			section!.innerHTML = `<p>${error}</p>`;
		});
	}
}

//
//The aim of this class is to support scheduling of tasks similar to how "LINUX'S
//CRONTAB" command schedules tasks to occur at some specified frequency.
//(The scheduler executes a crontab)
export class scheduler extends component {
	constructor() {
		//
		//
		super();
	}
	//
	//Executing a crontab takes the value of "yes" to allow the user to refresh
	//the crontab and getting at jobs
	async execute(i: crontab): Promise<boolean> {
		//
		//1. Get the user input of the crontab to update the cronjobs
		const refresh: boolean = i.refresh_crontab();
		//
		//2. Get the user input on whether to rebuild the at jobs
		const rebuild: boolean = i.refresh_atjobs();
		//
		//2. Create the at start_date and end_date arrays
		//const ats: Array<lib.at> = i.get_at_commands();
		//
		//3. Get the job name
		const job_name: string = i.get_job_name();
		//
		//4. Schedule the jobs and return any errors that might occur
		const errors: Array<string> = await server.exec(
			"scheduler",
			[],
			"execute",
			[job_name, refresh, rebuild]
		);
		//
		//4. Report the errors
		if (errors.length !== 0) this.report_errors(errors);
		//
		//5. return true if there are no error
		return errors.length === 0;
	}
	//
	//Update the cronfile without directly having to fulfil the requirements of
	//the crontab
	async update_crontab(): Promise<void> {
		await server.exec("scheduler", [], "update_cronfile", []);
	}
}
//
//This is the interface which contains the specifications that
//allow the automated scheduling of tasks.
export interface crontab {
	//
	//Decide if we want to build a new crontab or not
	refresh_crontab(): boolean;
	//
	//Collect all "at" commands that are necessary for scheduling jobs
	//get_at_commands(): Array<lib.at>;
	//
	//Collect the job_name for the at command
	get_job_name(): string;
	//
	//Decide if we want to reconstruct the at jobs
	refresh_atjobs(): boolean;
}
//
//This class supports the registrar module developed for supporting recording of
// data to the database for all our template forms.(the writer saves the
// questionnaire)
export class writer extends component {
	//
	//The constructor to the class
	constructor() {
		//
		super();
	}
	//
	//Reporting errors encountered while saving the data
	report_errors(errors: Array<string>): void {}
	//
	//Allows data in the form of layouts ??
	async save(i: questionnaire): Promise<boolean> {
		//
		//1.Get the layouts from the input questionnaire
		const layouts: Array<quest.layout> = i.get_layouts();
		//
		//2. Use the layout and the questionniare class to load the data to a
		//database returning the HTML error report or Ok.
		const result: string = await server.exec(
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
		if (typeof result === "string") {
			return true;
		} else {
			throw new schema.mutall_error(`Invalid datataype loaded on ${result}`);
		}
		//
	}
}
//
//This is the questionnaire interface that drives collecting information from the level 2 registration form
//in either a label or tabular . A writer saves a questionnaire
export interface questionnaire {
	//
	//Return a collection of layouts to be used by the questionnaire for saving
	get_layouts(): Array<quest.layout>;
}
//
//The accounting class that captures transaction data in a double entry format
//which then proceeds to split into the refined data as per the DEALER model. Once
//done the transaction it is labelled as a debit or credit within an application.
//(the accounting class posts a journal)
export class accountant extends component {
	//
	//The
	//The constructor to the accounting class that will implement properties from
	//other classes.
	constructor() {
		//
		//
		super();
	}
	//
	//Errors encountered when posting journal entries to the database
	report_errors(errors: Array<string>): void {}
	//
	//A generator that obtains all layouts and labels associated with a business
	//to ready that business's id so that when we post a transaction, the credit,
	//debit,and the journal entry is part of the post.
	*collect_j_layout(j: journal): Generator<quest.layout> {
		//
		//Collect the business_id required for developing a journal
		yield ["mutall_users", "business", [], "id", [j.get_business_id()]];
		//
		//Collect the journal entry needed for posting the transaction to the
		//database
		yield* this.collect_je_layout(
			j.get_je().ref_num,
			j.get_je().date,
			j.get_je().purpose,
			j.get_je().amount
		);
		//
		//Collect the account in order to debit them
		yield* this.collect_debit_layout(j.get_debit());
		//
		//Collect the account that needs to be credited
		yield* this.collect_credit_layout(j.get_credit());
	}
	//
	//Collect journal entries needed to construct a journal layout in the
	//questionnaire
	*collect_je_layout(
		ref_num: string,
		date: string,
		purpose: string,
		amount: number
	): Generator<quest.layout> {
		//
		//Get the reference number of a journal entry
		yield ["mutall_users", "je", [], "ref_num", [ref_num]];
		//
		//Get the date associated with a particular journal entry
		yield ["mutall_users", "je", [], "date", [date]];
		//
		//Get the purpose for a defined journal entry
		yield ["mutall_users", "je", [], "purpose", [purpose]];
		//
		//Get the amount associated with a particular journal entry
		yield ["mutall_users", "je", [], "amount", [String(amount)]];
	}
	//
	//Collect the account needed to be debited
	*collect_debit_layout(account: string): Generator<quest.layout> {
		//
		//The amount to be debited to a particular account
		yield ["mutall_users", "debit", ["debit"], "amount", [account]];
	}
	//
	//Compound the accounts that need to be credited
	*collect_credit_layout(account: string): Generator<quest.layout> {
		//
		//The amount to be credited in a particular account
		yield ["mutall_users", "credit", ["credit"], "amount", [String(account)]];
	}
	//
	//Post the given account to the general ledger and return the value of true
	//if the record is saved successfully.
	async post(j: journal): Promise<boolean> {
		//
		//Collect all the details needed for posting as layouts
		const layouts = Array.from(this.collect_j_layout(j));
		//
		//Load the layouts using the required format
		const save: string = await server.exec(
			"questionnaire",
			[layouts],
			"load_common",
			[]
		);
		//
		//Check whether the data was loaded or not
		const result: boolean = save ? true : false;
		//
		return result;
	}
	//
	//Get the business unique identifier
	get_business_id(): string {
		//
		//Get the id of the business from the application
		return "";
	}
	//
	//Obtain the amount to be debited to an account
	get_debit(): string {
		return "";
	}
	//
	//Obtain the amount to be credited to an account
	get_credit(): string {
		return "";
	}
}
//
//The double entry interface allows capturing transaction data, which is later used
//to populate the different accounts.i.e., the office account
export interface journal {
	//
	//Use the currently logged in user to get business id.(What happens if a user
	//is associated with more than one business)?
	get_business_id(): string;
	//
	//Return a journal entry that has the following structure:-
	get_je(): {
		//
		//The reference number of the transaction
		ref_num: string;
		//
		//The purpose of the transaction, this allows us to tell whether the
		//payment is debit or a credit in the specific account
		purpose: string;
		//
		//The date the transaction was recorded
		date: string;
		//
		//The amount involved in the transaction
		amount: number;
	};
	//
	//post the trasaction as a debit as specified by the account type
	get_debit(): string;
	//
	//post the transaction as a credit depending on the account type. Refer at
	//the dealer platform
	get_credit(): string;
}

//
//The messenger class supports sending of emails and sms's to the members belonging
//to a specific business. A message is defined by the business and the body of
//of the message.
export class messenger extends component {
	//
	constructor() {
		super();
	}
	//
	//This allows the user to send emails and sms's to all users that belong to
	//a current business
	async send(i: message): Promise<boolean> {
		//
		//1. Broadcast this message through the server sockets
		//
		//2. Get the recipient(s)
		const recipient: lib.recipient = i.get_recipient();
		//
		//3. Get the message
		const message: { subject: string; body: string } = i.get_content();
		//
		//4. Get the technology to send the SMS with
		const technology: Array<"phpmailer" | "twilio" | "mobitech"> =
			i.get_technology();
		//
		//5.Send the message and return the errors if any
		const errors: Array<string> = await server.exec("messenger", [], "send", [
			recipient,
			message.subject,
			message.body,
			technology
		]);
		//
		//6.Report the errors
		if (errors.length !== 0) this.report_errors(errors);
		//
		//7.return true if there are no error
		return errors.length === 0;
	}
}
//
//The message interface defines the structure of the data to be colllected to
//allow users to send a message from one user to another.It collects the business
//and the body of the message defined with a subject and the messafe
export interface message {
	//
	//Get the business of the currently logged in user
	get_business(): outlook.business;
	//
	//Get the content of the message. It comprises of a subject and a body
	get_content(): { subject: string; body: string };
	//
	//Get recievers array
	get_recipient(): lib.recipient;
	//
	//Get the technology to use to send the message
	get_technology(): Array<"phpmailer" | "twilio" | "mobitech">;
}
//
//
//The Cashier class that implements that is supporting the different modes of payment
//such as M_PESA, Paypal,Cash,Cheque,and Equity.
export class cashier extends component {
	//
	//Constructor
	constructor() {
		//
		super();
	}
	//
	//Make the payment using the phone number and the message
	async pay(i: money): Promise<boolean> {
		return true;
	}
}
//
//This money/payment interface supports the different types of inputs necessary
//to authorize payments using the different forms of payment such as M-PESA and
//Equity.
export interface money {
	//
	//1. As a common base, each form of payment needs some amount of money
	get_amount(): number;
	//
	//2. We will need to sum up all other variables as part of optional variables
	//within a tuple of elements
	//
	//The phone number to send the message
	get_fullname(): string;
}
////
////The Whatsapp class that supports sending messages to WhatsAp group members
//class whatsapp extends messenger implements message {
//    //
//    //
//    constructor() {
//        super();
//    }
//    //
//    //Get the body of a message
//    //
//    //Send the message to the whatsapp groups. In this case, should the
//    async send(media: message): Promise<boolean> {
//        //
//        return true;
//    }
//
//}
