const passport = require('passport');
const { Strategy: NaverStrategy, Profile: NaverProfile } = require('passport-naver-v2');

const connection = require('../database.js')

module.exports = () => {
   passport.use(
      new NaverStrategy(
         {
            clientID: process.env.NAVER_ID,
            clientSecret: process.env.NAVER_SECRET,
            callbackURL: '/login/naver/callback',
         },
         async (accessToken, refreshToken, profile, cb) => {
            console.log('naver accessToken : ', accessToken);
            try{
                var sql = `SELECT * FROM user 
                            INNER JOIN federated_credentials ON USER.id = federated_credentials.user_id
                            WHERE username = ? AND provider= ?  AND subject = ?`;
                var data = [
                    'oauth',
                    'https://nid.naver.com',
                    profile.id
                ]
                var [cred, fields] = await (await connection).execute(sql, data);

                // console.log("cred :", cred);

                if(cred.length <= 0){
                    console.log('cred 없음')
                    // The account at Google has not logged in to this app before.  Create a
                    // new user record and associate it with the Google account.
                    var sql = `INSERT INTO user (username, nickname) VALUES (?, ?)`;
                    var data = [ 'oauth' ,profile.nickname ]
                    var [result, fields] = await (await connection).execute(sql, data);

                    var id = result.insertId
                    var sql = `INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)`;
                    var data = [ id, 'https://nid.naver.com', profile.id ]
                    var [result, fields] = await (await connection).execute(sql, data);

                    var sql = `INSERT INTO user_emails (user_id, user_email) VALUES (?, ?)`;
                    var data = [ id, profile.email]
                    var [result, fields] = await (await connection).execute(sql, data);

                    var sql = `SELECT * FROM user
                                WHERE username = ? AND id = ?`;
                    var data = [ 'oauth' , id ]
                    var [user, fields] = await (await connection).execute(sql, data);
                    if (!user) { return  cb(null, false, {message: err}); }
                    return cb(null, user);
                } else {
                    console.log('cred 있음')
                    // The account at Google has previously logged in to the app.  Get the
                    // user record associated with the Google account and log the user in.

                    var id = cred[0].id
                    var sql = `SELECT * FROM user
                                WHERE username = ? AND id = ?`;
                    var data = [ 'oauth', id ]
                    var [user, fields] = await (await connection).execute(sql, data);
                    if (!user) { return  cb(null, false, {message: err}); }
                    return cb(null, user);
                }
            } catch(err){
                console.log(err);
                return cb(null, false, {message: err});
            }
         },
      ),
   );
};