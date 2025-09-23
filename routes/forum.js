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
    
    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'tu',
        content : {
             kor_name : result? result[0]['kor_name'] : '전체 컨텐츠',
             eng_name : req.query.content
            },
        contents_list : contents_list,
    }

    res.render('forum.ejs',  {data : data})

})

module.exports=router;