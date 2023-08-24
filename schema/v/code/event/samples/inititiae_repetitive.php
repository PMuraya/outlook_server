<?php
    //Get the root directory from the server. We need this for locating the
    //log file
    $root_dir = $_SERVER['DOCUMENT_ROOT'];
?>
<!--
Sample to demonstrate how to schedule an event that writes a message to a log 
file repetitively. The first message is written 2 minutes from now. Subsequently, 
it is written after every minute. The writing stops after 10 minutes. We can 
inspect the log file to see if the scheduling was successful or not
-->
<html>
    <head>
        
        <title>Plan to Run with Repetitively</title>
        
        <script type="module">
            //
            //Resolve the reference to the tests
            import * as test from from "./tests.js";
            //
            //Start the scheduling after this page is fully loading into this 
            //window
            window.onload = async ()=>{
                //
                await test.repetitive();
                //
                //Get the results element
                const result = document.getElementById("result");
                //
                //Display message
                result.textContent = `Repetitive nitiated successfuly at time ${Date()}. Check file ${file} after 10 minutes for results`;
            };
        </script>
    </head>
    <body>
        <!-- 
        The result of the scheduling will be placed here
        -->
        Result: <span id="result"></span>
    </body>
</html>
