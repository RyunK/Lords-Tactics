const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/forum/share/?sort=tu');

})

router.get('/:forumtab', async(req, res) => {
    var sql = `SELECT * FROM CONTENTS_NAME
                WHERE ENG_NAME= ?`;
    var [q_content, fields] = await (await connection).execute(sql, [req.query.content ? req.query.content : 'all']);
    
    let contents_list = await getDatas.getContentsName(req, res, connection);
    let hero_list = await getDatas.getHeroList(req, res, connection);
    let filtered_heroes_list, filtered_heroes_list_forrender;
    try{
        [filtered_heroes_list, filtered_heroes_list_forrender] = await getDatas.get_filtered_herolist(req, res, connection);
    }catch(e){
        filtered_heroes_list = [];
        filtered_heroes_list_forrender =[];
    }

    // 쿼리에 맞는 편성들 내보내기
    
    var where = ``;
    let q_list = []
    if(req.params.forumtab == 'share'){
        where += 'HF.FORM_STATUS_ID = ? '
        q_list.push(1);
    } else{
        where += '(HF.FORM_STATUS_ID = ? OR HF.FORM_STATUS_ID = ?) '
        q_list.push(2);
        q_list.push(4);
    }

    if(q_content[0].id != '9') {
        where += `AND HF.CONTENTS_ID = ? `;
        q_list.push(q_content[0].id)
    }

    where += `AND HF.FORM_ACCESS_STATUS_ID = ? `;
    q_list.push(1)


    if(req.query.hero){
        let sql_heroes = '';
        for(let i=0; i<filtered_heroes_list.length; i++){
            sql_heroes += ` fM.HERO_ID = ? `
            q_list.push(filtered_heroes_list[i]);
        }
        where += 'AND' + sql_heroes;
    }

    let order = getDatas.formOrderGetter(req, res);

    try{
        [form_list, members] = await getDatas.getFormlistNMembers(where, order, q_list, connection);
    }catch(e){
        console.log(e)
        form_list = [];
        members =[];
    }

    
    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : q_content,
        contents_list : contents_list,
        hero_list : hero_list,
        form_list : form_list,
        members : members,
    }
    // console.log("filtered_heroes : " + filtered_heroes_list)

    res.render('./forum/forum.ejs',  {data : data})

})

module.exports=router;