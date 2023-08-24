//The mutall mesaging system
//
//Resolve recipient
import * as lib from '../library';

//Resolve references to teh user
import * as outlook from '../../../../outlook/v/code/outlook.js';

import * as server from './../server.js';

//
//Message reciepient

//
//This class is the core of mutall's messaging system
export class message{
    //
    //The content of the message; it may be plain text or a formated HTML
    public content:lib.content;
    //
    //The targeget recipient of the message
    public recipient:recipient;
    //
    //The technologies to be used for sending the message
    public technologies:Array<technology>; 
    //
    constructor(
        content:lib.content, 
        technologies:Array<lib.technology_id>,
        Recipient:lib.recipient
    ){
        this.content = content;
        //
        //Conver the sttaic form of a recipient to a class object
        this.recipient = recipient.create(Recipient);
        //
        //Get the technologies for sending this message
        this.technologies = technologies.map(
            techid=>technology.create(techid, this.recipient)
        );
    }
    //
    //Send this message to all the recipients
    async send():Promise<void>{
        //
        //Get the number of addresses for all the techologies
        const addresses:Array<number> = [];
        for(const tech of this.technologies){
            addresses.push(await tech.get_count());
        }
        //
        //Get the maximum number of recipient from all the technolgies.
        const max = Math.max(...addresses);
        //
        //Use this max page size to to drive the pagigation
        for(let offset=0; offset<max; offset += technology.page_size){
            //
            //Step throug each techology
            for(const technology of this.technologies){
                //
                //Only those case where the number of addresses are greater or 
                //teh current offset are considerd
                if (await technology.get_count()>=offset) continue
                //
                //Send messages statring from the given page, up to teh page
                //sixe defiend for all the technolgies
                await technology.execute(this.content, offset);
            }
        }
    }
}


//This class suports messageing between a message sender and 
//a) the entire business/group for which he is logged
//b) selected members of the group
export abstract class recipient{
    //
    constructor(){}
    //
    //Returns the caluse needed for extending a user. By default there
    //is none. For the grouo recipient, we need to add a bsuoness throuh 
    ////membership
    get join():string{return ""};
    //
    //The clasues for filteringing recipients
    abstract get where():string;
    //
    //Create a recipient class object from the equivalent static object
    static create(recipient:lib.recipient):recipient{
        //
        switch(recipient.type){
            case 'group':return new group(recipient.business);
            case 'individual': return new individual(recipient.users);
        }
    }
}

//Enture group/business as a recient
export class group extends recipient{
    //
    //The business associated with this group
    public business:outlook.business;
    //
    constructor(business: outlook.business){
        super();
        this.business=business;
    }
    
    //Returns the join clause thta matches a group query, by joining
    //user to business through membership
    get join():string{
        return ` 
            inner join member on member.user=user.user
            inner join business on business.business= member.business`;
    }
    //
    //Returns the where clasues by filtering addresses that belong
    //are associate with current bsuiness
    get where():string{
        return `business.id= '${this.business.id}'`
    }
}

//This class represents selected individuals from a user group
export class individual extends recipient{
    //
    //The users that constitutes the receivers of this message
    public selection:Array<lib.username>;
    
    constructor(selection:Array<lib.username>){
        //
        super();
        //
        this.selection = selection;
    }
    
    //The clause for filtering users
    get where():string{
        //
        //Get the usernames from the selection, speratoirs by a comma
        const names = this.selection.map(
            //
            //Enclose teh name in quotes
            name=>`'{$name}'`
       )
       //Add the comma separaror
       .join(', ');
        
        return `user in (${names})`;
    }
}

//Techologies used for sending messages
export abstract class technology{
    //
    //
    //The number of addressees to be sent this message. It value is set when we
    //rettrieve the count from the database
    public qty?:number;
    //
    //
    //The page size for sending messages. Why 20?
    static page_size:number = 20;
    //
    constructor(public recipient:recipient){}
    //
    //Create a messaging techology, given its id and the recipient.
    static create(techid:lib.technology_id, recipient:recipient):technology{
        //
        switch(techid){
            case 'mailer':return new mailer(recipient);
            case 'twilio':return new twilio(recipient);
            case 'mobitech': return new mobitech(recipient);
        }
    }
    
    //Get teh sql for retyrieving addresses
    abstract get sql():string;
    //
    //Send messages starting from the given page offset, up to the page
    //size defined for all the technologies
    async execute(content:lib.content, offset:number):Promise<void>{
        //
        await server.exec(
            //
            //The required class matches the technology constructor. Its one
            //of the following: 
            <'mailer'|'mobitech'|'twilio'> this.constructor.name,
            //
            //Construction of a messaging technology needs the sql for retrieving
            //addressees
            [this.sql],
            //
            //Use the exceute method
            'execute',
            //
            //To use a technology for sending a message, we need...,  
            [
                //
                //...the message content
                content, 
                //
                //...the current (sql) page offset and its size
                {offset, size:technology.page_size}
            ]
        );
    }
    

    //Get the count of addresses to send this message to
    async get_count():Promise<number>{
        //
        //Check teh buffer first
        if (this.qty!==undefined) return this.qty;
        //
        //Use the server to get the count, saving it to the buffer to a void a
        //server re-visit
        return this.qty = await server.exec(
            this.constructor.name as lib.technology_id,
            [this.sql],
            'get_count',
            []
        );
    }

    //Prices (in Ksh) for variouts technologies
    public static prices:{[key in lib.technology_id]:number}={
        'mailer':0,
        'mobitech':0.35,
        'twilio':10
    }
    
    //The cost of sending a message using thois techlogy
    async get_cost():Promise<number>{
        return technology.prices[<lib.technology_id>this.constructor.name] * await this.get_count();
    }
}

//A email system based on PHP mailer. An email address is required, but sending
//a message has no direct cost.
export class mailer extends technology{
    
    constructor(recipient:recipient){
        //
        super(recipient);
    }
    
    //Returns the sql for retrieving all valid email addresses 
    get sql():string{
        //
        //The query to fetch all emails for users specifid by the
        //recipient
        return `
            select
                user.email as address,
                user.name  as username
            from user 
                ${this.recipient.join}
            where ${this.recipient.where}
                and not(user.email is null) 
            `;
    }
}

//Sms technology
export abstract class sms extends technology{
    //
    constructor(recipient:recipient){
        super(recipient);
    }
    
    //Returns the sql for retrieving message recipients
    get sql(){
        return `
            with
                #
                #Get the primary phone number of each user
                mobile as(
                    select
                        concat(mobile.prefix, mobile.num) as address,
                        row_number() over(partition by mobile.user) as counter,
                        user.name as username
                    from user
                        inner join mobile on mobile.user= user.user
                        ${this.recipient.join} 
                    where ${this.recipient.where}
                )
                #
                #Assume that the primary phone is the first one among many
                select address, username from mobile where counter=1";
      `
    }
}


//This is one of the cheapest sms-base techlogy, at sh. 0.35 per message. Even
//Safaricom is one of thier clients
export class mobitech extends sms{
    //
    constructor(recipient:recipient);
    
}

//This mesaging system is very international, but very expensive at sh.10.00 
//per user.  Registration with Twilio is required. Their initial cost is not as 
//high as that of AfracasTalking.
export class twilio extends sms{
    //
    constructor(recipient:recipient);
    
}

