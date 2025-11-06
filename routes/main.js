const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')




router.get('/', async(req, res) => {
    var sql = `SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT,
                CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, USER.NICKNAME, 
                ROW_NUMBER() OVER(ORDER BY FLOOR(UNIX_TIMESTAMP(HF.LAST_DATETIME) / 60 / 60 / 24 / 7) + HF.VIEW*10 + HF.saved_cnt * 100 desc,  HF.last_datetime desc) AS rnk
                FROM HERO_FORMS HF 
                INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                INNER JOIN USER ON HF.USER_ID = USER.ID
                WHERE HF.FORM_ACCESS_STATUS_ID = 1 AND hf.form_status_id = 1
                LIMIT 5; `;
    
    var [best_form_list, fields] = await (await connection).execute(sql);

    var best_form_ids = best_form_list.map(function(e){
        return e.ID;
    })
    best_form_ids = best_form_ids.join();
    // 미리보기를 위한 form_hero와 launched_hero inner join

    var best_members
    if(best_form_ids == ''){
        best_members = []
    }else{
        var sql = `SELECT form_id, types.ENG_NAME AS type, names.ENG_NAME AS name, hc.ENG_NAME AS class  
            FROM FORM_MEMBERS FM
            INNER JOIN LAUNCHED_HEROES LH ON FM.HERO_ID = lh.ID 
            INNER JOIN HERO_CLASSES HC ON lh.CLASS_ID = hc.IDX 
            INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
            INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
            WHERE form_id IN (${best_form_ids})
            ORDER BY form_id;`;
        [best_members, fields] = await (await connection).execute(sql);
    }

    var sql = `SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT,
                CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, USER.NICKNAME, ROW_NUMBER() OVER(ORDER BY FLOOR(UNIX_TIMESTAMP(HF.LAST_DATETIME) / 60 / 60 / 24 ) + hf.form_status_id%4 * 100 desc) AS rnk FROM HERO_FORMS HF 
                INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                INNER JOIN USER ON HF.USER_ID = USER.ID
                WHERE HF.FORM_ACCESS_STATUS_ID = 1 AND (hf.form_status_id = 2 OR hf.form_status_id = 4)
                LIMIT 5; `;
    
    var [today_ask_form_list, fields] = await (await connection).execute(sql);

    var today_ask_form_ids = today_ask_form_list.map(function(e){
        return e.ID;
    })
    today_ask_form_ids = today_ask_form_ids.join();
    // 미리보기를 위한 form_hero와 launched_hero inner join

    var today_ask_members
    if(today_ask_form_ids == ''){
        today_ask_members = []
    }else{
        var sql = `SELECT form_id, types.ENG_NAME AS type, names.ENG_NAME AS name, hc.ENG_NAME AS class  FROM FORM_MEMBERS FM
            INNER JOIN LAUNCHED_HEROES LH ON FM.HERO_ID = lh.ID 
            INNER JOIN HERO_CLASSES HC ON lh.CLASS_ID = hc.IDX 
            INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
            INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
            WHERE form_id IN (${today_ask_form_ids})
            ORDER BY form_id;`;
        [today_ask_members, fields] = await (await connection).execute(sql);
    }

    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await(await connection).execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }
    
    let data = {
        from : 'main',
        nickname: getDatas.loggedInNickname(req, res),
        best_form_list : best_form_list,
        best_members : best_members,
        today_ask_form_list : today_ask_form_list,
        today_ask_members : today_ask_members,
        saved_forms : saved_forms,
    }
    // console.log("filtered_heroes : " + filtered_heroes_list)

    res.render('index.ejs',  {data : data})

})

module.exports=router;