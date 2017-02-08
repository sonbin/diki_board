var express = require('express');
var router = express.Router();
var BoardContents = require('../model/dikie_schema');


router.get('/',function(req,res){

	BoardContents.find({}).sort({date:-1}).exec(function(err,rawDatas){
		if(err) throw err;
		res.render('board',{content:rawDatas});
	});
});

router.post('/',function(req,res){

	var addWriter = req.body.addWriter;
	var addTitle = req.body.addTitle;
	var addContents = req.body.addContent;
	var addPassword = req.body.addPassword;

	addboard(addTitle,addWriter,addPassword,addContents);
	res.redirect('/');
});


router.get('/view',function(req,res){


	var user_id = req.query.id;

	BoardContents.findOne({_id:user_id},function(err,rawContents){

			if(err) throw err;
			rawContents.count += 1;

			rawContents.save(function(err){
				if(err) throw err;
				res.render('boardDetail',{content:rawContents});
			})

	})

})


function addboard(title,writer,password,content){

		var newBoardContent = new BoardContents;

		newBoardContent.title = title;
		newBoardContent.writer = writer;
		newBoardContent.password = password;
		newBoardContent.contents = content;

		newBoardContent.save(function(err){
			if(err) throw err;
		});
}

module.exports = router;