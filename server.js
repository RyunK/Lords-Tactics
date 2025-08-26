const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/statics')) 

require('dotenv').config() // .env 파일 사용


var fs = require('fs');
app.listen(process.env.PORT, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

const cookieParser = require("cookie-parser");
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/static', express.static('public'));
app.use(cookieParser());

const connection = require('./database.js')

const session = require('express-session')
// const MySQLStore = require("express-mysql-session")(session);

// var sessionStore = new MySQLStore({
//   host : process.env.DB_HOST,  
//   user : process.env.DB_USER,
//   password : process.env.DB_PW,
//   database : process.env.DB_NAME,
//   port : process.env.DB_PORT
// });

const { RedisStore } = require('connect-redis')
const redis = require("redis");


const client = redis.createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
});

client.on("error", (err) => console.error("Redis error:", err));
client.connect();

// redisClient.on('connect', () => {
//    console.info('Redis connected!');
// });
// redisClient.on('error', (err) => {
//    console.error('Redis Client Error', err);
// });
// redisClient.connect().then(); // redis v4 연결 (비동기)
// const redisCli = redisClient.v4; // 기본 redisClient 객체는 콜백기반인데 v4버젼은 프로미스 기반이라 사용


const passportConfig = require('./passport');
passportConfig();


const passport = require('passport')



app.use(passport.initialize())
app.use(session({
  secret: process.env.CODE,
  resave : false,
  saveUninitialized : false,
  cookie: {
      httpOnly: true,
      secure: false,
    },
    store: new RedisStore({ client }), 
}));

app.use(passport.initialize()); 
app.use(passport.session());

const flash = require("connect-flash");
app.use(flash());

/**
 * 로그인 화면 외 링크 저장해둠.
 * 로그인 및 로그아웃 성공 후 이전 화면으로 이동하기 위함.
 */
app.use((req, res, next) => {
  if (!req.isAuthenticated() &&req.method === 'GET' && req.path !== '/login' && !req.path.includes('error')
    && !req.path.includes('com.chrome.devtools.json') && !req.path.includes('.well-known')) {
    req.session.returnTo = req.originalUrl;
    // console.log(req.session.returnTo)
    req.session.save();
  }
  next();
});

app.use('/login', require('./routes/login.js'));
app.use('/mailcheck', require('./routes/mailCheck.js'));

const getDatas = require('./routes/getDatas.js')

app.get('/', (req, res) => {

  // console.log(getDatas.loggedInNickname(req, res))
  res.render('index.ejs',  {data : {nickname: getDatas.loggedInNickname(req, res)}})
})


app.get('/formmake', (req, res) => {
  fs.readdir('./statics/sources/img/characters', (err, filelist) => {
    // console.log(err);
    // console.log(filelist);
    let characterslist = filelist.map(e=>{
      let t = e.split('_')[0]
      return {file : e, type: t}
    })
    res.render('form_making.ejs', {characterslist : characterslist})
  })
}) 