import React from 'react';
import PropTypes from 'prop-types';

import './Content.scss';
import Draggable from './Draggable.js';
import SubMenu from './SubMenu.js';

export default class Content extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      position: props.position,
      contentMenuActive: false
    };

    if (props.inserting) {
      this.libraryName = this.props.inserting.target.dataset.libraryName;
    }
  }

  componentWillReceiveProps = (nextProps) => {
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

  getPoints = () => {
    const raw = this.refs.element.getBoundingClientRect();
    return [{
      x: raw.x,
      y: raw.y
    }, {
      x: raw.x + raw.width,
      y: raw.y + raw.height
    }];
  }

  overlap = (points) => {
    const local = this.getPoints();
    return !(points[1].y < local[0].y ||
      points[0].y > local[1].y ||
      points[1].x < local[0].x ||
      points[0].x > local[1].x );
  }

  highlight() {
    this.refs.element.refs.element.classList.add('highlight');
  }

  dehighlight() {
    this.refs.element.refs.element.classList.remove('highlight');
  }

  /**
   * Get content class name.
   *
   * @return {string} Content class name.
   */
  getContentClass = () => {
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
  intersection = (edges) => {
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

  handleStarted = () => {
    this.setState({
      selected: true
    });

    this.props.onPlacing();
  }

  handleMoved = (position) => {
    this.props.onMove(position);
    this.setState({
      position: position,
      moving: true
    });
  }

  handleStopped = (moved) => {
    this.setState({
      selected: false,
      moving: false
    });

    if (moved) {
      this.props.onDropped();
    }
  }

  handleMenuButtonClick = () => {
    if (!this.state.contentMenuActive) {
      this.setState({
        contentMenuActive: true
      });
      document.addEventListener('click', this.handleDocumentClick);
    }
  }

  handleDocumentClick = (event) => {
    if (event.button !== 0 || event.defaultPrevented) {
      return; // Only handle left click
    }

    // Close
    this.setState({
      contentMenuActive: false
    });

    document.removeEventListener('click', this.handleDocumentClick);
  }

  handlePreview = () => {
    // Postponed
  }

  handleEdit = () => {
    this.props.onEditContent(this.props.id);
  }

  handleCopy = () => {
    this.props.onCopyContent(this.props.id);
  }

  handleDelete = () => {
    this.props.onDeleteContent(this.props.id);
  }

  render() {

    // Determine element class depending on state
    let elementClass = this.props.contentClass + ' draggable';
    if (this.state.selected) {
      elementClass += ' selected';

      if (this.state.moving) {
        elementClass += ' dragging';
        elementClass += ' active';
      }
    }
    if (!this.state.moving && !this.props.inserting) {
      // Prevent showing menu button
      elementClass += ' ready';
    }

    let contentMenuButtonClass = 'content-menu-button';
    if (this.state.contentMenuActive) {
      elementClass += ' active';
      contentMenuButtonClass += ' active';
    }

    if (this.props.fade) {
      elementClass += ' fade';
    }

    return (
      <Draggable
        ref='element'
        className={ elementClass }
        style={ {
          left: this.state.position.x + 'px',
          top: this.state.position.y + 'px',
          width: this.props.width + 'px',
          transform: (this.props.inserting && this.state.moving ? 'scale(' + this.props.scale + ',' + this.props.scale + ')' : '')
        } }
        scale={ this.props.inserting && this.state.moving ? 1 : this.props.scale }
        started={ this.props.inserting ? this.props.inserting : null }
        position={ this.state.position }
        onStarted={ this.handleStarted }
        onMoved={ this.handleMoved }
        onStopped={ this.handleStopped }
      >
        <div className='draggable-wrapper'>
          <div className={ 'draggable-label ' + this.props.contentClass }>
            { this.props.children }
          </div>
          <div
            className={ contentMenuButtonClass }
            onClick={ this.handleMenuButtonClick }
          />
        </div>
        { this.props.tooltip &&
          <div className="dark-tooltip">
            <div className="dark-text-wrap">{ this.props.tooltip }</div>
          </div>
        }
        { this.state.contentMenuActive &&
          <SubMenu
            onPreview={ this.handlePreview }
            onEdit={ this.handleEdit }
            onCopy={ this.handleCopy }
            onDelete={ this.handleDelete }
          />
        }
      </Draggable>
    );
  }
}

Content.propTypes = {
  width: PropTypes.number,
  contentClass: PropTypes.string,
  content: PropTypes.string,
  inserting: PropTypes.object,
  fade: PropTypes.bool,
  scale: PropTypes.number
};
