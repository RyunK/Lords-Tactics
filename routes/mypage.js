const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/mypage/formsave');

})


router.get('/formsave', async(req, res) => { 
    var sql = `SELECT * FROM FORM_STATUS`;
    var [form_status_list, fields] = await (await connection).execute(sql);
    
    var sql = `SELECT * FROM CONTENTS_NAME
                ORDER BY KOR_NAME`;
    var [contents_list, fields] = await (await connection).execute(sql);
    // console.log(result);

    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [result, fields] = await (await connection).execute(sql, [req.query.content ? req.query.content : 'all']);

    var sql = `SELECT * FROM FORM_STATUS
                WHERE ID= ?`;
    var [now_formstatus, fields] = await (await connection).execute(sql, [req.query.form_status ? req.query.form_status : '1']);

    console.log(now_formstatus)

    var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                ORDER BY names.KOR_NAME, types.KOR_NAME`;
    var [hero_list, fields] = await (await connection).execute(sql);

    let filtered_heroes_list = req.query.hero? req.query.hero : [];
    let filtered_heroes_list_forrender = []

    if(!Array.isArray(filtered_heroes_list)){
        filtered_heroes_list = [filtered_heroes_list];
    }
    
    for(let i=0; i<filtered_heroes_list.length; i++){
        var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                WHERE LH.ID = ?`;
        var [filtered_hero, fields] = await (await connection).execute(sql, [filtered_heroes_list[i]]);

        filtered_heroes_list_forrender.push(filtered_hero[0]);
    }

    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        form_status_list : form_status_list,
        contents_list : contents_list,
        sort : req.query.sort? req.query.sort : 'tu',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : {
             kor_name : result? result[0].kor_name : '전체 컨텐츠',
             eng_name : req.query.content? req.query.content : 'all',
            },
        form_status : now_formstatus[0],
        hero_list : hero_list,
    }

    res.render('mypage_formsave.ejs',  {data : data})

})

module.exports=router;