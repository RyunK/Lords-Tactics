// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);

const express = require('express');
const router = express.Router();
const pool = require('../database.js')
const getDatas = require('./getDatas.js')
const setDatas = require('./setDatas.js')

const { mustLoggedIn, mustNotLoggedIn, stoppedCheck } = require('./middlewares'); 
const {CreateFormData} = require('./form_data/CreateFormData.js');
// const getDatas = require('./getDatas.js')



router.get('/', async(req, res) => {
    let contents_list = await getDatas.getContentsName(req, res,  pool);
    let hero_list = await getDatas.getHeroList(req, res,  pool);

    let form_herolist = req.query.hero? req.query.hero : [];
    if(typeof(form_herolist) == "string"){
        form_herolist = [form_herolist];
    }
    var sql = `SELECT * FROM CONTENTS_NAME
              WHERE ENG_NAME = ?`;
    var [now_content, fields] = await pool.execute(sql, [req.query.content? req.query.content : "story"]);

    var having_heroes, fields, having_heroes_id;
    if (req.isAuthenticated()) {
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
        [having_heroes, fields] = await pool.execute(sql, [req.user[0].id? req.user[0].id : 0]);
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
        var [result, fields] = await pool.execute(sql, [req.params.form_id, req.user[0].id, req.user[0].id]);
        if(result.length <= 0) throw new Error("편성을 수정할 권한이 없습니다.");

        // 일반 데이터 불러오기
        let contents_list = await getDatas.getContentsName(req, res,  pool);
        let hero_list = await getDatas.getHeroList(req, res,  pool);

        // formdata 불러오기
        let [formdata, members] = await getDatas.getFormInfoNMembers(req, res, pool, req.params.form_id);
        let form_herolist = members.map(function(val){ return val.HERO_ID });

        // 유저 보유 영웅 출력
        var having_heroes, having_heroes_id;
        if (req.isAuthenticated()) {
            var sql = `SELECT * FROM HERO_SETTINGS
                    WHERE USER_ID = ?`;
            [having_heroes, fields] = await  pool.execute(sql, [req.user[0].id? req.user[0].id : 0]);
            having_heroes_id = having_heroes.map(function(e, i){
                return e.hero_id;
            })
        }
        
        let data = {
                nickname: getDatas.loggedInNickname(req, res),
                contents_list : contents_list,
                hero_list : hero_list,
                form_herolist : form_herolist,
                having_heroes : having_heroes,
                having_heroes_id : having_heroes_id,
                banner_notice : req.banner_notice,
                formdata : formdata[0],
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
        var [now_form, fields] = await pool.execute(sql, [req.params.id]);
        if(now_form.length <= 0) throw new Error("도움을 줄 수 없습니다.");
       
        // 일반 데이터 불러오기
        let contents_list = await getDatas.getContentsName(req, res,  pool);
        let hero_list = await getDatas.getHeroList(req, res,  pool);

        // 쿼리 영웅 정보 있다면 읽기
        let form_herolist = req.query.hero? req.query.hero : [];
        if(typeof(form_herolist) == "string"){
            form_herolist = [form_herolist];
        }

        // 질문글 정보 읽기
        let [askform_data, this_members] = await getDatas.getFormInfoNMembers(req, res,  pool, req.params.id); 
        
        if(!form_herolist || form_herolist.length <= 0){
            form_herolist = this_members.map(function(val){ return val.hero_id });
        }

        // 질문자 영웅 육성 정보
        var having_heroes, having_heroes_id;
        if (askform_data[0].MYHERO_ACCESS == 1) {
            var sql = `SELECT * FROM HERO_SETTINGS
                    WHERE USER_ID = ?`;
            [having_heroes, fields] = await  pool.execute(sql, [now_form[0].user_id]);
            having_heroes_id = having_heroes.map(function(e, i){
                return e.hero_id;
            })
        }

        
        let data = {
                nickname: getDatas.loggedInNickname(req, res),
                contents_list : contents_list,
                hero_list : hero_list,
                askform_data : askform_data[0],
                members : this_members,
                form_herolist : form_herolist,
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




// 편성 공개 게시
router.post('/postform', mustLoggedIn , stoppedCheck, async(req, res) => {
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
        var sql = `select * from hero_forms HF 
        where id = ? and 
        (HF.USER_ID = ? OR (HF.ID = (select form_id from form_save where user_id = ? and form_id = ?) 
        and HF.form_access_status_id = 1) );`
        var [result, fields] = await pool.execute(sql, [req.params.form_id, req.user[0].id, req.user[0].id, req.params.form_id]);
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

// 질문에 대한 답변 게시
router.post('/help/:form_id/postform', mustLoggedIn , stoppedCheck, async(req, res) => {
    try{

        // 공개됐으며 편성 요청인지 검사
        var sql = `select * from hero_forms HF where id = ? and ( form_status_id = 2 or form_status_id = 4) and form_access_status_id = 1`
        var [now_form, fields] = await pool.execute(sql, [req.params.form_id]);
        if(now_form.length <= 0) throw new Error("도움을 줄 수 없습니다.");
        
        let form_id = await setDatas.insertAnswerForm(req, res);
        res.redirect('/forum/help/detail/' + req.params.form_id);
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})

module.exports=router;