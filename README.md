# electron 衍生

视频中截图，导出png和gif

TODO :
1. <del>解构png数据结构</del>
2. 解构gif数据结构
3. 迁移旧版本（nw版本）到electron上

# gifMaker
在zweiCanvas里有简单功能的展示,录制事件从点击播放(play)到点击暂停(stop)

[DEMO](http://nodecanvas.duapp.com/zweiGif.html "zweiGif")
###读取本地mp4格式视频转为gif图(window)

可以设置gif图长宽,按`空格键`开始到`空格键`结束.

该项目应用到如下2个东东:

[nwjs](https://github.com/nwjs/nw.js)

[gif.js](https://github.com/jnordberg/gif.js)

PS:

 1. 原nw.js项目并不能播放视频,需要通过替换对应版本内核浏览器的`ffmpegsumo.dll`文件,本项目的是采用node-webkit-v0.10.5
 2. 因为性能有限,当图片大于`320*175`,且时间长于`10s`时,转换将会非常慢,但不影响功能,只需耐心等待
 3. 生成图片后,直接拖拽到桌面即可保存
 4. 如果有什么好的意见提议或者BUG的话,小弟我乐意聆听