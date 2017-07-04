import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'
import { png16 } from '../../png.json';

class Canvas extends Component {
  constructor(params) {
    super(params)
    this.imageData = []
    this.buildImageByPNGdata()
  }
  data(target) {
    const imgDom = new Image();
    const ctx = this.refs.canvas.getContext('2d');
    const reader = new FileReader();
    reader.readAsBinaryString(target);
    reader.onload = (file) => {
      console.log('图片的源码：');
      console.log(file.target.result);
      let image = this.toAscii(file.target.result);
      // imgDom.src = file.target.result;
      image = this.filterIHDR(image.join(' '));
      console.log(image);
      ipcRenderer.send('imgToSteam', image);
    }
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
  }
  buildImageByPNGdata() {
    let { Signature, IHDR, IDAT, IEND } = png16;
    [Signature, IHDR, IDAT, IEND] = this.transformToArray({ Signature, IHDR, IDAT, IEND });
    // console.log(Signature, IHDR, IDAT, IEND);
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
  hexadecimalToDecimal(vArr) {
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
  filterIHDR(str) {
    const srcData = str.split('2 50 58 ea')[0] + '2 50 58 ea 0 0 0 18 49 44 41 54' + str.split('2 50 58 ea')[1].split('0 0 0 18 49 44 41 54')[1]
    return this.hexadecimalToDecimal(srcData.split(' '))
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