const express = require('express');
const router = express.Router();
const connection = require('../database.js')
const { mustLoggedIn, mustNotLoggedIn } = require('./middlewares'); // 내가 만든 사용자 미들웨어
const getDatas = require('./getDatas.js')

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



router.get('/', async(req, res) => {
    

    res.render('./info/info_notice.ejs',  {data : ''})

})

router.get('/notice/write', async(req, res) => {
    

    res.render('./info/notice_editer.ejs',  {data : ''})

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

router.post('/writeNewNotice', async(req, res) => {
    console.log(req.body);
})

module.exports=router;