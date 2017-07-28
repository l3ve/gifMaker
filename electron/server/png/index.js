const Stream = require('stream');
const fs = require('fs');
const pngConst = require('./const');

class PNG extends Stream {
  constructor() {
    super()
    this.buffers = {}
    this.buffered = 0
    this.pngChunks = {
      signature: pngConst.PNG_SIGNATURE
    }
    this.encoding = 'utf8'
  }
  write(data, encoding = this.encoding) {
    let dataBuffer;
    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
    } else {
      dataBuffer = new Buffer(data, encoding);
    }
    this.buffers = dataBuffer;
    this.buffered = dataBuffer.length;
    this.parseChunk();
    console.log(this.pngChunks);
  }
  parseChunk() {
    let buf = this.buffers.slice(8);

    while (this.buffered > 8) {
      let length = buf.readUInt32BE(0);
      let type = buf.readUInt32BE(4);
      let crc = '';

      let name = '';
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(buf[i]);
      }
      let data = new Buffer(length + 4);
      buf.copy(data, 0, 8, length + 12);
      buf = buf.slice(length + 12);
      crc = data.slice(length);
      data = data.slice(0, length)
      this.buffered -= length + 12;
      this.pngChunks[name] = {}
      this.pngChunks[name].data = data
      this.pngChunks[name].len = length
      this.pngChunks[name].crc = crc
    }
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
  crc32(buf) {
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    let crc = -1;
    for (let index = 0; index < buf.length; index += 1) {
      let byte = buf[index];
      crc = pngConst.TABLE[(crc ^ byte) & 0xff] ^ crc >>> 8;
    }
    return crc ^ -1
  }
}


module.exports = new PNG()