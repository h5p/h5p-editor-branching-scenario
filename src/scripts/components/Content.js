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

  render() {

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

    return (
      <Draggable
        ref='element'
        className={ elementClass }
        style={ {
          left: this.state.position.x + 'px',
          top: this.state.position.y + 'px',
          width: this.props.width + 'px'
        } }
        scale={ this.props.scale }
        started={ this.props.inserting ? this.props.inserting : null }
        position={ this.state.position }
        onStarted={ this.props.onPlacing }
        onMoved={ position => { this.setState({position: position}); this.props.onMove(); } }
        onStopped={ this.props.onDropped }
      >
        <div className='draggable-wrapper'>
          <div className={ 'draggable-label ' + this.props.contentClass }>
            { this.props.children }
          </div>
          { dropped &&
            <div
              className={ contentMenuButtonClass }
              onClick={ () => {
                this.setState(prevState => {
                  return {
                    contentMenuActive: !prevState.contentMenuActive
                  };
                });
              }}
            />
          }
        </div>
        { this.props.tooltip &&
          <div className="dark-tooltip">
            <div className="dark-text-wrap">{ this.props.tooltip }</div>
          </div>
        }
        { this.state.contentMenuActive &&
          <SubMenu
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
