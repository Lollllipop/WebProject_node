module.exports = function asyncErrorCatcher(req, res, next) {
  console.log("############### User check #################");
  console.log("req.user : ",req.user); // 제대로 user가 장착이 된건지 check
  console.log("req.isAuthenticated : ",req.isAuthenticated()); // 제대로 user가 장착이 된건지 check
  console.log("############################################");
  if (req.isAuthenticated()) { // 지금 현재 사용자가 회원인 상태에서 시스템에 접근하는건지 확인
    next(); //맞으면 다음 미들웨어로 req를 넘긴다.
  } else {
    req.flash('danger', '로그인 먼저 해주시기 바랍니다.');
    res.redirect('/signin');
  }
};