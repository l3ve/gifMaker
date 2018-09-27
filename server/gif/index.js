const fs = require('fs');
const zlib = require('zlib');
const gifConst = require('./const');
const { LZW } = require('./tool');

class GIF {
  constructor() {
    this.encoding = 'utf8'
    this.gifData = Buffer.concat([
      Buffer.from(gifConst.GIF_SIGNATURE),
      Buffer.from(gifConst.LSD),
      Buffer.from(gifConst.GCT),

      Buffer.from(gifConst.GCE),
      Buffer.from(gifConst.ID),
      Buffer.from(gifConst.IMAGEDATA),

      Buffer.from(gifConst.GCE),
      Buffer.from(gifConst.ID),
      Buffer.from(gifConst.FUCK4),

      Buffer.from(gifConst.END)
    ])
    this.initData(this.gifData)
    const _d = Buffer.from(gifConst.IMAGEDATA).toString('utf8')
    console.log(_d);
    console.log(LZW(_d, true));
  }
  initData(gifData) {
    this.bufferFragments = []
    fs.writeFile('./gif.gif', gifData, (res) => {
    })
  }
}


module.exports = GIF