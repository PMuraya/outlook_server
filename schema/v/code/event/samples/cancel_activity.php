<?php
    //Get the root directory from the server. We need this for locating the
    //log file
    $root_dir = $_SERVER['DOCUMENT_ROOT'];
?>
<!--
Sample to demonstrate how to cancel a scheduled even plan
-->
<html>
    <head>
        
        <title>Cancel an Event Plan</title>
        
        <script type="module">
            //
            //Resolve the reference to the plan tests
            import * as test from "./test.js";
            //
            //Start the cancelation after this page is fully loading into this 
            //window
            window.onload = async ()=>{
                //
                await test.cancel();
                //
                //Get the results element
                const result = document.getElementById("result");
                //
                //Display message
                result.textContent = `Plan canceled successfuly`;
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
