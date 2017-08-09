const Stream = require('stream');
const fs = require('fs');
const zlib = require('zlib');
const pngConst = require('./const');
const { getByteWidth, crc32, paethPredictor, concat } = require('../tool')

class PNG extends Stream {
  constructor() {
    super()
    this.encoding = 'utf8'
    this.initData()
  }
  initData() {
    this.bufferFragments = []
    this.buffers = {}
    this.buffered = 0
    this.metaData = {
      width: 0,
      height: 0,
      depth: 8,
      bpp: 3,
      colorType: 2
    }
    this.pngChunks = {
      signature: new Buffer(pngConst.PNG_SIGNATURE)
    }
  }
  write(data, cb, encoding = this.encoding) {
    let dataBuffer;
    if (Buffer.isBuffer(data)) {
      dataBuffer = data;
    } else {
      dataBuffer = new Buffer(data, encoding);
    }
    this.buffers = dataBuffer;
    this.buffered = dataBuffer.length;
    this.parseChunk();
    this.inflateData(this.pngChunks.IDAT.data, cb)
  }
  getMetaData(chunk) {
    const buf = chunk.slice(8)
    let width = buf.readUInt32BE(0);
    let height = buf.readUInt32BE(4);
    let depth = buf[8]
    let colorType = buf[9]
    let bpp = pngConst.COLORTYPE_TO_BPP_MAP[colorType];
    let xComparison = depth === 8 ? bpp : depth === 16 ? bpp * 2 : 1;
    this.metaData = { width, height, depth, colorType, bpp, xComparison };
  }
  buildChunk(signature) {
    const signatureChunk = this.pngChunks[signature];
    let i = 0
    let buf = Buffer.from([])
    while (i < signatureChunk.times) {
      let chunk = [
        signatureChunk.len[i],
        Buffer.from(pngConst['TYPE_' + signature]),
        signatureChunk.data[i],
        signatureChunk.crc[i]
      ]
      buf = Buffer.concat([buf, ...chunk])
      i += 1
    }
    return buf;
  }
  parseChunk() {
    let buf = this.buffers.slice(8);
    this.bufferFragments.push(this.buffers.slice(0, 8));
    this.getMetaData(buf);
    while (this.buffered > 8) {
      let lenBuf = buf.slice(0, 4);
      let length = buf.readUInt32BE(0);
      let type = buf.readUInt32BE(4);
      let crc = '';

      let name = '';
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(buf[i]);
      }
      this.bufferFragments.push(buf.slice(0, length + 12))
      let data = new Buffer(length + 4);
      buf.copy(data, 0, 8, length + 12);
      buf = buf.slice(length + 12);
      crc = data.slice(length);
      data = data.slice(0, length)
      this.buffered -= length + 12;
      if (this.pngChunks[name]) {
        this.pngChunks[name].data = concat(this.pngChunks[name].data, [data])
        this.pngChunks[name].len = concat(this.pngChunks[name].len, [lenBuf])
        this.pngChunks[name].crc = concat(this.pngChunks[name].crc, [crc])
        this.pngChunks[name].times += 1
      } else {
        this.pngChunks[name] = {}
        this.pngChunks[name].data = [data]
        this.pngChunks[name].len = [lenBuf]
        this.pngChunks[name].crc = [crc]
        this.pngChunks[name].times = 1
      }
    }
  }
  reverseColorData(chunk) {
    const byteWidth = getByteWidth(this.metaData) + 1;
    let buf = chunk;
    let lastLine = '';
    let colorData = [];
    while (buf.length) {
      let fragments = new Buffer(byteWidth);
      buf.copy(fragments, 0, 0, byteWidth);
      buf = buf.slice(byteWidth);
      colorData.push(fragments)
    }
    colorData = colorData.map((d, i) => {
      switch (d[0]) {
        case 1:
          lastLine = this.unFilterType1(d, lastLine, byteWidth);
          break;
        case 2:
          lastLine = this.unFilterType2(d, lastLine, byteWidth);
          break;
        case 3:
          lastLine = this.unFilterType3(d, lastLine, byteWidth);
          break;
        case 4:
          lastLine = this.unFilterType4(d, lastLine, byteWidth);
          break;
        case 0:
          lastLine = d;
          break;
        default:
          throw new Error('Unrecognised filter type - ' + d[0]);
      }
      return lastLine
    })
    this.pngChunks.IDAT.colorData = colorData
  }
  inflateData(data, cb) {
    let allData = data.reduce((p, n) => {
      return Buffer.concat([p, n])
    })
    zlib.inflate(allData, (err, res) => {
      if (err) {
        console.log(err);
        cb(this.pngChunks)
      } else {
        // console.log(res);
        this.reverseColorData(res)
        cb(this.pngChunks)
      }
    })
  }
  unFilterType1(rawData, lastLine, byteWidth) {
    const { xComparison } = this.metaData;
    let xBiggerThan = xComparison - 1;
    let lineColorData = new Buffer(byteWidth);

    for (let x = 0; x < byteWidth; x += 1) {
      let rawByte = rawData[1 + x];
      let f1Left = x > xBiggerThan ? lineColorData[x - xComparison] : 0;
      lineColorData[x] = rawByte + f1Left;
    }
    return lineColorData;
  }
  unFilterType2(rawData, lastLine, byteWidth) {
    let lineColorData = new Buffer(byteWidth);

    for (let x = 0; x < byteWidth; x += 1) {
      let rawByte = rawData[1 + x];
      let f2Up = lastLine ? lastLine[x] : 0;
      lineColorData[x] = rawByte + f2Up;
    }
    return lineColorData
  }
  unFilterType3(rawData, lastLine, byteWidth) {
    const { xComparison } = this.metaData;
    let xBiggerThan = xComparison - 1;
    let lineColorData = new Buffer(byteWidth);

    for (let x = 0; x < byteWidth; x += 1) {
      let rawByte = rawData[1 + x];
      let f3Up = lastLine ? lastLine[x] : 0;
      let f3Left = x > xBiggerThan ? lineColorData[x - xComparison] : 0;
      let f3Add = Math.floor((f3Left + f3Up) / 2);
      lineColorData[x] = rawByte + f3Add;
    }
    return lineColorData
  }
  unFilterType4(rawData, lastLine, byteWidth) {
    const { xComparison } = this.metaData;
    let xBiggerThan = xComparison - 1;
    let lineColorData = new Buffer(byteWidth);

    for (let x = 0; x < byteWidth; x += 1) {
      let rawByte = rawData[1 + x];
      let f4Up = lastLine ? lastLine[x] : 0;
      let f4Left = x > xBiggerThan ? lineColorData[x - xComparison] : 0;
      let f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
      let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
      lineColorData[x] = rawByte + f4Add;
    }
    return lineColorData
  }
  saveMin(name) {
    let buf = Buffer.concat([
      Buffer.from(this.pngChunks.signature),
      this.buildChunk('IHDR'),
      this.buildChunk('IDAT'),
      this.buildChunk('IEND')
    ])
    // buf = Buffer.concat(this.bufferFragments)
    // console.log(this.bufferFragments);
    // console.log(buf);
    fs.writeFile(name, buf, (err) => {
      if (err) console.log(err);
    })
  }
  readFile(src, cb) {
    if (typeof src === 'string') {
      fs.readFile(src, (err, data) => {
        if (err) {
          cb(err)
          return
        }
        this.write(data, cb)
      })
    } else {
      this.write(src, cb)
    }
  }
}


module.exports = PNG