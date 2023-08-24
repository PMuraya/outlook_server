//Support for sql formulations
//
//Resolve references to the schema model
//
//Resolve the schema classes, viz.:database, columns, mutall e.t.c. 
import * as schema from "../../../schema/v/code/schema.js";
//Defines a joint between 2 entities, major and minor: The joint has the form:-
//$inner JOIN $entity1 ON $col11 = $col12
//where 
//entity1 is the major entity
//col1 is the column on the majors entity0
//col2 is the column on the minor entity to be joined to col1                     
export class joint {
    entity1;
    entity2;
    type;
    constructor(entity1, entity2, type = 'inner') {
        this.entity1 = entity1;
        this.entity2 = entity2;
        this.type = type;
    }
    //
    //Convert a joint to a string
    toString() {
        //
        //Use the current applications databases to get the 2 columns  to be 
        //joined. They must exist; otherwise an exception is raised
        const [col1, col2] = this.get_columns();
        //
        return `${this.type} JOIN ${this.entity1} ON ${col1}=${col2}`;
    }
    //Returns the columns that take part in this a joint.  One column must a 
    //foreinn key column, the other must be a primary one.
    get_columns() {
        //
        //Test if the first entity has the the foreign column
        const joint1 = joint.get_columns(this.entity1, this.entity2);
        //
        //If it is foreigner, return the foreign and primary columns in that order
        if (joint1 !== false)
            return joint1;
        //
        //If it is not a foreigner, test if the 2nd partcipant is a foreigner
        const joint2 = joint.get_columns(this.entity2, this.entity1);
        //
        //If it is a foreingner, return the primaty and foreign columns in that order
        if (joint2 !== false)
            return joint2;
        //
        //If it is not, then the 2 participants cannot form a valid joint. Its
        //an error
        throw new schema.mutall_error(`Entities ${this.entity1} and ${this.entity2}  cannot form a joint`);
    }
    //Assume that the first column has the foreign key that points to the primary
    //key of the the 2nd entity. If that is the case retuirn teh forein and primary
    //keys in that order. If not, retirn false
    static get_columns(e1, e2) {
        //
        //Get all the foreign key columns of the first entity.
        const foreigns1 = Object.values(e1.columns).filter(col => col instanceof schema.foreign);
        //
        //Filter the columns that point to the 2nd entity
        const foreigns2 = foreigns1.filter(col => {
            //
            //Get the foreign key entity reference
            const { dbname, ename } = col.ref;
            //
            //Retrieve the referenced entity from the current application;
            const entity = schema.databases[dbname].entities[ename];
            //
            //Compare the referenced and the 2nd particiant entities and
            //Return whether they match or not
            return entity === e2;
        });
        //
        //Count the entries found
        const count = foreigns2.length;
        //
        //It is an error if there is more than one: its a sign of bad data modelling
        if (count > 1)
            throw new schema.mutall_error(`Bad modelling. There are 2 colums, foreigns2, that point to the same entity ${e2}`);
        //
        //Return false if there are are no foreign key in the list
        if (count === 0)
            return false;
        //
        //Return the found foreign key column and the proimary key of the 2nd entity
        return [foreigns2[0], e2.columns[e2.name]];
    }
}
//The join of an sql is defined as a list of joints
export class join {
    joints;
    //
    //A join is defined as a list of joints
    constructor(joints) {
        this.joints = joints;
    }
    //
    //Convert a join to a string of the form:-
    // $inner JOIN $entity1 ON $col11 = $col12
    // $inner JOIN $entity2 ON $col21 = $col12
    // $inner JOIN $entity3 ON $col31 = $col32, etc
    toString() {
        //
        //Convert all the joints to strings, each on its own line and indented
        const joints = this.joints.map(joint => `\n\t${joint}`);
        //
        //Retrns the list of joins with a new line separator 
        return joints.join("\n");
    }
}
//
//The base class for all sql statements.
export class stmt {
    //
    //The sql constuctor. For now it does nothing
    constructor() {
    }
    //
    //The string version of an sql. It has the following 
    //simple structure:-
    // select $expressions from $from $join where $where.
    // where:- 
    //  - $fields are named or unnamed expressions.
    //  - $from corresponds the main tabel the drives the sql.
    //  - $join is a set of joins connecting to the $from.
    //  - $where is an expression that yields a boolean value.
    toString() {
        //
        //Convert the select expressions into a comma separated string list
        const fields = this.select.map(field => `${field}`).join(", \n");
        //
        //Compile the complete sql statement.
        const statement = `
            select 
                ${fields} 
            from 
                ${this.from} 
                ${this.join} 
            where ${this.where}`;
        //
        return statement;
    }
}
//The implementtaion of a standard sql statement
class stmt_std extends stmt {
    select_;
    from_;
    join_;
    where_;
    //
    constructor(select_, from_, join_, where_) {
        super();
        this.select_ = select_;
        this.from_ = from_;
        this.join_ = join_;
        this.where_ = where_;
    }
    //
    //The expressions that forms the fields of a select sttaement
    get select() { return this.select_; }
    //
    //The from clause is a schema table
    get from() { return this.from_; }
    //
    //The join clause
    get join() { return this.join; }
    //
    //The where clause is an expression that yields a boolean
    get where() { return this.where_; }
    ;
}
