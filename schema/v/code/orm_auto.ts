import * as tuple from "./tuple.js";
export namespace mutall_users {
	declare class account extends tuple.tuple {
		public account?: number;
		public business?: number;
		public child_of?: number;
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
	declare class activity extends tuple.tuple {
		public activity?: number;
		public command?: string;
		public date?: Date;
		public end_date?: Date;
		public event?: number;
		public frequency?: string;
		public name?: string;
		public repetitive?: boolean;
		public start_date?: Date;

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
		public dbname?: string;
		public id?: string;
		public name?: string;
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
		public player?: number;
		public price?: number;
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
		public description?: string;
		public entity?: number;
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
	declare class balance extends tuple.tuple {
		public amount?: number;
		public balance?: number;
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
		public balance?: number;
		public business?: number;
		public closed?: number;
		public end_date?: Date;
		public previous?: number;
		public start_date?: Date;

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
		public account?: number;
		public closed?: number;
		public credit?: number;
		public is_valid?: boolean;
		public je?: number;

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
		public description?: string;
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
	declare class debit extends tuple.tuple {
		public account?: number;
		public closed?: number;
		public debit?: number;
		public is_valid?: boolean;
		public je?: number;

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
		public cx?: number;
		public cy?: number;
		public dbase?: number;
		public description?: string;
		public entity?: number;
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
	declare class event extends tuple.tuple {
		public amount?: float;
		public business?: number;
		public contributory?: enum;
		public description?: string;
		public end_date?: Date;
		public event?: number;
		public id?: string;
		public mandatory?: enum;
		public name?: string;
		public start_date?: Date;

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
		public application?: number;
		public execution?: number;
		public is_valid?: boolean;
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
	declare class je extends tuple.tuple {
		public amount?: number;
		public business?: number;
		public credit?: number;
		public date?: Date;
		public debit?: number;
		public je?: number;
		public purpose?: string;
		public ref_num?: string;

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
		public business?: number;
		public member?: number;
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
		public child_of?: number;
		public date?: Date;
		public details?: text;
		public done?: enum;
		public event?: number;
		public is_agenda?: enum;
		public minute?: number;
		public num?: number;
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
		public num?: number;
		public prefix?: string;
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
	declare class msg extends tuple.tuple {
		public business?: number;
		public child_of?: number;
		public date?: Date;
		public event?: number;
		public language?: string;
		public msg?: number;
		public subject?: string;
		public text?: blob;
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
	declare class player extends tuple.tuple {
		public application?: number;
		public player?: number;
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
		public cost?: number;
		public id?: string;
		public name?: string;
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
	declare class resource extends tuple.tuple {
		public is_valid?: boolean;
		public product?: number;
		public resource?: number;
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
		public id?: string;
		public name?: string;
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
	declare class solution extends tuple.tuple {
		public id?: string;
		public listener?: string;
		public name?: string;
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
	declare class subscription extends tuple.tuple {
		public charge?: number;
		public end_date?: Date;
		public player?: number;
		public start_date?: Date;
		public subscription?: number;
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
	declare class user extends tuple.tuple {
		public account?: number;
		public address?: string;
		public business?: number;
		public email?: string;
		public full_name?: string;
		public name?: string;
		public occupation?: string;
		public password?: string;
		public photo?: string;
		public registration_id?: string;
		public sector?: string;
		public title?: string;
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
}
export namespace mutall_tracker {
	declare class attachment extends tuple.tuple {
		public attachment?: number;
		public company?: string;
		public designation?: string;
		public end_date?: Date;
		public intern?: number;
		public start_date?: Date;

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
		public email?: string;
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
	declare class certificate extends tuple.tuple {
		public cert_name?: string;
		public certificate?: number;
		public end_date?: Date;
		public institute?: string;
		public intern?: number;
		public start_date?: Date;

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
		public caption?: string;
		public content?: number;
		public definer?: number;
		public originator?: string;
		public source?: string;
		public url?: mediumtext;

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
		public blobs?: blob;
		public caption?: string;
		public definer?: number;
		public id?: string;
		public organization?: number;
		public seq?: number;

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
		public attachment?: enum;
		public available?: string;
		public email?: string;
		public end_date?: Date;
		public intern?: number;
		public kin?: number;
		public language?: json;
		public name?: string;
		public organization?: number;
		public referee?: number;
		public requirement?: enum;
		public residence?: string;
		public resume?: string;
		public self_sponsored?: mediumtext;
		public sponsor?: number;
		public start_date?: Date;
		public title?: string;
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
	declare class kin extends tuple.tuple {
		public email?: string;
		public kin?: number;
		public name?: string;
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
		public application?: number;
		public chair?: string;
		public mod_name?: string;
		public module?: number;
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
		public business?: number;
		public ceo?: number;
		public events?: string;
		public id?: string;
		public org_name?: string;
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
	declare class referee extends tuple.tuple {
		public email?: string;
		public name?: string;
		public phone?: string;
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
	declare class sponsor extends tuple.tuple {
		public email?: string;
		public name?: string;
		public phone?: string;
		public sponsor?: number;

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
		public description?: mediumtext;
		public end_date?: Date;
		public id?: string;
		public intern?: number;
		public is_done?: boolean;
		public module?: number;
		public start_date?: timestamp;
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
}
