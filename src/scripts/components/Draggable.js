import React from 'react';
import PropTypes from 'prop-types';

import './Draggable.scss';

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = props.started ? this.prepareMouseMove(props.started) : {
      moving: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.started && prevProps.started !== this.props.started) {
      // Required for switching to other Draggables in ContentMenu when placing
      this.state = this.prepareMouseMove(this.props.started);
    }
  }

  handleMouseDown = (event) => {
    const isExcludedTarget = event.target.classList.contains('loop-back')
      || event.target.classList.contains('content-menu-button');

    if (event.button !== 0 || this.props.disabled || Draggable.inUse || isExcludedTarget) {
      return; // Only handle left click
    }
    this.setState(this.prepareMouseMove({
      startX: event.pageX,
      startY: event.pageY
    }));

    if (this.props.onStarted) {
      this.props.onStarted();
    }
  }

  prepareMouseMove = (element) => {
    // Prevent the multiple draggables on top of each other
    Draggable.inUse = true;

    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('mousemove', this.handleMouseMove);

    return {
      moving: element
    };
  }

  handleMouseMove = (event) => {
    let newState;

    if (!this.state.moving.started) {
      // Element has not started moving yet (might be clicking)

      const threshold = 5; // Only start moving after passing threshold value
      if (event.pageX > this.state.moving.startX + threshold ||
          event.pageX < this.state.moving.startX - threshold ||
          event.pageY > this.state.moving.startY + threshold ||
          event.pageY < this.state.moving.startY - threshold) {
        newState = {
          moving: {
            ...this.state.moving,
            started: true
          },
          offset: this.props.position
        };
        document.body.style.userSelect = 'none'; // Disable text select
      }
      else {
        return; // Not passed threshold value yet
      }
    }

    // Determine if new state has been set already
    newState = newState || {};

    // Use newest offset if possible
    let offset = (newState.offset ? newState.offset : this.state.offset);

    // Scale mouse movement to fit with external scale
    const scale = this.props.scale ? (1 / this.props.scale) : 1;

    // Update element position
    const position = {
      x: ((event.pageX - this.state.moving.startX) * scale) + offset.x,
      y: ((event.pageY - this.state.moving.startY) * scale) + offset.y
    };

    if (this.props.limits) {
      // Enforce limits for the dragging
      this.props.limits(position);
    }

    this.setState(newState);
    if (this.props.onMoved) {
      this.props.onMoved(position);
    }
  }

  handleMouseUp = () => {
    const moved = this.state.moving.started;
    if (moved) {
      this.setState({
        moving: null
      });
      document.body.style.userSelect = ''; // Enable text select again
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);

    Draggable.inUse = false;

    // Trigger stopped event when we're done moving
    if (this.props.onStopped) {
      this.props.onStopped(moved);
    }
  }

  getBoundingClientRect = () => {
    return this.element.getBoundingClientRect();
  }

  render() {
    return (
      <div
        ref={node => this.element = node}
        className={this.props.className}
        onMouseOver={() => {
          if (this.props.draggableMouseOver) {
            this.props.draggableMouseOver(this.props.id);
          }
        }}
        onMouseOut={() => {
          if (this.props.draggableMouseOut) {
            this.props.draggableMouseOut();
          }
        }}
        onMouseDown={this.handleMouseDown}
        style={this.props.style}
      >
        {this.props.children}
      </div>
    );
  }
}

Draggable.propTypes = {
  className: PropTypes.string,
  position: PropTypes.object,
  style: PropTypes.object,
  disabled: PropTypes.bool,
  limits: PropTypes.func,
  onStarted: PropTypes.func,
  onMoved: PropTypes.func,
  onStopped: PropTypes.func,
  id: PropTypes.number,
  draggableMouseOver: PropTypes.func,
  draggableMouseOut: PropTypes.func,
  draggableHovered: PropTypes.number,
};
