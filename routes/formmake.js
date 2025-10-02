const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')



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
    let form_herolist_forrender = []
    for(let i=0; i<form_herolist.length; i++){
        var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                WHERE LH.ID = ?`;
        var [form_hero, fields] = await (await connection).execute(sql, [form_herolist[i]]);
        form_herolist_forrender.push(form_hero[0]);
    }

    var sql = `SELECT * FROM CONTENTS_NAME
              WHERE ENG_NAME = ?`;
    var [now_content, fields] = await (await connection).execute(sql, [req.query.content? req.query.content : "story"]);
    
    let data = {
            nickname: getDatas.loggedInNickname(req, res),
            contents_list : contents_list,
            hero_list : hero_list,
            form_herolist_forrender : form_herolist_forrender,
            now_content : now_content[0],
        }

    res.render('form_making.ejs', {data : data})

})

module.exports=router;