const express = require('express')
const app = express()
app.set('trust proxy', true);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/statics')) 

require('dotenv').config() // .env 파일 사용


var fs = require('fs');
app.listen(process.env.PORT, () => {
    console.log(`http://localhost:${process.env.PORT} 에서 서버 실행중`)
})

const cookieParser = require("cookie-parser");
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use('/static', express.static('public'));
app.use(cookieParser());

const pool = require('./database.js')

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
    && !req.path.includes('favicon.ico') && !req.path.includes('.') && !req.path.includes('download') && !req.query.error
    && !req.path.includes('/personalinfo') && !req.path.includes('preview')) {
    req.session.returnTo = req.originalUrl;
    console.log(req.session.returnTo)
    req.session.save();
  }
  console.log("요청 url: " + req.originalUrl)
  next();
});

/**
 * 고정된 공지사항 + 최신 공지사항 1개 제목과 id를 req.notice_banner에 담아 전달
 */
app.use(async (req, res, next) => {
  var sql = `(select id, subject from notice_table
            where pin = TRUE)
            UNION
            (SELECT id, subject FROM NOTICE_TABLE
            WHERE pin = FALSE 
            ORDER BY UPLOAD_DATETIME DESC
            LIMIT 1);`;
  var [result, fields] = await pool.execute(sql);
  req.banner_notice = result;
  next();
});

app.use('/login', require('./routes/login.js'));
app.use('/forum', require('./routes/forum.js'));
app.use('/formmake', require('./routes/formmake.js'));
app.use('/mypage', require('./routes/mypage.js'));
app.use('/main',  require('./routes/main.js'))
app.use('/info',  require('./routes/info.js'))
app.use('/admin',  require('./routes/admin.js'))

const getDatas = require('./routes/getDatas.js')

app.get("/personalinfo", (req, res) =>{
  data = {
    nickname: getDatas.loggedInNickname(req, res),
    banner_notice : req.banner_notice,
  }
  res.render('personal_info.ejs', {data: data})
})

app.get('/', (req, res) => {

  // console.log(req.query.error)
  if(req.query.error){
    res.render('error_alret.ejs', {data: {err: req.query.error}})

  } else{
    res.redirect('/main')
  }
})

app.get('/detail/:id', async(req, res) => {
  var sql = `select form_status_id from hero_forms where id=?`
  var[result, fields] = await pool.execute(sql, [req.params.id]);

  if(result[0].form_status_id == 1){
    res.redirect('/forum/share/detail/'+req.params.id);
    return;
  } else{
    res.redirect('/forum/help/detail/'+req.params.id);
    return;
  }
})
const { mustLoggedIn, mustNotLoggedIn } = require('./routes/middlewares'); 
const { heroSettingNormalSave, heroSettingAllSave } = require('./routes/setDatas'); 


app.post('/herosetting/normalsave', mustLoggedIn,  async(req, res) => {
    // console.log(req.body);
    try{
      await heroSettingNormalSave(req, res);

      var sql = `SELECT * FROM HERO_SETTINGS
                WHERE USER_ID = ?`;
      var [having_heroes, fields] = await pool.execute(sql, [req.user[0].id]);
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
    } catch(e){
	console.log(e.message);
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
      var [having_heroes, fields] = await pool.execute(sql, [req.user[0].id]);
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


app.use(function (req, res, next) {
    res.render('error_alret.ejs', {data: {err: '존재하지 않는 페이지입니다.'}})
});

app.use((err, req, res, next) => {
    console.error(err); // 서버 로그에 에러 기록
    
    // 이미 헤더가 전송되었다면 Express 기본 에러 핸들러에 위임
    if (res.headersSent) {
        return next(err);
    }
    
    const status = err.status || 500;
    // 💡 Ajax 요청 여부 확인
    const isAjax = req.xhr || (req.headers['x-requested-with'] === 'XMLHttpRequest');
    if (isAjax) {
        // JSON 응답 로직
        res.status(status).json({
        message: err.message,
    });
    } else {
      res.redirect("/?error=" + err.message)
    }
    
    // 모든 에러를 JSON 형식으로 응답
    
});