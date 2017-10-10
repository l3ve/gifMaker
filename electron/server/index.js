const { ipcMain } = require('electron');
const fs = require('fs');
const { crc32 } = require('./png/tool');
const pngConst = require('./png/const');
const zlib = require('zlib')

const PNG = require('./png')
let times = 0;

ipcMain.on('makePNG', (event, pixels, width, height) => {
  let png = new PNG()
  png.creatPNG({ pixels, width, height }, (res) => {
    event.sender.send('makePNG', res)
  })
})


ipcMain.on('parsePNG', (event, path) => {
  let png = new PNG()
  png.readFile(path, (res) => {
    console.log(res);
  })
  event.returnValue = 'res'
})
