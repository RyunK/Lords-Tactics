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
        from : 'forum',
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

// 댓글 게시
router.post('/submit/comment/:form_id', mustLoggedIn, async (req, res) => {

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
            var [rst, fields] = await (await connection).execute(sql, [req.params.form_id, req.user[0].id, req.body.comment, now_date]);
        } 
        // kind == commnet 면 reply 테이블에 reply_id = null으로 저장
        else if(req.body.kind == "comment"){
            var sql = `INSERT INTO FORM_REPLYS (COMMENT_ID , REPLY_ID ,AUTHOR_ID, REPLY_BODY, LAST_DATETIME)
                    VALUES (?, ?, ?, ?, ?)`;
            var [rst, fields] = await (await connection).execute(sql, [req.body.reply_id, null,req.user[0].id, req.body.comment, now_date]);
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
        var [comments, replys] = await getDatas.getCommentsNReplys(req, res, connection, req.params.form_id);

        let result = {
            status: '200',
            data : {
                comments : comments,
                replys : replys,
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


// 댓글 수정
router.post('/edit/comment/:form_id', mustLoggedIn, async (req, res) => {

    try{

        if(!req.body.comment || req.body.comment.length > 1000){
            throw new Error("댓글의 길이는 1자 이상 1000자 이하여야 합니다.");
        }

        var sql;
        if(req.body.kind == "comment")
            sql = `SELECT * FROM FORM_COMMENTS FC
                WHERE id = ?`
        else
            sql = `SELECT * FROM FORM_REPLYS FR
                INNER JOIN FORM_COMMENTS FC ON FC.ID = FR.COMMENT_ID
                WHERE FR.id = ?`
        var [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        if(rst[0].form_id != req.params.form_id || rst[0].author_id != req.user[0].id){
            throw new Error("댓글을 수정할 권한이 없습니다.");
        }

        let now_date = new Date();
        now_date = now_date.getFullYear()+"-"+("0"+(now_date.getMonth()+1)).slice(-2) + 
        "-" + ("0"+(now_date.getDate())).slice(-2) + " " + ("0"+(now_date.getHours())).slice(-2) + ":" +  ("0"+(now_date.getMinutes())).slice(-2) 

        // kind == comment 면 comment 테이블에서 id 찾아서 내용 업데이트
        if(req.body.kind == "comment"){
            var sql = `UPDATE FORM_COMMENTS 
                    SET COMMENT_BODY = ?, LAST_DATETIME = ?
                    WHERE ID = ?`
            var [rst, fields] = await(await connection).execute(sql, [req.body.comment , now_date ,req.body.id]);
        } 
        // kind == reply면 reply 테이블에서 id 찾아서 내용 업데이트
        else{
            var sql = `UPDATE FORM_REPLYS 
                    SET REPLY_BODY = ?, LAST_DATETIME = ?
                    WHERE ID = ?`
            var [rst, fields] = await(await connection).execute(sql, [req.body.comment , now_date ,req.body.id]);
        }

        

        // comment 및 reply 다시 select 해서 반환
        var [comments, replys] = await getDatas.getCommentsNReplys(req, res, connection, req.params.form_id);

        let result = {
            status: '200',
            data : {
                comments : comments,
                replys : replys,
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

// 댓글 삭제 
router.post('/delete/comment/:form_id', mustLoggedIn, async (req, res) => {

    try{
        var sql;
        if(req.body.kind == "comment")
            sql = `SELECT * FROM FORM_COMMENTS FC
                WHERE id = ?`
        else
            sql = `SELECT fc.form_id, fr.author_id FROM FORM_REPLYS FR
                INNER JOIN FORM_COMMENTS FC ON FC.ID = FR.COMMENT_ID
                WHERE FR.id = ?`
        var [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        if(rst[0].form_id != req.params.form_id || rst[0].author_id != req.user[0].id){
            throw new Error("댓글을 삭제할 권한이 없습니다.");
        }

        // kind == comment 면 comment_id 컬럼 중에서 찾아보기 
        let finds =[]
        if(req.body.kind == "comment"){
            var sql = `SELECT SUM(FR.AUTHOR_ID ) AS s FROM FORM_REPLYS FR
                WHERE comment_id = ?`;
            [finds, fields] = await(await connection).execute(sql, [req.body.id]);
        } 
        // kind == reply면 reply_id 컬럼 중에서 찾아보기
        else{
            var sql = `SELECT SUM(FR.AUTHOR_ID ) AS s FROM FORM_REPLYS FR
                WHERE reply_id = ?`;
            [finds, fields] = await(await connection).execute(sql, [req.body.id]);
        }

        // 답댓이 있으면 유저 id 0, 내용 "삭제된 댓글입니다." 로 변경
        if(finds[0].s > 0 && req.body.kind == "comment"){
            var sql = `UPDATE FORM_COMMENTS 
                    SET COMMENT_BODY = "삭제된 댓글입니다.", AUTHOR_ID = 0
                    WHERE ID = ?`;
            [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        }else if(finds[0].s > 0 && req.body.kind == "reply"){
            var sql = `UPDATE FORM_REPLYS 
                    SET REPLY_BODY = "삭제된 댓글입니다.", AUTHOR_ID = 0
                    WHERE ID = ?`;
            [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        }
        // 답댓이 없으면(답글들의 author_id가 전부 0이면) 답댓까지 전부 레코드 삭제 + 내가 참조하고 있던 애도 이미 삭제됐으면 같이 삭제
        else if(req.body.kind == "comment"){
            var sql = `DELETE FROM FORM_COMMENTS FC
                    WHERE FC.ID = ?`;
            [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        } else{ // 내가 참조하고 있던 애를 참조하고 있으며 살아있는 애가 없는지 먼저 확인
            var sql = `SELECT comment_id, reply_id
                    FROM FORM_REPLYS
                    WHERE (comment_id = (
                        SELECT comment_id
                        FROM FORM_REPLYS
                        WHERE id = ?
                    ) OR
                    REPLY_ID = (
                        SELECT reply_id
                        FROM FORM_REPLYS
                        WHERE id = ?
                    )) AND NOT id = ? AND NOT AUTHOR_ID = 0`
            var [ref, fields] = await(await connection).execute(sql, [req.body.id, req.body.id, req.body.id]);
            if(ref.length > 0){
                sql = `DELETE FROM FORM_REPLYS FR
                    WHERE FR.ID = ?`;
            }else{
                sql = `DELETE  FC, FR, FR2 FROM FORM_REPLYS FR
                    LEFT JOIN FORM_REPLYS  FR2 ON FR.REPLY_ID = FR2.ID AND fr2.AUTHOR_ID = 0
                    LEFT JOIN FORM_COMMENTS  FC ON FR.COMMENT_ID = FC.ID AND fc.AUTHOR_ID = 0
                    WHERE FR.ID = ?`;
            }
            
            
            [rst, fields] = await(await connection).execute(sql, [req.body.id]);
        }
        

        // comment 및 reply 다시 select 해서 반환
        var [comments, replys] = await getDatas.getCommentsNReplys(req, res, connection, req.params.form_id);

        let result = {
            status: '200',
            data : {
                comments : comments,
                replys : replys,
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

// 게시판 삭제
// 그냥 post 요청 받아가지고 form 삭제하면 될듯
router.post('/delete/form/:form_id', mustLoggedIn, async(req, res) => {
    
    try{

        var sql = `select * from hero_forms where id = ?`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id]);
        if(result[0].user_id != req.user[0].id) throw new Error("편성을 삭제할 권한이 없습니다.");
        
        var sql = `delete from hero_forms where id = ?`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id]);

        res.send(`<script> alert("삭제가 완료되었습니다."); window.location.href='/${req.body.page}'  </script>`)

    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`)
    }

})

module.exports=router;