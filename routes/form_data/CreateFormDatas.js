import { FormData } from "./FormData.js";
// import pool from "../../database"
const pool = require('../../database.js')

class CreateFormData extends FormData{
    constructor(members, form_status, form_access, content_num, writer_memo) {
        super(members, form_status, form_access, content_num, writer_memo)
    }

    async insertData(req){
        var sql = `SELECT * FROM CONTENTS_NAME
              WHERE KOR_NAME = ?`;
        var [content, fields] = await  pool.execute(sql, [req.body.content_name.trim()]);

        // form_status_id select
        var sql = `SELECT * FROM FORM_STATUS
              WHERE STATUS_NAME = ?`;
        var [form_status, fields] = await  pool.execute(sql, [req.body.form_status]);

        // form_access_status_id select
        var sql = `SELECT * FROM FORM_ACCESS_STATUS
              WHERE ENG_NAME = ?`;
        var [form_access_status, fields] = await  pool.execute(sql, [req.body.form_access]);
        

        var sql = `INSERT hero_forms (user_id, contents_id, form_status_id, form_access_status_id ,myhero_access, writer_memo, last_datetime) 
                    VALUES( ?, ?, ?, ?, ?, ?, ?)`;
        var execute_list = [
            req.user[0].id, content[0].id, form_status[0].id, form_access_status[0].id, 
            req.body.myhero_access =='true', req.body.writer_memo, req.body.last_datetime];
        var [result, fields] = await  pool.execute(sql, execute_list);
        
        let form_id = result.insertId;
        for(let i=0; i<req.body.hero.length; i++){
            var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [hero_info, fields] = await  pool.execute(sql, [req.user[0].id, req.body.hero[i]]);
            let lv, cho, gak;
            // console.log(hero_info + typeof(hero_info))
            lv = hero_info.length > 0 ? hero_info[0].lv : 0;
            cho = hero_info.length > 0  ? hero_info[0].cho : 5;
            gak = hero_info.length > 0  ? hero_info[0].gak : 0;
            
            var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
            var [hero_info, fields] = await  pool.execute(sql, [form_id, req.body.hero[i], lv, cho, gak]);
        }

        return form_id;
    }
}