var express = require('express');
var router = express.Router();
var fs = require('fs');
var BoardContents = require('../model/dikie_schema');
var multer = require('multer');
var storage = multer.diskStorage({
	destination:function(req,file,cb){
		cb(null,'./uploads')
	},
	filename:function(req,file,cb){
		cb(null,file.originalname)
	}
});

var upload = multer({storage:storage});



router.get('/',function(req,res){



	var page = req.param('page');
	if(page==null) {page=1;}

	var skipSize = (page-1)*10;
	var limitSize = 10;
	var pageNum = 1;

	BoardContents.count({deleted:false},function(err,totalCount){
		if(err) throw err;

		pageNum = Math.ceil(totalCount/limitSize);

			BoardContents.find({deleted:false}).sort({date:-1}).skip(skipSize).limit(limitSize).exec(function(err,pageContents){
				if(err) throw err;
				res.render('board',{content:pageContents,pagination:pageNum});
		});
	});
});

router.post('/',upload.array('UploadFile'),function(req,res){

	var mode = req.param('mode');

	var addWriter = req.body.addWriter;
	var addTitle = req.body.addTitle;
	var addContents = req.body.addContent;
	var addPassword = req.body.addPassword;
	var upFile = req.files;

	var modTitle = req.body.modTitle;
	var modContent = req.body.modContent;
	var modID = req.body.modID;


	if(mode=='add'){
		if(isSaved(upFile)){

			addboard(addTitle,addWriter,addPassword,addContents,upFile);
			res.redirect('/');
		}else{ console.log('파일이 저장되지 않았습니다.'); }
		
	}else if(mode=='modify'){
		modboard(modID,modTitle,modContent);
		res.redirect('/');
	}

});


router.get('/view',function(req,res){

	var user_id = req.query.id;

	BoardContents.findOne({_id:user_id},function(err,rawContents){

		var reply_pg = Math.ceil(rawContents.comments.length/5);

			if(err) throw err;
			rawContents.count += 1;

			rawContents.save(function(err){
				if(err) throw err;
				res.render('boardDetail',{content:rawContents,replyPage:reply_pg});
				res.render('test',{replyPage:reply_pg});
			});
	});
});


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


router.post('/reply',function(req,res){

	var reply_writer = req.body.replyWriter;
	var reply_comment = req.body.replyComment;
	var reply_id = req.body.reply_ID;
	
	addComment(reply_id,reply_writer,reply_comment);

	res.redirect('/view?id='+reply_id);

});

router.get('/reply',function(req,res){

	var id= req.param('id');
	var page = req.param('page');
	var max = req.param('max');
	var skipSize = (page-1)*5;
	var limitSize = skipSize + 5;

	if(max < skipSize+5){limitSize=max*1;}

	BoardContents.findOne({_id:id},{comments:{$slice:[skipSize,limitSize]}},function(err,pageReply){
		if(err) throw err;

		var pageQ = pageReply.comments;
		res.send(pageQ);
	});
});


router.get('/download/:path',function(req,res){
	//file download

	var path = req.params.path;
	console.log(path);
	//res.send(path);
	res.download('../bin/uploads/'+path,path);
	
	
});


function addComment(id,writer,comment){
	BoardContents.findOne({_id:id},function(err,rawContent){
		if(err) throw err;

		rawContent.comments.unshift({name:writer,memo:comment});
		rawContent.save(function(err){
			if(err) throw err;
		});
	});
}






function addboard(title,writer,password,content,upFile){



	var addContent_DB = content.replace(/\r\n/gi,"\\r\\n");

		var newBoardContent = new BoardContents;

		newBoardContent.title = title;
		newBoardContent.writer = writer;
		newBoardContent.password = password;
		newBoardContent.contents = addContent_DB;

		newBoardContent.save(function(err){
			if(err) throw err;
			BoardContents.findOne({_id:newBoardContent._id},{_id:1},function(err,newBoardId){
				if(err)throw err;
				if(upFile != null){
					var renaming = renameUploadFile(newBoardId.id,upFile);
					for(var i=0; i<upFile.length; i++){
						fs.rename(renaming.tmpname[i],renaming.fsname[i],function(err){
							if(err){console.log(err); return; }
						});
					}

					for(var i=0; i<upFile.length; i++){
						BoardContents.update({_id:newBoardId.id},{$push:{fileUp:renaming.fullname[i]}},function(err){
							if(err)throw err;
						});
					}
				}
			});
		});
}

function modboard(id,title,content){
	var modContents = content.replace(/\r\n/gi,"\\r\\n");
	BoardContents.findOne({_id:id},function(err,originContent){
		if(err) throw err;
		originContent.updated.push({title:originContent.title,contents:originContent.contents});
		originContent.save(function(err){
			if(err) throw err;
		});
	});
	BoardContents.update({_id:id},{$set:{title:title,contents:modContents,date:Date.now()}},function(err){
		if(err) throw err;
	});
}

function isSaved(upFile){

	var savedFile = upFile;
	var count = 0;

	if(savedFile != null){
		for(var i=0; i<savedFile.length; i++){
			if(fs.statSync(getDirname(1)+savedFile[i].path).isFile()){
				count++;
			}
		}

		if(count == savedFile.length){
			return true;
		}else{
			return false;
		}
	}else{
		return true;
	}
}

function getDirname(num){
	var order = num;
	var dirname = __dirname.split('/');
	var result = '';

	for(var i=0; i<dirname.length-order;i++){
		result += dirname[i]+'/';
	}
	return result;
}

function renameUploadFile(itemId,upFile){
	var renameForUpload = {};
	var newFile = upFile;
	var tmpPath = [];
	var tmpType = [];
	var index = [];
	var rename = [];
	var fileName = [];
	var fullName =[];
	var fsName = [];
 
	for(var i=0; i<newFile.length; i++){
		tmpPath[i] = newFile[i].path;
		tmpType[i] = newFile[i].mimetype.split('/')[1];
		index[i] = tmpPath[i].split('/').length;
		rename[i]=tmpPath[i].split('/')[index[i]-1];
		fileName[i]=itemId+"_"+getFileDate(new Date())+"_"+rename[i];
		fullName[i]=fileName[i]+":"+newFile[i].originalname.split('.')[0];
		fsName[i]=getDirname(1)+"upload/"+fileName[i];
	}

	renameForUpload.tmpname = tmpPath;
	renameForUpload.filename = fileName;
	renameForUpload.fullname = fullName;
	renameForUpload.fsname = fsName;

	return renameForUpload;
}

function getFileDate(date){
	var year = date.getFullYear();
	var month = date.getMonth();
	var day = date.getDate();
	var hour = date.getHours();
	var min = date.getMinutes();
	var sec = date.getSeconds();

	var fullDate = year+""+month+""+day+""+hour+""+min+""+sec;
	return fullDate;
}

module.exports = router;