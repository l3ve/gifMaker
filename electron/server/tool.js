const Buffer = require('Buffer').Buffer;
var CrcCalculator = require('./png/crc');

function padStart(str, targetLengthSrc, padString) {
  let res;
  let targetLength = targetLengthSrc;
  targetLength >>= 0; // floor if number or convert non-number to 0;
  padString = String(padString || ' ');
  if (str.length > targetLength) {
    return String(str);
  }
  targetLength -= str.length;
  if (targetLength > padString.length) {
    padString += padString.repeat(targetLength / padString.length); // append to original to ensure we are longer than needed
  }
  res = padString.slice(0, targetLength) + String(str);
  return Buffer.from([
    '0x' + res.slice(0, 2),
    '0x' + res.slice(2, 4),
    '0x' + res.slice(4, 6),
    '0x' + res.slice(6, 8)
  ])
}

function crc32(buf) {
  let crc = new CrcCalculator();
  crc.write(new Buffer(buf));
  return padStart(crc.crc32().toString(16), 8, '0')
}


function getByteWidth({ width, bpp, depth }) {
  let byteWidth = width * bpp;
  if (depth !== 8) {
    byteWidth = Math.ceil(byteWidth / (8 / depth));
  }
  return byteWidth;
}

function paethPredictor(left, above, upLeft) {

  var paeth = (left + above) - upLeft;
  var pLeft = Math.abs(paeth - left);
  var pAbove = Math.abs(paeth - above);
  var pUpLeft = Math.abs(paeth - upLeft);

  if (pLeft <= pAbove && pLeft <= pUpLeft) {
    return left;
  }
  if (pAbove <= pUpLeft) {
    return above;
  }
  return upLeft;
}
function concat(...param) {
  return Array.prototype.concat.apply(...param)
}
module.exports = {
  crc32,
  padStart,
  getByteWidth,
  paethPredictor,
  concat
}