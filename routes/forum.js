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


    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await(await connection).execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }
    
    let data = {
        from : 'forum',
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        saved_forms : saved_forms,
        content : q_content,
        contents_list : contents_list,
        hero_list : hero_list,
        form_list : form_list,
        members : members,
    }

    res.render('./forum/forum.ejs',  {data : data})

})

router.get('/:forumtab/detail/:id', async(req, res) => {     
    // if(!req.query.n) res.redirect('/formsave');


    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await (await connection).execute(sql, [req.query.content ? req.query.content : 'all']);

    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res, connection);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    try{
        // id로 form검색
        let [form_info, this_members] = await getDatas.getFormInfoNMembers(req, res, connection); 
        if(form_info[0].FORM_ACCESS_STATUS_ID != 1){
            throw new Error("이 편성에는 접근할 수 없습니다.")
        }

        // 내가 편성 저장 했는지 검색
        var sql = `select * from form_save where user_id = ? and form_id = ?`
        var [result, fields] = await(await connection).execute(sql, [req.isAuthenticated()?req.user[0].id:-1, req.params.id]);
        let saved = result.length;

        // console.log(this_members)

        // 쿼리로 앞뒤 레코드 검색 * 앞뒤는 아이디/status/content만 필요
        // where 절 생성
        var where = `FAS.ENG_NAME = ? `;
        let q_list = [req.isAuthenticated()?req.user[0].id:-1, 'public']

        if(req.query.content && req.query.content!='all'){
            where += `AND CN.ENG_NAME = ? `;
            q_list.push(req.query.content)
        }

        // forumtab에 따라서
        if(req.params.forumtab == "share"){
            where += `AND HF.FORM_STATUS_ID = ? `;
            q_list.push(1)
        } else{
            where += `AND (HF.FORM_STATUS_ID = ? OR HF.FORM_STATUS_ID = ?) `;
            q_list.push(2)
            q_list.push(4)
        }

        if(req.query.hero && Array.isArray(req.query.hero)){
            let sql_heroes = '(';
            for(let i=0; i<req.query.hero.length; i++){
                where += ` fM.HERO_ID = ? `
                if(i < req.query.hero.length - 1) sql_heroes += 'or'
                q_list.push(req.query.hero[i]);
            }
            where += 'AND' + sql_heroes + ')';
        } else if(req.query.hero && !Array.isArray(req.query.hero)){
            where += `AND fM.HERO_ID = ? `
            q_list.push(req.query.hero);
        }

        let order = getDatas.formOrderGetter(req, res);

        let rn = 1;
        if(req.query.hero && Array.isArray(req.query.hero)) rn = req.query.hero.length;
        var sql = `SELECT  T2.* 
                FROM (SELECT T.*, ROW_NUMBER() OVER(${order}) AS ORDER_NUM
                        FROM (
                            SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT, hf.USER_ID = ? AS IS_WRITER,
                            FM.HERO_ID, CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, FAS.ENG_NAME AS ACCESS, USER.NICKNAME,
                                ROW_NUMBER() OVER (
                                    PARTITION BY HF.id 
                                    ORDER BY HF.last_datetime DESC
                                ) AS rn
                            FROM HERO_FORMS HF
                            INNER JOIN FORM_MEMBERS FM ON HF.ID = fM.FORM_ID
                            INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                            INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                            INNER JOIN USER ON HF.USER_ID = USER.ID
                            INNER JOIN FORM_ACCESS_STATUS FAS ON HF.FORM_ACCESS_STATUS_ID = FAS.ID 
                            WHERE ${where}
                        ) AS T
                    WHERE T.rn = ${rn}) AS T2
                WHERE T2.ORDER_NUM = ${parseInt(req.query.n? req.query.n : -2) - 1} `;
        var [previous, fields] = await (await connection).execute(sql, q_list );

        var sql = `SELECT  T2.* 
                FROM (SELECT T.*, ROW_NUMBER() OVER(${order}) AS ORDER_NUM
                        FROM (
                            SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT, hf.USER_ID = ? AS IS_WRITER,
                            FM.HERO_ID, CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, FAS.ENG_NAME AS ACCESS, USER.NICKNAME,
                                ROW_NUMBER() OVER (
                                    PARTITION BY HF.id 
                                    ORDER BY HF.last_datetime DESC
                                ) AS rn
                            FROM HERO_FORMS HF
                            INNER JOIN FORM_MEMBERS FM ON HF.ID = fM.FORM_ID
                            INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                            INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                            INNER JOIN USER ON HF.USER_ID = USER.ID
                            INNER JOIN FORM_ACCESS_STATUS FAS ON HF.FORM_ACCESS_STATUS_ID = FAS.ID 
                            WHERE ${where}
                        ) AS T
                    WHERE T.rn = ${rn}) AS T2
                WHERE T2.ORDER_NUM = ${parseInt(req.query.n? req.query.n : -2) + 1} `;
        var [next, fields] = await (await connection).execute(sql, q_list );


        // 게시글 id로 comment 및 reply 검색
        var [comments, replys, help_members] = await getDatas.getCommentsNReplys(req, res, connection, req.params.id)

        // 내가 저장한 form 리스트 보내주기
        let saved_forms = []
        if(req.isAuthenticated()){
            var sql = `select * from form_save where user_id = ?`
            var [mysave, fields] = await(await connection).execute(sql, [req.user[0].id]);
            saved_forms = mysave.map((e) => e.form_id);
        }


        // 조회수 +1
        var sql = `UPDATE HERO_FORMS HF 
                    SET HF.VIEW = (
                    SELECT T.VIEW FROM (SELECT HF.VIEW FROM HERO_FORMS HF 
                    WHERE HF.ID = ?) AS T
                    ) +1
                    WHERE HF.ID = ?;`
        var [result, fields] = await(await connection).execute(sql, [req.params.id, req.params.id])

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            content: q_content,
            now_formstatus : req.params.forumtab = "share"? "편성 공유":"편성 완료",
            filtered_heroes_list_forrender : filtered_heroes_list_forrender,
            form_id : req.params.id,
            form_info : form_info,
            saved : saved,
            members : this_members,
            previous : previous,
            next : next,
            comments : comments,
            replys : replys,
            help_members : help_members,
            saved_forms : saved_forms,
        }
        res.render('./forum/forum_formdetail.ejs',  {data : data})
    }catch(e){
        console.log(e);
        res.redirect("/?error=" + e.message);
    }
})

// 편성 저장
router.post('/formsave/change/:form_id', mustLoggedIn, async (req, res) => {

    try{
        // 본인거면 저장 못함
        var sql = `select * FROM hero_forms
                where user_id = ? and id = ?`;
        var [r, fields] = await(await connection).execute(sql, [req.user[0].id, req.params.form_id]);
        if(r.length > 0) throw new Error("자신의 편성은 [편성 저장]할 수 없습니다.")
        
        // 없으면 채택해

        // 이미 저장돼있나 체크해
        var sql = `select * from form_save
                where user_id = ? and form_id = ?`
        var [r, fields] = await(await connection).execute(sql, [req.user[0].id, req.params.form_id])

        let change
        // 저장돼있으면 삭제해
        if(r.length > 0){
            var sql = `delete from form_save where user_id = ? and form_id = ?`
            var [r, fields] = await(await connection).execute(sql, [req.user[0].id, req.params.form_id])
            change = 'delete'
        } 
        // 저장 안돼있으면 저장해
        else{
            var sql = `insert form_save (user_id, form_id) values (?, ?)`
            var [r, fields] = await(await connection).execute(sql, [req.user[0].id, req.params.form_id])
            change = 'insert'
        
            // 질문글 작성자 본인이고 writer_save에 이 편성 채택 내역 있는지 확인해
            var sql = `select rf.id req_form, ws.id ws_id FROM hero_forms CF
                inner join hero_forms rf on cf.comments_for_id = rf.id
                left join writer_save ws on ws.req_id = rf.id
                where cf.id = ? and rf.user_id = ?`;
            var [ws, fields] = await(await connection).execute(sql, [req.params.form_id, req.user[0].id]);
            if(!ws[0].ws_id){
                var sql = `insert writer_save (req_id, ans_comment_id) values (?, ?)`
                var [r, fields] = await(await connection).execute(sql, [ws[0].req_form, req.params.form_id])

                var sql = `update hero_forms set form_status_id = 4 where id = ?`
                var [r, fields] = await(await connection).execute(sql, [ws[0].req_form])
            }
        }

        // 저장 수 + 1
        var sql = `select * from form_save
                where form_id = ?`
        var [saved, fields] = await(await connection).execute(sql, [req.params.form_id])
        var sql = `update hero_forms
                set saved_cnt = ?
                where id = ?`
        var [r, fields] = await(await connection).execute(sql, [saved.length, req.params.form_id])

        // 이 댓글이 이 글의 몇번째 도움 댓글인지도 반환
        var sql = `SELECT * FROM (
                SELECT hf.id, ROW_NUMBER() OVER(ORDER BY id) AS rn from HERO_FORMS HF 
                where hf.COMMENTS_FOR_ID  = (SELECT hf.COMMENTS_FOR_ID WHERE hf.id = ?) ) AS t
                WHERE t.id = ?;`
        var [comment_num, fields] = await(await connection).execute(sql, [req.params.form_id, req.params.form_id])

        // console.log(comment_num)

        let result = {
            status: '200',
            data : {
                change :change,
                saved_cnt : saved.length,
                comment_num : comment_num[0].rn,
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

/**
 * 댓글 ajax 요청 시 새로고침 반환
 * req.params.form_id로 댓글 및 댓글의 편성 읽어서 반환해줌
 * @param {*} req 
 * @param {*} res 
 */
async function comment_reload_respond(req, res){
    // comment 및 reply 다시 select 해서 반환
    var [comments, replys, help_members] = await getDatas.getCommentsNReplys(req, res, connection, req.params.form_id);
    
    var sql = `select cn.num_of_heroes from hero_forms hf
            inner join contents_name cn on hf.contents_id = cn.id
            where hf.id = ?`
    var [member_num, fields] = await(await connection).execute(sql, [req.params.form_id]);
    let member_length = member_num[0].num_of_heroes;

    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await(await connection).execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }

    let data = {
            comments : comments,
            replys : replys,
            help_members : help_members,
            member_length : member_length,
            saved_forms : saved_forms,
        }

    res.render('./components/comments_and_replys.ejs', {data: data}, (err, html) =>{
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        let result = {
            status: '200',
            data : {
                html : html,
            }
        }
        res.json(result)
    })
}

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
        
        comment_reload_respond(req, res);
        

    
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
        
        let help_form ;
        if(req.body.kind == "comment" && rst[0].help_form_id){
            help_form = rst[0].help_form_id;         
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

        // 도움 편성 댓글을 수정했다면 편성까지 수정
        if(help_form){
            var sql = `update hero_forms set writer_memo = ?, last_datetime = ? where id = ?`
            var [rst, fields] = await(await connection).execute(sql, [req.body.comment , now_date, help_form]);
        }
        

        comment_reload_respond(req, res);
        
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

        let help_form;
        if(req.body.kind == "comment" && rst[0].help_form_id) help_form = rst[0].help_form_id;

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
                    SET COMMENT_BODY = "삭제된 댓글입니다.", AUTHOR_ID = 0, help_form_id = null
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
        
        // 도움 편성 댓글을 삭제했다면 편성까지 삭제
        if(help_form){
            var sql = `delete from hero_forms where id = ?`
            var [rst, fields] = await(await connection).execute(sql, [help_form]);
        }

        comment_reload_respond(req, res);

    } catch(e){
        console.log(e)
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }
    
})

// 편성 삭제
router.post('/delete/form/:form_id', mustLoggedIn, async(req, res) => {
    
    try{

        var sql = `select * from hero_forms where id = ?`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id]);
        if(result[0].user_id != req.user[0].id) throw new Error("편성을 삭제할 권한이 없습니다.");
        
        let comments_for = result[0].comments_for_id;


        var sql = `delete from hero_forms where id = ?`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id]);


        // 삭제한 게 편성 도움이면 댓글까지 찾아서 삭제
        if(comments_for){

            var sql = `select * from form_comments where form_id = ? and help_form_id = ?`
            var [fc, fields] = await(await connection).execute(sql, [comments_for, req.params.form_id]);


            let finds =[]
            // 답댓 있는지 확인
            var sql = `SELECT SUM(FR.AUTHOR_ID ) AS s FROM FORM_REPLYS FR
                WHERE comment_id = ?`;
            [finds, fields] = await(await connection).execute(sql, [fc[0].id]);

            // 답댓이 있으면 유저 id 0, 내용 "삭제된 댓글입니다." 로 변경
            if(finds[0].s > 0 ){
                var sql = `UPDATE FORM_COMMENTS 
                        SET COMMENT_BODY = "삭제된 댓글입니다.", AUTHOR_ID = 0, help_form_id = null
                        WHERE ID = ?`;
                [rst, fields] = await(await connection).execute(sql, [fc[0].id]);
            }
            // 답댓이 없으면(답글들의 author_id가 전부 0이면) 답댓까지 전부 레코드 삭제 + 내가 참조하고 있던 애도 이미 삭제됐으면 같이 삭제
            else {
                var sql = `DELETE FROM FORM_COMMENTS FC
                        WHERE FC.ID = ?`;
                [rst, fields] = await(await connection).execute(sql, [fc[0].id]);
            } 

            
        }

        res.send(`<script> alert("삭제가 완료되었습니다."); window.location.href='/${req.body.page}'  </script>`)
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`)
    }

})

module.exports=router;