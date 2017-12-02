const express = require('express');
const Event = require('../models/event');
const Answer = require('../models/answer'); 
const User = require('../models/user'); 
const Apply = require('../models/apply');
const catchErrors = require('../lib/async-error');
const needAuth = require('../lib/auth-check');
const validateForm = require('../lib/validateForm-event');

const router = express.Router();



/**
 * GET route (read)
 */

router.get('/', catchErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; 
  var query = {};

  const events = await Event.paginate(query, {
    sort: {createdAt: -1}, // 이걸로 정렬하겠다.
    populate: 'author',
    page: page, // page 정보와
    limit: limit // limit 정보 전달
  });

  res.render('events/index', {events: events, query: req.query});
}));

router.get('/new', needAuth, (req, res, next) => {
  res.render('events/new');
});

router.get('/:id', catchErrors(async (req, res, next) => {
  const user = req.user;
  console.log(user);
  const applies = await Apply.find({event: req.params.id})
  const event = await Event.findById(req.params.id).populate('author');
  const answers = await Answer.find({event: event.id}).populate('author');
  event.numReads++;   
   // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록??? 만들어야 함
  await event.save();
  res.render('events/detail', {event: event, answers: answers, user: user, applies: applies});
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
  console.log("applier!! : ",apply);//@@@@@@@@@@@
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  var apply_event=[]; 
  for(var i in apply){
    apply_event.push(apply[i].event); 
  }
  console.log("applyEvent!! : ",apply_event);//@@@@@@@@@@@
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
  console.log("users!!!!!! : ",users);
  res.render('events/applierList', {users: users, event: req.params.id});
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
    var charge = Number(req.body.charge);
  }
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
    charge:charge
  });
  await event.save();
  req.flash('success', '이벤트 등록이 성공적으로 완료되었습니다.');
  res.redirect('/events'); // 이거 핵심임 새로 다시 업데이트 된 디비 내용을 refresh해서 게시하게 하도록 함
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
  event.charge = Number(req.body.charge);

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
