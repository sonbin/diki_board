var mongoose = require('mongoose');

var BoardSchema = mongoose.Schema({
	writer:String,
	title:String,
	password:String,
	contents:String,
	comments:[{
		name:String,
		memo:String,
		date:{type:Date,default:Date.now}
	}],
	date:{type:Date,default:Date.now},
	count:{type:Number,default:0},
	updated:[{contents:String,date:{type:Date,default:Date.now}}],
	deleted:{type:Boolean,default:false}
});


module.exports = mongoose.model('BoardContents',BoardSchema);