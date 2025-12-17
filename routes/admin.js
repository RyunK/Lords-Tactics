const express = require('express');
const router = express.Router();
const pool = require('../database.js')
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
        var sql = `SELECT count(*) as cnt FROM reports`
        var [data_cnt, fields] = await pool.execute(sql);
        
        let page_size = 30
        let max_page = Math.floor(data_cnt[0].cnt / page_size) + (data_cnt[0].cnt % page_size != 0)
        let page
        if(!req.query.p){
            page = 1;
        }else if(req.query.p > max_page){
            page = max_page
        }else if(req.query.p < 1){
            page = 1
        } 
        else{
            page = req.query.p
        }

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
                        )FR ON fr.id = r.OBJECT_ID
                        WHERE R.end = 0
                    ) AS t
                    ORDER BY id
                    LIMIT ${(page - 1) * page_size}, ${page_size};`;
    
        var [report_data, fields] = await pool.execute(sql);
        // console.log(report_data)
        // 보내주기

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            banner_notice : req.banner_notice,
            report_data : report_data,
            page : page,
            max_page : max_page,
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
        var sql = `SELECT count(*) as cnt FROM user`
        var [data_cnt, fields] = await pool.execute(sql);

        let page_size = 30
        let max_page = Math.floor(data_cnt[0].cnt / page_size) + (data_cnt[0].cnt % page_size != 0)
        let page
        if(!req.query.p){
            page = 1;
        }else if(req.query.p > max_page){
            page = max_page
        }else if(req.query.p < 1){
            page = 1
        } 
        else{
            page = req.query.p
        }

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
                ORDER BY u.id
                LIMIT ${(page - 1) * page_size}, ${page_size};`;
    
        var [user_data, fields] = await pool.execute(sql);
        // 정지 횟수 조회
        
        var sql = `SELECT u.id, count(CASE WHEN up.id IS NOT NULL THEN 1 END) AS stopped_cnt  FROM user U
                INNER JOIN USER_EMAILS UE ON u.id = ue.USER_ID 
                LEFT JOIN USER_PURNISHMENT UP ON u.id = up.USER_ID 
                GROUP BY u.id
                ORDER BY u.id
                LIMIT ${(page - 1) * page_size}, ${page_size};`;
    
        var [stopped_cnt, fields] = await pool.execute(sql);

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            banner_notice : req.banner_notice,
            user_data : user_data,
            stopped_cnt : stopped_cnt,
            page : page,
            max_page : max_page,
        }
        // console.log("filtered_heroes : " + filtered_heroes_list)


        res.render('./admin/user_manage.ejs',  {data : data})
    }catch(err){
        console.log(err);
        res.redirect('/?error=' + err.message)
    }

})

const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
var appDir = path.dirname(require.main.filename);

/**
 * user_id와 end_date 받아서 유저 정지시키기
 * @param {string} user_id 
 * @param {Date} end_date 
 */
async function user_stop(user_id, end_date) {
    // user_purnishment 테이블에서 최신 내역 찾기
    var sql = `select * from user_purnishment where user_id = ? order by end_date desc limit 1`
    var [r, f] = await pool.execute(sql, [user_id]);

    // end_date 비어있으면 한 달 뒤로 지정
    if(!end_date){
        end_date = new Date();
        end_date.setMonth(end_date.getMonth() + 1);
    }
    console.log(end_date)

    // 없거나 end_date가 지났으면 신규 추가
    if(r.length <= 0 || r[0].end_date < new Date()){
        var sql = `insert into user_purnishment (user_id, end_date) value(?, ?)`
        var [r, f] = await pool.execute(sql, [user_id, end_date]);
    } else{ // 있으면 가장 최신 내역 end_date 변경
        var sql = `update user_purnishment set end_date = ? where user_id = ?`
        var [r, f] = await pool.execute(sql, [ end_date, user_id]);
    }

    var sql = `select * from user u inner join user_emails ue on u.id = ue.user_id where user_id = ? `
    var [user, f] = await pool.execute(sql, [user_id]);

    // 이메일 보내기
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS,
        },
    });

    let emailTemplete, mailOptions;
    let username = user[0].username == 'oauth'? '본 소셜 계정' : user[0].username
    if(end_date <= new Date()){
        ejs.renderFile(appDir+'/templates/user_endstop.ejs', {username: username}, function (err, data) {
            if(err){
                console.log(err);
                throw new Error("이메일을 전송할 수 없습니다.")
            }
            emailTemplete = data;
        });
        mailOptions = {
            to: user[0].user_email,
            subject: '[로드의 전술서] 계정 정지가 해제되었습니다.',
            html: emailTemplete,
        };
    }else{
        ejs.renderFile(appDir+'/templates/user_stop.ejs', {username: username, end_date : end_date}, function (err, data) {
            if(err){
                console.log(err);
                throw new Error("이메일을 전송할 수 없습니다.")
            }
            emailTemplete = data;
        });
        mailOptions = {
            to: user[0].user_email,
            subject: '[로드의 전술서] 계정이 정지되었습니다.',
            html: emailTemplete,
        };
    }


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            throw new Error("이메일을 전송할 수 없습니다.")
        }
    });
}

/**
 * kind에 따라 서로 다른 테이블에서 id를 찾아 삭제해줌.
 * 편성 : 아예 삭제 / 댓글이나 답글 : 내용과 작성자 바꾸기
 * @param {String} kind 
 * @param {int} id 
 */
async function content_delete (kind, id){
    if(kind.includes("formation")){
        sql = `delete from hero_forms where id = ?`
    } else if (kind.includes("comment")){
        sql = `update form_comments set author_id = 0, comment_body = "관리자에 의해 삭제되었습니다.", help_form_id = null where id = ?`
    } else{
        sql = `update form_replys set author_id = 0, reply_body = "관리자에 의해 삭제되었습니다." where id = ?`
    }
    var [r, f] = await pool.execute(sql, [id]);
}

/**
 * 신고 내역 처리
 */
router.post('/report/process', mustAdmin, async(req, res) => {
    try{
        // 작성자, 컨텐츠(종류/id), 처분(종류/종료일) 받기
        var sql = `select r.*, 
                CASE
                    WHEN R.OBJECT_KIND = "formation" THEN HF. USER_ID 
                    WHEN R.OBJECT_KIND = "comment" THEN fc.AUTHOR_ID 
                    WHEN R.OBJECT_KIND = "reply" THEN fr.AUTHOR_ID 
                END AS object_u_id
                from reports r
                LEFT JOIN hero_forms hf ON hf.id = r.OBJECT_ID 
                LEFT JOIN FORM_COMMENTS FC ON fc.ID = r.OBJECT_ID 
                LEFT JOIN FORM_REPLYS FR ON fr.id = r.OBJECT_ID 
                where r.id=?`
        var [report_data, f] = await pool.execute(sql, [req.body.report_id]);
        // console.log(report_data)

        // 처분에 "삭제" 들어있을 경우, 컨텐츠 종류와 id 전달하며 삭제하기
        if(req.body.how.includes("삭제")){
            content_delete(report_data[0].object_kind, report_data[0].object_id);
        }

        // 처분에 "정지" 들어있을 경우, 유저 id와 종료일을 전달하며 정지시키기.
        if(req.body.how.includes("정지")){
            user_stop(report_data[0].object_u_id, req.body.end_date);
        }

        // 처리된 신고는 완료됨 처리
        if(!req.body.how.includes("나중에")){
            sql = `update reports set reports.end = 1 where reports.object_kind=? and object_id=?`
            var [r, f] = await pool.execute(sql, [report_data[0].object_kind, report_data[0].object_id]);
        }
        
        
       let result = {
            status: '200',
            data : {
            }
        }
        res.json(result)
    }catch(err){
        console.log(err);
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }

})

/**
 * 유저 관리
 */
router.post('/manage/user/submit', mustAdmin, async(req, res) => {
    try{
        // 유저 정보 db에서 권한 변경
        let user_auth;
        if(req.body.auth.includes("관리자")) user_auth = 0;
        else user_auth = 1;

        var sql = `update user set user_auth_id = ? where id = ?`
        var [r, f] = await pool.execute(sql, [user_auth, req.body.user_id]);
        

        // 정지 상태를 감별
        var sql = `select * from user_purnishment where user_id = ? order by end_date desc limit 1`
        var [r, f] = await pool.execute(sql, [req.body.user_id]);

        // 변화가 있다면 유저 아이디와 정지 상태를 전달하여 정지. 
        if((r.length<=0 || r[0].end_date < new Date() ) && req.body.user_stat.includes("정지")){ // 없거나 지났다 + 상태 정지 > 정지시킨다
            user_stop(req.body.user_id, req.body.end_date)
        } else if((r.length > 0 && r[0].end_date > new Date() ) && req.body.user_stat.includes("일반")){ // 있으며 진행중이다 + 상태 일반 > 레코드 종료일을 전날로 바꾸기
            let end_date = new Date();
            end_date.setDate(end_date.getDate() - 1);
            user_stop(req.body.user_id, end_date)
        } else if((r.length > 0 && r[0].end_date > new Date() ) && req.body.user_stat.includes("정지")){ // 있으며 진행중이다 + 상태 정지 > 레코드 종료일을 받은 날짜로 바꾸기
            user_stop(req.body.user_id, req.body.end_date)
        }

       let result = {
            status: '200',
            data : {
            }
        }
        res.json(result)
    }catch(err){
        console.log(err);
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }

})





module.exports=router;