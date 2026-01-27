// import { createRequire } from 'module';
// import { CreateFormData } from './form_data/CreateFormData.js';
// const require = createRequire(import.meta.url);

const  pool = require('../database.js')
const {CreateFormData} = require('./form_data/CreateFormData.js')
const {EditFormData} = require('./form_data/EditFormData.js')

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
     writer_memo: '작성자 메모 예시',
     last_datetime: '2025-10-30 18:22:28'
   }
    */
   insertNewForm: async(req, res) =>{
        let creater = new CreateFormData()
        await creater.setNewForm( 
            req.user[0].id, req.body.hero, req.body.form_status, req.body.form_access, 
            req.body.myhero_access=='true', req.body.content_name.trim(), req.body.writer_memo, req.body.last_datetime
        )

        return creater.insertData();       
   },

   updateForm: async(req, res) =>{
        let updater = new EditFormData()
        await updater.setNewForm( 
            req.user[0].id, req.body.hero, req.body.form_status, req.body.form_access, 
            req.body.myhero_access=='true', req.body.content_name.trim(), req.body.writer_memo, req.body.last_datetime, req.params.form_id
        );
        // updater.formid = req.params.form_id;
        await updater.editData();

   },

   /**
    * 편성 요청에 대한 편성 도움을 insert 함. req.params.form_id로 원본 편성 데이터 읽어옴.
    * @param {*} req 
    * @param {*} res 
    * @returns 
    */
   insertAnswerForm: async(req, res) =>{
        let creater = new CreateFormData()
        await creater.setNewForm( 
            req.user[0].id, req.body.hero, req.body.form_status, req.body.form_access, 
            req.body.myhero_access=='true', req.body.content_name.trim(), req.body.writer_memo, req.body.last_datetime
        )

        let form_id = await creater.insertData();  

        // 댓글 관리
        var sql = `INSERT FORM_COMMENTS (form_id, author_id, help_form_id, comment_body, last_datetime)
                VALUES(?, ?, ?, ?, ?)`;
        var [comment, fields] = await  pool.execute(sql, [req.params.form_id, req.user[0].id, form_id, req.body.writer_memo, req.body.last_datetime]);

        return form_id;
   },

   updateAnswerForm: async(req, res) =>{
        let updater = new EditFormData()
        await updater.setNewForm( 
            req.user[0].id, req.body.hero, req.body.form_status, req.body.form_access, 
            req.body.myhero_access=='true', req.body.content_name.trim(), req.body.writer_memo, req.body.last_datetime, req.params.helpform_id
        );
        // updater.formid = req.params.form_id;
        await updater.editData();
   },

}
