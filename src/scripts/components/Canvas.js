import React from 'react';
import './Canvas.scss';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {
  }

  createDraggable() {
    const draggable = this.props.draggable;
    const draggableStyle = {
      top: this.props.mouseY + 'px',   
      left: this.props.mouseX + 'px',
      width: draggable.width
    }

    return ( <li style={ draggableStyle } className={ ['draggable', draggable.contentClass].join(' ') }>Video</li> );
  }

  render() {
    const draggable = this.props.dragging ? this.createDraggable() : '';
    console.log(this.props.dragging)

    return (
      <div className="canvas">
        <h1>Hi</h1>
        { draggable } 
      </div>
    )
  }
}
