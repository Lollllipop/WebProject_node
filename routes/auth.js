module.exports = (app, passport) => {
  app.get('/signin', (req, res, next) => {
    res.render('signin');
  });

/**
 * passport.authenticate() => callback 함수로 사용되는 것임
 * /signin에 라우트 되면 위의 함수를 실행!
 * passport.authenticate()의 첫번째 파라미터 : strategy 
 * 위의 파라미터를 통해 받은 인자로 해당 strategy 객체를 실제로 생성후 객체 생성시 발생하는 콜백함수에 의해
 * 해당 strategy의 인증이 수행되는 것이다.
 */

  app.post('/signin', passport.authenticate('local-signin', {
    successRedirect : '/questions', // redirect to the secure profile section
    failureRedirect : '/signin', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  app.get('/auth/facebook',
    passport.authenticate('facebook', { scope : 'email' })
  );

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect : '/signin',
      failureFlash : true // allow flash messages
    }), (req, res, next) => {
      req.flash('success', 'Welcome!');
      res.redirect('/questions');
    }
  );

  app.get('/signout', (req, res) => {
    req.logout();
    req.flash('success', 'Successfully signed out');
    res.redirect('/');
  });
};
