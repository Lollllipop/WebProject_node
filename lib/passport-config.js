const LocalStrategy = require('passport-local').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../models/user');

/**
 * passport와 세션 연결 
 * seri => 인증 통과한 사용자에게 sessID 설정 
 * deseri => 클라이언트 쿠키에 담겨있는 sessID값이 존재하는지 확인
 */

module.exports = function(passport) {
  passport.serializeUser((user, done) => { // 사용자 인증 후 존재하는 사용자면 이 함수 실행됨
    console.log(user); // id는 자동으로 해당 객체와 연결이 되는 듯
    done(null, user.id); // 받은 user객체로부터 user.id를 sessID로 등록하는 작업임
  });

  passport.deserializeUser((id, done) =>  { // 사용자가 사이트에 접속할때 마다 이 함수 실행 (세션ID 검사)
    User.findById(id, done); // 디비와 들어온 id값 비교 done함수를 실행하므로써 req의 객체로 user객체를 달아줌
  });



/**
 * passport의 인증 과정
 * passport 인증 방법 설정
 * 각 strategy의 인증 방식이 어떻게 작동할 것인지 정의
 * done : 함수, 인증 확인 후(인증이 됐던 회원이 아니던) 처리 코드로 이 함수를 사용하는 것임
 */

  passport.use(new LocalStrategy({
  /**
   * 첫번째 인자로 주는 것은 해당 html의 값들의 name과 우리가 사용하고자 하는 변수들의 매칭 작업
   * 첫번째 인자를 안줘도 되긴 함 옵션임
   */
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true
    }, async (req, email, password, done) => {
      try {
        // user정보 확인
        const user = await User.findOne({email: email}); // 성공하면 User객체 user에 전달
        if (user && user.password && await user.validatePassword(password)) { // 암호화해서 현재 암호화되어 있는 비밀번호랑 비교
          return done(null, user, req.flash('success', '환영합니다!')); // 두번째 인자로 user객체를 넘기는 것을 확인할 수 있음
        }
        return done(null, false, req.flash('danger', '유효하지 않은 이메일 또는 패스워드를 입력하였습니다.'));
      } 
      catch(err) {
        done(err);
      }
    })
  );

/**
 * 페이스북 로그인
 * 우리 사이트 계정 없이 페이스북 로그인만 해도 결국 DB에 해당 계정의 정보가 생김
 * 사용자가 로그인을 이미 한 상태이던 해야되는 상태이던 결국 이 함수가 실행될 때는
 * 사용자의 페이스북 계정의 정보가 profile에 담겨온다.
 */

  passport.use(new FacebookStrategy({
      clientID : '178596946052472',
      clientSecret : '212668708a8bd2e3ef03fd8538e9b3fe',
      callbackURL : 'http://localhost:3000/auth/facebook/callback',
      profileFields : ['email', 'name', 'picture'] // profile 값으로 들어와야 될 정보를 표시
    }, async (accesstoken, refreshToken, profile, done) => {
      /**
       * 페이스북이 profile 정보를 전달 해 줌
       */
        try {
          /**
           * profile로 넘어온 계정 파싱 코드
           */
          var email = (profile.emails && profile.emails[0]) ? profile.emails[0].value : '';
          var picture = (profile.photos && profile.photos[0]) ? profile.photos[0].value : '';
          var name = (profile.displayName) ? profile.displayName : 
            [profile.name.givenName, profile.name.middleName, profile.name.familyName]
              .filter(e => e).join(' ');

          // 같은 facebook id를 가진 사용자가 있나?
          var user = await User.findOne({'facebook.id': profile.id});

          if (!user) {
            // 없다면, 혹시 같은 email이라도 가진 사용자가 있나?
            if (email) {
              user = await User.findOne({email: email});
            }
            if (!user) {
              // 그것도 없다면 새로 만들어야지.
              user = new User({name: name});
              user.email =  email ? email : `__unknown-${user._id}@no-email.com`; // 페이스북 사용자의 이메일이 없는 경우도 있기 때문에
            }
            // facebook id가 없는 사용자는 해당 id를 등록
            user.facebook.id = profile.id;
            user.facebook.photo = picture;
          }

          user.facebook.token = profile.token;
          await user.save();
          return done(null, user);
        } catch (err) {
          done(err);
        }
    })
  );

/**
 * 카카오 로그인
 * 우리 사이트 계정 없이 페이스북 로그인만 해도 결국 DB에 해당 계정의 정보가 생김
 * 사용자가 로그인을 이미 한 상태이던 해야되는 상태이던 결국 이 함수가 실행될 때는
 * 사용자의 페이스북 계정의 정보가 profile에 담겨온다.
 */

  passport.use(new KakaoStrategy({
      clientID : '8eebed48302c8c9208f3dc645e0271e8',
      clientSecret: 'AHDSRuW590XS1RXgHtFpzMR5MLOMwOqi', // clientSecret을 사용하지 않는다면 넘기지 말거나 빈 스트링을 넘길 것
      callbackURL : 'http://localhost:3000/auth/kakao/callback'
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        var _profile = profile._json; 

        var email = (_profile.kaccount_email)?_profile.kaccount_email:'';
        var picture = (_profile.properties.profile_image)?_profile.properties.profile_image:'';
        var name = profile.username;

        // 같은 facebook id를 가진 사용자가 있나?
        var user = await User.findOne({'facebook.id': _profile.id});

        if (!user) {
          // 없다면, 혹시 같은 email이라도 가진 사용자가 있나?
          if (email) {
            user = await User.findOne({email: email});
          }
          if (!user) {
            // 그것도 없다면 새로 만들어야지.
            user = new User({name: name});
            user.email =  email ? email : `__unknown-${user._id}@no-email.com`; // 페이스북 사용자의 이메일이 없는 경우도 있기 때문에
          }
          // facebook id가 없는 사용자는 해당 id를 등록
          user.kakao.id = _profile.id;
          user.kakao.photo = picture;
        }

        user.kakao.token = _profile.token;
        await user.save();
        return done(null, user);
      } catch (err) {
        done(err);
      }

      // User.findOrCreate(..., function(err, user) {
      //   if (err) { return done(err); }
      //   done(null, user);
      // });
    })
  );
};


