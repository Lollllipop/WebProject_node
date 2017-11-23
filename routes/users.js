const express = require('express');
const User = require('../models/user');
const router = express.Router();
const catchErrors = require('../lib/async-error');

function needAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash('danger', 'Please signin first.');
    res.redirect('/signin');
  }
}

/**
 * Form 잘 작성했는지 검사하는 함수
 */

function validateForm(form, options) {
  var name = form.name || "";
  var email = form.email || "";
  name = name.trim();
  email = email.trim();

  if (!name) {
    return 'Name is required.';
  }

  if (!email) {
    return 'Email is required.';
  }

  if (!form.password && options.needPassword) {
    return 'Password is required.';
  }

  if (form.password !== form.password_confirmation) {
    return 'Passsword do not match.';
  }

  if (form.password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}






/*
 * GET route
 */

router.get('/', needAuth, catchErrors(async (req, res, next) => {
  const users = await User.find({});
  res.render('users/index', {users: users});
}));

router.get('/new', (req, res, next) => {
  res.render('users/new', {messages: req.flash()});
});

router.get('/:id', catchErrors(async (req, res, next) => {
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
 * POST route
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
    req.flash('danger', 'Email address already exists.');
    return res.redirect('back'); // 다시 users/new로 가라!
  }

  
  //모두 다 검사가 끝나면 정상적으로 새 유저 데이터 생성
  user = new User({
    name: req.body.name,
    email: req.body.email,
  });
  user.password = await user.generateHash(req.body.password); // 비밀번호는 암호화해서 DB에 입력
  await user.save(); // DB에 저장!
  req.flash('success', 'Registered successfully. Please sign in.');
  res.redirect('/signin');
}));

/*
 * PUT route
 */

router.put('/:id', needAuth, catchErrors(async (req, res, next) => {
  const err = validateForm(req.body);
  if (err) {
    req.flash('danger', err);
    return res.redirect('back');
  }

  const user = await User.findById({_id: req.params.id});
  if (!user) {
    req.flash('danger', 'Not exist user.');
    return res.redirect('back');
  }

  if (!await user.validatePassword(req.body.current_password)) {
    req.flash('danger', 'Current password invalid.');
    return res.redirect('back');
  }

  user.name = req.body.name;
  user.email = req.body.email;
  if (req.body.password) {
    user.password = await user.generateHash(req.body.password);
  }
  await user.save();
  req.flash('success', 'Updated successfully.');
  res.redirect('/users');
}));

/*
 * DELETE route
 */

router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  const user = await User.findOneAndRemove({_id: req.params.id});
  req.flash('success', 'Deleted Successfully.');
  res.redirect('/users');
}));



module.exports = router;
