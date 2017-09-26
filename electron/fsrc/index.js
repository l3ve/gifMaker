import React, { Component } from 'react';
import Canvas from './canvas';

class Index extends Component {
  constructor(params) {
    super(params)
    this.state = {
      video: {}
    }
    this.inputChange = this.inputChange.bind(this);
  }
  inputChange() {
    const { files: [file] } = this.refs.fileInput;
    this.setState({
      video: file
    });
  }
  render() {
    const { video } = this.state;
    return (
      <div>
        <Canvas cls='canvas' target={video} />
        <input type="file" ref='fileInput' onChange={this.inputChange} multiple />
      </div>
    );
  }
}

export default Index;