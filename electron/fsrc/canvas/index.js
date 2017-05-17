import React, { Component } from 'react';
import './style.styl'

class Canvas extends Component {
  constructor(params) {
    super(params)
  }
  data(target) {
    const imgDom = new Image();
    const ctx = this.refs.canvas.getContext('2d');
    imgDom.onload = () => {
      ctx.drawImage(imgDom, 0, 0);
    }
    imgDom.src = URL.createObjectURL(target);
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