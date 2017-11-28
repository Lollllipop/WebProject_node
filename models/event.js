const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User' }, // author 자체가 해당 user의 ID를 받는 듯
  title: {type: String, trim: true, required: true},
  content: {type: String, trim: true, required: true},
  location: {type: String, required: true},
  startTime: {type: Date, required: true},
  endTime: {type: Date, required: true},
  orgName: {type: String, required: true},
  orgDescription: {type: String, required: true},
  kinds: [String],
  fields: [String],
  isFree: Boolean,
  charge: {type: Number},
  numLikes: {type: Number, default: 0},
  numAnswers: {type: Number, default: 0},
  numApplis: {type: Number, default: 0},
  numFavorites: {type: Number, default: 0},
  numReads: {type: Number, default: 0},
  createdAt: {type: Date, default: Date.now}
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});
schema.plugin(mongoosePaginate);
var Event = mongoose.model('Event', schema);

module.exports = Event;