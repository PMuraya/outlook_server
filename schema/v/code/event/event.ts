//The following code contains classes of an event plan that complement those in 
//mutall_users.ts. The ones in mutall_users are automatically generated using 
//the relational model; those in this file are manually added to support 
//implementation of event plan initialization and cancelling methods.

import * as server from "./../server.js";

export type linux_command = string; 

//
export class entry{
    constructor(public cmd:linux_command){}
}

export class at_entry extends entry{
    constructor(cmd:linux_command, public date:Date){
        super(cmd);
    }
}

export class crontab_entry extends entry{
    constructor(cmd:linux_command, public frequency:string){
        super(cmd);
    }
}

export abstract class scheduler{
    //
    constructor(public entries:Array<entry>){}
    //
    //Returns true if it is necessary to refresh theh scehduler
    refresh_is_necessary():boolean{
        return this.entries.length>0 
    }
    
    //Refreshing a schedular means claring all ruuning jobs and re-submiting a 
    //fresh set derived from relevant entries in mutall_users database 
    abstract refresh():Promise<void>
}

export class at_scheduler extends scheduler{
    //
    //Crontab entries
    declare public entries:Array<at_entry>;
    //
    constructor(entries:Array<entry>){
        const myentries = entries.filter(entry=>entry instanceof  at_entry)
        super(myentries);
        
    }

    //Refresh the at jobs
    async refresh(): Promise<void> {
        //
        await server.exec('at_scheduler', [], 'refresh', [])
    }

}

export class crontab_scheduler extends scheduler{
    //
    //Crontab entries
    declare public entries:Array<crontab_entry>;
    //
    constructor(entries:Array<entry>){
        const myentries = entries.filter(entry=>entry instanceof  crontab_entry)
        super(myentries);
        
    }
    //
    //Refresh the crontab
    async refresh(): Promise<void> {
        //
        await server.exec('crontab_scheduler', [], 'refresh', []);
    }
}
