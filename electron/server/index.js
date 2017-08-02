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
  // console.log(crc16);
  event.returnValue = { crc16 }
})

ipcMain.on('getPNGidat', (event) => {
  let png = new PNG()
  png.readFile('./png.png', (res) => {
    // console.log(res);
    let idat = ''
    // res.IDAT.colorData[1][0] = 33;
    // res.IDAT.colorData[1][3] = 33;
    // res.IDAT.colorData[1][6] = 33;
    // res.IDAT.colorData[1][9] = 33;
    // res.IDAT.colorData[1][12] = 33;
    // res.IDAT.colorData[1][15] = 33;
    // res.IDAT.colorData[1][18] = 33;
    // res.IDAT.colorData[1][21] = 33;
    // res.IDAT.colorData[1][24] = 33;
    // res.IDAT.colorData[1][27] = 33;
    // console.log(res.IDAT.colorData);
    idat = res.IDAT.colorData.map((v) => {
      return Buffer.concat([Buffer.from(pngConst.newLine2)])
    })
    idat[0] = Buffer.from(pngConst.newLine)
    // console.log(idat);
    idat = idat.reduce((p, n) => {
      return Buffer.concat([p, n])
    })
    const sdf = Buffer.from(pngConst.data);
    zlib.inflate(sdf, (err, ress) => {
      // console.log(ress);
      zlib.deflate(ress, (s, f) => {
        console.log(f);
      })
      const bufidat = Buffer.from(pngConst.TYPE_IDAT)
      console.log(sdf);
      let crc = crc32(Buffer.concat([bufidat, sdf]));
      // console.log([res.signature,
      //   ...res.IHDR.len,
      //   Buffer.from(pngConst.TYPE_IHDR),
      //   ...res.IHDR.data,
      //   ...res.IHDR.crc,
      //   ...res.IDAT.len,
      //   Buffer.from(pngConst.TYPE_IDAT),
      //   ress,
      //   crc,
      //   ...res.IEND.len,
      //   Buffer.from(pngConst.TYPE_IEND),
      //   ...res.IEND.crc]);
      fs.writeFile('./create_png.png', Buffer.concat([
        res.signature,
        ...res.IHDR.len,
        Buffer.from(pngConst.TYPE_IHDR),
        ...res.IHDR.data,
        ...res.IHDR.crc,
        ...res.IDAT.len,
        Buffer.from(pngConst.TYPE_IDAT),
        sdf,
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

