const router = require('express').Router();

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어

const passport = require('passport')


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

router.get('/', mustNotLoggedIn ,(req, res) => {
  if(req.user){
    res.redirect('/')
  } else {
    res.render('login.ejs', {data : {nickname: ""}, error: req.flash("error") })
  }
  
})

router.get('/register', mustNotLoggedIn, (req, res) => {
  if(req.user){
    res.redirect('/')
  } else {
    res.render('register.ejs', {data : {nickname: ""}})
  }
})

//* 구글로 로그인하기 라우터 ***********************
router.get('/google', [mustNotLoggedIn , passport.authenticate('google', { scope: ['profile', 'email'] })]); // 프로파일과 이메일 정보를 받는다.

//? 위에서 구글 서버 로그인이 되면, 구글 redirect url 설정에 따라 이쪽 라우터로 오게 된다. 인증 코드를 박게됨
router.get(
   '/google/callback',
   passport.authenticate('google', { failureRedirect: '/login' }), //? 그리고 passport 로그인 전략에 의해 googleStrategy로 가서 구글계정 정보와 DB를 비교해서 회원가입시키거나 로그인 처리하게 한다.
   (req, res) => {
      res.redirect('/');
   },
);

//* 네이버로 로그인하기 라우터 ***********************
router.get('/naver', passport.authenticate('naver', { authType: 'reprompt' }));

//? 위에서 네이버 서버 로그인이 되면, 네이버 redirect url 설정에 따라 이쪽 라우터로 오게 된다.
router.get(
   '/naver/callback',
   //? 그리고 passport 로그인 전략에 의해 naverStrategy로 가서 카카오계정 정보와 DB를 비교해서 회원가입시키거나 로그인 처리하게 한다.
   passport.authenticate('naver', { failureRedirect: '/' }),
   (req, res) => {
      res.redirect('/');
   },
);



/**
 * 회원가입
 */
router.post('/register', mustNotLoggedIn, async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let re_password = req.body.re_password;
  let nickname = req.body.nickname;
  let email = req.body.email;

  // console.log(username, password, nickname, email);

  if(!usernameCheck(username) || !pwCheck(password, re_password || !nicknameCheck(nickname) || !emailCheck(email))){
    console.log("회원가입 실패!");
    res.statusMessage = "Bad Input";
    res.status(400).end();
  }else{
    password = await bcrypt.hash(req.body.password, 10);
    // 이상한 데이터 없음
    try{
      var sql = `INSERT INTO user (username, nickname) VALUES( ? , ?)`;
      var [result, fields] = await (await connection).execute(sql, [username, nickname]);

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
 * 로그인
 */
router.post('/', mustNotLoggedIn, async (req, res, next) => {
  // 1. 아이디 비밀번호 검사
  // 2. 다르면 튕기기. 맞으면 로그인 id 적어서 세션 발행
  var redirectUrl;
  req.session.save((err) => {
    if (err) console.error(err);
    console.log("login-returnTo : " + req.session.returnTo);
    redirectUrl = req.session.returnTo || "/";
    // delete req.session.returnTo; // 한 번 쓰고 지워주기

    // console.log("login-redirect : " + redirectUrl);
  });
  
  passport.authenticate('local',  
    (error, user, info) => {
      if (error) return res.status(500).json(info.message)
      // if (!user) return res.redirect("/login?error=" + encodeURIComponent(info.message));

      if (!user) {
        req.flash("error", info.message);
        return res.redirect("/login");
      }
      req.logIn(user, (err) => {
        if (err) return next(err)
        
        if(req.body.keep_login){
          // console.log("로그인상태유지")
          const maxAge = 1000 * 60 * 60 * 24 * 14;
          req.session.cookie.maxAge = maxAge; // 쿠키
          req.session.cookie.expires = new Date(Date.now() + maxAge); // DB 반영
          req.session.touch();
        } else {
          // console.log("로그인상태유지 안함")
          req.session.cookie.expires = false;
          req.session.cookie.maxAge = null;
        }
        res.redirect(redirectUrl);

        
        
      })
  })(req, res, next)

})


/**
 * 로그아웃
 */
router.post('/logout', mustLoggedIn, async (req, res) => {

  req.session.destroy(function(err){
    if(err) res.status(500).json(err.message);
    res.redirect('/');
  })
})

/**
 * 회원가입 - 아이디 체크
 */
async function usernameCheck(username){
  var sql = `SELECT username from user 
             WHERE username = ?`;
  let [result, fields] = await (await connection).execute(sql, [username])
  // console.log(result[0].username);
  
  if(result.length > 0 || username.length >20 || username.length <6){
    console.log("id 오류")
    return false;
  } else {
    return true;
  }
  
}

router.post('/register/idcheck', async (req, res) => {
  console.log(`요청 들어옴. 데이터 : ${req.body.username}`);
  // console.log( await usernameCheck(req.body.username))
  res.send({result : await usernameCheck(req.body.username)});
})

/**
 * 회원가입 - password 체크
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
 * 회원가입 - 닉네임 체크
 */
function nicknameCheck(nickname){
  if (nickname.length > 1 && nickname.length < 9){
    return true;
  } else{
    console.log("닉네임 오류")
    return false;
  }
}

/**
 * 회원가입 - 이메일 체크
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