const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const getDatas = require('./getDatas.js')
const setDatas = require('./setDatas.js')

const { mustLoggedIn, mustNotLoggedIn, stoppedCheck } = require('./middlewares'); 


router.get('/', async(req, res) => {
    let contents_list = await getDatas.getContentsName(req, res, connection);
    let hero_list = await getDatas.getHeroList(req, res, connection);

    let form_herolist = req.query.hero? req.query.hero : [];
    if(typeof(form_herolist) == "string"){
        form_herolist = [form_herolist];
    }
    var sql = `SELECT * FROM CONTENTS_NAME
              WHERE ENG_NAME = ?`;
    var [now_content, fields] = await (await connection).execute(sql, [req.query.content? req.query.content : "story"]);

    var having_heroes, fields, having_heroes_id;
    if (req.isAuthenticated()) {
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
        [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id? req.user[0].id : 0]);
        having_heroes_id = having_heroes.map(function(e, i){
            return e.hero_id;
        })
    } else {
        
    }
    
    
    let data = {
            nickname: getDatas.loggedInNickname(req, res),
            contents_list : contents_list,
            hero_list : hero_list,
            form_herolist : form_herolist,
            now_content : now_content[0],
            writer_memo : req.query.writer_memo? req.query.writer_memo : "", 
            having_heroes : having_heroes,
            having_heroes_id : having_heroes_id,
            banner_notice : req.banner_notice,
        }

    res.render('./formmake/form_making2.ejs', {data : data})

})

router.get('/edit/:form_id', mustLoggedIn, async(req, res) => {

    try{
        // author_id 같거나 저장했고 공개 편성인지 권한 확인
        var sql = `select * from hero_forms HF where id = ? and (HF.USER_ID = ? OR (HF.ID in (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) )`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id, req.user[0].id, req.user[0].id]);
        if(result.length <= 0) throw new Error("편성을 수정할 권한이 없습니다.");

        let contents_list = await getDatas.getContentsName(req, res, connection);
        let hero_list = await getDatas.getHeroList(req, res, connection);

        var sql = `select * from form_members
                where form_id = ?`
        var [form_heroes, fields] = await(await connection).execute(sql, [req.params.form_id]);
        let form_herolist = form_heroes.map(function(val){ return val.hero_id });

        var sql = `SELECT * FROM CONTENTS_NAME
                WHERE id = (SELECT hf.CONTENTS_ID  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [now_content, fields] = await (await connection).execute(sql, [req.params.form_id]);

        var having_heroes, fields, having_heroes_id;
        if (req.isAuthenticated()) {
            var sql = `SELECT * FROM HERO_SETTINGS
                    WHERE USER_ID = ?`;
            [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id? req.user[0].id : 0]);
            having_heroes_id = having_heroes.map(function(e, i){
                return e.hero_id;
            })
        }

        var sql = `SELECT * FROM form_status
                WHERE id = (SELECT hf.form_status_id  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [form_status, fields] = await (await connection).execute(sql, [req.params.form_id]);

        var sql = `SELECT * FROM form_access_status
                WHERE id = (SELECT hf.form_access_status_id  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [form_access_status, fields] = await (await connection).execute(sql, [req.params.form_id]);

        var sql = `SELECT myhero_access, writer_memo FROM HERO_FORMS
                WHERE id = ?`;
        var [form, fields] = await (await connection).execute(sql, [req.params.form_id]);

        
        
        let data = {
                nickname: getDatas.loggedInNickname(req, res),
                contents_list : contents_list,
                hero_list : hero_list,
                form_herolist : form_herolist,
                now_content : now_content[0],
                form_status : form_status[0],
                form_access_status : form_access_status[0],
                myhero_access : form[0].myhero_access,
                writer_memo : form[0].writer_memo? form[0].writer_memo : "", 
                having_heroes : having_heroes,
                having_heroes_id : having_heroes_id,
                banner_notice : req.banner_notice,
            }

        res.render('./formmake/form_making2.ejs', {data : data})
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`)
    }
    

})

// 편성 도움 > 새로운 편성 공유
router.get('/help/:id', mustLoggedIn, async(req, res) => {

    try{
        // 공개 편성이고 편성 요청 혹은 편성 완료인지 확인
        var sql = `select * from hero_forms HF where id = ? and ( form_status_id = 2 or form_status_id = 4) and form_access_status_id = 1`
        var [now_form, fields] = await(await connection).execute(sql, [req.params.id]);
        if(now_form.length <= 0) throw new Error("도움을 줄 수 없습니다.");

        let contents_list = await getDatas.getContentsName(req, res, connection);
        let hero_list = await getDatas.getHeroList(req, res, connection);

        let form_herolist = req.query.hero? req.query.hero : [];
        if(typeof(form_herolist) == "string"){
            form_herolist = [form_herolist];
        }
        

        var sql = `SELECT * FROM CONTENTS_NAME
                WHERE id = (SELECT hf.CONTENTS_ID  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [now_content, fields] = await (await connection).execute(sql, [req.params.id]);

        var having_heroes, fields, having_heroes_id;
        if (now_form[0].myhero_access == 1) {
            var sql = `SELECT * FROM HERO_SETTINGS
                    WHERE USER_ID = ?`;
            [having_heroes, fields] = await (await connection).execute(sql, [now_form[0].user_id]);
            having_heroes_id = having_heroes.map(function(e, i){
                return e.hero_id;
            })
        }

        var sql = `SELECT * FROM form_status
                WHERE id = (SELECT hf.form_status_id  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [form_status, fields] = await (await connection).execute(sql, [req.params.id]);

        var sql = `SELECT * FROM form_access_status
                WHERE id = (SELECT hf.form_access_status_id  FROM HERO_FORMS HF WHERE hf.id = ?)`;
        var [form_access_status, fields] = await (await connection).execute(sql, [req.params.id]);

        let [form_info, this_members] = await getDatas.getFormInfoNMembers(req, res, connection); 
        
        if(!form_herolist || form_herolist.length <= 0){
            var sql = `select * from form_members
                where form_id = ?`
            var [form_heroes, fields] = await(await connection).execute(sql, [req.params.id]);
            form_herolist = form_heroes.map(function(val){ return val.hero_id });
        }

        
        let data = {
                nickname: getDatas.loggedInNickname(req, res),
                contents_list : contents_list,
                hero_list : hero_list,
                form_herolist : form_herolist,
                members : this_members,
                now_content : now_content[0],
                form_status : form_status[0],
                form_access_status : form_access_status[0],
                myhero_access : form_info[0].MYHERO_ACCESS,
                writer_memo : form_info[0].WRITER_MEMO? form_info[0].WRITER_MEMO : "", 
                writer : form_info[0].NICKNAME,
                having_heroes : having_heroes,
                having_heroes_id : having_heroes_id,
                helper_memo : req.query.writer_memo? req.query.writer_memo : "", 
                banner_notice : req.banner_notice,
            }

        res.render('./formmake/help_newform.ejs', {data : data})
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`)
    }
    

})





router.post('/postform', mustLoggedIn , stoppedCheck ,async(req, res) => {
    
    // console.log(req.body);
    try{
        
        let form_id = await setDatas.insertNewForm(req, res);
        res.redirect('/mypage/formsave/detail/' + form_id);
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})

// 수정 후 게시
router.post('/edit/:form_id/postform', mustLoggedIn , stoppedCheck, async(req, res) => {
    
    try{
        // author_id 같거나 저장했는지 권한 확인
        var sql = `select * from hero_forms HF where id = ? and (HF.USER_ID = ? OR (HF.ID = (select form_id from form_save where user_id = ?) and HF.form_access_status_id = 1) )`
        var [result, fields] = await(await connection).execute(sql, [req.params.form_id, req.user[0].id, req.user[0].id]);
        if(result.length <= 0) throw new Error("편성을 수정할 권한이 없습니다.");

        let form_id;
        
        // author id 다르면 create / 같으면 update
        if(result[0].user_id != req.user[0].id){
            form_id = await setDatas.insertNewForm(req, res);
        }else {
            await setDatas.updateForm(req, res);
            form_id = req.params.form_id;
        }
        
        
        res.redirect('/mypage/formsave/detail/' + form_id);
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})

router.post('/help/:form_id/postform', mustLoggedIn , stoppedCheck, async(req, res) => {
    
    // console.log(req.body);
    try{

        // 공개됐으며 편성 요청인지 검사
        var sql = `select * from hero_forms HF where id = ? and ( form_status_id = 2 or form_status_id = 4) and form_access_status_id = 1`
        var [now_form, fields] = await(await connection).execute(sql, [req.params.form_id]);
        if(now_form.length <= 0) throw new Error("도움을 줄 수 없습니다.");
        
        let form_id = await setDatas.insertAnswerForm(req, res);
        res.redirect('/forum/help/detail/' + req.params.form_id);
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})

module.exports=router;