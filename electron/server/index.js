const { ipcMain } = require('electron');
const fs = require('fs');
const { crc32 } = require('./png/tool');
const pngConst = require('./png/const');
const zlib = require('zlib')

const PNG = require('./png')
let times = 0;

ipcMain.on('makePNG', (event) => {
  let png = new PNG()
  png.readFile('./white.png', (res) => {
    console.log(res);
    createPNG(res);
  })
  event.returnValue = 'res'
})

ipcMain.on('compress', (event, file) => {
  let buf = Buffer.from(file);
  var png = new PNG()
  png.readFile(buf, (res) => {
    console.log('=====================================');
    console.log(res);
  })
  png.saveMin(`./min${times += 1}.png`)
})


function createPNG(res) {
  let idat = ''
  res.IDAT.colorData[1][0] = 33;
  res.IDAT.colorData[1][3] = 33;
  res.IDAT.colorData[1][6] = 33;
  res.IDAT.colorData[1][9] = 33;
  res.IDAT.colorData[1][12] = 33;
  res.IDAT.colorData[1][15] = 33;
  res.IDAT.colorData[1][18] = 33;
  res.IDAT.colorData[1][21] = 33;
  res.IDAT.colorData[1][24] = 33;
  res.IDAT.colorData[1][27] = 33;
  idat = res.IDAT.colorData.map((v) => {
    return Buffer.concat([Buffer.from([0x00]), Buffer.from(v).slice(0, 30)])
  })
  idat = idat.reduce((p, n) => {
    return Buffer.concat([p, n])
  })

  zlib.deflate(idat, { level: 9 }, (err2, srcData) => {
    const bufidat = Buffer.from(pngConst.TYPE_IDAT)
    let crc = crc32(Buffer.concat([bufidat, srcData]));


    fs.writeFile('./create_png.png', Buffer.concat([
      res.signature,
      ...res.IHDR.len,
      Buffer.from(pngConst.TYPE_IHDR),
      ...res.IHDR.data,
      ...res.IHDR.crc,
      Buffer.from([0x00, 0x00, 0x00, 0x17]),
      Buffer.from(pngConst.TYPE_IDAT),
      srcData,
      Buffer.from(crc),
      ...res.IEND.len,
      Buffer.from(pngConst.TYPE_IEND),
      ...res.IEND.crc
    ]), () => { })
  })
}