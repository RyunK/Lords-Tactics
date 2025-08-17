const router = require('express').Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../database.js')

// 회원가입
// 1. 아이디 중복 검사 버튼을 누르면 중복검사 (완)
// 2. 입력한 정보 읽어오기 (완)
// 3. 비밀번호 암호화하여 저장 (완)
// 4. 확인용 이메일 전송
// 5. 이메일 인증 (나중에)

// 로그인
// 1. 아이디 비밀번호 검사
// 2. 다르면 튕기기. 맞으면 세션 발행
// 3. 로그인한 사람 닉네임 전달

router.get('/', (요청, 응답) => {
  응답.render('login.ejs')
})

router.get('/register', (요청, 응답) => {
  응답.render('register.ejs')
})


/**
 * 회원가입 시 데이터 추가
 */
router.post('/register', async (req, res) => {
  let userid = req.body.userid;
  let password = req.body.password;
  let re_password = req.body.re_password;
  let username = req.body.username;
  let email = req.body.email;

  // console.log(userid, password, username, email);

  if(!useridCheck(userid) || !pwCheck(password, re_password || !usernameCheck(username) || !emailCheck(email))){
    console.log("회원가입 실패!");
    res.statusMessage = "Bad Input";
    res.status(400).end();
  }else{
    password = await bcrypt.hash(req.body.password, 10);
    // 이상한 데이터 없음
    try{
      var sql = `INSERT INTO user (userid, username) VALUES( ? , ?)`;
      var [result, fields] = await (await connection).execute(sql, [userid, username]);

      let user_id = result.insertId;
      var sql = `INSERT INTO user_emails (user_id, user_email) VALUES(?, ?)`;
      var [result, fields] = await (await connection).execute(sql, [user_id, email]);

      var sql = `INSERT user_pw_table (user_id, user_password) VALUES( ? , ?)`;
      var [result, fields] = await (await connection).execute(sql, [user_id, password]);

      res.send("<script>alert('회원가입에 성공했습니다. 해당 아이디로 로그인하세요.'); location.href='/login';</script>");
    } catch{
      console.log(err);
      res.statusMessage = "DB ERROR";
      res.status(500).end();
    }

  }

  
})

/**
 * 아이디 체크
 */
async function useridCheck(userid){
  var sql = `SELECT userid from user 
             WHERE userid = ?`;
  let result = await (await connection).execute(sql, [userid])
  // console.log(result);
  
  if(result[0].length > 0 || userid.length >20 || userid.length <6){
    console.log("id 오류")
    return false;
  } else {
    return true;
  }
  
}

router.post('/register/idcheck', async (req, res) => {
  console.log(`요청 들어옴. 데이터 : ${req.body.userid}`);
  // console.log( await useridCheck(req.body.userid))
  res.send({result : await useridCheck(req.body.userid)});
})

/**
 * password 체크
 */
function pwCheck(password, re_password){
  const regex = /^[a-zA-Z0-9!@#$%^&*()_+-=]*$/;
  if(re_password == password && password.length<=20 && password.length>=8 && regex.test(password)){
    return true
  } else{
    console.log(`re_password == password : ${re_password == password}
      password.length : ${password.length}
      regex.test(password) : ${regex.test(password)}`)
    console.log("비밀번호 오류")
    return false
  }
}

/**
 * 닉네임 체크
 */
function usernameCheck(username){
  if (username.length > 1 && username.length < 9){
    return true;
  } else{
    console.log("닉네임 오류")
    return false;
  }
}

/**
 * 이메일 체크
 */
function emailCheck(email){
  const regex = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/i
  if (!regex.test(email)) {
    // 입력된 값이 정규 표현식과 맞지 않음
    console.log("이메일 오류")
    return false;
  } else{
      return true;
  }
}


module.exports = router;