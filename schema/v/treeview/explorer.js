//This serves as a demo of how to use the treeview/exploer
//
//Resolve references to the schema (database)
import * as schema from "../code/schema.js";
//
//To resolve the server methods
import * as server from "../code/server.js";
//Resolve reference to the tree viewer
import * as tree from "./tree.js";
//Resolve reference to e-a-r model
import * as ear from "./ear.js";
//View related (non-hierarchical) records from a database based
//on the mutall-compliant E-A-R model, to support the CAQ idea
export async function explore() {
    //
    //Formulate the root node
    //
    //Define the starting entity name for the  explorer
    const ename = 'school';
    //
    //Get the school database
    const Idbase = await server.exec('database', [ename], 'export_structure', []);
    const dbase = new schema.database(Idbase);
    //
    //Create the root node
    const root = new ear.dbase(dbase);
    //
    //
    //Register the the user database to support this database. This is an
    //asynchronous process; it cannot be done as part of the tree constructor. 
    //Perhaps this should be renmaed as initialize
    await root.initialize();
    //
    //Explore the root node
    //
    //Create a new explorer
    const Explorer = new tree.explorer(root);
    //
    //Show the panels
    await Explorer.show_panels();
}
