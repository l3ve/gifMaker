const { ipcMain } = require('electron');
const fs = require('fs');
const Buffer = require('Buffer').Buffer;
const crc = require('crc');
const LZ77 = require('./tool');

ipcMain.on('getCRC', (event, str) => {
  let str16 = str.split(' ').map((v) => {
    return String.fromCharCode(v)
  }).join('')
  let value = crc.crc32(str16).toString(16);
  event.returnValue = value
})

ipcMain.on('compressIDAT', (event, { str, config = {} }) => {
  event.returnValue = LZ77.compress(str, config)
})
ipcMain.on('decompressIDAT', (event, { str, config = {} }) => {
  event.returnValue = LZ77.decompress(str, config)
})

ipcMain.on('saveImage', (event, base64Str) => {
  let buf = Buffer.from(base64Str);
  fs.writeFile('./new.png', buf, (err) => {
    err ? console.log(err) : null
  })
})