import React from 'react';
import PropTypes from 'prop-types';
import './Draggable.scss';

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);
  }

  handleMouseDown = (e) => {
    const positionData = this.refs['listItem'].getBoundingClientRect();

    const mouseDownData = {
      id: this.props.id,
      contentClass: e.currentTarget.className,
      content: e.currentTarget.innerHTML,
      xPos: positionData.width/2,
      yPos: positionData.y,
      width: positionData.width,
      height: positionData.height,
      top: positionData.top
    };

    this.props.handleMouseDown(e, mouseDownData);
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    const draggableStyle = {
      top: this.props.yPos + 'px', //TODO Fix offset, snap to?
      left: this.props.xPos + 'px',   
      width: this.props.width + 'px'
    };

    if (this.props.dropped) {
      return (
        <div>
          <li
            ref= { 'listItem' } 
            onMouseDown={ e => this.handleMouseDown(e) }
            style={ draggableStyle } 
            className={ ['draggable', this.props.contentClass].join(' ') }>
            { this.props.content } 
          </li>
        </div> 
      );
    }
    else {
      return (
        <li
          style={ draggableStyle } 
          className={ ['draggable', this.props.contentClass].join(' ') }>
          { this.props.content } 
        </li>
      );
    }
  }
}

Draggable.propTypes = {
  yPos: PropTypes.number,
  xPos: PropTypes.number,
  width: PropTypes.number,
  contentClass: PropTypes.string,
  content: PropTypes.string
};
