import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'

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
    const readerCanvas = new FileReader();
    reader.readAsBinaryString(target);
    readerCanvas.readAsDataURL(target);

    reader.onload = (file) => {
      console.log('图片的源码：');
      console.log(file.target.result);
      // let image16 = this.toAscii(file.target.result);
      let image = this.toAscii(file.target.result);
      // let image10 = this.filterIHDR(image16.join(' '));
      // console.log(image16);
      ipcRenderer.send('saveImage', image);
    }
    readerCanvas.onload = (file) => {
      imgDom.src = file.target.result;
    }
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
  }
  buildImageByPNGdata() {
    let idat = ipcRenderer.sendSync('getPNGidat');
    console.log(idat);
  }
  toAscii(src) {
    return Array.prototype.map.call(src, (i) => {
      return i.charCodeAt();
    })
  }
  getCrc(src) {
    return ipcRenderer.sendSync('getCRC', src);
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