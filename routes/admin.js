const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn, mustAdmin } = require('./middlewares'); 
const getDatas = require('./getDatas.js');



router.get('/', mustAdmin, async(req, res) => {
    try{
        
        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            banner_notice : req.banner_notice,
        }
        // console.log("filtered_heroes : " + filtered_heroes_list)

        res.render('./admin/admin_main.ejs',  {data : data})
    }catch(err){
        console.log(err);
        res.redirect('/?error=' + err.message)
    }

})



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
                        WHEN R.OBJECT_KIND = "formation" THEN HF. u_id
                        WHEN R.OBJECT_KIND = "comment" THEN fc.u_id
                        WHEN R.OBJECT_KIND = "reply" THEN fr.u_id
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
                        SELECT HERO_FORMS.*, u.USERNAME, u.ID u_id  FROM HERO_FORMS INNER JOIN user U  ON u.id = HERO_FORMS.USER_ID 
                    ) HF ON hf.ID = r.OBJECT_ID
                    LEFT JOIN (
                        SELECT FORM_COMMENTS.*, u.USERNAME, u.ID u_id  FROM FORM_COMMENTS INNER JOIN user U  ON u.id = FORM_COMMENTS.AUTHOR_ID  
                    )FC ON fc.ID = r.OBJECT_ID
                    LEFT JOIN (
                        SELECT FORM_REPLYS.*, u.USERNAME, u.ID u_id  FROM FORM_REPLYS INNER JOIN user U  ON u.id = FORM_REPLYS.AUTHOR_ID  
                    )FR ON fr.id = r.OBJECT_ID) AS t
                    ORDER BY id;`;
    
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

router.get('/manage/user', mustAdmin, async(req, res) => {
    try{
        // 유저 목록 + 현재 정지 상태 조회
        var sql = `SELECT u.*, ue.user_email, ua.auth_name,
                CASE
                    WHEN (SELECT end_date from user_purnishment up WHERE up.USER_ID = u.ID  ORDER BY id DESC LIMIT 1) >= curdate() THEN "정지"
                    ELSE "일반"
                END AS u_status,
                CASE
                    WHEN (SELECT end_date from user_purnishment up WHERE up.USER_ID = u.ID  ORDER BY id DESC LIMIT 1) >= curdate() THEN (SELECT end_date from user_purnishment up WHERE up.USER_ID = u.ID  ORDER BY id DESC LIMIT 1)
                END AS u_enddate
                FROM user U 
                INNER JOIN USER_EMAILS UE ON u.id = ue.USER_ID 
                INNER JOIN USER_AUTH UA ON ua.ID = u.USER_AUTH_ID 
                ORDER BY u.id;`;
    
        var [user_data, fields] = await (await connection).execute(sql);
        // 정지 횟수 조회
        
        var sql = `SELECT u.id, count(CASE WHEN up.id IS NOT NULL THEN 1 END) AS stopped_cnt  FROM user U
                INNER JOIN USER_EMAILS UE ON u.id = ue.USER_ID 
                LEFT JOIN USER_PURNISHMENT UP ON u.id = up.USER_ID 
                GROUP BY u.id
                ORDER BY u.id;`;
    
        var [stopped_cnt, fields] = await (await connection).execute(sql);

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            banner_notice : req.banner_notice,
            user_data : user_data,
            stopped_cnt : stopped_cnt,
        }
        // console.log("filtered_heroes : " + filtered_heroes_list)

        res.render('./admin/user_manage.ejs',  {data : data})
    }catch(err){
        console.log(err);
        res.redirect('/?error=' + err.message)
    }

})

module.exports=router;