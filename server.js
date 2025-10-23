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

const { RedisStore } = require('connect-redis')
const redis = require("redis");


const client = redis.createClient({
   url: `redis://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/0`,
});

client.on("error", (err) => console.error("Redis error:", err));
client.connect();

const passportConfig = require('./passport');
passportConfig();


const passport = require('passport')



// app.use(passport.initialize())
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
  if (!req.isAuthenticated() &&req.method === 'GET' && !(req.path).startsWith('/login')  && !(req.path).includes('error')
    && !req.path.includes('com.chrome.devtools.json') && !req.path.includes('.well-known') && !req.path.includes('.png')
    && !req.path.includes('favicon.ico') && !req.path.includes('.') && !req.path.includes('download') && !req.path.includes('error')) {
    req.session.returnTo = req.originalUrl;
    console.log(req.session.returnTo)
    req.session.save();
  }
  next();
});

app.use('/login', require('./routes/login.js'));
app.use('/mailcheck', require('./routes/mailCheck.js'));
app.use('/forum', require('./routes/forum.js'));
app.use('/formmake', require('./routes/formmake.js'));
app.use('/mypage', require('./routes/mypage.js'));

const getDatas = require('./routes/getDatas.js')

app.get('/', (req, res) => {

  // console.log(req.query.error)
  if(req.query.error){
    res.render('error_alret.ejs', {data: {err: req.query.error}})

  } else{
    res.render('index.ejs',  {data : {nickname: getDatas.loggedInNickname(req, res)}})
  }
})

const { mustLoggedIn, mustNotLoggedIn } = require('./routes/middlewares'); // 내가 만든 사용자 미들웨어
const { heroSettingNormalSave, heroSettingAllSave } = require('./routes/setDatas'); // 내가 만든 사용자 미들웨어


app.post('/herosetting/normalsave', mustLoggedIn,  async(req, res) => {
    // console.log(req.body);
    try{
      await heroSettingNormalSave(req, res);

      var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
      var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id]);
      let having_heroes_id = having_heroes.map(function(e, i){
          return e.hero_id;
      })

      // console.log(having_heroes[1]);

      let result = {
        status: '200',
        data : {
          having_heroes : having_heroes,
          having_heroes_id : having_heroes_id,
        }
      }
      res.json(result)
    } catch{
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }
    
})

app.post('/herosetting/allsave', mustLoggedIn,  async(req, res) => {
    // console.log(req.body);
    try{
      await heroSettingAllSave(req, res);

      var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
      var [having_heroes, fields] = await (await connection).execute(sql, [req.user[0].id]);
      let having_heroes_id = having_heroes.map(function(e, i){
          return e.hero_id;
      })

      // console.log(having_heroes[1]);

      let result = {
        status: '200',
        data : {
          having_heroes : having_heroes,
          having_heroes_id : having_heroes_id,
        }
      }
      res.json(result)
    } catch{
        res.json({
          status : '500',
          message: "오류가 발생했습니다. 다시 시도하세요."
        });
    }
    
})

