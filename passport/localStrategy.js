const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const connection = require('../database.js')
const bcrypt = require('bcrypt');

module.exports = () => {
  passport.use(new LocalStrategy(async (inputid, inputpw, done) => {
    try {
        console.log(`id: ${inputid}`)

        var sql = `SELECT * FROM USER
                INNER JOIN user_pw_table ON USER.id = USER_PW_TABLE.USER_ID
                WHERE USERNAME= ?`;

        var [result, fields] = await (await connection).execute(sql, [inputid]);

        // console.log(result);
        if (result.length <= 0) {
          return done(null, false, { message: '존재하지 않는 ID입니다.' })
        }
        // console.log(bcrypt.compareSync(inputpw, result[0].user_password))
        if (await bcrypt.compareSync(inputpw, result[0].user_password)) {
          return done(null, result)
        } else {
          return done(null, false, { message: '비밀번호가 일치하지 않습니다.' });
        }
    } catch (err){
        return done(null, false, { message:  '알 수 없는 오류가 발생했습니다. 다시 시도해보세요.'})
    }
  }
))
};