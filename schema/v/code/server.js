//
//Resolve the mutall error class, plus access to the application url
import * as schema from "./schema.js";
//
//Simplifies the windows equivalent fetch method with the following 
//behaviour.
//If the fetch was successful, we return the result; otherwise the fetch 
//fails with an exception.
//partcular static methods are specifed static:true....
//It returns the same as result as the method  in php 
export async function exec(
//
//The class of the php class to execute.
class_name, 
//
cargs, 
//
method_name, 
//
margs) {
    //
    //Call the non parametric form of exec
    return await exec_nonparam(class_name, method_name, margs, cargs);
}
//
//
//Post the given file to the server at the given folder.
export async function post_file(file, path) {
    //
    //1. Create a form data object
    const formData = new FormData();
    //
    //2. Append the file to the form data object
    //
    //Attach the folder name where the file will go
    formData.append('path', path);
    //
    //Attach the actual file to the form data 
    formData.append("file", file);
    //     
    //4. Prepare a fetch initialization file using the form data
    const init = {
        method: 'POST',
        body: formData
    };
    //
    //5. Use the initialization object to send the file to the server
    const response = await fetch('/schema/v/code/index.php?post_file=true', init);
    //
    //await for the output which has the following structure
    //{ok, result, html}
    //ok
    const output = await response.json();
    //
    return output;
}
//
//The ifetch function is used for executing static methods on php class
export async function ifetch(
//
//The class of the php object to use.
class_name, 
//
//The static method name to execute on the class. 
method_name, 
//
//The method parameters
margs) {
    //
    //Call the non parametric form of exec, without any constructor 
    //arguments
    return await exec_nonparam(class_name, method_name, margs);
}
//
//This is the non-parametric version of exec useful for calling both the static
// and object of the given php class
export async function exec_nonparam(
//
//This is the name of the php class to create
class_name, 
//
//The method to execute on the php class
method_name, 
//
//The arguements of the method
margs, 
//
//If defined, this parameter represents the constructor arguements for the 
//php class. It is undefined for static methods.
cargs = null) {
    //
    //Prepare to collect the data to send to the server
    const formdata = new FormData();
    //
    //Add the application URL from the schema class
    formdata.append("url", schema.schema.app_url);
    //
    //Add to the form, the class to create objects on the server
    formdata.append('class', class_name);
    //
    //Add the class constructor arguments if they are defined
    if (cargs === null) {
        //
        //The method on the php class is static
        formdata.append('is_static', 'true');
    }
    else {
        //
        //The method on the php class is an object method
        formdata.append('cargs', JSON.stringify(cargs));
    }
    //
    //Add the method to execute on the class
    formdata.append('method', method_name);
    //
    //Add the method parameters 
    formdata.append('margs', JSON.stringify(margs));
    //
    //Prepare  to fetch using a post
    const init = {
        method: 'post',
        body: formdata
    };
    //
    //Fetch and wait for the response, using the (shared) export file
    const response = await fetch('/schema/v/code/index.php', init);
    //
    //Get the text from the response. This can never fail
    const text = await response.text();
    //
    //The output is expected to be a json string that has the following 
    //pattern: {ok:boolean, result:any, html:string}. If ok, the 
    //result is that of executing the requested php method; otherise it
    //is an error message. htm is any buffered warnings.
    let output;
    //
    //The json might fail (for some reason)
    try {
        //Try to convert the text into json
        output = JSON.parse(text);
    }
    //
    //Invalid json;this must be a structural error that needs special attention
    catch (ex) {
        // 
        //Compile a usefull error message
        const msg = `Error trapping failed???. <br/> Message: "${ex.message}".<br/>Text = "${text}"`;
        //
        throw new schema.mutall_error(msg);
    }
    //
    //The json is valid.
    // 
    //Test if the requested method ran successfully 
    if (output.ok)
        return output.result;
    //
    //The method failed. Report the method specific errors. The result
    //must be an error message string
    const msg = output.result;
    // 
    //Report the error. 
    throw new schema.mutall_error(msg);
}
//
//Simplifies the windows equivalent fetch method with the following 
//behaviour.
//If the fetch was successful, we return the result; otherwise the fetch 
//fails with an exception.
//partcular static methods are specifed static:true....
//It returns the same as result as the method  in php 
export function test(
//
//The class of the php class to execute.
class_name, 
//
method_name, 
//
method, 
//
margs) {
}
