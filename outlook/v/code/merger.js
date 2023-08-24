//To access the method for talking to the server in order to execute
//the PHP based mathods
import * as server from "../../../schema/v/code/server.js";
//
//To access utilites developed in Outlook project and shared by
//other view-based applications, e.g., get_element(id:string), create_element
import * as outlook from "./outlook.js";
//
//Resolve access to the mutall errorclass 
import * as schema from "../../../schema/v/code/schema.js";
//
//The merger class kills two birds with one stone: it acts as a baby, i.e., a 
//data colcecting window (hence the extension) and it imlements the the 
//merging process -- hence the imerge extensiion. The baby parameter data type
//is the primary key of the principal member that received all the consolidation 
//data, i.e., the result of the merge operation.
//
//NB. Implementation of the Imerge interface is critical because we it
//is required to implement the constructor methods of the merger 
//merger class defined in PHP
export default class merger extends outlook.baby {
    //
    imerge;
    //
    //Implementation of the Imerge interface
    get dbname() { return this.imerge.dbname; }
    get ename() { return this.imerge.ename; }
    get members() { return this.imerge.members; }
    //
    //Track the current class for global access
    static current;
    //
    //The stack for supporting detection of endless merger execution
    static stack = [];
    //
    //The members that drive the merging process
    get principal() { return this.imerge.principal; }
    ;
    get minors() { return this.imerge.minors; }
    ;
    //
    constructor(imerge, mother) {
        //
        //The merger uses the general template. It will be modified by 
        //show_panels to refflect the ned of the merger
        const url = "/outlook/v/code/general.html";
        //
        //Initialize the baby view
        super(mother, url);
        //
        //Initialize the view class
        this.imerge = imerge;
    }
    //
    //The baby merger returns the primary key of the principal
    //member
    async get_result() {
        //
        //Get the principal that received all the consolidations
        const principal = this.imerge.principal;
        //
        //Convert the principal to a number (to conform with the required
        //output)
        const result = Number(principal);
        //
        //Return a new promise which resolves to the principal 
        return result;
    } //
    //
    //The baby merger page has no checks to do
    async check() {
        //
        //Return true only if the principlal is set; otherwise it is false;
        return (this.imerge.principal !== undefined);
    }
    //
    //Paint the general page with merger specific elements, then execute the
    //merge process
    async show_panels() {
        //
        //The general template used for ther merging  process has all the
        //elements we need; 
        //
        //Execute the merger process
        await this.execute();
    }
    //
    //Get the details of the members to merge
    get_imerge() {
        //
        //Get the dbname from the curret window document
        const dbname = this.get_element('dbase').value;
        //
        //Read the reference entity name
        let ename = this.get_element('ename').value;
        ;
        //
        //Read the members sql
        let members = this.get_element('members').value;
        ;
        //
        return { dbname, ename, members };
    }
    //Merge the members of this object
    async execute() {
        //
        //Avoid endless looping
        //
        //Get the key merge parameters
        const key = {
            dbname: this.dbname,
            ename: this.ename,
            members: this.members
        };
        //Stop if the key is already in the stack
        if (merger.stack.includes(key))
            throw new schema.mutall_error("Endless looping for Imerge '" + JSON.stringify(key) + "'");
        //
        //Push the merger key to the stack
        merger.stack.push(key);
        //
        //
        //From the members identify the principal and the minor players.
        const players = await this.get_players();
        //
        //Proceed only if the players are valid
        if (players === null) {
            await this.report(true, "Merging is not necessary");
            return null;
        }
        //
        //There is are principal and minor members, therefore, merging is 
        //feasible.
        //
        //Destructure the player to access the principal and the minor
        //members
        const { principal, minors } = players;
        //
        //Save the principal and minors to this object for referencing 
        //elsewhere.
        this.imerge.principal = principal;
        this.imerge.minors = minors;
        //
        //Get the interventions
        const interventions = await this.consolidate();
        //
        //Remove the minors
        await this.clean_minors(interventions);
        //
        //Remove the merger key from the stack
        merger.stack.pop();
        //
        //Report; its not an error
        await this.report(false, "Merging was successful");
        //
        //Return the princioal primary key that
        return this.imerge.principal;
    }
    //Delete the minors until there are no integrity errors; then update
    //the principal with the consolidations
    async clean_minors(consolidations) {
        //
        //Redirect the minors to the principal until all the minors 
        //can be deleted without violating the unique index integrity contraint.
        let deletion;
        while ((deletion = await this.delete_minors()) !== 'ok') {
            //
            //Redirect all contributors pointing to the minors to point
            //to the principal
            await this.redirect_minors(deletion);
        }
        //
        //3. Update the principal
        await this.update_principal(consolidations);
    }
    //Redirect all contributors pointing to the minors to point
    //to the principal. The given list of pointers must be the dones that
    //caused the previous deltion process to fail, so integrity must have been
    //violated
    async redirect_minors(pointers) {
        //
        //Avoid cyclic merging possibility by first attending to structural 
        //member ponters followed by the cross members.
        for (let cross_member of [false, true]) {
            //
            //Select pointers that match the cross member frag
            let selected_pointers = pointers.filter(pointer => pointer.is_cross_member = cross_member);
            //
            //For every selected pointer...
            for (let pointer of selected_pointers) {
                //
                //...re-direct the pointer to the principal until redirection
                //is successful.
                let redirection;
                while ((redirection = await this.redirect_pointer(pointer)) !== 'ok') {
                    //
                    //Redirection of the current pointer was not successful
                    //(because of referential integrity violation)
                    //
                    //Merge the pointer members and re-try
                    await this.merge_pointer_members(pointer, redirection);
                }
            }
        }
    }
    //Merge the members of the pointer
    async merge_pointer_members(pointer, indices) {
        //
        //On an index by index basis....
        for (let index of indices) {
            //
            //...and on a signature by signature basis....
            for (let signature of index.signatures) {
                //
                //Merge the pointer members that share the 
                //same signanture
                //
                //Compile the Imerge data
                //
                const dbname = pointer.dbname;
                const ename = pointer.ename;
                //
                //Set the cname to sgnify that te next merge oparation 
                //originated from a pointer
                const cname = pointer.cname;
                //
                //Use the signaure to constrain the pointer members
                const members = `
                    SELECT
                        member 
                    FROM
                        (${index.members}) as member
                    WHERE `
                    //
                    //Trimming was found necessary to remove spurios 
                    //leading and/trailing charatcters
                    + ` trim(signature)='${signature}'
                `;
                //
                //Assemble the imerge components together
                const imerge = { dbname, ename, cname, members };
                //
                //Use the pointer members, a.k.a., contributors, 
                //to start a new merge operation using this merger page as 
                //the new mother
                const $merger = new merger(imerge, this);
                //
                //Do the merger administration
                await $merger.administer();
            }
        }
    }
    //Get the consolidation data
    async consolidate() {
        //
        //Get the consolidation data
        let consolidation;
        consolidation = await this.get_consolidation();
        //
        //Use the consolidates to resolve conflicts if any
        let interventions = [];
        if (consolidation.dirty.length != 0)
            interventions = await this.intervene(consolidation.dirty);
        //
        //Consolidate all the member properties to the principal
        return consolidation.clean.concat(interventions);
    }
    //
    //Here we allow the user to :-
    //- select correct values from the incoherent ones,
    //- process the selected values and 
    //- send them to the server.
    async intervene(conflicts) {
        //
        //Compile the interventions Html for loading to the resolution panel
        //Map the conflicts to matching fields sets
        const fields = conflicts.map(conflict => {
            //
            //Destructure the conflict
            const { cname, values } = conflict;
            //
            //Convert the values to matching radio buttons, assuming that these
            //buttons are part of the current application, and so we have access
            //to class app
            const radios = values.map(value => `
                <label>
                    <input type = 'radio' name='${cname}' value='${value}'
                        onclick = "app.current.show_panel('${cname}_group', false)"
                    />
                    ${value}
                </label>
            `);
            //Add the 'Other/specify' option
            radios.push(`
                <label>
                    <input type = 'radio' name='${cname}' value='other'
                      onclick = "app.current.show_panel('${cname}_group', true)"
                    />
                    Other
                    <div id='${cname}_group' hidden>
                        <label>
                            Specify:<input type = 'text' id='${cname}'/>
                        </label>
                    </div>
                </label>
            `);
            //
            //Return a field set that matches the column name
            return `
            <fieldset>
                <legend>${cname}</legend>
                ${radios.join("\n")}
            </fieldset>
            `;
        });
        //
        //
        //Get the panel to handle the resolutions; it is the content tag
        const resolution = this.get_element('content');
        //
        //Write the intervention sql to the pannel
        resolution.innerHTML = fields.join("\n");
        //
        //Get the go button to program the conlcik event
        const button = this.get_element('go');
        //
        //Wait/return for the user's response to resolve 
        //the required promise
        return await new Promise(resolve => {
            button.onclick = () => {
                //
                //Get the checked values for each conflict
                const interventions = conflicts.map(conflict => {
                    const cname = conflict.cname;
                    const value = this.get_checked_value(cname);
                    return { cname, value };
                });
                //
                //Check that all the interventions are catered for
                for (let intervention of interventions) {
                    if (intervention.value === null) {
                        alert(`Please resolve value for ${intervention.cname}`);
                        return;
                    }
                }
                //
                //Resolve the promise
                resolve(interventions);
            };
        });
    }
    //Return the named checked value is selected; otherwise null
    get_checked_value(cname) {
        //
        //Get the identified column
        const radio = document.querySelector(`input[name='${cname}']:checked`);
        //
        //Return a null value if a named radion is not set
        if (radio === null)
            return null;
        //
        //Get the value
        let value = radio.value;
        //
        //If the value is other, read the specify field
        if (value === 'other') {
            //
            //Read the other/specify field. It must be set
            const elem = this.get_element(cname);
            //
            value = elem.value;
            //
            if (value === '')
                return null;
        }
        return value;
    }
    async get_players() {
        return await server.exec("merger", [this.imerge], "get_players", []);
    }
    async get_consolidation() {
        return await server.exec("merger", [this.imerge], "get_consolidation", []);
    }
    async delete_minors() {
        return await server.exec("merger", [this.imerge], "delete_minors", []);
    }
    async redirect_pointer(pointer) {
        return await server.exec("merger", [this.imerge], "redirect_pointer", [pointer]);
    }
    async update_principal(c) {
        return await server.exec("merger", [this.imerge], "update_principal", [c]);
    }
}
