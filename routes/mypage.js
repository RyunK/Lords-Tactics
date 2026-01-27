// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

const express = require('express');
const router = express.Router();
const  pool = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const { heroSettingNormalSave, heroSettingAllSave } = require('./setDatas'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', mustLoggedIn, (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/mypage/formsave');

}) 

/**
 * 
 * @param {*} req 
 * @param {*} q_content 
 * @param {*} filtered_heroes_list 
 * @param {boolean} except_save 편성 저장 포함 여부 / 기본 : 포함=false 
 * @returns 
 */
function mypageFormWhereMaker(req, q_content, filtered_heroes_list, except_save = false){
    var where = `(HF.USER_ID = ? OR (HF.ID in (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) )`;
    let q_list = [req.user[0].id, req.user[0].id]

    if(except_save){
        where = `HF.USER_ID = ?`;
        q_list = [req.user[0].id]
    }


    if(req.query.form_status && req.query.form_status != 8 && req.query.form_status != 3){
        where += `AND ( HF.FORM_STATUS_ID = ? and HF.USER_ID = ?) `;
        q_list.push(req.query.form_status)
        q_list.push(req.user[0].id)
    } else if (req.query.form_status == 3){
        where = `(not HF.USER_ID = ? and (HF.ID in (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) )
                and (hf.form_status_id = 1 or hf.form_status_id = 7)`;
    }

    if(q_content[0].id != '9'){
        where += `AND HF.CONTENTS_ID = ? `;
        q_list.push(q_content[0].id)
    }

    // '편성 저장' 했으면 무조건 비공개로만 출력되게
    if(req.query.form_access && req.query.form_access == 'public') {
        // where += `AND HF.FORM_ACCESS_STATUS_ID = ? `;
        where += `AND HF.FORM_ACCESS_STATUS_ID = if(HF.USER_ID = ?, 1, 2)`;
        q_list.push( req.user[0].id)
    } else if(req.query.form_access && req.query.form_access == 'private') {
        // where += `AND HF.FORM_ACCESS_STATUS_ID = ? `;
        where += `AND HF.FORM_ACCESS_STATUS_ID = if(HF.USER_ID = ?, 2, 1)`;
        q_list.push( req.user[0].id)
    }

    if(req.query.hero){
        let sql_heroes = '(';
        for(let i=0; i<filtered_heroes_list.length; i++){
            sql_heroes += ` fM.HERO_ID = ? `
            if(i < filtered_heroes_list.length - 1) sql_heroes += 'or'
            q_list.push(filtered_heroes_list[i]);
        }
        where += 'AND' + sql_heroes + ')';
    }

    return [where, q_list];
}

router.get('/formsave', mustLoggedIn, async(req, res) => { 
    var sql = `SELECT * FROM FORM_STATUS
            ORDER BY status_name`;
    var [form_status_list, fields] = await  pool.execute(sql);
    
    let contents_list = await getDatas.getContentsName(req, res,  pool);

    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await  pool.execute(sql, [req.query.content ? req.query.content : 'all']);

    var sql = `SELECT * FROM FORM_STATUS
                WHERE ID= ?`;
    var [now_formstatus, fields] = await  pool.execute(sql, [req.query.form_status ? req.query.form_status : '8']);

    let hero_list = await getDatas.getHeroList(req, res,  pool);
    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res,  pool);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    // 쿼리에 맞는 폼만 출력하기
    // where 절 생성
    let [where, q_list] = mypageFormWhereMaker(req, q_content, filtered_heroes_list);

    let order = getDatas.formOrderGetter(req, res);
    
    var form_list, members;
    try{
        [form_list, members, page, max_page] = await getDatas.getFormlistNMembers(req, res, where, order, q_list,  pool);
    }catch(e){
        console.log(e)
        form_list = [];
        members =[];
    }
    
    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await pool.execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }
 
    let data = {
        from: 'mypage',
        nickname: getDatas.loggedInNickname(req, res),
        form_status_list : form_status_list,
        contents_list : contents_list,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : q_content,
        query_form_access : req.query.form_access? req.query.form_access : 'all',
        form_status : now_formstatus[0],
        hero_list : hero_list,
        form_list : form_list,
        members : members,
        saved_forms : saved_forms,
        page : page,
        max_page : max_page,
        banner_notice : req.banner_notice,
    }
    res.render('./mypage/mypage_formsave.ejs',  {data : data})
})


router.get('/formsave/detail/:id', mustLoggedIn, async(req, res) => {     
    // if(!req.query.n) res.redirect('/formsave');
    try{
        // 권한 체크 해야함
        var sql = `select * from hero_forms HF where id = ? and (HF.USER_ID = ? OR (HF.ID in (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) )`
        var [result, fields] = await pool.execute(sql, [req.params.id, req.user[0].id, req.user[0].id]);
        if(result.length <= 0) throw new Error("편성을 열람할 권한이 없습니다.");

        var sql = `SELECT * FROM CONTENTS_NAME
                    WHERE ENG_NAME= ?`;
        var [q_content, fields] = await  pool.execute(sql, [req.query.content ? req.query.content : 'all']);

        var sql = `SELECT * FROM FORM_STATUS
                    WHERE ID= ?`;
        var [now_formstatus, fields] = await  pool.execute(sql, [req.query.form_status ? req.query.form_status : '8']);

        let filtered_heroes_list, filtered_heroes_list_forrender;
        try{
            [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res,  pool);
        }catch(e){
            filtered_heroes_list = [];
            filtered_heroes_list_forrender =[];
        }

        // id로 form검색
        let [form_info, this_members] = await getDatas.getFormInfoNMembers(req, res,  pool); 
        let req_form_info , req_members
        if(form_info[0].COMMENTS_FOR_ID){
            [req_form_info, req_members] = await getDatas.getFormInfoNMembers(req, res,  pool, form_info[0].COMMENTS_FOR_ID); 
        }

        //where절 생성 
        let [where, q_list] = mypageFormWhereMaker(req, q_content, filtered_heroes_list);
        q_list.unshift(req.user[0].id);
        let order = getDatas.formOrderGetter(req, res);

        // 앞뒤 글 검색
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
        var [previous, fields] = await  pool.execute(sql, q_list );

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
        var [next, fields] = await  pool.execute(sql, q_list );


        // 게시글 id로 comment 및 reply 검색
        var [comments, replys, help_members] = await getDatas.getCommentsNReplys(req, res,  pool, req.params.id)

        // 내가 저장한 form 리스트 보내주기
        let saved_forms = []
        if(req.isAuthenticated()){
            var sql = `select * from form_save where user_id = ?`
            var [mysave, fields] = await pool.execute(sql, [req.user[0].id]);
            saved_forms = mysave.map((e) => e.form_id);
        }

        let data = {
            nickname: getDatas.loggedInNickname(req, res),
            content: q_content,
            now_formstatus : now_formstatus,
            form_access : req.query.form_access? req.query.form_access : 'all',
            filtered_heroes_list_forrender : filtered_heroes_list_forrender,
            form_id : req.params.id,
            form_info : form_info,
            members : this_members,
            req_form_info : req_form_info,
            req_members : req_members,
            previous : previous,
            next : next,
            comments : comments,
            replys : replys,
            help_members : help_members,
            saved_forms : saved_forms,
            banner_notice : req.banner_notice,
            
        }
        res.render('./mypage/mypage_formdetail.ejs',  {data : data})

    }catch(e){
        console.log(e);
        res.redirect("/?error="+e.message);
    }

    
})

// 편성 불러오기
router.get('/loadmyform', mustLoggedIn, async(req, res) => { 
    var sql = `SELECT * FROM FORM_STATUS
            ORDER BY status_name`;
    var [form_status_list, fields] = await  pool.execute(sql);
    
    let contents_list = await getDatas.getContentsName(req, res,  pool);

    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await  pool.execute(sql, [req.query.content ? req.query.content : 'all']);

    var sql = `SELECT * FROM FORM_STATUS
                WHERE ID= ?`;
    var [now_formstatus, fields] = await  pool.execute(sql, [req.query.form_status ? req.query.form_status : '8']);

    let hero_list = await getDatas.getHeroList(req, res,  pool);
    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res,  pool);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    // 쿼리에 맞는 폼만 출력하기
    // where 절 생성
    let [where, q_list] = mypageFormWhereMaker(req, q_content, filtered_heroes_list);

    let order = getDatas.formOrderGetter(req, res);
    
    var form_list, members;
    try{
        [form_list, members, page, max_page] = await getDatas.getFormlistNMembers(req, res, where, order, q_list,  pool);
    }catch(e){
        console.log(e)
        form_list = [];
        members =[];
    }
    
    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await pool.execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }
 
    let data = {
        from: 'mypage',
        nickname: getDatas.loggedInNickname(req, res),
        form_status_list : form_status_list,
        contents_list : contents_list,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : q_content,
        query_form_access : req.query.form_access? req.query.form_access : 'all',
        form_status : now_formstatus[0],
        hero_list : hero_list,
        form_list : form_list,
        members : members,
        saved_forms : saved_forms,
        page : page,
        max_page : max_page,
        banner_notice : req.banner_notice,
    }
    res.render('./mypage/mypage_loadmyform.ejs',  {data : data})
})


// 편성 불러오기 (편성 요청에 대한 도움)
router.get('/helping/loadmyform/:req_id', mustLoggedIn, async(req, res) => { 
    var sql = `SELECT * FROM FORM_STATUS
            ORDER BY status_name`;
    var [form_status_list, fields] = await  pool.execute(sql);
    
    let contents_list = await getDatas.getContentsName(req, res,  pool);

    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await  pool.execute(sql, [req.query.content ? req.query.content : 'all']);

    var sql = `SELECT * FROM FORM_STATUS
                WHERE ID= ?`;
    var [now_formstatus, fields] = await  pool.execute(sql, [req.query.form_status ? req.query.form_status : '8']);

    let hero_list = await getDatas.getHeroList(req, res,  pool);
    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res,  pool);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    // 쿼리에 맞는 폼만 출력하기
    // where 절 생성
    let [where, q_list] = mypageFormWhereMaker(req, q_content, filtered_heroes_list, true);
    let order = getDatas.formOrderGetter(req, res);
    
    var form_list, members;
    try{
        [form_list, members, page, max_page] = await getDatas.getFormlistNMembers(req, res, where, order, q_list,  pool);
    }catch(e){
        console.log(e)
        form_list = [];
        members =[];
    }
    
    // 내가 저장한 form 리스트 보내주기
    let saved_forms = []
    if(req.isAuthenticated()){
        var sql = `select * from form_save where user_id = ?`
        var [mysave, fields] = await pool.execute(sql, [req.user[0].id]);
        saved_forms = mysave.map((e) => e.form_id);
    }
 
    let data = {
        from: 'mypage_help', // 마이페이지면 편성 저장 출력용
        nickname: getDatas.loggedInNickname(req, res),
        form_status_list : form_status_list,
        contents_list : contents_list,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : q_content,
        query_form_access : req.query.form_access? req.query.form_access : 'all',
        form_status : now_formstatus[0],
        hero_list : hero_list,
        form_list : form_list,
        members : members,
        saved_forms : saved_forms,
        req_id : req.params.req_id,
        page : page,
        max_page : max_page,
        banner_notice : req.banner_notice,
    }
    res.render('./mypage/mypage_loadmyform.ejs',  {data : data})
})

router.get('/preview/detail/:id', async(req, res) => {     
    // if(!req.query.n) res.redirect('/formsave');
    try{
        // 권한 체크 해야함
        var sql = `select * from hero_forms HF where id = ? 
        and (HF.USER_ID = ? OR (HF.ID in (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) OR (HF.form_status_id = 7 AND HF.form_access_status_id = 1))`
        var [result, fields] = await pool.execute(sql, [req.params.id, req.user[0].id, req.user[0].id]);
        if(result.length <= 0) throw new Error("편성을 열람할 권한이 없습니다.");

        // console.log(req.params.id)

        // req.params.id로 form검색
        let [form_info, this_members] = await getDatas.getFormInfoNMembers(req, res,  pool); 

        // 내가 저장한 편성인지 여부
        var sql = `select * from form_save where user_id = ? and form_id = ?`
        var [mysave, fields] = await pool.execute(sql, [req.user[0].id, req.params.id]);


        let data = {
            form_id : req.params.id,
            form_info : form_info,
            members : this_members,
            saved : mysave.length>0? "true" : "false"
        }
        res.render('./components/form_preview_detail.ejs',  {data : data}, (err, html) =>{
            if(err){
                res.json({
                    status: "500",
                    message : err.message,
                })
                return;
            }
            res.json({
                status: "200",
                data : {html : html}
            })
        })

    }catch(e){
        console.log(e);
        res.json({
            status: "500",
            message : err,
        })
    }

    
})

router.get('/myhero', mustLoggedIn, async(req, res) => {

    let hero_list = await getDatas.getHeroList(req, res,  pool);

    var sql = `SELECT * FROM HERO_CLASSES
                ORDER BY KOR_NAME`;
    var [class_list, fields] = await  pool.execute(sql);

    var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
    var [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id]);
    let having_heroes_id = having_heroes.map(function(e, i){
        return e.hero_id;
    })

    // console.log(having_heroes_id);

    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        hero_list : hero_list,
        class_list: class_list,
        having_heroes : having_heroes,
        having_heroes_id : having_heroes_id,
        banner_notice : req.banner_notice,

    }
    res.render('./mypage/mypage_myhero.ejs',  {data : data})
})

// 보유 영웅 설정 > 체크한 거 모두 적용
router.post('/myhero/havingherosave', mustLoggedIn, async(req, res) => {
    // console.log(req.body);

    let checked_herolist = typeof(req.body.hero) != 'string'? req.body.hero : [req.body.hero];
    // console.log(checked_herolist);

    // DB에는 있는데 리스트에는 없는거 찾아서 DB 레코드 삭제
    var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
    var [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id]);

    for(let i=0; i<having_heroes.length; i++){
        if( !checked_herolist || checked_herolist.length <= 0 || !checked_herolist.includes(`${having_heroes[i].hero_id}`)){
            var sql = `DELETE FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [result, fields] = await  pool.execute(sql, [req.user[0].id, having_heroes[i].hero_id]);
        }
    }

    // 리스트에 있는게 DB에 있는지 찾아가지고 없으면 1렙 5초 0각 INSERT
    for(let i=0; checked_herolist && i<checked_herolist.length; i++){
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
        var [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id, checked_herolist[i]]);

        if(having_heroes.length <= 0){
             var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await  pool.execute(sql, [req.user[0].id, checked_herolist[i], 1, 5, 0]);
        }
    }

    

    res.redirect('/mypage/myhero')
})

router.get('/setting', mustLoggedIn, async(req, res) => {

    var sql = `SELECT U.ID, UE.USER_EMAIL  FROM user U
            INNER JOIN USER_EMAILS UE ON U.ID = UE.USER_ID
            WHERE U.ID = ?`;
    var [email, fields] = await  pool.execute(sql, [req.user[0].id]);

    var provider;
    if(req.user[0].username.includes("oauth")){
        var sql = `SELECT U.ID, FC.PROVIDER FROM user U
            INNER JOIN FEDERATED_CREDENTIALS FC ON U.ID = FC.USER_ID
            WHERE U.ID = ?`;
        [provider, fields] = await  pool.execute(sql, [req.user[0].id]);
        // console.log(provider)
    }

    
    let data = {
        nickname: req.user[0].nickname,
        username: req.user[0].username,
        email : email[0]["USER_EMAIL"],
        provider : provider,
        banner_notice : req.banner_notice,
    }
    res.render('./mypage/mypage_personalset.ejs',  {data : data})
})

router.post('/changenickname', mustLoggedIn, async(req, res) => {
    if(nicknameCheck(req.body.nickname)){
        try{
            var sql = `UPDATE user
                SET nickname = ?
                WHERE id = ?` ;
            
            await  pool.execute(sql, [ req.body.nickname ,req.user[0].id]);

            let result = {
                status: '200'
            }
            res.json(result)
        }catch(e){
            res.json({
                status : '500',
                message: "오류가 발생했습니다. 다시 시도하세요. 에러 메시지 : " + e.message
            });
        }
    } else{
        res.json({
                status : '500',
                message: "올바르지 않은 닉네임입니다."
            });
    }
})

/**
 * 닉네임 체크
 */
function nicknameCheck(nickname){
  if (nickname.length > 1 && nickname.length < 9){
    return true;
  } else{
    // console.log("닉네임 오류")
    return false;
  }
}

const bcrypt = require('bcrypt');


router.post('/changepassword', mustLoggedIn, async(req, res) => {
    try{
        if(req.user[0].username == 'oauth'){
            throw new Error("소셜로그인 이용자는 비밀번호를 변경할 수 없습니다.");
        }else if(! await nowpwCheck(req, res)){
            throw new Error("현재 비밀번호가 틀립니다.");
        } else if(!pwCheck(req.body.new_pw, req.body.new_pw_conf)){
            throw new Error("새 비밀번호의 양식 또는 비밀번호 확인에 오류가 있습니다.");
        }
        var sql = `UPDATE USER_PW_TABLE
                SET USER_PASSWORD = ?
                WHERE USER_ID = ?` ;
        
        await  pool.execute(sql, [ await bcrypt.hash(req.body.new_pw, 10) , req.user[0].id]);

        let result = {
            status: '200'
        }
        res.json(result)
    }catch(e){
        res.json({
            status : '500',
            message: "오류 : " + e.message
        });
    }
    
})

/**
 * 새 password 양식 체크
 */
function pwCheck(password, re_password){
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+-=]*$/;
  if(re_password == password && password.length<=20 && password.length>=8 && regex.test(password)){
    return true
  } else{
    return false
  }
}

/**
 * 기존 password 일치 체크
 */
async function nowpwCheck(req, res){
    // console.log(req.user)
    var sql = `SELECT * FROM USER
                INNER JOIN user_pw_table ON USER.id = USER_PW_TABLE.USER_ID
                WHERE USER.id = ?`;
    var [result, fields] = await  pool.execute(sql, [req.user[0].id]);


    console.log("CompareSync : " + bcrypt.compareSync(req.body.now_pw, result[0].user_password));
    return bcrypt.compareSync(req.body.now_pw, result[0].user_password);
}

router.post('/withdraw', mustLoggedIn, async(req, res) => {
    try{
        var sql = `DELETE FROM federated_credentials WHERE user_id = ?;` ;
        await  pool.execute(sql, [req.user[0].id]);
        var sql = `DELETE FROM user_pw_table WHERE user_id = ?;` ;
        await  pool.execute(sql, [req.user[0].id]);
        var sql = `DELETE FROM user_emails WHERE user_id = ?;` ;
        await  pool.execute(sql, [req.user[0].id]);
        var sql = `DELETE FROM hero_settings WHERE user_id = ?;` ;
        await  pool.execute(sql, [req.user[0].id]);

        var sql = `UPDATE USER SET USERNAME = '', NICKNAME="(탈퇴한 유저)" WHERE ID = ?`
        await  pool.execute(sql, [req.user[0].id]);


        var sql = `DELETE FROM hero_forms WHERE user_id = ? AND form_access_status_id = 2;` ;
        await  pool.execute(sql, [req.user[0].id]);

        // 로그아웃
        req.session.destroy(function(err){
            if(err) res.status(500).json(err.message);
        })
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.write("<script>alert('탈퇴가 완료되었습니다.')</script>");
        res.write("<script>window.location=\"/\"</script>");

    }catch(e){
        res.write("<script>alert('알 수 없는 오류로 인해 탈퇴하지 못했습니다.')</script>");
    }
    
})

module.exports=router;
