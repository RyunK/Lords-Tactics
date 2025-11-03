const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/forum/share/?sort=tu');

})

router.get('/:forumtab', async(req, res) => {
    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await (await connection).execute(sql, [req.query.content ? req.query.content : 'all']);
    
    let contents_list = await getDatas.getContentsName(req, res, connection);
    let hero_list = await getDatas.getHeroList(req, res, connection);
    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res, connection);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    // 쿼리에 맞는 편성들 내보내기
    
    var where = ``;
    let q_list = []
    if(req.params.forumtab == 'share'){
        where += 'HF.FORM_STATUS_ID = ? '
        q_list.push(1);
    } else{
        where += '(HF.FORM_STATUS_ID = ? OR HF.FORM_STATUS_ID = ?) '
        q_list.push(2);
        q_list.push(4);
    }

    if(q_content[0].id != '9') {
        where += `AND HF.CONTENTS_ID = ? `;
        q_list.push(q_content[0].id)
    }

    where += `AND HF.FORM_ACCESS_STATUS_ID = ? `;
    q_list.push(1)


    if(req.query.hero){
        let sql_heroes = '(';
        for(let i=0; i<filtered_heroes_list.length; i++){
            sql_heroes += ` fM.HERO_ID = ? `
            if(i < filtered_heroes_list.length - 1) sql_heroes += 'or'
            q_list.push(filtered_heroes_list[i]);
        }
        where += 'AND' + sql_heroes + ')';
    }

    let order = getDatas.formOrderGetter(req, res);

    try{
        [form_list, members] = await getDatas.getFormlistNMembers(req, res, where, order, q_list, connection);
    }catch(e){
        console.log(e)
        form_list = [];
        members =[];
    }

    
    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : q_content,
        contents_list : contents_list,
        hero_list : hero_list,
        form_list : form_list,
        members : members,
    }
    // console.log("filtered_heroes : " + filtered_heroes_list)

    res.render('./forum/forum.ejs',  {data : data})

})

router.post('/submit/comment', mustLoggedIn, async (req, res) => {

    try{

        if(!req.body.comment || req.body.comment.length > 1000){
            throw new Error("댓글의 길이는 1자 이상 1000자 이하여야 합니다.");
        }

        let now_date = new Date();
        now_date = now_date.getFullYear()+"-"+("0"+(now_date.getMonth()+1)).slice(-2) + 
        "-" + ("0"+(now_date.getDate())).slice(-2) + " " + ("0"+(now_date.getHours())).slice(-2) + ":" +  ("0"+(now_date.getMinutes())).slice(-2) 

        // kind == none이면 comment 테이블에 저장
        if(req.body.kind == "none"){
            var sql = `INSERT INTO FORM_COMMENTS (FORM_ID , AUTHOR_ID , COMMENT_BODY, LAST_DATETIME)
                    VALUES (?, ?, ?, ?)`;
            var [rst, fields] = await (await connection).execute(sql, [req.body.form_id, req.user[0].id, req.body.comment, now_date]);
        } 
        // kind == commnet 면 reply 테이블에 reply_id = 0으로 저장
        else if(req.body.kind == "comment"){
            var sql = `INSERT INTO FORM_REPLYS (COMMENT_ID , REPLY_ID , AUTHOR_ID, REPLY_BODY, LAST_DATETIME)
                    VALUES (?, ?, ?, ?, ?)`;
            var [rst, fields] = await (await connection).execute(sql, [req.body.reply_id, 0, req.user[0].id, req.body.comment, now_date]);
        }
        // kind == reply 면 reply 테이블에 reply_id에 id 넣어서 저장
        else if(req.body.kind == "reply"){
            var sql = `SELECT * FROM FORM_REPLYS
                    WHERE ID = ?`
            var [rst, fields] = await (await connection).execute(sql, [req.body.reply_id]);

            var sql = `INSERT INTO FORM_REPLYS (COMMENT_ID , REPLY_ID , AUTHOR_ID, REPLY_BODY, LAST_DATETIME)
                    VALUES (?, ?, ?, ?, ?)`;
            var [rst, fields] = await (await connection).execute(sql, [rst[0].comment_id, req.body.reply_id, req.user[0].id, req.body.comment, now_date]);
        }
        // kind == form 이면 comment 테이블에 help_form_id에 form id 넣어서 저장 > 근데 이건 여기서 안하게 될듯
        


        // comment 및 reply 다시 select 해서 반환

        let result = {
            status: '200',
            data : {
            }
        }
        res.json(result)
    } catch(e){
        console.log(e)
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }
    
})

module.exports=router;