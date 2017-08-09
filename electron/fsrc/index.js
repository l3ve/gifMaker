import React, { Component } from 'react';
import Canvas from './canvas';

class Index extends Component {
  constructor(params) {
    super(params)
    this.state = {
      objImg: {}
    }
    this.inputChange = this.inputChange.bind(this);
  }
  inputChange() {
    const { files: [file] } = this.refs.fileInput;
    this.setState({
      objImg: file
    });
  }
  render() {
    const { objImg } = this.state;
    return (
      <div>
        <Canvas cls='canvas' target={objImg} />
        <input type="file" ref='fileInput' onChange={this.inputChange} multiple />
      </div >
    );
  }
}

export default Index;
