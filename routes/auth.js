module.exports = (app, passport) => {
  
  app.get('/signin', (req, res, next) => {
    res.render('signin');
  });

/**
 * passport를 통한 라우트(인증 시작)
 * passport.authenticate() => callback 함수로 사용되는 것임
 * /signin에 라우트 되면 위의 함수를 실행!
 * passport.authenticate()의 첫번째 파라미터 : strategy 
 * 위의 파라미터를 통해 받은 인자로 해당 strategy 객체를 실제로 생성후 객체 생성시 발생하는 콜백함수에 의해
 * 해당 strategy의 인증이 수행되는 것이다.
 */
 
  app.post('/signin', passport.authenticate('local',{
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/signin', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));



  /**
   * Facebook 
   * Thrid-party certification
   * OAuth2의 동작 원리에 따라 
   * local 인증 방식과는 달리 두개의 라우트가 필요
   * 실행 흐름 => 사용자가 facebook 로그인 클릭 -> 페이스북 서버와 사용자의 인증 -> 우리 콜백 서버로 페이스북 서버가 인증토큰 전달
   */
  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope : 'email' }) // 페이스북에서 가져올 사용자의 원하는 정보 범위 설정
  );

  /**
   * 이 주소는 페이스북에 등록이 되어 있어야 함 
   * 그래야 페이스북이 이 주소를 보고 이 주소로 이동시키므로
   * 해당 유저의 accessToken과 함께 이쪽으로 이동시킴
   */
  app.get('/auth/facebook/callback', passport.authenticate('facebook', {
      failureRedirect : '/signin',
      failureFlash : true // allow flash messages
    }), (req, res, next) => {
      req.flash('success', '환영합니다!');
      res.redirect('/');
    }
  );



  /**
   * Kakao
   * Thrid-party certification
   */
  app.get('/auth/kakao',
    passport.authenticate('kakao') 
  );

  app.get('/auth/kakao/callback', passport.authenticate('kakao', {
      failureRedirect : '/signin',
      failureFlash : true 
    }), (req, res, next) => {
      req.flash('success', '환영합니다!');
      res.redirect('/');
    }
  );



  app.get('/signout', (req, res) => {
    req.logout(); // passport에 의해 생긴 함수
    req.flash('success', '로그아웃 되었습니다.');
    res.redirect('/');
  });
};
