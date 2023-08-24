select 
    credit.date as credit_date,
    credit.amount as credit_amount,
    credit.reason as credit_reason,
    client.name as client_name
from 
    credit
    inner join client on credit.client = client.client
where changes.pk = 'credit'