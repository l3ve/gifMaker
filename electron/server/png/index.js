const Stream = require('stream');
const fs = require('fs');
const pngConst = require('./const');

class PNG extends Stream {
  constructor() {
    super()
    this.buffers = []
    this.buffered = 0
    this.encoding = 'utf8'
  }
  write(data, encoding = this.encoding) {
    let dataBuffer;
    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
    } else {
      dataBuffer = new Buffer(data, encoding);
    }
    this.buffers.push(dataBuffer);
    this.buffered += dataBuffer.length;
  }
  readFile(url, cb) {
    fs.readFile(url, (err, data) => {
      if (err) {
        cb(err)
        return
      }
      this.write(data)
      // cb(null, ndarray(new Uint8Array(img_data.data),
      //   [img_data.width | 0, img_data.height | 0, 4],
      //   [4, 4 * img_data.width | 0, 1],
      //   0))
    })
  }
}


module.exports = new PNG()