var express = require('express');
var router = express.Router();

/**
 * GET Main homepage
 * 메인 홈페이지만 보여줌
 */
 
router.get('/', function(req, res, next) {
  res.render('index');
});


module.exports = router;
