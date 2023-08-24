//
import * as server from '../../../schema/v/code/server.js';
//
import * as schema from '../../../schema/v/code/schema.js';
//
//This class is the home of all methods that are common to all our modules.
//For instance, all modules should be able to report errors to the user.
export class component {
    //
    constructor() { }
    //
    //This method is called when we need to report errors. It must be implemented
    //by all modules.
    report_errors(errors) {
        //
        //Loop through the array of errors.
        errors.forEach(error => {
            //
            //Add the error to the dialogue
            alert(error);
        });
    }
    ;
}
//
//This class supports the registrar module developed for supporting recording of
// data to the database for all our template forms.(the writer saves the
// questionnaire)
export class writer extends component {
    //
    //The conctructor of the class.
    constructor() {
        //
        super();
        //
    }
    //
    //Get the data in the form layouts and save the data to the database .
    //The return value is true if it is successful otherwise it is false.
    async save(data) {
        //
        //1. Get the layout from the input questionnaire
        const layout = data.get_layouts();
        //
        //2. use the layout and questionnaire  to load the data to the database
        //returning ok if successful or an error message if it failed.
        const result = await server.exec(
        //
        //Use the questionnaire class to load data.
        "questionnaire", 
        //
        //The only parameter required to construct a questionnaire is layouts[].
        [layout], 
        //
        //Use the more general version of loading that returns a html report.
        "load_common", 
        //
        //Call the load common without any parameters.
        []);
        //
        //3. Check to see if the data was saved successfully if yes return true
        //if not return false with the error reporting for checking.
        if (result !== 'Ok')
            throw new schema.mutall_error(result);
        //
        return true;
    }
}
//
//The accounting class that captures transaction data in a double entry format
//which then proceeds to split into the refined data as per the DEALER model. Once
//done the transaction it is labelled as a debit or credit within an application.
//(the accounting class posts a journal)
export class accountant extends component {
    //
    constructor() {
        //
        super();
    }
    //
    //For reporting any error that occurs to aid in debugging.
    report_error() { }
    //Post the given accounts to the general ledger and return true is
    //successful and false otherwise.
    async post(je) {
        //
        //1.Collect as many labels as are neccessary for effective posting of the journal
        //guided by the simple template and the accounting sub-model.(fn)
        const layouts = Array.from(this.collect_layouts(je));
        //
        //2. Use the questionnaire class in php to load the labels to the database.(pk)
        const answer = await server.exec(
        //
        //Use the questionnaire class to load data.
        "questionnaire", 
        //
        //The only parameter required to construct a questionnaire is layouts[].
        [layouts], 
        //
        //Use the more general version of loading that returns a html report.
        "load_common", 
        //
        //Call the load common without any parameters.
        []);
        //
        //3. Check to see if the data was saved successfully if yes return true
        //if not return false with the error reporting for checking.
        if (answer !== 'Ok') {
            throw new schema.mutall_error(answer);
        }
        //
        return true;
        //
        //4. Otherwise report the error message and return false.(pm)
    }
    //
    //Collect all the layouts of the journal for saving to the database.
    *collect_layouts(je) {
        //
        //The database to save the data.
        const dbname = "mutall_users";
        //
        //The entity name.
        const ename = "je";
        //
        //1 Get the journal entries, credit and debit accounts.
        const { ref_num, purpose, date, amount } = je.get_je();
        //
        //Get the reference number
        yield [dbname, ename, [], "ref_num", ref_num];
        //
        //Get the purpose of the transaction
        yield [dbname, ename, [], "purpose", purpose];
        //
        //Get the date the transactoin was carried out.
        yield [dbname, ename, [], "date", date];
        //
        //Get the amount in the transaction
        yield [dbname, ename, [], "amount", amount];
        //
        //2 Get data for the account to credit.
        const credit = je.get_credit();
        //
        //Get the credit table.
        yield [dbname, "credit", [credit], "credit", null];
        //
        //Fill the is_valid;
        yield [dbname, "credit", [credit], "is_valid", 1];
        //
        //Get the account to credit the transaction:-
        // -id.
        yield [dbname, "account", [credit], "id", credit];
        // -name.
        yield [dbname, "account", [credit], "name", credit];
        //
        //3 Get the account to debit;
        const debit = je.get_debit();
        //
        //Get the debit table.
        yield [dbname, "debit", [debit], "debit", null];
        //
        //Fill the is_valid;
        yield [dbname, "debit", [debit], "is_valid", 1];
        //
        //Get the account to debit the transaction:-
        // -id.
        yield [dbname, "account", [debit], "id", debit];
        // -name.
        yield [dbname, "account", [debit], "name", debit];
        //
        //4. Get the business id.
        const id = je.get_business_id();
        //
        yield [dbname, "business", [], "id", id];
        //
    }
}
//
//The messenger class supports sending of messages from one user to another but
//the functionality changes in different applications.(The messenger sends a
//message)
export class messenger extends component {
    //
    constructor() {
        //
        super();
    }
    //
    //This allows the user to send emails and sms's to all users that belong to
    //a current business
    async send(i) {
        //
        //1. Get the recipient(s)
        const recipient = i.get_recipient();
        //
        //2. Get the message
        const message = i.get_content();
        //
        //3.Send the message and return the errors if any
        const errors = await server.exec("messenger", [], "send", [
            recipient,
            message.subject,
            message.body
        ]);
        //
        //4.Report the errors
        if (errors.length !== 0)
            this.report_errors(errors);
        //
        //5.return true if there are no error
        return errors.length === 0;
    }
}
//
//Allow performing of cron jobs without a persons involvement.
export class scheduler extends component {
    //
    constructor() { super(); }
    //
    //To set the tasks that need to carried out at
    //a later time and others that are repetitive to
    //allow a user to set this tasks ahead of time
    //increasing the systems automation process.
    //
    //Executing a crontab takes the value of "yes" to allow the user to refresh 
    //the crontab and getting at jobs
    async execute(i) {
        //
        //1. Get the user input of the crontab to update the cronjobs
        const refresh = i.refresh_crontab();
        //
        //2. Create the at start_date and end_date arrays
        const ats = i.get_at_commands();
        //
        //3. Get the job name.
        const job_name = i.get_job_name();
        //
        //3. Schedule the jobs and return any errors that might occur
        const errors = await server.exec("scheduler", [], "execute", [job_name, refresh, ats]);
        //
        //4. Report the errors
        if (errors.length !== 0)
            this.report_errors(errors);
        //
        //5. return true if there are no error
        return errors.length === 0;
    }
}
//
//This class supports the payments made. This is done by invoking the accountant and
//have a record of each transaction.
export class cashier extends component {
    //
    constructor() {
        //
        super();
    }
    //
    async pay(py) {
        //
        return true;
    }
}
export class loading extends component {
    //
    constructor() {
        super();
    }
    //
    async load(l) {
        //
        return true;
    }
}
