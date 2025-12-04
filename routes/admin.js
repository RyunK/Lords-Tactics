const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn, mustAdmin } = require('./middlewares'); 
const getDatas = require('./getDatas.js');




router.get('/report', mustAdmin, async(req, res) => {
    try{
        // 신고자 id + 신고 대상 + 신고 대상이 신고당한 횟수 카운트 select
        var sql = `SELECT t.*, count(*) OVER (PARTITION BY t.object_user) AS user_cnt
            FROM (
            SELECT r.*, u.USERNAME, 
            CASE
                WHEN R.OBJECT_KIND = "formation" THEN HF. WRITER_MEMO
                WHEN R.OBJECT_KIND = "comment" THEN fc.COMMENT_BODY
                WHEN R.OBJECT_KIND = "reply" THEN fr.REPLY_BODY
            END AS object_body,
            CASE
                WHEN R.OBJECT_KIND = "formation" THEN HF. USERNAME
                WHEN R.OBJECT_KIND = "comment" THEN fc.USERNAME
                WHEN R.OBJECT_KIND = "reply" THEN fr.USERNAME
            END AS object_user,
            CASE
                WHEN R.OBJECT_KIND = "formation" THEN HF.ID
                WHEN R.OBJECT_KIND = "comment" THEN fc.form_id
                WHEN R.OBJECT_KIND = "reply" THEN (SELECT fc.form_id FROM form_comments fc WHERE fc.id = fr.comment_id)
            END AS link_id,
            count(*) OVER (PARTITION BY OBJECT_KIND, object_id) AS content_cnt
            FROM REPORTS R 
            INNER JOIN user U  ON r.REPORTER_ID  = u.ID 
            LEFT JOIN (
                SELECT HERO_FORMS.*, u.USERNAME  FROM HERO_FORMS INNER JOIN user U  ON u.id = HERO_FORMS.USER_ID 
            ) HF ON hf.ID = r.OBJECT_ID
            LEFT JOIN (
                SELECT FORM_COMMENTS.*, u.USERNAME  FROM FORM_COMMENTS INNER JOIN user U  ON u.id = FORM_COMMENTS.AUTHOR_ID  
            )FC ON fc.ID = r.OBJECT_ID
            LEFT JOIN (
                SELECT FORM_REPLYS.*, u.USERNAME  FROM FORM_REPLYS INNER JOIN user U  ON u.id = FORM_REPLYS.AUTHOR_ID  
            )FR ON fr.id = r.OBJECT_ID) AS t
            ORDER BY iD; `;
    
        var [report_data, fields] = await (await connection).execute(sql);
        // console.log(report_data)
         
        // 보내주기

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            banner_notice : req.banner_notice,
            report_data : report_data,
        }
        // console.log("filtered_heroes : " + filtered_heroes_list)

        res.render('./admin/report_view.ejs',  {data : data})
    }catch(err){
        console.log(err);
        res.redirect('/?error=' + err.message)
    }

})

module.exports=router;