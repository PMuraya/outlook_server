select 
    debit.date as debit_date,
    debit.amount as debit_amount,
    debit.reason as debit_reason,
    client.name as client_name
from 
    debit
    inner join client on debit.client = client.client
where changes.pk = 'debit'