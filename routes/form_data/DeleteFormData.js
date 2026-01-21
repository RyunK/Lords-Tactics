import { FormData } from "./FormData.js";
// import pool from "../../database"
const pool = require('../../database.js')

class DeleteFormData extends FormData{
    constructor(userid, formid) {
        super.formid = formid;
    }

    async deleteData(){        
        var sql = `delete from hero_forms where id = ?`
        var [result, fields] = await pool.execute(sql, [super.formid]);

        let commentsfor = this.getCommentsfor()
        // 삭제한 게 편성 도움이면 댓글까지 찾아서 삭제
        if(commentsfor){

            var sql = `select * from form_comments where form_id = ? and help_form_id = ?`
            var [fc, fields] = await pool.execute(sql, [commentsfor, super.formid]);


            let finds =[]
            // 답댓 있는지 확인
            var sql = `SELECT SUM(FR.AUTHOR_ID ) AS s FROM FORM_REPLYS FR
                WHERE comment_id = ?`;
            [finds, fields] = await pool.execute(sql, [fc[0].id]);

            // 답댓이 있으면 유저 id 0, 내용 "삭제된 댓글입니다." 로 변경
            if(finds[0].s > 0 ){
                var sql = `UPDATE FORM_COMMENTS 
                        SET COMMENT_BODY = "삭제된 댓글입니다.", AUTHOR_ID = 0, help_form_id = null
                        WHERE ID = ?`;
                [rst, fields] = await pool.execute(sql, [fc[0].id]);
            }
            // 답댓이 없으면(답글들의 author_id가 전부 0이면) 답댓까지 전부 레코드 삭제 + 내가 참조하고 있던 애도 이미 삭제됐으면 같이 삭제
            else {
                var sql = `DELETE FROM FORM_COMMENTS FC
                        WHERE FC.ID = ?`;
                [rst, fields] = await pool.execute(sql, [fc[0].id]);
            } 

            
        }
    }
}

export {DeleteFormData}