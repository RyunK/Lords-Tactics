const express = require('express')
const app = express()

app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/statics')) 


var fs = require('fs');
app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})

app.get('/formmake', (요청, 응답) => {
  fs.readdir('./statics/sources/img/characters', (err, filelist) => {
    // console.log(err);
    console.log(filelist);
    let characterslist = filelist.map(e=>{
      let t = e.split('_')[0]
      return {file : e, type: t}
    })
    응답.render('form_making.ejs', {characterslist : characterslist})
  })
}) 