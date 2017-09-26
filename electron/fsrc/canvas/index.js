import React, { Component } from 'react'
import { ipcRenderer } from 'electron'
import './style.styl'

class Canvas extends Component {
  constructor(params) {
    super(params)
    this.state = {
      video: {}
    }
    this.width = 333
    this.i = 0
  }
  componentDidMount() {
    const { video } = this.refs
    video.addEventListener('playing', (res) => {
      this.loop()
    })
  }
  componentWillReceiveProps(nextProps) {
    const { target } = nextProps;
    const videoDom = this.refs.video;
    videoDom.src = target.path
    videoDom.addEventListener('loadedmetadata', (res) => {
      this.setState({
        video: target,
        width: this.width,
        height: (res.target.clientHeight / res.target.clientWidth) * this.width
      });
    })
  }
  loop = () => {
    const { width, height } = this.state
    this.refs.canvas.getContext('2d').drawImage(this.refs.video, 0, 0, width, height);
    this.i = requestAnimationFrame(this.loop);
  }
  computeFrame() {
    this.ctx1.drawImage(this.video, 0, 0, this.width, this.height);
    let frame = this.ctx1.getImageData(0, 0, this.width, this.height);
    let l = frame.data.length / 4;

    for (let i = 0; i < l; i += 1) {
      let r = frame.data[(i * 4) + 0];
      let g = frame.data[(i * 4) + 1];
      let b = frame.data[(i * 4) + 2];
      if (g > 100 && r > 100 && b < 43) { frame.data[(i * 4) + 3] = 0; }
    }
    this.ctx2.putImageData(frame, 0, 0);
  }
  render() {
    const { cls } = this.props;
    const { width, height } = this.state;
    return (
      <div>
        <video width={width} autoPlay ref='video'></video>
        <canvas width={width} height={height} ref='canvas' className='canvas'></canvas>
      </div>
    );
  }
}

export default Canvas;