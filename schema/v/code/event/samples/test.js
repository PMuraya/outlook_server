//Resolve references to the mutall_users class model (derived from mutall_users
//database)
import * as mutall_user from "./../mutall_users.js";
//
//Run a test for scheduling a simple 'echo' command to be executed once at 
//2 minutes from now
export function once(file) {
    //
    //The business that this plan is linked to
    const business_id = 'mutall_data';
    //
    //Name of the one-off activity
    const name = 'Testing';
    //
    //The time when the command is executed -- using the date command
    //substitution method
    const time = '$(date)';
    //
    //Construct the message to log when the test is successful. 
    //It consists of:-
    //- the name of the acitivity
    //- the liunx date/time when the command is executed
    const msg = `Name=${name}, at: ${time}`;
    //
    //The linux command to execute:-
    //Write the message to the named file
    const cmd = `echo ${msg}>>${file}`;
    //
    //Date when the command will be executed:-
    //2 minutes from now.
    const date = new Date(
    //
    //Get the date for now (in milliseconds since midnight 1st Jan 1970).
    Date.now()
        //
        //Add 2*60*1000 -- the number of milliseconds in 2 minutes    
        + 2 * 60000);
    //
    //Create the event, to output the message 2 minutes later
    const Event = new mutall_user.once(business_id, name, cmd, date);
    //
    //Initiate the scheduling
    Event.initiate();
}
//Cancel a scehduled event
export async function cancel() {
    //
    //Specify the primary key of the event to cancel
    const pk = 1;
    //
    //Create the activity; we must know its type -- that is the 
    //assumption -- so that the user only has to supply the primary
    //key. 
    //The method is synchronous, as the data comes from the server. 
    //Seek throws an exception if it fails for whatever reason.
    const Plan = await mutall_user.event.seek(pk);
    //
    //Cancel the plan
    await Plan.cancel(pk);
}
//Test the scheduling of a recurrent plan.
export async function repetive(file) {
    //
    //The business to be associated with this plan
    const business_id = 'mutall_data';
    //
    //Name of the repetitvely executed plan
    const name = 'Test Scheduling a Repetitive Plan';
    //
    //Construct the message to log when the test is successful. 
    //It consists of:-
    //- the name of the acitivity
    //- the linux date/time when the command is executed. Note how we
    //use the command substitution method to capture the 
    //dat/time echoedf by the linux date command
    const msg = `Name=${name}, at: $(date)`;
    //
    //Compile the linux command to execute. The command is:-
    //Write the message to the named file
    const cmd = `echo ${msg}>>${file}`;
    //
    //Specify the date when the command will start to be be executed as 
    //2 minutes from now.
    const start_date = new Date(
    //
    //Get the current date and time (in milliseconds since midnight 1st Jan 1970).
    Date.now()
        //
        //Add 2*60*1000 -- the number of milliseconds in 2 minutes    
        + 2 * 60 * 1000);
    //
    //Specify the frequency of executing the command. It is after 
    //every 1 minute
    //
    //Crontab star positions
    //Minute 1-60
    //Hour 1-24
    //Day 1-31
    //Month 1-12
    //Day of Week 1-7
    const frequency = "*/1 * * * * *";
    //
    //Specify the date when the command will stop to be be executed as 
    //10 minutes from now.
    const end_date = new Date(
    //
    //Get the current date and time.
    Date.now()
        //
        //Add 10*60*1000 -- the number of milliseconds in 10 minutes    
        + 10 * 60 * 1000);
    //
    //Create the repetive event 
    const Event = new mutall_user.repetitive(business_id, name, cmd, frequency, start_date, end_date);
    //
    //Initiate the scheduling
    Event.initiate();
}
