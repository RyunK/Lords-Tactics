const router = require('express').Router();

const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../database.js')

const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')

router.use(passport.initialize())
router.use(session({
  secret: process.env.CODE,
  resave : false,
  saveUninitialized : false,
}))

router.use(passport.session()) 

/**
 * 로그인 ID 비번 검사
 */
passport.use(new LocalStrategy(async (inputid, inputpw, cb) => {
  try {
    console.log(`id: ${inputid} / pw: ${inputpw}`)

    var sql = `SELECT * FROM USER
              INNER JOIN user_pw_table ON USER.id = USER_PW_TABLE.USER_ID
              WHERE USERNAME= ?`;

    var [result, fields] = await (await connection).execute(sql, [inputid]);

    // console.log(result);
    if (result.length <= 0) {
      return cb(null, false, { message: '잘못된 ID' })
    }
    // console.log(bcrypt.compareSync(inputpw, result[0].user_password))
    if (await bcrypt.compareSync(inputpw, result[0].user_password)) {
      return cb(null, result)
    } else {
      return cb(null, false, { message: '비번불일치' });
    }
  } catch (err){
    return cb(null, false, { message:  '알 수 없는 오류'})
  }
}))

passport.serializeUser((user, done) => {
  process.nextTick(() => {
  console.log("serialize / " + user[0].id)
    done(null, { id: user[0].id, username: user[0].username })
  })
})

passport.deserializeUser(async (user, done) => {
  console.log("dserialize / " + user.id)
  var sql = `SELECT * FROM USER
              WHERE ID= ?`;

  let [result, fields] = await (await connection).execute(sql, [user.id]);
  process.nextTick(() => {
    return done(null, result)
  })
})

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

router.get('/', (req, res) => {
  if(req.user){
    res.redirect('/')
  } else {
    res.render('login.ejs', {data : {nickname: ""}})
  }
  
})

router.get('/register', (req, res) => {
  if(req.user){
    res.redirect('/')
  } else {
    res.render('register.ejs', {data : {nickname: ""}})
  }
})


/**
 * 회원가입
 */
router.post('/register', async (req, res) => {
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
router.post('/', async (req, res, next) => {
  // 1. 아이디 비밀번호 검사
  // 2. 다르면 튕기기. 맞으면 세션 발행
  // 3. 로그인한 사람 닉네임 전달
  passport.authenticate('local', (error, user, info) => {
      if (error) return res.status(500).json(info.message)
      if (!user) return res.status(401).json(info.message)
      req.logIn(user, (err) => {
        if (err) return next(err)
        res.redirect('/')
      })
  })(req, res, next)

  // join 후 select 해서 있으면 로그인 성공 없으면 실패
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