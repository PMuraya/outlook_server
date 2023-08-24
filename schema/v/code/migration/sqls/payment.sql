#
#Select all changes from the payment table
select
	#
	#Start with the payment attributes
	payment.amount as payment_amount,
	payment.bank as payment_bank,
	payment.date as payment_date,
	payment.type as payment_type,
	payment.ref as payment_ref,
	payment.description as payment_description,
	#
	#Resolve the mandatory foreign keys to their constituent attributes by
	#considering the primary identification index. Optional foreign keys are
	#extracted differently
	client.name as client_name
from
	#
	#Our main table
	payment
	#
	#include all tables needed to resolve the foreign keys
	inner join client on client.client =payment.client
	#
	#Add the table for supporting filtering of the payments from the changes
	inner join changes on changes.pk= payment.payment 
where changes.source  = "payment";
