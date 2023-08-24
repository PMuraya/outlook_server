import * as tuple from "./tuple.js";
export namespace mutall_users {
	declare class account extends tuple.tuple {
		public account?: number;
		public id?: string;
		public name?: string;
		public business?: number;
		public child_of?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class activity extends tuple.tuple {
		public activity?: number;
		public name?: string;
		public command?: string;
		public repetitive?: boolean;
		public date?: Date;
		public start_date?: Date;
		public end_date?: Date;
		public frequency?: string;
		public event?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class application extends tuple.tuple {
		public application?: number;
		public id?: string;
		public name?: string;
		public dbname?: string;
		public version?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class asset extends tuple.tuple {
		public asset?: number;
		public price?: number;
		public player?: number;
		public product?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class attribute extends tuple.tuple {
		public attribute?: number;
		public name?: string;
		public description?: string;
		public entity?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class balance extends tuple.tuple {
		public balance?: number;
		public amount?: number;
		public closed?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class business extends tuple.tuple {
		public business?: number;
		public id?: string;
		public name?: string;
		public user?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class closed extends tuple.tuple {
		public closed?: number;
		public start_date?: Date;
		public end_date?: Date;
		public business?: number;
		public balance?: number;
		public previous?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class credit extends tuple.tuple {
		public credit?: number;
		public is_valid?: boolean;
		public je?: number;
		public account?: number;
		public closed?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class custom extends tuple.tuple {
		public custom?: number;
		public is_valid?: boolean;
		public product?: number;
		public role?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class dbase extends tuple.tuple {
		public dbase?: number;
		public name?: string;
		public description?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class debit extends tuple.tuple {
		public debit?: number;
		public is_valid?: boolean;
		public je?: number;
		public account?: number;
		public closed?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class entity extends tuple.tuple {
		public entity?: number;
		public name?: string;
		public description?: string;
		public dbase?: number;
		public cx?: number;
		public cy?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class event extends tuple.tuple {
		public event?: number;
		public id?: string;
		public name?: string;
		public description?: string;
		public start_date?: Date;
		public end_date?: Date;
		public contributory?: enum;
		public mandatory?: enum;
		public amount?: float;
		public business?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class execution extends tuple.tuple {
		public execution?: number;
		public is_valid?: boolean;
		public product?: number;
		public application?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class je extends tuple.tuple {
		public je?: number;
		public purpose?: string;
		public ref_num?: string;
		public date?: Date;
		public amount?: number;
		public business?: number;
		public credit?: number;
		public debit?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class member extends tuple.tuple {
		public member?: number;
		public business?: number;
		public user?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class minute extends tuple.tuple {
		public minute?: number;
		public num?: number;
		public done?: enum;
		public is_agenda?: enum;
		public child_of?: number;
		public details?: text;
		public date?: Date;
		public event?: number;
		public user?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class mobile extends tuple.tuple {
		public mobile?: number;
		public prefix?: string;
		public user?: number;
		public num?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class msg extends tuple.tuple {
		public msg?: number;
		public subject?: string;
		public text?: blob;
		public language?: string;
		public date?: Date;
		public child_of?: number;
		public user?: number;
		public business?: number;
		public event?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class player extends tuple.tuple {
		public player?: number;
		public application?: number;
		public role?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class product extends tuple.tuple {
		public product?: number;
		public id?: string;
		public name?: string;
		public cost?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class resource extends tuple.tuple {
		public resource?: number;
		public is_valid?: boolean;
		public product?: number;
		public solution?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class role extends tuple.tuple {
		public role?: number;
		public id?: string;
		public name?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class solution extends tuple.tuple {
		public solution?: number;
		public id?: string;
		public name?: string;
		public listener?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class subscription extends tuple.tuple {
		public subscription?: number;
		public start_date?: Date;
		public user?: number;
		public player?: number;
		public end_date?: Date;
		public charge?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class user extends tuple.tuple {
		public user?: number;
		public name?: string;
		public email?: string;
		public full_name?: string;
		public account?: number;
		public address?: string;
		public photo?: string;
		public title?: string;
		public occupation?: string;
		public registration_id?: string;
		public password?: string;
		public business?: number;
		public sector?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
}
export namespace mutall_tracker {
	declare class attachment extends tuple.tuple {
		public attachment?: number;
		public company?: string;
		public designation?: string;
		public start_date?: Date;
		public end_date?: Date;
		public intern?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class ceo extends tuple.tuple {
		public ceo?: number;
		public name?: string;
		public user?: number;
		public email?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class certificate extends tuple.tuple {
		public certificate?: number;
		public cert_name?: string;
		public institute?: string;
		public start_date?: Date;
		public end_date?: Date;
		public intern?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class content extends tuple.tuple {
		public content?: number;
		public source?: string;
		public url?: mediumtext;
		public originator?: string;
		public caption?: string;
		public definer?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class definer extends tuple.tuple {
		public definer?: number;
		public id?: string;
		public caption?: string;
		public seq?: number;
		public blobs?: blob;
		public organization?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class intern extends tuple.tuple {
		public intern?: number;
		public name?: string;
		public email?: string;
		public title?: string;
		public resume?: string;
		public start_date?: Date;
		public end_date?: Date;
		public requirement?: enum;
		public attachment?: enum;
		public available?: string;
		public self_sponsored?: mediumtext;
		public language?: json;
		public residence?: string;
		public organization?: number;
		public user?: number;
		public kin?: number;
		public sponsor?: number;
		public referee?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class kin extends tuple.tuple {
		public kin?: number;
		public name?: string;
		public email?: string;
		public phone?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class module extends tuple.tuple {
		public module?: number;
		public mod_name?: string;
		public application?: number;
		public chair?: string;
		public todo?: number;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class organization extends tuple.tuple {
		public organization?: number;
		public id?: string;
		public org_name?: string;
		public ceo?: number;
		public business?: number;
		public events?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class referee extends tuple.tuple {
		public referee?: number;
		public name?: string;
		public email?: string;
		public phone?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class sponsor extends tuple.tuple {
		public sponsor?: number;
		public name?: string;
		public email?: string;
		public phone?: string;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
	declare class todo extends tuple.tuple {
		public todo?: number;
		public start_date?: timestamp;
		public end_date?: Date;
		public intern?: number;
		public module?: number;
		public description?: mediumtext;
		public id?: string;
		public is_done?: boolean;

    //Collect all the layouts of this entity
    collect_layouts(): Generator<quest.layout>;
    //
    //Convert a basic tuple structure to a ready one. The ready one is then used
    //for setting the user properties of the tuple 
    convert_reader_2_edit(i:reader<tuple>):edit<tuple>;
    //
    //Convert the ready data of this tuple to a  basic version primarily for the
    //for purpose of saving it to a database. 
    convert_2_writer():writer<tuple>;
    
    	}
}
