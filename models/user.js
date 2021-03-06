const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

/**
 * DB 스키마 생성
 * 다 객체처럼 되어 있는 이유는 여러 옵션을 주기 위해서
 * 기본 타입 : String, Number, Array
 * 속성 종류 : 
 * type : 데이터 타입
 * required : 꼭 입력해야 하는
 * unique : 다른 행과 중복되면 안 된다.
 * trim : 공백을 제거합니다.(문자열 타입에 사용)
 * default : 문서가 생성되면 기본값으로 저장하고 싶은 것을 입력 해 놓을 수 있음
 * lowercase : 대문자를 소문자로 저장한다(문자열 타입)
 * validate : 함수로 개발자가 조건을 만듭니다.
 */

var schema = new Schema({
  name: {type: String, required: true, trim: true},
  email: {type: String, required: true, index: true, unique: true, trim: true}, // 회원탈퇴시 삭제
  password: {type: String}, // 회원탈퇴시 삭제
  isManager: {type: Boolean},
  facebook: {id: String, token: String, photo: String}, // 회원탈퇴시 삭제 (이 정보는 만약 API와 연결이 된다면 문제 발생할 가능성 있음)
  kakao: {id: String, token: String, photo: String}, // 회원탈퇴시 삭제 (이 정보는 만약 API와 연결이 된다면 문제 발생할 가능성 있음)
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

/*
 * 암호화 및 암호화된 비밀번호 확인 함수
 */

schema.methods.generateHash = function(password) {
  return bcrypt.hash(password, 10); // return Promise
};

schema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password); // return Promise
};

schema.plugin(mongoosePaginate);
var User = mongoose.model('User', schema);

module.exports = User;
