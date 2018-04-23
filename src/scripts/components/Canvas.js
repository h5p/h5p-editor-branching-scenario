import React from 'react';
import './Canvas.scss';

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

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.dragging === true && this.props.dragging == false) {
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

    return ( 
       <li 
        style={
          {
            top: this.props.posY + 'px',
            left: this.props.posX + 'px', 
            width: this.props.draggable.width + 'px'
          }
        } 
        className={ ['draggable', this.props.draggable.contentClass].join(' ') }>
          Video
        </li> 
     );
  }

  addDraggableToDropped(xPos, yPos) {
    const newDraggable = (  
       <li
         key = { Math.random() * 100 } 
         style={
           {
             top: yPos/2 + 'px', //TODO Fix offset 
             left: xPos + 'px',   
             width: this.props.draggable.width + 'px'
           }
         } 
         className={ ['draggable'].join(' ') }>
         Video
      </li>
    )

    this.setState(prevState => {
      return {
        droppedDraggables: [...prevState.droppedDraggables, newDraggable] 
      }
    })
  }

  render() {
    return (
      <div className="canvas">
        { this.renderActiveDraggable() } 
        { this.state.droppedDraggables } 
        <div className="start-canvas">
          <div 
            className="droppable"
            ref={ "droppable" }  
           />
        </div>
      </div>
    )
  }
}
