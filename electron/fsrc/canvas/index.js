import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'
import { png16 } from '../../png.json';

class Canvas extends Component {
  constructor(params) {
    super(params)
    this.imageData = []
    // this.buildImageByPNGdata()
  }
  data(target) {
    const imgDom = new Image();
    const ctx = this.refs.canvas.getContext('2d');
    const reader = new FileReader();
    reader.readAsBinaryString(target);
    reader.onload = (file) => {
      console.log('图片的源码：');
      console.log(file.target.result);
      let image16 = this.toAscii(file.target.result);
      let image = this.toAscii(file.target.result, 10);
      // imgDom.src = file.target.result;
      // console.log(image);
      let image10 = this.filterIHDR(image16.join(' '));
      console.log(image16);
      ipcRenderer.send('saveImage', image10);
    }
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
  }
  buildImageByPNGdata() {
    let { Signature, IHDR, IDAT, IEND } = png16;
    const str = '73 72 68 82 00 00 00 10 00 00 00 10 08 02 00 00 00';
    const srcIdat = '\x49\x44\x41\x54\x78\xda\x62\xfc\xff\xff\x3f\x03\x6e\xc0\xc4\x80\x17\x8c\x54\x69\x80\x00\x03\x00\xa5\xe3\x03\x11';
    [Signature, IHDR, IDAT, IEND] = this.transformToArray({ Signature, IHDR, IDAT, IEND });
    let { crc10, crc16 } = this.getCrc(str);
    // let idat = this.decompressIDAT({ str: this.toHexadecimal(srcIdat.split(' ')).join(' ') });
    let idat = this.decompressIDAT({ str: srcIdat });
    // console.log(srcIdat);
    // console.log('crc:', crc10, crc16);
    // console.log(this.asciiToString(this.toDecimal(crc)));
    // console.log('idat:', idat);
  }
  transformToArray(para = {}) {
    let res = {}
    let keys = Object.keys(para);
    return keys.map((key) => {
      return para[key].split(' ')
    })
  }
  toAscii(src, index = 16) {
    return Array.prototype.map.call(src, (i) => {
      return i.charCodeAt().toString(index);
    })
  }
  toHexadecimal(vArr) {
    return vArr.map((v) => {
      return (v * 1).toString(16)
    })
  }
  toDecimal(vArr) {
    return vArr.map((v) => {
      return parseInt(v, 16)
    })
  }
  asciiToString(arr) {
    let str = '';
    if (typeof arr === 'string') arr = arr.split(' ')
    arr.forEach((ascii) => {
      str += String.fromCharCode(ascii);
    })
    return str
  }
  getCrc(src) {
    return ipcRenderer.sendSync('getCRC', src);
  }
  decompressIDAT(src) {
    return ipcRenderer.sendSync('getPNGidat', src);
  }
  filterIHDR(str) {
    const srcData = str.split('2 50 58 ea')[0] + '2 50 58 ea 0 0 0 18 49 44 41 54' + str.split('2 50 58 ea')[1].split('0 0 0 18 49 44 41 54')[1]
    return this.toDecimal(srcData.split(' '))
  }

  componentDidMount() {
    ipcRenderer.on('img', (event, imgBuffer) => {
      // console.log('imgBuffer:', imgBuffer);
    })
  }
  componentWillReceiveProps(nextProps) {
    const { target } = nextProps;
    target && this.data(target)
  }
  render() {
    const { cls } = this.props;
    return (
      <div>
        <canvas ref='canvas' className={cls}></canvas>
      </div>
    );
  }
}

export default Canvas;