// import { FormData } from "./FormData.js";
// import pool from "../../database.js"
const pool = require('../../database.js')
const {FormData} = require('./FormData.js');

class GetFormData extends FormData{
    
    // formdetail에서 뽑아쓰는 데이터
    async getFormDetail(viewer_id){
        var sql = `SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT, hf.USER_ID = ? AS IS_WRITER, HF.MYHERO_ACCESS, HF.FORM_ACCESS_STATUS_ID,
                HF.COMMENTS_FOR_ID, CN.KOR_NAME as CONTENT_NAME, CN.ENG_NAME as CONTENT_NAME_ENG, CN.NUM_OF_HEROES, FS.STATUS_NAME, FAS.ENG_NAME AS ACCESS ,USER.NICKNAME 
                FROM HERO_FORMS HF
                INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                INNER JOIN USER ON HF.USER_ID = USER.ID
                INNER JOIN FORM_ACCESS_STATUS FAS ON HF.FORM_ACCESS_STATUS_ID = FAS.ID 
                WHERE HF.ID = ?;`
        var [form_info ,fields] = await  pool.execute(sql, [viewer_id , this.formid]);

        // 편성 멤버 조회
        let members = await this.getMembersDetail();

        return [form_info, members];
    }
    
    async getMembersDetail(){
        var sql = `SELECT FM.HERO_ID, FM.HERO_LV, FM.HERO_CHO, FM.HERO_GAK, TYPES.ENG_NAME AS TYPE, NAMES.ENG_NAME AS NAME, classes.ENG_NAME AS CLASS  
                FROM FORM_MEMBERS FM 
                INNER JOIN LAUNCHED_HEROES LH  ON FM.HERO_ID = LH.ID 
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                WHERE FM.FORM_ID = ?;`
        var [members ,fields] = await  pool.execute(sql, [this.formid]);
        return members;
    }


}

module.exports = {GetFormData}
// export {GetFormData}