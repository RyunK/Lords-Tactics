const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/statics')) 

require('dotenv').config() // .env 파일 사용


var fs = require('fs');
app.listen(process.env.PORT, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

let connection = require('./database.js')

connection.connect(function(err) {
  if (err) {
    console.error('MySQL 연결실패 :' + err.stack);
    return;
  }
  console.log('MySQL 연결됨');
});


app.get('/', (요청, 응답) => {
  // console.log(err);
  // console.log(filelist);
  응답.render('index.ejs')
})

app.get('/login', (요청, 응답) => {
  // console.log(err);
  // console.log(filelist);
  응답.render('login.ejs')
})

app.get('/signup', (요청, 응답) => {
  // console.log(err);
  // console.log(filelist);
  응답.render('signup.ejs')
})




app.get('/formmake', (요청, 응답) => {
  fs.readdir('./statics/sources/img/characters', (err, filelist) => {
    // console.log(err);
    // console.log(filelist);
    let characterslist = filelist.map(e=>{
      let t = e.split('_')[0]
      return {file : e, type: t}
    })
    응답.render('form_making.ejs', {characterslist : characterslist})
  })
}) 