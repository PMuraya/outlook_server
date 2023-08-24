select 
    ebill.due_date as ebill_date,
    ebill.current_amount as ebill_amount,
    eaccount.num as eaccount_num
from 
    ebill
    inner join eaccount on ebill.eaccount = eaccount.eaccount
where changes.pk = 'ebill'