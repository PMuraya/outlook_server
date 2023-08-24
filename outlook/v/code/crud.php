<html>
    <head>
        <title>crud</title>
        <link rel="stylesheet" href="crud.css">
    </head>
    <body>
        <div id="head">
            <h3>Managing <span id="subject"></span></h3>
            <label>Filter by:
                <input 
                    type="text" 
                    id="filter" 
                    placeholder="E.g., participant.name = 'Kaniu'">
            </label>
            <label>Sort by:
                <input 
                    type="text"
                    id="sort" 
                    placeholder="E.g., minute.date desc">
            </label>

            <button onclick="crud.page.current.review()">Review</button>
        </div>
        <div id="content">
            <table>
                <thead>
                </thead>
               
                 
            </table>
        </div>
        <div id="footer">
        <!--
            This will hide or highlight selected column.
        -->
        <select onchange="show(this)">
            <option>click to show</option>
        </select>
        <button onclick="hide()">Hide</button>
            <!-- 
        This is a toggle switch that puts the page in edit mode. You know you 
        are in the edit mode because of Joyce's cursor. When re-pressed, it 
        switches to normal mode-->
        <button id="edit" onclick="edit()">Edit</button>
        <!-- 
        Remove the selected record from both the database and the view-->
        <button onclick="crud.page.current.delete()">Delete Current</button>
        <!-- 
        Remove the selected records from both the database and the view
        in bulk. This implies multiple records have been selected-->
        <button onclick="crud.page.current.delete()">Delete All Selections</button>
        <!-- 
        Insert a record above the current cursor position. If at the top
        insert it just after the 'th' tag-->
        <button onclick="create(this)">Create</button>
        <!--
        Save all the affected records in bulk-->
        <button onclick="save()">Save</button>
        <!--
        -->
         <button onclick="record.multi_select()">Multi select</button>
        <button onclick="record.merge()">Merge</button>
        <button onclick="record.back()">Back</button>
        <button onclick="record.cancel()">Cancel</button>
        </div>
    </body>
</html>
