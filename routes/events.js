const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const Event = require('../models/event');
const Answer = require('../models/answer'); 
const User = require('../models/user'); 
const Apply = require('../models/apply');
const Like = require('../models/like');
const catchErrors = require('../lib/async-error');
const needAuth = require('../lib/auth-check');
const validateForm = require('../lib/validateForm-event');

const router = express.Router();

// const minetypes = { // 내가 받을 타입의 조건을 포함하는 객체 생성
//   "image/jpeg": "jpg",
//   "image/gif": "gif",
//   "image/png": "png"
// }

// const upload = multer({
//   dest:'tmp',
//   fileFilter:(req, file, cb) => {

//   }
// });

/**
 * GET route (read)
 */

router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; 
  var query = {};
  const searchKey = req.query.searchKey;
  const field = req.query.field;

  if (searchKey) { // 검색창에 검색어를 입력해서 조건이 존재하면 query에 그 조건을 넣는 것
    query = {$or: [ // 배열의 조건중 하나라도 맞으면 검색 되도록
      {title: {'$regex': searchKey, '$options': 'i'}}, // title 값에 term이 포함되면 pick!
      {location: {'$regex': searchKey, '$options': 'i'}} // i는 대소문자를 무시하겠다라는 뜻
    ]};
  }

  if (field) { 
    query = {fields: {'$regex': field, '$options': 'i'}};
  }
  console.log("query!!:", query);

  const events = await Event.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    populate: 'author',
    page: page, // page 정보와
    limit: limit // limit 정보 전달
  });

  res.render('events/index', {events: events, searchKey: searchKey, query: req.query});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('events/new');
});

router.get('/:id', catchErrors(async (req, res, next) => {
  const user = req.user;
  var isLiker = null;
  if(user){
    isLiker = await Like.find({$and: [
      {event: req.params.id}, 
      {liker: user.id}
    ]});
    if(!isLiker.length>0){
      isLiker = null;
    }
  }
  const applies = await Apply.find({event: req.params.id});
  const event = await Event.findById(req.params.id).populate('author');
  const answers = await Answer.find({event: event.id}).populate('author');
  const applyNum = applies.length;
  event.numReads++;   
   // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록??? 만들어야 함
  await event.save();
  console.log("isLiker!! : ", isLiker);
  res.render('events/detail', {event: event, answers: answers, user: user, applies: applies, applyNum: applyNum, isLiker: isLiker});
}));

router.get('/:id/edit', needAuth, catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);
  res.render('events/edit', {event: event});
}));

router.get('/my_write/:id', needAuth, catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8; 
  var query = {author: req.user.id}; // 원하는 쿼리를 여기다 주면 그 쿼리에 해당된 데이터만 넘어감.

  var events = await Event.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    page: page, 
    limit: limit 
  });
  
  res.render('events/my_write', {events: events, query: req.query, user:req.user}); // 현 사용자의 이벤트 다 넘김
}));

router.get('/my_apply/:id', needAuth, catchErrors(async (req, res, next) => {
  const apply = await Apply.find({applier: req.user.id});
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  var apply_event=[]; 
  for(var i in apply){
    apply_event.push(apply[i].event); 
  }
  var query = {'_id':{$in:apply_event}};
  var events = await Event.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    page: page, 
    limit: limit 
  });

  res.render('events/my_apply', {events: events, query: req.query, user:req.user});
}));

router.get('/:id/applierList', needAuth, catchErrors(async (req, res, next) => {
  const apply = await Apply.find({event: req.params.id}); 
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // listform 느낌으로 갈 것이니 10개로
  var apply_applier=[]; 
  for(var i in apply){
    apply_applier.push(apply[i].applier); 
  }

  var query = {'_id':{$in:apply_applier}};
  var users = await User.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    page: page, 
    limit: limit 
  });
  res.render('events/applierList', {users: users, event: req.params.id});
}));

router.get('/my_favorite/:id', needAuth, catchErrors(async (req, res, next) => {
  const like = await Like.find({liker: req.user.id});
  console.log("applier!! : ",like);//@@@@@@@@@@@
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  var like_event=[]; 
  for(var i in like){
    like_event.push(like[i].event); 
  }
  console.log("applyEvent!! : ",like_event);//@@@@@@@@@@@
  var query = {'_id':{$in:like_event}};
  var events = await Event.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    page: page, 
    limit: limit 
  });

  res.render('events/my_favorite', {events: events, query: req.query, user:req.user});
}));





/**
 * POST route (create)
 */

router.post('/', needAuth, catchErrors(async (req, res, next) => {
  const user = req.user;
  var sdArray = req.body.startDate.split('-').map(Number);
  var edArray = req.body.endDate.split('-').map(Number); 
  var stArray = req.body.startTime.split(':').map(Number);
  var etArray = req.body.endTime.split(':').map(Number);
  const start_time = new Date(sdArray[0], sdArray[1], sdArray[2], stArray[0], stArray[1]);
  const end_time = new Date(edArray[0], edArray[1], edArray[2], etArray[0], etArray[1]);
  var charge = 0;
  if(req.body.charge){
    charge = Number(req.body.charge);
  }
  console.log("charge!!:",charge);
  var event = new Event({
    author: user._id, // 여기서 저자와 연결이 되네
    title: req.body.title,
    content: req.body.content,
    location: req.body.location,
    startTime: start_time,
    endTime: end_time,
    orgName: req.body.orgName,
    orgDescription: req.body.orgDescription,
    kinds:req.body.kinds,
    fields:req.body.fields,
    isFree:!(req.body.isFree==="false"),
    charge:charge,
    maxNum:Number(req.body.maxNum)
  });
  await event.save();
  req.flash('success', '이벤트 등록이 성공적으로 완료되었습니다.');
  res.redirect(`/events/${event.id}`); // 이거 핵심임 새로 다시 업데이트 된 디비 내용을 refresh해서 게시하게 하도록 함
}));

router.post('/:id/my_apply', needAuth, catchErrors(async (req, res, next) => {
  var event = await Event.findById(req.params.id);
  // 여기에 좀 문제가 있는듯?
  var apply = new Apply({
    applier: req.user.id,
    event: event.id
  });
  await apply.save();

  event.numApplis++;
  await event.save();

  req.flash('success', '이벤트 신청이 성공적으로 완료되었습니다.');
  res.redirect(`/events/${event.id}`);
}));

router.post('/:id/like', needAuth, catchErrors(async (req, res, next) => {
  var event = await Event.findById(req.params.id);
  var user = req.user;
  var like = new Like({
    liker: user.id,
    event: event.id
  });

  await like.save();

  event.numLikes++;

  await event.save();

  return res.json(event.numLikes);
}));

/**
 * PUT route (update)
 */

router.put('/:id', catchErrors(async (req, res, next) => {
  const event = await Event.findById(req.params.id);

  var sdArray = req.body.startDate.split('-').map(Number);
  var edArray = req.body.endDate.split('-').map(Number); 
  var stArray = req.body.startTime.split(':').map(Number);
  var etArray = req.body.endTime.split(':').map(Number);
  const start_time = new Date(sdArray[0], sdArray[1], sdArray[2], stArray[0], stArray[1]);
  const end_time = new Date(edArray[0], edArray[1], edArray[2], etArray[0], etArray[1]);
  var charge = 0;
  if(req.body.charge){
    charge = Number(req.body.charge);
  }

  event.title = req.body.title;
  event.content = req.body.content;
  event.location = req.body.location;
  event.startTime = start_time;
  event.endTime = end_time;
  event.orgName = req.body.orgName;
  event.orgDescription = req.body.orgDescription;
  event.kinds = req.body.kinds;
  event.fields = req.body.fields;
  event.isFree = !(req.body.isFree==="false");
  event.charge = charge;
  event.maxNum = Number(req.body.maxNum);

  await event.save();

  req.flash('success', '성공적으로 수정되었습니다.');
  res.redirect(`/events/${event.id}`);
}));
module.exports = router;



/**
 * DELETE route (delete)
 */

 router.delete('/:id', needAuth, catchErrors(async (req, res, next) => {
  await Apply.find({event: req.params.id}).remove(); // 관련 신청 내역 삭제
  await Event.findOneAndRemove({_id: req.params.id});
  
  req.flash('success', '삭제가 완료되었습니다.');
  res.redirect(`/events/my_write/${req.params.id}`); // 내 이벤트 목록으로 이동하면 더 좋을 듯
}));
