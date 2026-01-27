// import { FormData } from "./FormData.js";
// import pool from "../../database.js"
const pool = require('../../database.js')
const {FormData} = require('./FormData.js');

class EditFormData extends FormData{

    async editData(){            
        var sql = `UPDATE hero_forms
                    SET contents_id = ?, form_status_id = ?, form_access_status_id = ?, myhero_access = ?, writer_memo = ?, last_datetime = ?
                    WHERE id = ?`
        var execute_list = [
            this.contentnum, this.formstatus, this.formaccess, 
            this.myheroaccess, this.writermemo, this.lastdatetime, this.formid];
        var [result, fields] = await  pool.execute(sql, execute_list);

        // 멤버 업데이트
        await this.updateMembers()
        // 댓글에서 아이디로 찾아서 내용 수정하기
        await this.updateCommentForAnswerForm();
        // return form_id;  
    }
    
    async updateCommentForAnswerForm(){
        var sql = `UPDATE FORM_COMMENTS
                    SET COMMENT_BODY = ?, last_datetime = ?
                    WHERE HELP_FORM_ID = ?;`
        var [hero_info, fields] = await  pool.execute(sql, [this.writermemo, this.lastdatetime, this.formid]);
    }

    async updateMembers(){
        var sql = `SELECT id FROM FORM_MEMBERS FM WHERE FM.FORM_ID = ?;`
        var [members_id, fields] = await  pool.execute(sql, [this.formid]);

        await this.checkRecordCnt(members_id.length)

        for(let i=0; i<this.members.length; i++){
            var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [hero_info, fields] = await  pool.execute(sql, [this.userid, this.members[i]]);
            let lv, cho, gak;
            // console.log(hero_info + typeof(hero_info))
            lv = hero_info.length > 0 ? hero_info[0].lv : 0;
            cho = hero_info.length > 0  ? hero_info[0].cho : 5;
            gak = hero_info.length > 0  ? hero_info[0].gak : 0;
            
            var sql = `UPDATE FORM_MEMBERS
                    SET hero_id = ?, hero_lv = ?, hero_cho = ?, hero_gak = ?
                    WHERE ID = (
                        SELECT ID FROM( SELECT id FROM FORM_MEMBERS FM WHERE FM.FORM_ID = ? ORDER BY FM.ID LIMIT ${i}, 1 ) AS t
                    );`
            var [hero_info, fields] = await  pool.execute(sql, [this.members[i], lv, cho, gak, this.formid]);
        }
    }

    async checkRecordCnt(existing_cnt){
        if(existing_cnt > this.members.length){
            var sql = `DELETE FROM FORM_MEMBERS FM WHERE FM.FORM_ID = ? ORDER BY FM.ID DESC LIMIT ${existing_cnt - this.members.length}`
            var [result, fields] = await  pool.execute(sql, [this.formid]);
        } else if (existing_cnt < this.members.length){
            for(let i=0; i<this.members.length - existing_cnt; i++){
                var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
                var [result, fields] = await  pool.execute(sql, [this.formid, 0, 0, 0, 0]);
            }
        }
    }
}

module.exports = {EditFormData}
// export {EditFormData}