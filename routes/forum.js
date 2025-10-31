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
                WHERE NOT LH.ID = '0'
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
    
    // console.log(req.query)

    // 쿼리에 맞는 편성들 내보내기
    // 공개 설정 여부, 정렬, 영웅 필터, 컨텐츠 query에서 읽어서

    let content_name = req.query.content? req.query.content : 'all';
    var sql = `SELECT * FROM CONTENTS_NAME
            WHERE ENG_NAME = ?`;
    var [content, fields] = await (await connection).execute(sql, [content_name]);

    // userid는 필수. contents id 없거나 9면 true, req.params.forumtab=share면 공유만, help면 요청 + 완료 form_access_status_id 없거나 3이면 true
    // sort saved_cnt면 저장횟수순, view면 조회수, new면 최신순
    
    var where = ``, order = '';
    let q_list = []
    if(req.params.forumtab == 'share'){
        where += 'HF.FORM_STATUS_ID = ? '
        q_list.push(1);
    } else{
        where += '(HF.FORM_STATUS_ID = ? OR HF.FORM_STATUS_ID = ?) '
        q_list.push(2);
        q_list.push(4);
    }

    if(content[0].id == '9') where += `AND TRUE `;
    else{
        where += `AND HF.CONTENTS_ID = ? `;
        q_list.push(content[0].id)
    } 

    where += `AND HF.FORM_ACCESS_STATUS_ID = ? `;
    q_list.push(1)


    if(!req.query.hero) where += `AND TRUE `;
    else{
        let sql_heroes = '(';
        for(let i=0; i<filtered_heroes_list.length; i++){
            sql_heroes += ` fM.HERO_ID = ? `
            q_list.push(filtered_heroes_list[i]);
            if(i < filtered_heroes_list.length - 1) sql_heroes += 'OR'
        }
        sql_heroes += ')';
        where += 'AND' + sql_heroes;
    }

    if(!req.query.sort || req.query.sort =='saved_cnt'){
        order += 'ORDER BY SAVED_CNT DESC;'
    } else if(req.query.sort =='view'){
        order += 'ORDER BY VIEW DESC;'
    } else if(req.query.sort == 'new'){
        order += 'ORDER BY LAST_DATETIME DESC;'
    }

    var sql = `SELECT T.* FROM (
                SELECT HF.ID, HF.WRITER_MEMO, HF.LAST_DATETIME, HF.VIEW, HF.SAVED_CNT,
                FM.HERO_ID, CN.KOR_NAME as CONTENT_NAME, FS.STATUS_NAME, USER.NICKNAME,
                    ROW_NUMBER() OVER (
                        PARTITION BY HF.id 
                        ORDER BY HF.last_datetime DESC
                    ) AS rn
                FROM HERO_FORMS HF
                INNER JOIN FORM_MEMBERS FM ON HF.ID = fM.FORM_ID
                INNER JOIN CONTENTS_NAME CN ON HF.CONTENTS_ID = CN.ID
                INNER JOIN FORM_STATUS FS ON HF.FORM_STATUS_ID = FS.ID
                INNER JOIN USER ON HF.USER_ID = USER.ID
                WHERE ${where}
            ) AS T
            WHERE T.rn = 1
            ${order} `;
    
    var [form_list, fields] = await (await connection).execute(sql, q_list );

    var form_ids = form_list.map(function(e){
        return e.ID;
    })
    form_ids = form_ids.join();
    // 미리보기를 위한 form_hero와 launched_hero inner join

    var members
    if(form_ids == ''){
        members = []
    }else{
        var sql = `SELECT form_id, types.ENG_NAME AS type, names.ENG_NAME AS name, hc.ENG_NAME AS class  FROM FORM_MEMBERS FM
            INNER JOIN LAUNCHED_HEROES LH ON FM.HERO_ID = lh.ID 
            INNER JOIN HERO_CLASSES HC ON lh.CLASS_ID = hc.IDX 
            INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
            INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
            WHERE form_id IN (${form_ids})
            ORDER BY form_id;`;
        [members, fields] = await (await connection).execute(sql);
    }

    
    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        forumtab: req.params.forumtab,
        sort : req.query.sort? req.query.sort : 'saved_cnt',
        filtered_heroes : filtered_heroes_list,
        filtered_heroes_forrender : filtered_heroes_list_forrender,
        content : {
             kor_name : result? result[0]['kor_name'] : '전체 컨텐츠',
             eng_name : req.query.content? req.query.content : 'all',
            },
        contents_list : contents_list,
        hero_list : hero_list,
        form_list : form_list,
        members : members,
    }
    // console.log("filtered_heroes : " + filtered_heroes_list)

    res.render('forum.ejs',  {data : data})

})

module.exports=router;