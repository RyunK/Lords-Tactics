const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')


router.get('/', (req, res) => {

    res.render('forum.ejs',  {data : {nickname: getDatas.loggedInNickname(req, res)}})

})

module.exports=router;