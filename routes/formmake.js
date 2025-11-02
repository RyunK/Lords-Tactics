const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const getDatas = require('./getDatas.js')

const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); 


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
        }

    res.render('form_making2.ejs', {data : data})

})

/**
 * {
  form_status: '편성 공유',
  form_access: 'private',
  content_name: '아레나',
  hero: [ '27', '28', '29', '26', '30' ],
  myhero_access: 'true',
  writer_memo: '로잔나를 좋아하는 세팅\r\n통령님 너무 좋아!!!',
  last_datetime: '2025-10-30 18:22:28'
}
 */

router.post('/postform', mustLoggedIn ,async(req, res) => {
    
    // console.log(req.body);
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
        
        let form_id = result.insertId;
        for(let i=0; i<req.body.hero.length; i++){
            var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [hero_info, fields] = await (await connection).execute(sql, [req.user[0].id, req.body.hero[i]]);
            let lv, cho, gak;
            // console.log(hero_info + typeof(hero_info))
            lv = hero_info.length > 0 ? hero_info[0].lv : 0;
            cho = hero_info.length > 0  ? hero_info[0].cho : 5;
            gak = hero_info.length > 0  ? hero_info[0].gak : 0;
            
            var sql = `INSERT FORM_MEMBERS (form_id, hero_id, hero_lv, hero_cho, hero_gak)
                VALUES(?, ?, ?, ?, ?)`;
            var [hero_info, fields] = await (await connection).execute(sql, [form_id, req.body.hero[i], lv, cho, gak]);
        }
        

        // 추후에 올라간 해당 게시글로 이동하도록 수정
        res.redirect('/mypage/formsave');
    }catch(e){
        console.log(e);
        res.redirect(`/?error=${e.message}`);
    }


})



module.exports=router;