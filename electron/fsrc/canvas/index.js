import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'

class Canvas extends Component {
  constructor(params) {
    super(params)
  }
  data(target) {
    const imgDom = new Image();
    const ctx = this.refs.canvas.getContext('2d');
    const reader = new FileReader();
    // reader.readAsDataURL(target);
    // reader.readAsArrayBuffer(target);
    reader.readAsBinaryString(target);
    reader.onload = (file) => {
      console.log(file.target.result);
      // imgDom.src = file.target.result;
      // ipcRenderer.send('imgToSteam', file.target.result);
    }
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
  }
  componentDidMount() {
    ipcRenderer.on('img', (event, imgBuffer) => {
      console.log(imgBuffer);
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