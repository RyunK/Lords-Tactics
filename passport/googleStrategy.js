const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
var GoogleStrategy = require('passport-google-oauth20');
const connection = require('../database.js');

module.exports = () => {
    passport.use(
    new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_ID, // 구글 로그인에서 발급받은 REST API 키
        clientSecret: process.env.GOOGLE_SECRET,
        callbackURL: '/login/google/callback', // 구글 로그인 Redirect URI 경로
    },
    async function validate(accessToken, refreshToken, profile, cb) {
        // console.log('google profile : ', profile);
        try{
            var sql = `SELECT * FROM user 
                        INNER JOIN federated_credentials ON USER.id = federated_credentials.user_id
                        WHERE username = ? AND provider= ?  AND subject = ?`;
            var data = [
                'oauth',
                'https://accounts.google.com',
                profile.id
            ]
            var [cred, fields] = await (await connection).execute(sql, data);

            // console.log("cred :", cred);

            if(cred.length <= 0){
                // console.log('cred 없음')
                // The account at Google has not logged in to this app before.  Create a
                // new user record and associate it with the Google account.
                var sql = `INSERT INTO user (username, nickname) VALUES (?, ?)`;
                var data = [ 'oauth' ,profile.displayName ]
                var [result, fields] = await (await connection).execute(sql, data);

                var id = result.insertId
                var sql = `INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)`;
                var data = [ id, 'https://accounts.google.com', profile.id ]
                var [result, fields] = await (await connection).execute(sql, data);

                var sql = `INSERT INTO user_emails (user_id, user_email) VALUES (?, ?)`;
                var data = [ id, profile.emails[0].value]
                var [result, fields] = await (await connection).execute(sql, data);

                var sql = `SELECT * FROM user
                            WHERE username = ? AND id = ?`;
                var data = [ 'oauth' , id ]
                var [user, fields] = await (await connection).execute(sql, data);
                if (!user) { return  cb(null, false, {message: err}); }
                return cb(null, user);
            } else {
                // console.log('cred 있음')
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
            // console.log(err);
            return cb(null, false, {message: err});
        }

    }
))}