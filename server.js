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
    && !req.path.includes('com.chrome.devtools.json') && !req.path.includes('.well-known')) {
    req.session.returnTo = req.originalUrl;
    // console.log(req.session.returnTo)
    req.session.save();
  }
  next();
});

app.use('/login', require('./routes/login.js'));
app.use('/mailcheck', require('./routes/mailCheck.js'));
app.use('/forum', require('./routes/forum.js'));

const getDatas = require('./routes/getDatas.js')

app.get('/', (req, res) => {

  // console.log(req.query.error)
  if(req.query.error){
    res.render('error_alret.ejs', {data: {err: req.query.error}})

  } else{
    res.render('index.ejs',  {data : {nickname: getDatas.loggedInNickname(req, res)}})
  }
})


app.get('/formmake', async(req, res) => {


  // let filelist =  fs.readdir('./statics/sources/img/characters', async (err, filelist) => {
    // console.log(err);
    // console.log(filelist);

    // console.log(filelist)
    let characterslist = [];

    // for(let i=0; i<filelist.length; i++){
    //   let t = filelist[i].split('_')[0]
    //   let name = filelist[i].split('_')[1]

    //   var sql = `SELECT KOR_NAME FROM HERO_NAMES
    //             WHERE ENG_NAME= ?`;
    //   var [result, fields] = await (await connection).execute(sql, [name]);

    //   // console.log(e);

    //   characterslist.push({file : filelist[i], type: t, name: result[0].KOR_NAME}); 
    // }

    var sql = `SELECT * FROM CONTENTS_NAME
                ORDER BY KOR_NAME`;
    var [contents_list, fields] = await (await connection).execute(sql);

    var sql = `SELECT LH.ID, types.ENG_NAME AS 'eng_type', types.KOR_NAME AS 'kor_type', 
                names.ENG_NAME AS 'eng_name', names.KOR_NAME AS 'kor_name', 
                classes.ENG_NAME AS 'eng_class', classes.KOR_NAME AS 'kor_class'  FROM LAUNCHED_HEROES AS LH
                INNER JOIN HERO_NAMES  names ON names.IDX = NAME_ID
                INNER JOIN HERO_CLASSES  classes ON classes.IDX = CLASS_ID
                INNER JOIN HERO_TYPES  types ON types.IDX = TYPE_ID
                ORDER BY names.KOR_NAME, types.KOR_NAME`;
    var [hero_list, fields] = await (await connection).execute(sql);

    let data = {
            nickname: getDatas.loggedInNickname(req, res),
            contents_list : contents_list,
            hero_list : hero_list,
            // characterslist : characterslist,
        }

    res.render('form_making.ejs', {data : data})
  // })
}) 