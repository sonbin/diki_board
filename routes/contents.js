var express = require('express');
var router = express.Router();
var BoardContents = require('../model/dikie_schema');


router.get('/',function(req,res){

	BoardContents.find({deleted:false}).sort({date:-1}).exec(function(err,rawDatas){
		if(err) throw err;
		res.render('board',{content:rawDatas});
	});
});

router.post('/',function(req,res){

	var mode = req.param('mode');

	var addWriter = req.body.addWriter;
	var addTitle = req.body.addTitle;
	var addContents = req.body.addContent;
	var addPassword = req.body.addPassword;

	var modTitle = req.body.modTitle;
	var modContent = req.body.modContent;
	var modID = req.body.modID;

	if(mode=='add'){
		addboard(addTitle,addWriter,addPassword,addContents);
		res.redirect('/');
	}else{
		modboard(modID,modTitle,modContent);
		res.redirect('/');
	}
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


router.get('/password',function(req,res){
	var id=req.param('id');

	BoardContents.findOne({_id:id},function(err,rawContents){
		res.send(rawContents.password);
	})
})


router.get('/delete',function(req,res){
	var contentID = req.param('id');
	BoardContents.update({_id:contentID},{$set:{deleted:true}},function(err){
		if(err) throw err;
		res.redirect('/');
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

function modboard(id,title,content){
	var modContent = content.replace(/\r\n/gi,"\\r\\n");
	BoardContents.findOne({_id:id},function(err,originContent){
		if(err) throw err;
		originContent.updated.push({title:originContent.title,contents:originContent.contents});
		originContent.save(function(err){
			if(err) throw err;
		});
	});
	BoardContents.update({_id:id},{$set:{title:title,contents:modContent,date:Date.now()}},function(err){
		if(err) throw err;
	});
}

module.exports = router;