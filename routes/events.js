const express = require('express');
const Event = require('../models/event');
const Answer = require('../models/answer'); 
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
  const event = await Event.findById(req.params.id).populate('author');
  console.log("event: ",event);
  const answers = await Answer.find({event: event.id}).populate('author');
  console.log("answers: ",answers);
  event.numReads++;   

   // TODO: 동일한 사람이 본 경우에 Read가 증가하지 않도록??? 만들어야 함
  
  await event.save();
  res.render('events/show', {event: event, answers: answers});
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
    isFree:(req.body.isFree==="true"),
    charge:Number(req.body.charge),
  });
  await event.save();
  req.flash('success', '이벤트 등록이 성공적으로 완료되었습니다.');
  res.redirect('/events'); // 이거 핵심임 새로 다시 업데이트 된 디비 내용을 refresh해서 게시하게 하도록 함
}));

module.exports = router;
