//
//Resolving the static node structure 
import * as library from "../../../schema/v/code/library.js";
// 
//Resolve the popup class used by the browser popup window 
import * as outlook from "./outlook.js";
// 
//Export all the classes in this module 
export {node, branch, leaf };

//Modelling branches and leaves as nodes
abstract class node {
    //
    //The parent of this node, which must be a branch or null
    parent: branch | null;
    //
    //Unique name for identifying this node. 
    name: string;
    // 
    //The full name of this node 
    public path: path;
    // 
    //The collection of all the nodes that are members 
    //of this tree 
    static members: Map<path, node> = new Map();
    //
    constructor(name:string, parent: branch|null) {
        //
        //Save the properies of this node
        this.parent = parent;
        //
        //Every node has a name
        this.name = name;
        //
        //The id of this node comprises of two parts 
        //full name of the parend and the name of this node 
        //
        //The full name of the parent is either its path or the 
        //root folder  
        const parent_path = this.parent === null ? "/" : this.parent.path;
        // 
        //Set the full name of this node.
        this.path = parent_path + "/"+ this.name; 
        //
        //Save this node in the collection indexed by its full name.
        node.members.set(this.path, this);
    }

    abstract get_html(): string;
    

    //
    //Create a node, given the static version.
    static create(Inode: library.Inode, parent: branch|null): node {
        //
        //Activate a branch
        if (Inode.class_name ==="branch" ) {
            //
            //This must be a branch. Create one and return
            return new branch(Inode, parent);
        }
        //
        //Destructure the node to reveal the name, popultaion etc
        //
        //Return a leaf
        return new leaf(Inode, parent);
    }
    //
    //Highlights the selected node on the navigation panel and updates
    //the content panel (depending on the node type)
    static select(elem: HTMLElement) {
        // 
        //Get the navigation panel which has the tree directory.
        const nav = document.querySelector('#nav')!;
        //
        //1. Highlight the selected element
        //
        //1.1 Remove whatever was selected before, assuming that there can 
        //be only 1 selection        
        //
        //Get the current selected element.
        const selection = nav.querySelector('.selected');
        //
        //Remove the selection, if any
        if (selection !== null) selection.classList.remove('selected');
        //
        //1.2 Select the given element
        elem.classList.add('selected');
        //
        //2. Update the content panel, dependig on the node type.
        this.show_content_panel(elem)
    }
    // 
    //Paint the content with the folder or file html
    // given the selected element
    static show_content_panel(selected: HTMLElement): void{
        // 
        //Get the file/folder node id 
        const id = selected.dataset.id!;
        // 
        //Get the html node element from the navigator
        const nav = document.getElementById(id)!;
        // 
        //Get the content panel 
        const content = document.getElementById("content")!;
        // 
        //Set the html of this content to that of the navigator 
        content.innerHTML = nav.innerHTML;
    }


}

//Modelling a branch as a node that has children.
 class branch extends node {
    //
    //The icon filename to be used for  representing all branches
    icon: string="Normal.ico";
    //
    //The children of this branch
    children: Array<node>;
    //
    //Use a static node to construct a branch (object)
    constructor(Inode: library.Inode, parent: branch|null) {
        //
        //Initialze the parent constructor
        super(Inode.name, parent);
        //
        //Start populating the children prperty
        //
        //There must be a chidren property in the static node
        //
        //Get the children node
        const children = (<library.Ibranch>Inode).children;
        //
        if (children===undefined) throw new Error('This node is not a branch');
        //
        //Go through each child and convert it to a node
        this.children = children.map(child => node.create(child, this));
    }
    //
    //Toggling is about opening the branch children (if they are closed) or closing
    //them if they are open.
    static toggle(name:string) {
        //
        //
        //Get the children node.
        const children_node:HTMLElement =this.get_child_node(name); 
        //
        //Esatblish if the children node is open
        const children_is_open:boolean = !children_node.hidden;
        //
        //Test if the childre brnch is open
        if (children_is_open){
            //
            //Close them
            //
            //Hide the children node
            children_node.hidden = true;
        }else{
            //Open them
            //
            //Unhide the children node
            children_node.hidden = false;
        }
        
    }

    //Returns the chil html elemen of this node
    static get_child_node(name:string):HTMLElement{
        //
        const parent = document.querySelector(name);
        //
        if (parent===null) throw new Error(`Node named ${name} cannot be found`);
        //
        const child_node = parent.querySelector('.children');
        if (child_node===null) throw new Error('Child node not found');
        //
        return child_node as HTMLElement;

    }

    //Returns the html of branch
    get_html() {
        //
        //leaf html
        const branch_html = `

                <div id="${this.path}" class="folder">
                    <div class="header">
                        <button  
                            onclick="branch.toggle('${this.name}')"
                            class="btn">+</button>
                        <div
                            data-id="${this.path}"
                            onclick="node.select(this)
                        >
                            <img src="images/${this.icon}"/>
                            <span>${this.name}</span>
                        </div>
                    </div>
                    <div class="children hide">
                        ${this.get_children_html()}
                    </div>
                </div>
               `;
        return branch_html;
    }
    //
    //Get the html of the children as a strin representation for display in a dom
    get_children_html() {
        //
        //begin with an empty string for the children
        let html = "";
        //
        //loop through all the children adding their html to this string
        for (const child of this.children) {
            //
            //adding the html by string concatenation
            const child_ = child.get_html();
            html += child_;
        }

        //
        //return the combined string
        return html;
    }
}

//A leaf is a node that has no children
class leaf extends node {
    constructor(Inode: library.Ileaf, parent: branch|null) {
        //
        super(Inode.name, parent);
    }

    //The html code for a leaf
    get_html(): string {
        return `
            <div
                id="${this.path}"
                class="file container"
                onclick="node.select(this)
                data-id="${this.path}"
            >
                <span>${this.name}</span>
            </div>
            `;
    }
}
// 
//The complete folder or file name. 
export type path = string;
// 
//A popoup quiz page for browsing the servers directory.
export class browser extends outlook.popup<path>{
    //
    //The selected full name is saved here for future 
    //access to return the browser result of this popup
    //It is set when we check the user input 
    public full_name?: path;
    // 
    constructor(
        // 
        //The target represents the type of the path to return
        //from this popup.
        public target: "file" | "folder",
        // 
        //This is the browser template  
        url: outlook.url, 
        // 
        //The static partialy enriched node 
        public Inode: library.Inode,
        //
        //This path defines those folders that will be enriched with  
        //children
        public initial?: path
        
    ) { 
        super(url);
        // 
        //The two pannel

    }
    // 
    //Ensure that a user has selected a file or path. 
    async check():Promise<boolean> {
        //
        //Get the selected node
        const selected_div = this.document.querySelector(".selected");
        //
        //Reject this promise if no node is currently selected
        if (selected_div === (undefined||null)) {
            // 
            //Alert the user 
            alert(`Please select a ${this.target}`) 
            // 
            //Fail gracefully 
            return false;
        }
        //
        //Get the corresponding node 
        const selected_node = node.members.get(selected_div.id);
        //Get its full name 
        this.full_name = selected_node!.path;
        // 
        //A successful selection
        return true;
    }
    // 
    //Return the selected full name. 
    async get_result(): Promise<path>{
        return this.full_name!;
    }
    // 
    //Show the pannels of this browser.
    async show_panels(): Promise<void> {
        // 
        //Show the naviation panel 
        //
        //Create the node from the static structure 
        const Node = node.create(this.Inode, null);
        // 
        //Get the html of the node 
        const html = Node.get_html();
        // 
        //Get the target element where to put the html
        const nav = this.get_element("nav");
        // 
        //Change the inner html 
        nav.innerHTML = html;
        // 
        //Open the initial path on the navigation panel 
        //and return the logical path node. 
        const logical_path_node = this.open_initial_path();
        // 
        const id = logical_path_node!.path;
        //Get the html path node 
        const html_path_node = this.get_element(id)
        //
        //Get the element to be marked as selected.
        const element =<HTMLElement> html_path_node.querySelector(`div[data-id='${id}']`)!;
        //
        //Select the initial path that also paints the content panel.
        node.select(element);

    }
    // 
    //Unhide the children of the rich folders(branches). 
    private open_initial_path(): node| null{
        // 
        // Opening an initial path is valid only when 
        //when are one.
        if (this.initial === undefined) return null;
        // 
        //Get the initial node.
        let path_node: node = node.members.get(this.initial)!;
        // 
        // Initialize the while loop 
        let Node: node | null= path_node;
        //
        //Loop through all the rich folders using this 
        //initial path and unhide their children.
        while (Node !== null) {
            // 
            //Test whether this node is a branch
            if (Node instanceof branch) {
                // 
                //Unhided this node's children.
                // 
                //Get the children html element. Its an immediate child of the 
                //the element identified by this node's path.
                const element = this.document
                    .querySelector(`#${Node.path}>.children`)!;
                // 
                //Unhide the element.
                element.classList.remove("hide");
            }
            // 
            //Update the looping node to its parent
            Node = Node.parent;           
        } 
        return path_node;
    }
}