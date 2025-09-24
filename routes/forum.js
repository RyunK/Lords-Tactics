const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/forum/share/?sort=tu');

})

// router.get('/:forumtab', (req, res) => {
//     res.redirect(`/forum/${req.params.forumtab}`);
// })

router.get('/:forumtab', async(req, res) => {
    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [result, fields] = await (await connection).execute(sql, [req.query.content ? req.query.content : 'all']);
    // console.log(result);

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
    
    
    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'tu',
        content : {
             kor_name : result? result[0]['kor_name'] : '전체 컨텐츠',
             eng_name : req.query.content
            },
        contents_list : contents_list,
        hero_list : hero_list,
    }

    res.render('forum.ejs',  {data : data})

})

module.exports=router;