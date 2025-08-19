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

const passportConfig = require('./passport');
passportConfig();

const session = require('express-session')
const passport = require('passport')

app.use(passport.initialize())
app.use(session({
  secret: process.env.CODE,
  resave : false,
  saveUninitialized : false,
}));

app.use(passport.initialize()); 
app.use(passport.session());

const flash = require("connect-flash");
app.use(flash());

app.use((req, res, next) => {
  if (!req.isAuthenticated() && req.method === 'GET' && req.path !== '/') {
    req.session.returnTo = req.originalUrl;
  }
  next();
});

app.use('/login', require('./routes/login.js'));

const getDatas = require('./routes/getDatas.js')

app.get('/', (req, res) => {

  // console.log(getDatas.loggedInNickname(req, res))
  res.render('index.ejs',  {data : {nickname: getDatas.loggedInNickname(req, res)}})
})


app.get('/formmake', res => {
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