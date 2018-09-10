import React from 'react';
import PropTypes from 'prop-types';
import './Draggable.scss';
import SubMenu from './SubMenu.js';

export default class Draggable extends React.Component {
  constructor(props) {
    super(props);

    this.state = props.inserting ? this.prepareMouseMove(props.inserting) : {};
    this.state.position = this.props.position;
    this.state.contentMenuActive = false;

    if (props.inserting) {
      this.libraryName = this.props.inserting.target.dataset.libraryName;
    }
    this.contentMenu = React.createRef();
    this.contentMenuButton = React.createRef();
  }

  componentDidMount = () => {
    window.addEventListener('mousedown', this.handleWindowMouseDown, false);
  }

  componentWillUnmount = () => {
    window.removeEventListener('mousedown', this.handleWindowMouseDown, false);
  }

  handleWindowMouseDown = (e) => {
    if (e.target === this.contentMenuButton.current ||
      e.target.className === 'edit-content' ||
      e.target.className === 'copy-content' ||
      e.target.className === 'delete-content'
    ) {
      return;
    }

    this.setState({
      contentMenuActive: false
    });
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
    }];
  }

  overlap(points) {
    const local = this.getPoints();
    return !(points[1].y < local[0].y ||
      points[0].y > local[1].y ||
      points[1].x < local[0].x ||
      points[0].x > local[1].x );
  }

  /**
   * Get content class name.
   *
   * @return {string} Content class name.
   */
  getContentClass() {
    return this.props.contentClass;
  }

  /**
   * Get intersecting area.
   *
   * @param {object[]} edges Edges of other item: [0] = upper left corner, [1] = lower right corner
   * @param {float} edges.x X coordinate.
   * @param {float} edges.y Y coordinate.
   * @param {float} Intersection area.
   */
  intersection(edges) {
    const local = this.getPoints();

    const intersectionX = Math.min(local[1].x, edges[1].x) - Math.max(local[0].x, edges[0].x);
    if (intersectionX <= 0) {
      return 0;
    }

    const intersectionY = Math.min(local[1].y, edges[1].y) - Math.max(local[0].y, edges[0].y);
    if (intersectionY <= 0) {
      return 0;
    }

    return intersectionX * intersectionY;
  }

  highlight() {
    this.refs.element.classList.add('highlight');
  }

  dehighlight() {
    this.refs.element.classList.remove('highlight');
  }

  handleMouseUp = () => {
    if (this.state.moving.started) {
      this.setState({
        moving: null
      });
      this.props.onDropped();
    }
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
  }

  determineOffset(element) {
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
//    (1/this.props.scale)

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
    if (event.button !== 0 || this.props.disabled) {
      return; // Only handle left click
    }

    this.setState(this.prepareMouseMove({
      startX: event.pageX,
      startY: event.pageY
    }));

    if (event.target !== this.contentMenuButton.current && this.state.contentMenuActive === false) {
      this.props.onPlacing();
    }
    event.preventDefault();
  }

  render() {
    const draggableStyle = {
      left: this.state.position.x + 'px',
      top: this.state.position.y + 'px',
      width: this.props.width + 'px'
    };

    const draggableToolTip = this.state.showToolTip ? (
      <div className='draggable-tooltip'/>
    ) : '';

    // Determine element class depending on state
    let elementClass = this.props.contentClass + ' draggable';
    let dropped = true;
    if (this.state.moving) {
      elementClass += ' selected';

      if (this.state.moving.started) {
        elementClass += ' dragging';
        elementClass += ' active';
        dropped = false;
      }
    }

    let contentMenuButtonClass = 'content-menu-button';
    if (this.state.contentMenuActive) {
      elementClass += ' active';
      contentMenuButtonClass += ' active';
    }

    if (this.props.fade) {
      elementClass += ' fade';
    }

    const contentMenuButton = dropped ? (
      <div
        ref={ this.contentMenuButton }
        className={ contentMenuButtonClass }
        onMouseDown={() => {
          this.setState(prevState => {
            return {
              contentMenuActive: !prevState.contentMenuActive
            };
          });
        }}
      />
    ) : '';

    const contentMenu = this.state.contentMenuActive ? (
      <SubMenu
        ref={ this.contentMenu }
        onPreview={ () => {
          this.setState({contentMenuActive: false});
        }}
        onEdit={ () => {
          this.setState({contentMenuActive: false});
          this.props.onEditContent(this.props.id);
        }}
        onCopy={ () => {
          this.setState({contentMenuActive: false});
          this.props.onCopyContent(this.props.id);
        }}
        onDelete={ () => {
          this.setState({contentMenuActive: false});
          this.props.onDeleteContent(this.props.id);
        }}
      />
    ) : '';

    return (
      <div
        ref={ 'element' }
        style={ draggableStyle }
        onMouseDown={ this.handleMouseDown }
        onMouseLeave={ () => {this.setState({showToolTip: false});}}
        className={ elementClass }>
        { draggableToolTip }
        <div className='draggable-wrapper'>
          <div className={ 'draggable-label ' + this.props.contentClass }>
            { this.props.children }
          </div>
          { contentMenuButton }
        </div>
        { this.props.tooltip &&
          <div className="dark-tooltip">
            <div className="dark-text-wrap">{ this.props.tooltip }</div>
          </div>
        }
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
  inserting: PropTypes.object,
  fade: PropTypes.bool,
  scale: PropTypes.number
};
