const { ipcMain } = require('electron');
const fs = require('fs');
const Buffer = require('Buffer').Buffer;
const { padStart, crc32 } = require('./tool');
const getPixels = require('get-pixels');
const PNG = require('./png')

ipcMain.on('getCRC', (event, str) => {
  let str16 = str.split(' ').map((v) => {
    // 根据unicode值 转换为字符串
    return String.fromCharCode(v)
  }).join('')
  // crc 接受的是unicode字符串
  let crc16 = padStart(crc32(str16).toString(16), 8, '0');
  let crc10 = [parseInt(crc16.slice(0, 2), 16), parseInt(crc16.slice(2, 4), 16), parseInt(crc16.slice(4, 6), 16), parseInt(crc16.slice(6, 8), 16)]
  event.returnValue = { crc10, crc16 }
})

ipcMain.on('decompressIDAT', (event, { str, config = {} }) => {
  event.returnValue = str
})

ipcMain.on('getPNGidat', (event, { str }) => {
  getPixels('./png.png', (err, pixels) => {
    if (err) {
      console.log('ERROR:', err);
      return false
    }
    event.returnValue = pixels
  })
  PNG.readFile('./new.png')
})

ipcMain.on('saveImage', (event, base64Str) => {
  let buf = Buffer.from(base64Str);
  fs.writeFile('./new.png', buf, (err) => {
    err ? console.log(err) : null
  })
})