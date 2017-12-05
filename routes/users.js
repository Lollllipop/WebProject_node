const express = require('express');
const User = require('../models/user');
const Apply = require('../models/apply');
const router = express.Router();
const catchErrors = require('../lib/async-error');
const validateForm = require('../lib/validateForm-user');
const needAuth = require('../lib/auth-check');



/*
 * GET route (read)
 */

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});

router.get('/:id', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/show', {user: user});
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  res.render('users/edit', {user: user});
}));

/**
 * 자꾸 헷갈리는 것
 * res.send / res.render / res.redirect 가 return 역할을 하는 것이 아님
 * 즉 이 함수들이 실행된다고 해도 뒤에 또 코드가 있으면 그 코드 또한 실행이 됨 (주의!!)
 * 함수의 종료는 무조건 return만
 */

/*
 * POST route (create)
 */

router.post('/', catchErrors(async (req, res, next) => {

  
  //폼 제대로 입력했는지 검사
  var err = validateForm(req.body, {needPassword: true});
  if (err) { // 에러가 존재하면?
    req.flash('danger', err); // flash메시지 전달
    return res.redirect('back');
  } // 모든 form을 다 입력한 후 

  
  //겹치는 이메일 있는지 검사 (이메일이 key인듯..?)
  var user = await User.findOne({email: req.body.email});
  console.log('USER???', user); // null이 나와야 겹치는 정상
  if (user) {
    req.flash('danger', '이미 존재하는 이메일 주소입니다.');
    return res.redirect('back'); // 다시 users/new로 가라!
  }

  
  //모두 다 검사가 끝나면 정상적으로 새 유저 데이터 생성
  user = new User({
    name: req.body.name,
    email: req.body.email,
  });
  user.password = await user.generateHash(req.body.password); // 비밀번호는 암호화해서 DB에 입력
  await user.save(); // DB에 저장!
  req.flash('success', '계정이 생성되었습니다. 로그인 해주세요!');
  res.redirect('/signin');
}));

/*
 * PUT route (update)
 */

router.put('/:id', needAuth, catchErrors(async (req, res, next) => { // 수정 버튼 클릭시 동작
  const user = await User.findById({_id: req.params.id}); // 현재 사용자 식별 및 DB에서 데이터 추출
  if (!user) {
    req.flash('danger', 'Not exist user.');
    return res.redirect('back');
  }
  if (!req.user.isManager) {
    var checkCurrenUser=true; 
    if (!await user.validatePassword(req.body.current_password)) {
      checkCurrenUser=false;
    }
  }
  var err="";
  if(req.user.isManager){
    var name = req.body.name || "";
    var email = req.body.email || "";
    name = name.trim();
    email = email.trim();
    err = (() => {
      if (!name) {
        return 'Name is required.';
      }

      if (!email) {
        return 'Email is required.';
      }
      return null;
    })();
  }else{
    err = validateForm(req.body ,{needPassword: true, updateUser: true, checkCurrenUser: checkCurrenUser});
  }
  console.log("!!err!! : ", err);
  if (err) { // 수정시에도 정보 적는 양식은 지켜줘야 하므로 check
    req.flash('danger', err);
    return res.redirect('back');
  }

  user.name = req.body.name;
  user.email = req.body.email;
  if (!req.user.isManager) {
    user.password = await user.generateHash(req.body.password);
  }
  await user.save();
  if(req.user.isManager){
    req.flash('success', '회원 수정 처리가 정상적으로 처리되었습니다.');
    res.redirect('/manager'); 
  }else{
    req.flash('success', '수정이 정상적으로 완료되었습니다.');
    res.redirect(`/users/${user._id}`); // 관리자 페이지에서 삭제시에도 적절한 라우트 필요
  }
}));

/*
 * DELETE route (delete)
 */

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => { // 여기에 needAuth와 async 미들웨어가 있는 것임
  const user = await User.findById({_id: req.params.id});  
  user.name = '탈퇴 회원';
  user.email = `__Deleted-${user._id}@no-email.com`; // 더미 값으로 설정
  user.password = undefined;
  user.facebook = undefined; // 주의 불확실함
  user.kakao = undefined; // 주의 불확실함
  await Apply.find({applier: user.id}).remove(); // 관련 신청 내역 삭제
  await user.save();
  if(req.user.isManager){
    req.flash('success', '회원 탈퇴 처리가 정상적으로 처리되었습니다.');
    res.redirect('/manager'); 
  }else{
    req.flash('success', '탈퇴가 정상적으로 처리되었습니다.');
    req.logout(); // 세션 연결 끊기 위해서
    res.redirect('/'); // 관리자 페이지에서 삭제시에도 적절한 라우트 필요
  }
}));



module.exports = router;
