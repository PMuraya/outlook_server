//The following code contains classes of an event plan that complement those in 
//mutall_users.ts. The ones in mutall_users are automatically generated using 
//the relational model; those in this file are manually added to support 
//implementation of event plan initialization and cancelling methods.
import * as server from "./../server.js";
//
export class entry {
    cmd;
    constructor(cmd) {
        this.cmd = cmd;
    }
}
export class at_entry extends entry {
    date;
    constructor(cmd, date) {
        super(cmd);
        this.date = date;
    }
}
export class crontab_entry extends entry {
    frequency;
    constructor(cmd, frequency) {
        super(cmd);
        this.frequency = frequency;
    }
}
export class scheduler {
    entries;
    //
    constructor(entries) {
        this.entries = entries;
    }
    //
    //Returns true if it is necessary to refresh theh scehduler
    refresh_is_necessary() {
        return this.entries.length > 0;
    }
}
export class at_scheduler extends scheduler {
    //
    constructor(entries) {
        const myentries = entries.filter(entry => entry instanceof at_entry);
        super(myentries);
    }
    //Refresh the at jobs
    async refresh() {
        //
        await server.exec('at_scheduler', [], 'refresh', []);
    }
}
export class crontab_scheduler extends scheduler {
    //
    constructor(entries) {
        const myentries = entries.filter(entry => entry instanceof crontab_entry);
        super(myentries);
    }
    //
    //Refresh the crontab
    async refresh() {
        //
        await server.exec('crontab_scheduler', [], 'refresh', []);
    }
}
