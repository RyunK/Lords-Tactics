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

