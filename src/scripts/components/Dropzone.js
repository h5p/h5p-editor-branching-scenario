import React from 'react';
import './Dropzone.scss';

export default class Dropzone extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dropzone: undefined
    };

    this.dropElement = React.createRef();
  }

  componentDidUpdate() {
    this.props.handleEntered(this.isInDropZone(this.props.mouseX, this.props.mouseY));
  }

  isInDropZone = (mouseX, mouseY) => {
    if (this.state.dropzone == undefined) {
      return false; 
    }

    const xStart = this.state.dropzone.x;
    const xEnd = this.state.dropzone.x + this.state.dropzone.width;

    const yStart = this.state.dropzone.y;
    const yEnd = this.state.dropzone.y + this.state.dropzone.height;
    
    const res = (mouseX > xStart && mouseX < xEnd && 
            mouseY > yStart && mouseY < yEnd);

    return res;
  }

  render() {
    return (
      <div 
        className="dropzone"
        style={ 
          { 
            top: this.props.posY + 'px',
            left: this.props.posX + 'px'
          }
        }
        ref={ node => {
          if (node !== null && this.state.dropzone == undefined) {
            this.setState({
              dropzone: node.getBoundingClientRect()
            }); 
          }         
        }} 
      />
    );
  }
}
