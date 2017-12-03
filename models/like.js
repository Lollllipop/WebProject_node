const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const Schema = mongoose.Schema;

var schema = new Schema({
  liker: { type: Schema.Types.ObjectId, ref: 'User' }, 
  event: { type: Schema.Types.ObjectId, ref: 'Event' }, 
  createdAt: {type: Date, default: Date.now} 
}, {
  toJSON: { virtuals: true},
  toObject: {virtuals: true}
});

schema.plugin(mongoosePaginate);
var Like = mongoose.model('like', schema);

module.exports = Like;