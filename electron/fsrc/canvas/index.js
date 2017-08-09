import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'

const imgSrc = 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAF0lEQVR42mP4jxcwKP7/jwcxENA9XKUBA/AiOBYNaxEAAAAASUVORK5CYII='
class Canvas extends Component {
  constructor(params) {
    super(params)
    this.imageData = []
    // this.buildImage()
  }
  data(target) {
    const imgDom = new Image();
    const ctx = this.refs.canvas.getContext('2d');
    const reader = new FileReader();
    const readerCanvas = new FileReader();
    reader.readAsBinaryString(target);
    readerCanvas.readAsDataURL(target);

    // 把图片变成文件原生二进制格式，发送给后端node处理
    reader.onload = (file) => {
      // 发送前，前端看看图片是数据
      console.log(file.target);
      console.log('图片的源码：');
      // console.log(file.target.result);
      // console.log(file);
      let image = this.toUnicode(file.target.result);
      ipcRenderer.send('compress', image);
    }

    // 把图片变成 base64，渲染到 canvas里
    readerCanvas.onload = (file) => {
      imgDom.src = file.target.result;
    }
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
  }
  buildImage() {
    let idat = ipcRenderer.sendSync('getPNGidat');
    console.log(idat);
  }
  toUnicode(src) {
    return Array.prototype.map.call(src, (i) => {
      return i.charCodeAt();
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
        <img src={'data:img/png;base64,' + imgSrc} alt="" />
      </div>
    );
  }
}

export default Canvas;