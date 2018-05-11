import React from 'react';
import PropTypes from 'prop-types';
import './Draggable.scss';
import SubMenu from './SubMenu.js'

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = props.inserting ? this.prepareMouseMove(props.inserting) : {};
    this.state.position = this.props.position;
    if (props.inserting) {
      this.libraryName = this.props.inserting.target.dataset.libraryName;
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

  overlap(points) {
    const local = this.getPoints();
    return !(points[1].y < local[0].y ||
             points[0].y > local[1].y ||
             points[1].x < local[0].x ||
             points[0].x > local[1].x )
  }

  highlight() {
    this.refs.element.classList.add('highlight');
  }

  dehighlight() {
    this.refs.element.classList.remove('highlight');
  }

  handleMouseUp = (event) => {
    if (this.state.moving.started) {
      this.setState({
        moving: null
      });
      this.props.onDropped();
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  determineOffset(element, x, y) {
    var style = window.getComputedStyle(element);
    if (style.position === 'relative') {
      const raw = element.getBoundingClientRect();
      return {
        x: raw.left,
        y: raw.top
      };
    }
    else if (element.parentElement) {
      return this.determineOffset(element.parentElement);
    }
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
            started: true
          },
          offset: this.determineOffset(this.refs.element.parentElement, event.pageX, event.pageY)
        };

        // Compensate for mouse position on element
        newState.offset.x += event.pageX - this.props.position.x - newState.offset.x;
        newState.offset.y += event.pageY - this.props.position.y - newState.offset.y;
      }
      else {
        return; // Not passed threshold value yet
      }
    }

    // Determine if new state has been set already
    newState = newState || {};

    // Use newest offset if possible
    let offset = (newState.offset ? newState.offset : this.state.offset);

    // Update element position
    newState.position = {
      x: event.pageX - offset.x,
      y: event.pageY - offset.y
    };

    this.setState(newState);
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

    // TODO: Show tooltip on hover
    const draggableToolTip = this.state.showToolTip ? (
      <div className='draggable-tooltip'/>
    ) : '';

    const contentMenu = this.state.contentMenuActive ?
      (
        <SubMenu
          preview={ () => {console.log('previewing');}}
          edit={ () => {console.log('editing');}}
          delete={ () => {console.log('deleting');}}
        />
      ) : '';

    // Determine element class depending on state
    let elementClass = 'draggable';
    let contentMenuButtonClass = 'content-menu-button';
    if (this.state.moving) {
      elementClass += ' selected';

      if (this.state.moving.started) {
        elementClass += ' dragging';
      }
    }

    return (
      <div
        ref={ 'element' }
        style={ draggableStyle }
        onMouseDown={ this.handleMouseDown }
        onMouseLeave={ () => {this.setState({showToolTip: false});}}
        className={ elementClass }>
        { draggableToolTip }
        <div className='draggable-wrapper'>
          <div className='draggable-label'
          >
            { this.props.children }
          </div>
          <div className={ contentMenuButtonClass }
            onMouseDown={() => {
              this.setState(prevState => {
                return {
                  contentMenuActive: !prevState.contentMenuActive
                };
              });
            }}
          />
        </div>
        { contentMenu }
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
