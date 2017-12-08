var express = require('express');
const aws = require('aws-sdk');
const S3_BUCKET = process.env.S3_BUCKET;
var router = express.Router();
const User = require('../models/user');
const Event = require('../models/event');
const catchErrors = require('../lib/async-error');

/**
 * GET Main homepage
 * 메인 홈페이지만 보여줌
 */
 
router.get('/', catchErrors(async (req, res, next) => {
  var getEventNumber = 9;
  var events = await Event.find().sort({createdAt: -1}).limit(getEventNumber); // limit : find할 개수 선택
  res.render('index', {events: events});
}));

/**
 * 관리자 페이지 라우트
 * 유저 정보를 관리하기 위해 통체로 넘김
 */

router.get('/manager', catchErrors(async (req, res, next) => {
	const page = parseInt(req.query.page) || 1; // 현재 페이지를 나타냄
  const limit = 10; // pagination이 제공되어야 하는 한계 숫자
  var query = {}; // 이건 공백으로 제공해야함

  const users = await User.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    page: page, // page 정보와
    limit: limit // limit 정보 전달
  });

  // const users = await User.find({});
  res.render('manage', {users: users, query: req.query});
}));

/**
 * 검색어 추천 ajax 라우트
 * ajax engine의 request를 라우트함
 */

router.get('/suggestEvents', catchErrors(async (req, res, next) => { 
  var pattern = /^[a-zA-Z]+$/;
  let keyword ='';
  let arr = [];

  if (!req.query.keyword) { // 입력 내용 없을시 그냥 빈 json 리턴
    return res.json([]);
  }

  if(pattern.test(req.query.keyword)){ // 영어 체크
    keyword = req.query.keyword.toLowerCase(); // 소문자로 변환
  }else if(req.query.keyword){ // 한글일 시 
    keyword = req.query.keyword;
  }
  let data = await Event.find({title: {'$regex': keyword, '$options': 'i'}});
  for (let x in data) {
    arr.push(data[x].title);
  }

  return res.json(arr);// JSON으로 결과를 return
  //render 나 send가 없으니 return을 해줘야 하나봄
}));

/**
 * S3 접근 ajax 라우트
 * S3 서버의 signed url을 처리하기 위한
 */

// router.get('/s3', function(req, res, next) {
//   const s3 = new aws.S3({region: 'ap-northeast-2'});
//   const filename = req.query.filename;
//   const type = req.query.type;
//   const params = {
//     Bucket: S3_BUCKET,
//     Key: filename,
//     Expires: 900,
//     ContentType: type,
//     ACL: 'public-read'
//   };
//   console.log("--params-- : ",params);
//   s3.getSignedUrl('putObject', params, function(err, data) {
//     if (err) {
//       console.log(err);
//       return res.json({err: err});
//     }
//     // pre-signed url을 s3 서버로부터 정상적으로 받았을 시 클라이언트에게 전달!
//     res.json({
//       signedRequest: data,
//       url: `https://${S3_BUCKET}.s3.amazonaws.com/${filename}` // 이 곳에 파일이 저장됨
//     });
//   });
// });

module.exports = router;
