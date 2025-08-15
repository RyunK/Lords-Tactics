const router = require('express').Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../database.js')

// 1. 아이디 중복 검사 버튼을 누르면 중복검사
// 2. 입력한 정보 읽어오기 (완)
// 3. 비밀번호 암호화하여 저장 (완)
// 4. 확인용 이메일 전송
// 5. 이메일 인증


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
  let password = await bcrypt.hash(req.body.password, 10);
  let username = req.body.username;
  let email = req.body.email;

  console.log(userid, password, username, email);

  var sql = `INSERT INTO user (userid, username) VALUES('${userid}', '${username}')`;
  connection.query(sql,function(err, result) {
    if (err){
      console.log(err);
    } else{
      let user_id = result.insertId;
      var sql = `INSERT INTO user_emails (user_id, user_email) VALUES(${user_id}, '${email}')`;
      connection.query(sql,function(err, result) {
        if (err){
          console.log(err);
        }
      });

      var sql = `INSERT user_pw_table (user_id, user_password) VALUES(${user_id}, '${password}')`;
      connection.query(sql,function(err, result) {
        if (err){
          console.log(err);
        }
      });

    }
  });

  res.redirect('/login');
})

/**
 * 아이디 체크
 */
router.post('/register/idcheck', async (req, res) => {
  console.log(`요청 들어옴. 데이터 : ${req.body.userid}`);
  
  var sql = `SELECT userid from user 
             WHERE userid = '${req.body.userid}'`;
  connection.query(sql,function(err, result) {
    if (err){
      console.log(err);
    } else {
      if(result.length > 0){
        res.send({result: false}); 
      } else{
        res.send({result: true}); // 아이디 사용 가능

      }
    }
  });
})

module.exports = router;