const express = require('express');
const router = express.Router();
const connection = require('../database.js')
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

    console.log(form_herolist);

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

module.exports=router;