<?php
namespace mutall;
 //
//Define the schema to make use of the database methods that 
//are already defined.
include_once 'schema.php';
//
//The class that houses all server functionality of
//an application.
class app extends database{
    //
    //The application id whose.
    public string $id;
    // 
    //The database name of this application
    public string $dbname;
    // 
    //For now to create an application class it takes 
    //no parameters.
    function __construct(string $app_id) {
        parent::__construct("mutall_users");
        $this->id=$app_id;
    }
    // 
    //Retrieve all the products that are customed to a particular 
    //role.
    function customed_products(){
        // 
        //Formulate the sql.
        $sql ="SELECT
                `product`.`id` as product_id ,
                `role`.`id` as role_id
           FROM `product`
               inner JOIN  `custom` on `custom`.`product`=`product`.`product`
               inner JOIN  `role` on `custom`.`role`=`role`.`role`
               inner join   player on `player`.`role`= `role`.`role`
               inner join   `application` on `player`.`application`=`application`.`application`
           WHERE `application`.`id`='$this->id'
        ";
        // 
        //Return the executed sql.
        return $this->get_sql_data($sql);
    }
    // 
    //Returns all the products that are executions of a 
    //particular application
    function execution_products(): string{
       return "SELECT
                `product`.`id` as id ,
                `product`.`name` as title,
                `product`.`cost` as cost,
                `solution`.`id` as solution_id ,
                `solution`.`name` as solution_title ,
                `solution`.`listener` as listener,
                'no' as is_global
            FROM `execution`
                 inner JOIN `application` ON `execution`.`application`=`application`.`application`
                 inner JOIN `product` on `execution`.`product`=`product`.`product`
                 inner JOIN `resource` ON `resource`.`product`=`product`.`product`
                 inner JOIN `solution` ON `resource`.`solution`=`solution`.`solution`
            WHERE `application`.`id`='$this->id'";
    }
    // 
    //Returns all the products that are globally 
    //available for all applications 
    function global_products():string{
       return "SELECT
                `product`.`id` as id ,
                `product`.`name` as title,
                `product`.`cost` as cost,
                `solution`.`id` as solution_id ,
                `solution`.`name` as solution_title ,
                `solution`.`listener` as listener,
                'yes' as is_global
            FROM `product`
                inner join `resource` on `resource`.`product`=`product`.`product`
                inner join `solution` on `resource`.`solution`=`solution`.`solution`
                left join `execution` on `execution`.`product`=`product`.`product`
            WHERE `execution`.`product` is null"; 
    }
    // 
    //Returns all the products that are available to the given user for this
    //application.
    function available_products(string $name){
        //
        //Get products that are sssets for the user. These are products that 
        //have a cost but the user has subscribed to them explicitly
        $assets ="SELECT
                 `product`.`id` as product_id
            FROM `product`
                inner JOIN `asset` ON `asset`.`product`=`product`.`product`
                inner JOIN  `player` on `asset`.`player`=`player`.`player`
                inner join subscription on subscription.player = player.player
                inner join  `user` on subscription.user = `user`.`user`
                inner join `application` on player.application = `application`.`application`
            WHERE
                `user`.`name`='$name' "
                ."and `application`.`id`='$this->id' "
                ."and not(`product`.`cost`=0 or `product`.`cost` is null)";
        //
        //Get the free products that match this user and application 
        $freebies ="SELECT
                 `product`.`id` as product_id
            FROM `product`
                inner join `custom` ON `custom`.`product`=`product`.`product`
                inner join `role` on `custom`.`role` = `role`.`role`
                inner join  `player` on player.`role`=`role`.`role`
                inner join subscription on subscription.player = player.player
                inner join  `user` on subscription.user = `user`.`user`
                inner join `application` on player.application = `application`.`application`
            WHERE
                `user`.`name`='$name' "
                ."and `application`.`id`='$this->id' "
                ."and (`product`.`cost`=0 or `product`.`cost` is null)";
        
        //Available products are (paid for) assets and (free) cases
        $sql = "$assets union $freebies"; 
         // 
        //Return the executed sql.
        return $this->get_sql_data($sql);
    }
    // 
    //Returns all the products available in this application.
    function get_products(){
        $sql ="{$this->execution_products()} "
            . " UNION "
            . " {$this->global_products()}";
        return $this->get_sql_data($sql);
    }    
}


