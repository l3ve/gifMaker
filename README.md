# gifMaker


###读取本地mp4格式视频转为gif图

可以设置gif图长宽,按`空格键`开始到`空格键`结束.

该项目应用到如下2个东东:

[nwjs](https://github.com/nwjs/nw.js)

[gif.js](https://github.com/jnordberg/gif.js)

PS:

 1. 原nw.js项目并不能播放视频,需要通过替换对应版本内核浏览器的`ffmpegsumo.dll`文件,本项目的是采用node-webkit-v0.10.5
 2. 因为性能有限,当图片大于`320*175`,且时间长于`10s`时,转换将会非常慢,但不影响功能,只需耐心等待
 