const connection = require('../database.js')

exports.mustLoggedIn = (req, res, next) => {
   // isAuthenticated()로 검사해 로그인이 되어있으면
   if (req.isAuthenticated()) {
      next(); // 다음 미들웨어
   } else {
      // res.status(403).send('로그인이 필요한 컨텐츠');
      // res.send("<script>alert('로그인이 필요한 서비스입니다.'); location.href='/login';</script>");
      const message = encodeURIComponent('needLogin');
      res.redirect(`/?error=${message}`);
   }
};

exports.mustNotLoggedIn = (req, res, next) => {
   if (!req.isAuthenticated()) {
      next(); // 로그인 안되어있으면 다음 미들웨어
   } else {
      const message = encodeURIComponent('이미 로그인되었습니다.');
      res.redirect(`/?error=${message}`);
      // res.set("Content-Type", "text/html; charset=utf-8");
   }
};

exports.mustAdmin = async (req, res, next) => {
   try{
      if(!req.isAuthenticated()){
         throw new Error("권한이 없습니다.")
      }
      var sql = `select * from user where id = ? and user_auth_id = ?`
      var [result, fields] = await (await connection).execute(sql, [req.user[0].id, 0]);
      // console.log(result);
      
      if(result.length <= 0){
         throw new Error("권한이 없습니다.")
      }
      next(); 
   }catch(e){
      res.redirect(`/?error=${e.message}`);
   }
};

/**
 * 정지됐는지 체크
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.stoppedCheck = async (req, res, next) => {
   if(!req.isAuthenticated()) next();
   var sql = `select * from user_purnishment where user_id = ? order by id desc limit 1`
   var [result, fields] = await (await connection).execute(sql, [req.user[0].id]);

   var now_date = new Date();
   if(result.length > 0 && result[0].end_date > now_date){
      var end_date = (result[0].end_date.getYear() - 100) + "-" + ("0" + (result[0].end_date.getMonth()+1)).substr(-2) + "-" + ("0" + result[0].end_date.getDate()).substr(-2)
      const err = new Error("활동이 정지되었습니다. \n정지 기한 : " + end_date );
      err.status = 403;
      return next(err);
   }
   next(); 
};



