
self.importScripts('ffmpeg.js');

onmessage = function(e) {
  console.log('ffmpeg_run', ffmpeg_run);
  var files = e.data;
  var retrun ;
  
  console.log(files);
  ffmpeg_run({
   // arguments: ['-i', 'https://gw.alicdn.com/bao/uploaded/LB1l2iXISzqK1RjSZFjXXblCFXa.mp4?file=LB1l2iXISzqK1RjSZFjXXblCFXa.mp4', '-b:v', '64k', '-bufsize', '64k', '-vf', 'showinfo', '-strict', '-2', 'out.mp4'],
  // arguments: ['-i', '/input/' + files[0].name  'out.mp4'],
  // arguments: ['-version'],
      //rguments: ['-i', '/input/' + files[0].name, '-b:v', '64k', '-bufsize', '64k', '-vf', 'showinfo', '-strict', '-2', 'out.mp4'],
	   arguments: ['-i', '/input/' + files[0].name, '-s' ,'360x240' , 'out.mpeg'],
    files: files,
	retrun:retrun
  }, function(results) {
	//var URL = this.window.URL || this.window.webkitURL;
    console.log('result',results[0].data);
	var blob = new Blob([results[0].data], {type: "video/mpeg"});

	console.log(blob)
	var blobURL = URL.createObjectURL(blob);
	console.log(blobURL)
   // self.postMessage(results[0].data, [results[0].data]);
  });

}

