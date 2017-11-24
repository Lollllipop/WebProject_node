var express = require('express');
var router = express.Router();
const User = require('../models/user');
const catchErrors = require('../lib/async-error');

/**
 * GET Main homepage
 * 메인 홈페이지만 보여줌
 */
 
router.get('/', function(req, res, next) {
  res.render('index');
});

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

module.exports = router;
