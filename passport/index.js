const passport = require('passport');
const local = require('./localStrategy');
const google = require('./googleStrategy'); // 구글 서버로 로그인할 때
const naver = require('./naverStrategy'); // 네이버 서버로 로그인할 때
const connection = require('../database.js');


module.exports = () => {
  passport.serializeUser((user, done) => {
    process.nextTick(() => {
    // console.log("serialize / " + user[0].id)
      done(null, { id: user[0].id })
    })
  });

  passport.deserializeUser(async (user, done) => {
    // console.log("dserialize / " + user.id)
    var sql = `SELECT * FROM USER
                WHERE ID= ?`;

    let [result, fields] = await (await connection).execute(sql, [user.id]);
    process.nextTick(() => {
        return done(null, result)
    })
  });

  local(); // localStrategy.js 실행
  google(); // googleStrategy.js 실행
  naver(); // naverStrategy.js 실행
};