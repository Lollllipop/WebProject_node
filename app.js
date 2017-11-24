/*####################### 사용될 모듈들 import #######################*/

/**
 * Module import
 * app이라는 서버를 구축하는 파일
 * 서버가 기능을 가지기 위한 여러 미들 웨어를 서버에 탑재 시키는 것
 */

var express = require('express'); // require('express')는 createApplication() 를 리턴한다.
var path = require('path'); // paht는 node.js의 built-in 모듈이다.
var favicon = require('serve-favicon'); // 파비콘 이미지 
var logger = require('morgan'); // log와 관련된 미들웨어
var cookieParser = require('cookie-parser'); // 쿠키 파싱
var bodyParser = require('body-parser'); // html 바디 파싱
var sassMiddleware = require('node-sass-middleware');
var session = require('express-session'); // express는 세션기능을 내장하고 있지 않아 모듈을 달아줘야 함
//var mongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var flash = require('connect-flash');
var mongoose   = require('mongoose'); // DB
var passport = require('passport'); 
var passportConfig = require('./lib/passport-config');

var index = require('./routes/index'); // 메인 홈페이지의 기본적인 링크들
var users = require('./routes/users'); // 유저와 관련된 링크들
var questions = require('./routes/questions');






/*####################### 서버 만들고 필요한 미들웨어 삽입  #######################*/

/**
 * App create
 * express(); 는 app이라는 객체를 반환 함
 * express web framework 객체를 app이라는 변수가 받는 것임
 */

var app = express(); // 이제 앞으로 이 framework에 여러가지 middleware를 끼워 넣기만 하면되는 것임

/**
 * Set view engine
 * path.join(__dirname, 'views') => 현재 디렉토리의 views 파일을 뜻함
 * view engine(=template engine)을 pug로 셋팅한것임 
 */

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
if (app.get('env') === 'development') { // 이쁜 형태로 보내기 위해서
  app.locals.pretty = true;
}

/**
 * Pug의 local에 moment라이브러리와 querystring 라이브러리를 사용할 수 있도록.
 */

app.locals.moment = require('moment');
app.locals.querystring = require('querystring');

/**
 * MongoDB connect
 * 외부 저장공간 mlab 사용 (public 하게 만들어야 되기 때문) 
 */

const MONGODB_CONN_URI = 'mongodb://dahan:cdh950113@ds257485.mlab.com:57485/cotoodb';
mongoose.Promise = global.Promise; // ES6 Native Promise를 mongoose에서 사용한다.
mongoose.connect(MONGODB_CONN_URI, {useMongoClient: true });
mongoose.connection.on('error', console.error); // error handler

/**
 * uncomment after placing your favicon in /public
 * 아래가 바로 미들웨어 끼워 넣는 것임 선언하는 순서대로 실행됨 이거 핵심!!!
 */

app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json()); // 바디 파싱
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser()); // 쿠키 파싱
app.use(methodOverride('_method', {methods: ['POST', 'GET']})); // _method를 통해서 method를 변경할 수 있도록 함. PUT이나 DELETE를 사용할 수 있도록.
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  debug: true,
  sourceMap: true
}));

/**
 * session객체는 req에 존재한다.
 * 그 이유는 클라이언트가 서버와 통신할 때 sessID를 쿠키로 주는데
 * 이것을 req.session 객체가 받는 것이기 때문이다.
 * 
 * 다음의 코드가 실행되면서 기본적으로 접속한 어떤 클라이언트이든 
 * sessID(=connect.sid)를 바로 제공하는 듯
 * 즉, 처음 접속시에 바로 sessID를 클라이언트가 받음
 * 세션 데이터와 DB의 사용자 데이터는 별개 a
 */

app.use(session({
  resave: true, 
  saveUninitialized: true, // 세션아이디를 클라이언트가 사용하기 전까진 발급하지 말라는 뜻
  secret: 'long-long-long-secret-string-1313513tefgwdsvbjkvasd', // 암호화 키랑 비슷한 역할
  //store: new mongoStore({url:MONGODB_CONN_URI}) // 디스크에 위치한 DB에 세션 정보를 저장하니까 엄청 느려지네 ;;
}));
app.use(flash()); // flash message를 사용할 수 있도록

/**
 * passport 초기화
 * passport가 다루는 html 태그의 name은 정해져 있으므로 passport가 사용하는 name으로
 * 적합하게 form 등을 짜줘야 한다.
 * name은 passport 홈페이지 참고
 */

app.use(express.static(path.join(__dirname, 'public'))); // 정적파일 라우팅

/**
 * passport 초기화
 * passport가 다루는 html 태그의 name은 정해져 있으므로 passport가 사용하는 name으로
 * 적합하게 form 등을 짜줘야 한다.
 * name은 passport 홈페이지 참고
 * 실행 흐름 => 라우트 -> passport.authentication() -> newStrategy -> passport.serializeUser()
 */

app.use(passport.initialize()); // passport 초기화 후 app과 연결
app.use(passport.session()); // passport와 세션 연결 (passport가 세션을 사용하겠다라는 뜻)
passportConfig(passport); // 여기서 접속한 클라이언트의 세션을 받아서 전역 req 변수의 객체로 해당 user 정보를 연결함

app.use(function(req, res, next) { // pug의 local에 현재 사용자 정보와 flash 메시지를 전달
  res.locals.currentUser = req.user;  // passport는 req.user로 user정보 전달
  res.locals.flashMessages = req.flash();
  next();
});

/**
 * 라우팅을 위한 코드
 */

app.use('/', index); // localhost:3000 하면 여기서 종료됨 즉, 이게 base임
app.use('/users', users);
app.use('/questions', questions);
require('./routes/auth')(app, passport);





/*####################### error handler #######################*/

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * app변수는 웹서버 객체를 참조한다.
 * module.exports도 웹서버 객체를 참조하도록 만듬
 */ 

module.exports = app;
