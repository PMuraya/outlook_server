with 
    #
    #Get all the at-cooand entries for a non repetitive activity
    non_rep  as ( 
        select 
            command, 
            date, 
            canceled 
        from 
            activity 
        where not (repetitive)
    ),
    #
    #Get all the at entries for the start of a repetitive activity. NB. The 
    # command to execute is the refresh crontab to ensure that this activity is 
    # included in the cronjob being refreshed
    rep_start as (
        select 
            "refresh_crontab.php" as command,
            start_date as date,
            canceled
        from activity
        where repetitive
    ),    
    #
    #Get all the at entries for the end of a repetitive activity. NB. The 
    # command to execute is the refresh crontab to ensure that this activity is 
    # excluded from the cronjob being refreshed
    rep_start as (
        select 
            "refresh_crontab.php" as command,
            start_date as date,
            canceled
        from activity
        where repetitive    
    ),
    #
    #Combine the results of the three queries
    joint as (
        table non_rep union all 
        table rep_start union all
        table rep_end
    )
    #
    #Only active non-canced case are considered
    select command, date from joint where date>now() and not (canceled);
