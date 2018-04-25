import React from 'react';
import PropTypes from 'prop-types';
import './Canvas.scss';
import Draggable from './Draggable.js';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dropzoneArea: {},
      droppedDraggables: []
    };
  }

  componentDidMount() {
    this.setState({
      dropzone: this.refs.droppable.getBoundingClientRect()
    }); 
  }

  componentDidUpdate(prevProps) {
    if (prevProps.dragging === true && this.props.dragging == false) {
      if (this.isInDropZone()) {
        this.addDraggableToDropped(this.props.mouseX, this.props.mouseY);
      }
    }

    if (prevProps.active === true && this.props.active === false) {
      if (this.isInDropZone()) {
        this.addDraggableToDropped(this.props.mouseX, this.props.mouseY);
      }
    }
  }

  isInDropZone() {
    const dz = this.state.dropzone;

    const xStart = dz.x;
    const xEnd = dz.x + dz.width;

    const yStart = dz.y;
    const yEnd = dz.y + dz.height;

    const mX = this.props.mouseX;
    const mY = this.props.mouseY;

    return (mX > xStart && mX < xEnd && mY > yStart && mY < yEnd);
  }

  renderActiveDraggable() {
    if (!this.props.dragging || !this.props.draggable) {
      return '';
    }

    const draggableData = this.props.draggable;

    return ( 
      <Draggable
        yPos={ this.props.mouseY - 65}
        xPos={ this.props.posX }
        width={ draggableData.width } 
        contentClass={ draggableData.contentClass }
        content={ draggableData.content } 
      />
    );
  }

  addDraggableToDropped(xPos, yPos) {
    const draggableData = this.props.draggable;

    const newDraggable = (  
      <Draggable
        key={ Math.random() } 
        xPos={ xPos - 60 } 
        yPos={ yPos - 65 }
        width={ draggableData.width } 
        contentClass={ draggableData.contentClass }
        content={ draggableData.content } 
      />
    );

    this.setState(prevState => {
      return {
        droppedDraggables: [...prevState.droppedDraggables, newDraggable] 
      };
    });
  }

  render() {
    return (
      <div className="canvas"
        onMouseDown= { this.props.onMouseDown } 
      >
        { this.renderActiveDraggable() } 
        { this.state.droppedDraggables } 
        <div className="start-canvas">
          <div 
            className="droppable"
            ref={ "droppable" }  
          />
        </div>
      </div>
    );
  }
}

Canvas.propTypes = {
  clicked: PropTypes.bool,
  draggable: PropTypes.object,
  dragging: PropTypes.bool,
  mouseX: PropTypes.number,
  mouseY: PropTypes.number,
  posX: PropTypes.number,
  poxY: PropTypes.number,
  width: PropTypes.number
};
