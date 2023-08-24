#select all changes in the wreading table.
select 
    wreading.date as wreading_date,
    wreading.value as wreading_value,
    #
    #Resolve the mandatory foreign keys 
    wmeter.serial_no as wmeter_no
from
    wreading
    inner join wmeter on wreading.wmeter = wmeter.wmeter
    inner join changes on changes.pk = wreading.wreading
where changes.source = 'wreading'