const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const getDatas = require('./getDatas.js')

const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); 


router.get('/', async(req, res) => {
    var sql = `SELECT * FROM CONTENTS_NAME
              ORDER BY KOR_NAME`;
    var [contents_list, fields] = await (await connection).execute(sql);

    var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                ORDER BY names.KOR_NAME, types.KOR_NAME`;
    var [hero_list, fields] = await (await connection).execute(sql);
    
    let form_herolist = req.query.hero? req.query.hero : [];
    if(typeof(form_herolist) == "string"){
        form_herolist = [form_herolist];
    }

    // console.log(form_herolist);

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
        }

    res.render('form_making2.ejs', {data : data})

})

router.post('/postform', mustLoggedIn ,async(req, res) => {
    
    console.log(req.body);
    try{
        // contents_id select
        let content_name = req.body.content_name.trim();
        var sql = `SELECT * FROM CONTENTS_NAME
              WHERE KOR_NAME = ?`;
        var [content, fields] = await (await connection).execute(sql, [content_name]);

        // form_status_id select
        var sql = `SELECT * FROM FORM_STATUS
              WHERE STATUS_NAME = ?`;
        var [form_status, fields] = await (await connection).execute(sql, [req.body.form_status]);

        // form_access_status_id select
        var sql = `SELECT * FROM FORM_ACCESS_STATUS
              WHERE ENG_NAME = ?`;
        var [form_access_status, fields] = await (await connection).execute(sql, [req.body.form_access]);
        

        var sql = `INSERT hero_forms (user_id, contents_id, form_status_id, form_access_status_id ,myhero_access, writer_memo, last_datetime) 
                    VALUES( ?, ?, ?, ?, ?, ?, ?)`;
        var execute_list = [
            req.user[0].id, content[0].id, form_status[0].id, form_access_status[0].id, 
            req.body.myhero_access =='true', req.body.writer_memo, req.body.last_datetime];
        var [result, fields] = await (await connection).execute(sql, execute_list);

        // 추후에 올라간 해당 게시글로 이동하도록 수정
        res.redirect('/mypage/formsave');
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})



module.exports=router;