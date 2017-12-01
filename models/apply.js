const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  applier: { type: Schema.Types.ObjectId, ref: 'User' }, // 신청한 저자
  event: { type: Schema.Types.ObjectId, ref: 'Event' }, // 신청받은 이벤트
  createdAt: {type: Date, default: Date.now} // 신청 시기
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

schema.plugin(mongoosePaginate);
var Apply = mongoose.model('apply', schema);

module.exports = Apply;