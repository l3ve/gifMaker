'use strict';

var crcTable = [];

(function () {
  for (let i = 0; i < 256; i += 1) {
    let currentCrc = i;
    for (let j = 0; j < 8; j += 1) {
      if (currentCrc & 1) {
        currentCrc = 0xedb88320 ^ (currentCrc >>> 1);
      }
      else {
        currentCrc = currentCrc >>> 1;
      }
    }
    crcTable[i] = currentCrc;
  }
}());

let CrcCalculator = module.exports = function () {
  this._crc = -1;
};

CrcCalculator.prototype.write = function (data) {

  for (var i = 0; i < data.length; i++) {
    this._crc = crcTable[(this._crc ^ data[i]) & 0xff] ^ (this._crc >>> 8);
  }
  return true;
};

CrcCalculator.prototype.crc32 = function () {
  // return this._crc ^ (-1)
  return (this._crc ^ (-1)) >>> 0;
};
