<?php
namespace mutall;
//The root configuration, e.g.., database credentials, are not expected to 
//be server-specific and should be set up is part of Outlook's installation -- 
//not when we switch to a different application
class config{
    const username = "root";
    const password =null;
    //
    //The database and entity for managing users and application that are 
    //running on this server 
    public array $user_subject = ["dbname" => "mutall_users", "ename" =>"user"];
    //	
    //This is the general template for displaying the user report 
    public string $report = "/outlook/v/code/report.html";
    //
    //This is the complete path for the login template
    public string $login= "/outlook/v/code/login.html";
    //
    //The complete path of the welcome template 
    public string $welcome= "/outlook/v/code/welcome.html";
        
    //The crud's template
    public string $crud = "/outlook/v/code/crud.html";
    // 
    //This is the general template for collecting simple user data.
    public string $general = "/outlook/v/code/general.html";
    // 
    //The maximum number of records that can be retrieved from 
    //the server using one single fetch. Its value is used to modify 
    //the editor sql by  adding a limit clause 
    public int $limit = 40;
    //
    //The application path, i.e., ../code, set from the config constructor;
    public string $path;
    //
    //The folder where images are stored; it is set relative to the from the 
    //application path. It is the folder which users see as the root when they
    //explore the server (for security reasons)
    public string $images;
    //
    function __construct($path){
        //
        //Set the code folder
        $this->path = $path;
        //
        //Set the image path; it is a sibling of the code folder -- the 
        //application path.
        $this->images = realpath("$path/../images");
    }
}
