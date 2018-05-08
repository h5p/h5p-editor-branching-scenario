import React from 'react';
import PropTypes from 'prop-types';
import './Draggable.scss';

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);

    if (props.inserting) {
      this.state = this.prepareMouseMove(props.inserting);
      this.state.position = {x: -200, y: -200}; // TODO: Improve
      this.libraryName = this.props.inserting.target.dataset.libraryName;
    }
    else {
      this.state = {
        position: this.props.position
      };
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.position && (
        nextProps.position.x !== this.state.position.x ||
        nextProps.position.y !== this.state.position.y)) {
      this.setState({
        position: {
          x: nextProps.position.x,
          y: nextProps.position.y
        }
      });
    }
  }

  getPoints() {
    const raw = this.refs.element.getBoundingClientRect();
    return [{
      x: raw.x,
      y: raw.y
    }, {
      x: raw.x + raw.width,
      y: raw.y + raw.height
    }]
  }

  handleMouseUp = (event) => {
    if (this.state.moving.started) {
      this.setState({
        moving: null,
        position: {
          x: event.pageX,
          y: event.pageY
        }
      });
      this.props.onDropped();
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove = (event) => {
    if (!this.state.moving.started) {
      // Element has not started moving yet (might be clicking)

      const threshold = 5; // Only start moving after passing threshold value
      if (event.pageX > this.state.moving.startX + threshold ||
          event.pageX < this.state.moving.startX - threshold ||
          event.pageY > this.state.moving.startY + threshold ||
          event.pageY < this.state.moving.startY - threshold) {
        this.state.moving.started = true;
        //this.setState({}); TODO
      }
      else {
        return; // Not passed threshold value yet
      }
    }

    // Update element position
    this.setState({
      position: {
        x: event.pageX,
        y: event.pageY
      }
    });
    this.props.onMove();
  }

  prepareMouseMove = (element) => {
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    return {
      moving: element
    };
  }

  handleMouseDown = (event) => {
    if (event.button !== 0) {
      return; // Only handle left click
    }

    this.setState(this.prepareMouseMove({
      target: event.currentTarget,
      startX: event.pageX,
      startY: event.pageY
    }));
    this.props.onPlacing();

    event.stopPropagation();
    event.preventDefault();
  }

  render() {
    const draggableStyle = {
      left: this.state.position.x + 'px',
      top: this.state.position.y + 'px',
      width: this.props.width + 'px'
    };

    // Determine element class depending on state
    let elementClass = 'draggable';
    if (this.state.moving) {
      elementClass += ' selected';

      if (this.state.moving.started) {
        elementClass += ' dragging';
      }
    }

    // TODO: Fix <li> inside <div> not really allowed
    return (
      <div>
        <li
          ref={ 'element' }
          onMouseDown={ this.handleMouseDown }
          style={ draggableStyle }
          className={ elementClass }>
          { this.props.children }
        </li>
      </div>
    );
  }
}


Draggable.propTypes = {
  yPos: PropTypes.number,
  xPos: PropTypes.number,
  width: PropTypes.number,
  contentClass: PropTypes.string,
  content: PropTypes.string,
  inserting: PropTypes.object
};
