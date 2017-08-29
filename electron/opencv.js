#!/usr/bin/env node
var cv = require('opencv');
var request = require('request');
var fs = require('fs');
var tmpfile = '/tmp/tmpgile';

function detect(imgfile) {
  cv.readImage(imgfile, function(err, im){
    im.detectObject(cv.FACE_CASCADE, {}, function(err, faces){
      for (var i=0;i<faces.length; i++){
        var x = faces[i]
        console.log('>>', x); //Will see something like: { x: 336, y: 1359, width: 42, height: 42 }
        im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2);
      }
      im.save('/tmp/test.jpg');
    });
  })
}

//Execute the process
if(process.argv[2].indexOf('http') == 0) { //from http resource
  var url = process.argv[2];
  var req = request.get(url);
  req.pipe(fs.createWriteStream(tmpfile));
  req.on('end', function(){
    detect(tmpfile);
  });
} else { //from localhost
  detect(process.argv[2]);
}