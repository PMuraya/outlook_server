<!DOCTYPE html>
<?php
    //Get the root directory from the server. NB> This is in PHP
    $root_dir = $_SERVER['DOCUMENT_ROOT'];
?>
<!--
Sample to demonstrate how to schedule set up a simple one-of activity using
the event library
-->
<html>
    <head>
        
        <title>Plan to Run Once</title>
        
        <script type="module">
            //
            //Resolve any references to the event class
            import * as test from "./test.js";
            
            //Start the scheduling the plan after fully loading this window
            window.onload = async ()=>{
                //
                //Transfer the root directory (where to log the reults) from 
                //the Php to Javascript
                const root_dir = '<?php echo $root_dir; ?>';
                //
                //The file (in teh root ditrectory) where to log the results
                const file = `${root_dir}/schema/v/code/event/samples/event.log`;
                //
                //Run the test once and log to the file
                test.once(file);
                //
                //Get the result element
                const result = document.getElementById("result");
                //
                //Display message
                result.textContent = `Plan initiated successfuly at time ${Date()}. Check event.log after 2 minutes for results`;
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
