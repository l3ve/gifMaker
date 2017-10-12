const fs = require('fs');
const zlib = require('zlib');
const pngConst = require('./const');
const { getByteWidth, crc32, paethPredictor } = require('./tool')

class GIF {
  constructor() {
    super()
    this.encoding = 'utf8'
    this.initData()
  }
  initData() {
    this.bufferFragments = []
  }
}


module.exports = GIF