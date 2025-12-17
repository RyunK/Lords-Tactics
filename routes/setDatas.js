
const  pool = require('../database.js')


module.exports = {
   heroSettingNormalSave :  async(req, res) =>{
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?;`;
        var [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id, req.body.hero]);
        
        if(!parseInt(req.body.lv) || !parseInt(req.body.cho) || isNaN(req.body.gak) || !parseInt(req.body.hero)){
            
		//console.log(`lv : ${parseInt(req.body.lv)} / cho : ${parseInt(req.body.cho)} / gak : ${parseInt(req.body.gak)} / hero : ${parseInt(req.body.hero)}`)
		throw new TypeError("숫자가 아닌 데이터는 저장할 수 없습니다.")
        }

        if(having_heroes.length > 0){
            var sql = `UPDATE HERO_SETTINGS
                        SET LV = ?, CHO = ?, gak = ?
                        WHERE USER_ID = ? AND HERO_ID = ?;`;
            var [result, fields] = await  pool.execute(sql, [req.body.lv, req.body.cho, req.body.gak, req.user[0].id, req.body.hero]);
            // console.log(result);
        } else {
            var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await  pool.execute(sql, [req.user[0].id, req.body.hero, req.body.lv, req.body.cho, req.body.gak]);
        }
   },

   heroSettingAllSave: async(req, res) =>{
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
        var [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id]);
            // console.log(having_heroes);
        
        if(!parseInt(req.body.lv) || !parseInt(req.body.cho) || isNaN(req.body.gak)){
            throw new TypeError("숫자가 아닌 데이터는 저장할 수 없습니다.")
        }
        
        if(having_heroes.length > 0){
            var sql = `UPDATE HERO_SETTINGS
                        SET LV = ?, CHO = ?, gak = ?
                        WHERE USER_ID = ?;`;
            var [result, fields] = await  pool.execute(sql, [req.body.lv, req.body.cho, req.body.gak, req.user[0].id]);
            // console.log(result);
        } else {
            var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await  pool.execute(sql, [req.user[0].id, req.body.hero, req.body.lv, req.body.cho, req.body.gak]);
        }
   },

   /**
    * {
     form_status: '편성 공유',
     form_access: 'private',
     content_name: '아레나',
     hero: [ '27', '28', '29', '26', '30' ],
     myhero_access: 'true',
     writer_memo: '로잔나를 좋아하는 세팅\r\n통령님 너무 좋아!!!',
     last_datetime: '2025-10-30 18:22:28'
   }
    */
   insertNewForm: async(req, res) =>{
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
   },

   updateForm: async(req, res) =>{
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
        

        var sql = `UPDATE hero_forms
                    SET contents_id = ?, form_status_id = ?, form_access_status_id = ?, myhero_access = ?, writer_memo = ?, last_datetime = ?
                    WHERE id = ?`
        var execute_list = [
            content[0].id, form_status[0].id, form_access_status[0].id, 
            req.body.myhero_access =='true', req.body.writer_memo, req.body.last_datetime, req.params.form_id];
        var [result, fields] = await  pool.execute(sql, execute_list);

        // 영웅 업데이트
        var sql = `SELECT id FROM FORM_MEMBERS FM WHERE FM.FORM_ID = ?;`
        var [members_id, fields] = await  pool.execute(sql, [req.params.form_id]);

        if(members_id.length > req.body.hero.length){
            var sql = `DELETE FROM FORM_MEMBERS FM WHERE FM.FORM_ID = ? ORDER BY FM.ID DESC LIMIT ${members_id.length - req.body.hero.length}`
            var [result, fields] = await  pool.execute(sql, [req.params.form_id]);
        } else if (members_id.length < req.body.hero.length){
            for(let i=0; i<req.body.hero.length - members_id.length; i++){
                var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
                var [hero_info, fields] = await  pool.execute(sql, [req.params.form_id, 0, 0, 0, 0]);
            }
        }

        for(let i=0; i<req.body.hero.length; i++){
            var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [hero_info, fields] = await  pool.execute(sql, [req.user[0].id, req.body.hero[i]]);
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
            var [hero_info, fields] = await  pool.execute(sql, [req.body.hero[i], lv, cho, gak, req.params.form_id]);
        }

        // return form_id;
   },

   /**
    * 편성 요청에 대한 편성 도움을 insert 함. req.params.form_id로 원본 편성 데이터 읽어옴.
    * @param {*} req 
    * @param {*} res 
    * @returns 
    */
   insertAnswerForm: async(req, res) =>{
        var sql = `SELECT * from hero_forms
                where id = ?`
        var [req_form, fields] = await  pool.execute(sql, [req.params.form_id]);

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
        

        var sql = `INSERT hero_forms (user_id, contents_id, form_status_id, form_access_status_id ,myhero_access, writer_memo, last_datetime, comments_for_id) 
                    VALUES( ?, ?, ?, ? ,?, ?, ?, ?)`;
        var execute_list = [
            req.user[0].id, content[0].id, form_status[0].id, form_access_status[0].id, 
            req.body.myhero_access =='true', req.body.writer_memo, req.body.last_datetime, req.params.form_id];
        var [result, fields] = await  pool.execute(sql, execute_list);
        
        let form_id = result.insertId;
        for(let i=0; i<req.body.hero.length; i++){
            var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [hero_info, fields] = await  pool.execute(sql, [req_form[0].user_id, req.body.hero[i]]);
            let lv, cho, gak;
            // console.log(hero_info + typeof(hero_info))
            lv = hero_info.length > 0 ? hero_info[0].lv : 0;
            cho = hero_info.length > 0  ? hero_info[0].cho : 5;
            gak = hero_info.length > 0  ? hero_info[0].gak : 0;
            
            var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
            var [hero_info, fields] = await  pool.execute(sql, [form_id, req.body.hero[i], lv, cho, gak]);
        }

        var sql = `INSERT FORM_COMMENTS (form_id, author_id, help_form_id, comment_body, last_datetime)
                VALUES(?, ?, ?, ?, ?)`;
        var [comment, fields] = await  pool.execute(sql, [req.params.form_id, req.user[0].id, form_id, req.body.writer_memo, req.body.last_datetime]);

        return form_id;
   },

}
