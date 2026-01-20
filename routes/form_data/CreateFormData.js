import { FormData } from "./FormData.js";
// import pool from "../../database"
const pool = require('../../database.js')

class CreateFormData extends FormData{
    constructor(userid, members, form_status, form_access, myheroaccess, content_num, writer_memo, lastdatetime) {
        super(userid, members, form_status, form_access, myheroaccess, content_num, writer_memo, lastdatetime)
    }

    async insertData(){
        var sql = `INSERT hero_forms (user_id, contents_id, form_status_id, form_access_status_id ,myhero_access, writer_memo, last_datetime) 
                    VALUES( ?, ?, ?, ?, ?, ?, ?)`;
        var execute_list = [
            this.userid, this.contentnum, this.formstatus, this.formaccess, 
            this.myheroaccess, this.writermemo, this.lastdatetime];
        var [result, fields] = await  pool.execute(sql, execute_list);
        
        let form_id = result.insertId;
        for(let i=0; i<this.members.length; i++){
            let member_data = this.getMemberData(i)
            
            var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
            var [hero_info, fields] = await  pool.execute(sql, [form_id, this.members[i], member_data.lv, member_data.cho, member_data.gak]);
        }

        return form_id;
    }
}