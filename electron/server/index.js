const { ipcMain } = require('electron');
const fs = require('fs');
const { crc32 } = require('./tool');
const getPixels = require('get-pixels');
const pngConst = require('./png/const');
const zlib = require('zlib')

const PNG = require('./png')
let times = 0;
ipcMain.on('getCRC', (event, str) => {
  let str16 = str.split(' ').map((v) => {
    // 根据unicode值 转换为字符串
    return String.fromCharCode(v)
  }).join('')
  // crc 接受的是unicode字符串
  let crc16 = crc32(str16);
  event.returnValue = { crc16 }
})

ipcMain.on('getPNGidat', (event) => {
  let png = new PNG()
  png.readFile('./png.png', (res) => {
    console.log(res);
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
    event.returnValue = res
  })
})

ipcMain.on('saveImage', (event, file) => {
  let buf = Buffer.from(file);
  var png = new PNG()
  png.readFile(buf, (res) => {

  })
  png.saveMin(`./min${times += 1}.png`)
})
