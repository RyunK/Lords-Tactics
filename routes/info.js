const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn, mustAdmin } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')

const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
var appDir = path.dirname(require.main.filename);

const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
  region : 'ap-northeast-2',
  credentials : {
      accessKeyId : process.env.AWSACCESS_KEY,
      secretAccessKey : process.env.AWSPRIVATE_ACCESS_KEY
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWSBUCKET,
    key: function (req, file, cb) {
      cb(null, Date.now().toString()) //업로드시 파일명 변경가능
    }
  })
})

router.get('/', (req, res) => {
  res.redirect('/info/notice')
})


router.get('/notice', async(req, res) => {
    
  // 공지사항 데이터 select 해서 출력
  var sql = `select id, pin, subject, upload_datetime from notice_table where pin = true`;
  var [pinned_notice, fields] = await (await connection).execute(sql);

  var sql = `SELECT COUNT(*) AS cnt FROM NOTICE_TABLE NT WHERE pin = false`;
  var [unpinned_cnt, fields] = await (await connection).execute(sql);

  let page_size = 10
  let max_page = Math.floor(unpinned_cnt[0].cnt / page_size) + (unpinned_cnt[0].cnt % page_size != 0)
  let page
  if(!req.query.p){
      page = 1;
  }else if(req.query.p > max_page){
      page = max_page
  }else if(req.query.p < 1){
      page = 1
  } 
  else{
      page = req.query.p
  }

  sql = `select id, pin, subject, upload_datetime from notice_table where pin = false
      LIMIT ${(page - 1) * page_size}, ${page_size}`
  var [unpinned_notice, fields] = await (await connection).execute(sql);

  var sql = `select user_auth_id from user where id = ?`;
  var [user_auth_id, fields] = await (await connection).execute(sql, [req.isAuthenticated()? req.user[0].id:0]);

  let data = {
    nickname: getDatas.loggedInNickname(req, res),
    pinned_notice : pinned_notice,
    unpinned_notice : unpinned_notice,
    page : page,
    max_page : max_page,
    isit_admin : user_auth_id[0].user_auth_id == 0,
  }

  res.render('./info/info_notice.ejs',  {data : data})

})

router.get('/notice/detail/:id', async(req, res) => {

  try{
    // 공지 내용 select
    var sql = `SELECT * FROM (
            select *, row_number() over(ORDER BY id) AS order_number from notice_table
            ) AS t
            WHERE id = ?`;
    var [notice_detail, fields] = await (await connection).execute(sql, [req.params.id]);

    if(notice_detail.length <= 0){
      throw new Error("존재하지 않는 글입니다.")
    }

    // 앞뒤 select
    var sql = `SELECT * FROM (
            select id, subject, upload_datetime, row_number() over(ORDER BY id) AS order_number from notice_table
            ) AS t
            WHERE order_number = ?`;
    var [previous, fields] = await (await connection).execute(sql, [notice_detail[0].order_number - 1]);

    var sql = `SELECT * FROM (
            select id, subject, upload_datetime, row_number() over(ORDER BY id) AS order_number from notice_table
            ) AS t
            WHERE order_number = ?`;
    var [next, fields] = await (await connection).execute(sql, [notice_detail[0].order_number + 1]);

    var sql = `select user_auth_id from user where id = ?`;
    var [user_auth_id, fields] = await (await connection).execute(sql, [req.isAuthenticated()? req.user[0].id:0]);

    let data = {
      nickname: getDatas.loggedInNickname(req, res),
      isit_admin : user_auth_id[0].user_auth_id == 0,
      notice_detail : notice_detail,
      previous : previous,
      next : next,
    }

    res.render('./info/info_notice_detail.ejs',  {data : data})
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
})

router.get('/notice/write', mustAdmin, async(req, res) => {
  
  try{
    var sql = `select * from user where id = ? and user_auth_id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.user[0].id, 0])

    if(!result){
      throw new Error("권한이 없습니다.")
    }
    res.render('./info/notice_editer.ejs',  {data : ''})
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
  

})

router.get('/notice/write/:id', mustAdmin, async(req, res) => {
  
  try{

    var sql = `select * from notice_table where id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.params.id])

    if(result.length <= 0){
      throw new Error("존재하지 않는 글입니다.")
    }

    let data = {
      pin : result[0].pin == 1,
      subject : result[0].subject,
      content : result[0].body,
    }

    res.render('./info/notice_editer.ejs',  {data : data})
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
  

})

router.post('/insertImage', upload.single('img'), async(req, res) => {
    // console.log(req.file)
    imgurl = '';
    if(req.file !== undefined) {
        var imgurl = req.file.location; // router에서 붙인 multer가 반환한 url (aws s3 object url)
        console.log(req.file.location)
    }
    res.json(imgurl); // json 형태로 반환해주어야 View에서 처리가 가능하다.
})


router.post('/writeNewNotice', mustAdmin, async(req, res) => {
  try{
    if(req.body.subject.length > 100 ) throw new Error("제목이 너무 깁니다.")
    else if(req.body.subject.length <= 0) throw new Error("제목을 입력하세요.")
    else if(req.body.content.length <= 0) throw new Error("내용을 입력하세요.")
    // db에 업로드
    var sql = `insert into notice_table (pin, subject, body, upload_datetime)
              value (?, ?, ?, NOW())`
    var [result, fields] = await (await connection).execute(sql, [req.body.pin == 'true'? 1:0, req.body.subject, req.body.content])
    
    res.redirect('/info')
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
    
})

router.post('/editnotice/:id', mustAdmin, async(req, res) => {
  try{
    if(req.body.subject.length > 100 ) throw new Error("제목이 너무 깁니다.")
    else if(req.body.subject.length <= 0) throw new Error("제목을 입력하세요.")
    else if(req.body.content.length <= 0) throw new Error("내용을 입력하세요.")

    var sql = `select * from notice_table where id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.params.id])

    if(result.length <= 0){
      throw new Error("존재하지 않는 글입니다.")
    }

    // db 업데이트
    var sql = `update notice_table 
              set pin = ? , subject = ?, body = ?
              where id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.body.pin == 'true'? 1:0, req.body.subject, req.body.content, req.params.id])
    
    res.redirect('/info')
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
    
})

router.post('/notice/delete', mustAdmin, async(req, res) => {
  try{
    if(!req.body.id || req.body.id.length <= 0 ) throw new Error("게시물 id를 받아오지 못했습니다.")
    // db에서 삭제
    var sql = `delete from notice_table where id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.body.id])
    
    // 쓰고 있던 이미지 파일 있으면 aws s3에서도 삭제(했으면좋겠다.)
    res.redirect('/info')
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
    
})



router.get('/faq', async(req, res) => {
  var sql = `SELECT COUNT(*) AS cnt FROM faq_table `;
  var [faqs_cnt, fields] = await (await connection).execute(sql);

  let page_size = 10
  let max_page = Math.floor(faqs_cnt[0].cnt / page_size) + (faqs_cnt[0].cnt % page_size != 0)
  let page
  if(!req.query.p){
      page = 1;
  }else if(req.query.p > max_page){
      page = max_page
  }else if(req.query.p < 1){
      page = 1
  } 
  else{
      page = req.query.p
  }

  var sql = `select * from faq_table  ORDER BY ORDER_NUM LIMIT ${(page - 1) * page_size}, ${page_size}`;
  var [faqs, fields] = await (await connection).execute(sql);

  var sql = `select user_auth_id from user where id = ?`;
  var [user_auth_id, fields] = await (await connection).execute(sql, [req.isAuthenticated()? req.user[0].id:0]);

  let data = {
    nickname: getDatas.loggedInNickname(req, res),
    isit_admin : user_auth_id[0].user_auth_id == 0,
    faqs : faqs,
    page : page,
    max_page : max_page,
  }

  res.render('./info/info_faq.ejs',  {data : data})

})

router.get('/faq/edit', mustAdmin, async(req, res) => {
  
  try{
    

    var sql = `select * from faq_table ORDER BY ORDER_NUM `;
    var [faqs, fields] = await (await connection).execute(sql);

    data = {
      faqs : faqs,
    }

    res.render('./info/info_faq_edit.ejs',  {data : data})
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
  

})

router.post('/faq/edit/delete', mustAdmin, async(req, res) => {
  try{
    // db에서 찾아서 order_num 반환
    var sql = `select * from faq_table where id = ?`
    var [selected, fields] = await (await connection).execute(sql, [req.body.id])

    if(selected.length <= 0) throw new Error("존재하지 않는 질문입니다.")

    // db에서 삭제
    var sql = `delete from faq_table where id = ?`
    var [result, fields] = await (await connection).execute(sql, [req.body.id])
    
    res.json({status:'200', data : {this_order : selected[0].order_num}})
  }catch(e){
    console.log(e)
    res.json({status:'500', message: e.message})
  }
    
})

router.post('/faq/edit/save', mustAdmin, async(req, res) => {
  try{
    // console.log(req.body)

    for(let i=0; i<req.body.id.length; i++){
      if(req.body.id[i] == "new"){
        var sql = `insert into faq_table (question, answer, order_num) value (?, ?, ?)`
        var [result, fields] = await (await connection).execute(sql, [req.body.question[i], req.body.answer[i], req.body.order_num[i]])
      } else{
        var sql = `update faq_table set question = ?, answer = ?, order_num = ? where id = ?`
        var [result, fields] = await (await connection).execute(sql, [req.body.question[i], req.body.answer[i], req.body.order_num[i], req.body.id[i]])
      }
    }

    res.redirect('/info/faq')

  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
    
})

router.get('/ask', async(req, res) => {
  
  let user_email = ""
  if(req.isAuthenticated()){
    var sql = `select user_email from user inner join user_emails on user.id = user_emails.user_id
             where id = ?`;
    var [user_auth_id, fields] = await (await connection).execute(sql, [req.user[0].id]);
    user_email = user_auth_id[0].user_email
  }

  var sql = `select user_auth_id from user where id = ?`;
  var [user_auth_id, fields] = await (await connection).execute(sql, [req.isAuthenticated()? req.user[0].id:0]);

  let data = {
    nickname: getDatas.loggedInNickname(req, res),
    isit_admin : user_auth_id[0].user_auth_id == 0,
    user_email : user_email,
  }

  res.render('./info/info_ask.ejs',  {data : data})

})

router.post('/ask/sendmail', async(req, res) => {
  // console.log(req.body)
  try{
    // console.log(req.body.file_name)
    if(!req.body.title || !req.body.from || !req.body.inq_body) throw new Error("이메일에 필요한 내용을 전부 적어주세요.");

    let attatchments = [];
    if(req.body.file){
      let files = req.body.file;
      let file_names = req.body.file_name;
      if(typeof(files) == 'string'){
        files = [files]
        file_names = [file_names]
      }
      for(let i=0; i<files.length; i++){
        let temp = {
          filename: file_names[i],
          path : files[i]
        }
        attatchments.push(temp)
      }
      
    }
    // console.log(attatchments)

    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        auth: {
            user: process.env.NODEMAILER_USER,
            pass: process.env.NODEMAILER_PASS,
        },
    });

    let ask_emailTemplete;
    ejs.renderFile(appDir+'/templates/ask_mail.ejs', {from : req.body.from, title:req.body.title , inq_body : req.body.inq_body}, function (err, data) {
        if(err){
          console.log(err);
          throw new Error("이메일을 전송할 수 없습니다.")
        }
        ask_emailTemplete = data;
    });

    let mailOptions = {
        to: 'teamsanghyang@gmail.com',
        subject: '[문의]' + req.body.title,
        html: ask_emailTemplete,
        attachments: attatchments,
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            throw new Error("이메일을 전송할 수 없습니다.")
        }
    });

    let confirm_emailTemplete;
    ejs.renderFile(appDir+'/templates/ask_confirm_mail.ejs', {inq_body : req.body.inq_body}, function (err, data) {
        if(err){
          console.log(err);
          throw new Error("이메일을 전송할 수 없습니다.")
        }
        confirm_emailTemplete = data;
    });

    mailOptions = {
        to: req.body.from,
        subject: '[로드의 전술서] 문의가 접수되었습니다.',
        html: confirm_emailTemplete,
        attachments: attatchments,
    };


    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            throw new Error("이메일을 전송할 수 없습니다.")
        }
    });

    res.redirect('/info/ask')
  }catch(e){
    console.log(e)
    res.redirect('/?error=' + e.message);
  }
  

})

module.exports=router;