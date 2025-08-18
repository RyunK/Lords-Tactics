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



app.use('/login', require('./routes/login.js'));


app.get('/', (req, res) => {

  console.log(req.user)

  res.render('index.ejs',  {data : {nickname: ""}})
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