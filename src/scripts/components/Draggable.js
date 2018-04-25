import React from 'react';
import PropTypes from 'prop-types';
import './Draggable.scss';

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    const draggableStyle = {
      top: this.props.yPos + 'px', //TODO Fix offset, snap to?
      left: this.props.xPos + 'px',   
      width: this.props.width + 'px'
    };

    return (
      <li
        style={ draggableStyle } 
        className={ ['draggable', this.props.contentClass].join(' ') }>
        { this.props.content } 
      </li>
    );
  }
}

Draggable.propTypes = {
  yPos: PropTypes.number,
  xPos: PropTypes.number,
  width: PropTypes.number,
  contentClass: PropTypes.string,
  content: PropTypes.string
};
