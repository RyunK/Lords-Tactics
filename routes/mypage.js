const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const { heroSettingNormalSave, heroSettingAllSave } = require('./setDatas'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', mustLoggedIn, (req, res) => {
    // res.redirect('/forum/share');
    res.redirect('/mypage/formsave');

})


router.get('/formsave', mustLoggedIn, async(req, res) => { 
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

    // console.log(now_formstatus)

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

router.get('/myhero', mustLoggedIn, async(req, res) => {

    var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                ORDER BY names.KOR_NAME, types.KOR_NAME`;
    var [hero_list, fields] = await (await connection).execute(sql);

    var sql = `SELECT * FROM HERO_CLASSES
                ORDER BY KOR_NAME`;
    var [class_list, fields] = await (await connection).execute(sql);

    var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
    var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id]);
    let having_heroes_id = having_heroes.map(function(e, i){
        return e.hero_id;
    })

    // console.log(having_heroes_id);

    let data = {
        nickname: getDatas.loggedInNickname(req, res),
        hero_list : hero_list,
        class_list: class_list,
        having_heroes : having_heroes,
        having_heroes_id : having_heroes_id,

    }
    res.render('mypage_myhero.ejs',  {data : data})
})

// 보유 영웅 설정 > 체크한 거 모두 적용
router.post('/myhero/havingherosave', mustLoggedIn, async(req, res) => {
    // console.log(req.body);

    let checked_herolist = typeof(req.body.hero) != 'string'? req.body.hero : [req.body.hero];
    // console.log(checked_herolist);

    // DB에는 있는데 리스트에는 없는거 찾아서 DB 레코드 삭제
    var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
    var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id]);

    for(let i=0; i<having_heroes.length; i++){
        if(!checked_herolist.includes(`${having_heroes[i].hero_id}`)){
            var sql = `DELETE FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
            var [result, fields] = await (await connection).execute(sql, [req.user[0].id, having_heroes[i].hero_id]);
        }
    }

    // 리스트에 있는게 DB에 있는지 찾아가지고 없으면 1렙 5초 0각 INSERT
    for(let i=0; i<checked_herolist.length; i++){
        var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ? AND HERO_ID = ?`;
        var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id, checked_herolist[i]]);

        if(having_heroes.length <= 0){
             var sql = `INSERT INTO HERO_SETTINGS (USER_ID, HERO_ID, LV, CHO, GAK)
                        VALUES (?, ?, ?, ?, ?);`;
            var [result, fields] = await (await connection).execute(sql, [req.user[0].id, checked_herolist[i], 1, 5, 0]);
        }
    }

    

    res.redirect('/mypage/myhero')
})

router.get('/setting', mustLoggedIn, async(req, res) => {

    var sql = `SELECT U.ID, UE.USER_EMAIL  FROM user U
            INNER JOIN USER_EMAILS UE ON U.ID = UE.USER_ID
            WHERE U.ID = ?`;
    var [email, fields] = await (await connection).execute(sql, [req.user[0].id]);

    var provider;
    if(req.user[0].username.includes("oauth")){
        var sql = `SELECT U.ID, FC.PROVIDER FROM user U
            INNER JOIN FEDERATED_CREDENTIALS FC ON U.ID = FC.USER_ID
            WHERE U.ID = ?`;
        [provider, fields] = await (await connection).execute(sql, [req.user[0].id]);
        // console.log(provider)
    }

    
    let data = {
        nickname: req.user[0].nickname,
        username: req.user[0].username,
        email : email[0]["USER_EMAIL"],
        provider : provider,
    }
    res.render('mypage_personalset.ejs',  {data : data})
})

router.post('/changenickname', mustLoggedIn, async(req, res) => {
    if(nicknameCheck(req.body.nickname)){
        try{
            var sql = `UPDATE user
                SET nickname = ?
                WHERE id = ?` ;
            
            await (await connection).execute(sql, [ req.body.nickname ,req.user[0].id]);

            let result = {
                status: '200'
            }
            res.json(result)
        }catch(e){
            res.json({
                status : '500',
                message: "오류가 발생했습니다. 다시 시도하세요. 에러 메시지 : " + e.message
            });
        }
    } else{
        res.json({
                status : '500',
                message: "올바르지 않은 닉네임입니다."
            });
    }
})

/**
 * 닉네임 체크
 */
function nicknameCheck(nickname){
  if (nickname.length > 1 && nickname.length < 9){
    return true;
  } else{
    // console.log("닉네임 오류")
    return false;
  }
}

const bcrypt = require('bcrypt');


router.post('/changepassword', mustLoggedIn, async(req, res) => {
    try{
        if(req.user[0].username == 'oauth'){
            throw new Error("소셜로그인 이용자는 비밀번호를 변경할 수 없습니다.");
        }else if(! await nowpwCheck(req, res)){
            throw new Error("현재 비밀번호가 틀립니다.");
        } else if(!pwCheck(req.body.new_pw, req.body.new_pw_conf)){
            throw new Error("새 비밀번호의 양식 또는 비밀번호 확인에 오류가 있습니다.");
        }
        var sql = `UPDATE USER_PW_TABLE
                SET USER_PASSWORD = ?
                WHERE USER_ID = ?` ;
        
        await (await connection).execute(sql, [ await bcrypt.hash(req.body.new_pw, 10) , req.user[0].id]);

        let result = {
            status: '200'
        }
        res.json(result)
    }catch(e){
        res.json({
            status : '500',
            message: "오류 : " + e.message
        });
    }
    
})

/**
 * 새 password 양식 체크
 */
function pwCheck(password, re_password){
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+-=]*$/;
  if(re_password == password && password.length<=20 && password.length>=8 && regex.test(password)){
    return true
  } else{
    return false
  }
}

/**
 * 기존 password 일치 체크
 */
async function nowpwCheck(req, res){
    // console.log(req.user)
    var sql = `SELECT * FROM USER
                INNER JOIN user_pw_table ON USER.id = USER_PW_TABLE.USER_ID
                WHERE USER.id = ?`;
    var [result, fields] = await (await connection).execute(sql, [req.user[0].id]);


    console.log("CompareSync : " + bcrypt.compareSync(req.body.now_pw, result[0].user_password));
    return bcrypt.compareSync(req.body.now_pw, result[0].user_password);
}

router.post('/signout', mustLoggedIn, async(req, res) => {
    try{
        if(req.user[0].username == 'oauth'){
            throw new Error("소셜로그인 이용자는 비밀번호를 변경할 수 없습니다.");
        }else if(! await nowpwCheck(req, res)){
            throw new Error("현재 비밀번호가 틀립니다.");
        } else if(!pwCheck(req.body.new_pw, req.body.new_pw_conf)){
            throw new Error("새 비밀번호의 양식 또는 비밀번호 확인에 오류가 있습니다.");
        }
        var sql = `UPDATE USER_PW_TABLE
                SET USER_PASSWORD = ?
                WHERE USER_ID = ?` ;
        
        await (await connection).execute(sql, [ await bcrypt.hash(req.body.new_pw, 10) , req.user[0].id]);

        let result = {
            status: '200'
        }
        res.json(result)
    }catch(e){
        res.json({
            status : '500',
            message: "오류 : " + e.message
        });
    }
    
})

module.exports=router;