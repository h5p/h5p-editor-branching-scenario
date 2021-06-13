import React from 'react';
import PropTypes from 'prop-types';

import './Content.scss';
import Draggable from './Draggable.js';
import SubMenu from './SubMenu.js';

export default class Content extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contentMenuActive: false
    };

    if (props.inserting) {
      this.libraryName = this.props.inserting.target.dataset.libraryName;
    }
  }

  /**
   * Determines a useful tooltip for the content
   * @param {Object} content
   * @param {boolean} [forceLibraryTitle] Setting this will try to get library title as specified in library json
   * @return {string}
   */
  static getTooltip(content, forceLibraryTitle) {
    const lib = content.params.type.library;
    const machineName = content.params.type.library.split(' ')[0];
    const libraryMetadata = H5PEditor.LibraryListCache.libraryCache[lib];
    let fallbackTip = libraryMetadata && libraryMetadata.title ? libraryMetadata.title : '';

    if (!fallbackTip) {
      fallbackTip = machineName.replace('H5P.', '');
    }

    // Allow force getting library title
    if (forceLibraryTitle) {
      return fallbackTip;
    }

    let html;
    const params = content.params.type.params;
    switch (machineName) {
      case 'H5P.AdvancedText':
        if (params.text) {
          html = Content.stripHTML(params.text);
        }
        if (html === undefined && content.params.type.metadata) {
          html = content.params.type.metadata.title;
        }
        return (html !== undefined ? html : fallbackTip);

      case 'H5P.BranchingQuestion':
        return (params.branchingQuestion
          && params.branchingQuestion.question
          && params.branchingQuestion.question.trim().length > 0)
          ? Content.stripHTML(params.branchingQuestion.question)
          : (
            (content.params.type.metadata
            && content.params.type.metadata.title
            && content.params.type.metadata.title.trim().length > 0)
              ? content.params.type.metadata.title
              : fallbackTip
          );

      default:
        return (content.params.type.metadata && content.params.type.metadata.title)
          ? Content.stripHTML(content.params.type.metadata.title)
          : fallbackTip;
    }
  }

  /**
   * Removes any HTML from the given string.
   * @return {string}
   */
  static stripHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  getPoints = () => {
    const raw = this.element.getBoundingClientRect();
    return [{
      x: raw.left,
      y: raw.top
    }, {
      x: raw.left + raw.width,
      y: raw.top + raw.height
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
    if (!this.props.disabled) {
      this.element.element.classList.add('highlight');
      this.props.onHighlight();
    }
  }

  dehighlight() {
    this.element.element.classList.remove('highlight');
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

  handleMoved = (position) => {
    this.setState({
      temporaryPosition: position,
    }, this.props.onMove);
  }

  handleStopped = (moved) => {
    if (moved) {
      this.props.onDropped();
    }

    if (this.element) {
      // Reset if component is still visible
      this.setState({
        temporaryPosition: null
      });
    }
  }

  handleMenuButtonClick = () => {
    if (!this.state.contentMenuActive) {
      this.setState({
        contentMenuActive: true
      });
      document.addEventListener('click', this.handleDocumentClick);
    }
    this.props.onDropped(); // Prevent placing after clicking button
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

  handleSubMenuAction = (action) => {
    this.props[action]();
    this.props.onDropped(); // Prevent placing after clicking button
    this.props.draggableMouseOut();
  }

  render() {

    // Use temporary position when dragging, props is the static place in the tree
    const moving = (this.state.temporaryPosition ? true : false);
    const position = (this.state.temporaryPosition ? this.state.temporaryPosition : this.props.position);
    
    // Determine element class depending on state
    let elementClass = this.props.contentClass + ' draggable';
    if (this.props.selected) {
      elementClass += ' selected';

      if (moving) {
        elementClass += ' dragging';
        elementClass += ' active';
      }
    }
    if (!moving && !this.props.inserting) {
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

    if (this.props.hasCustomEndScreen) {
      elementClass += ' endscreenCustom';
    }

    if (!this.props.disabled) {
      elementClass += ' not-disabled';
    }

    if (this.props.draggableHovered !== null
      && this.props.draggableHovered === this.props.id) {
      elementClass += ' hovered';
    }

    return (
      <Draggable
        id={this.props.id}
        ref={ node => this.element = node }
        className={ elementClass }
        style={ {
          left: position.x + 'px',
          top: position.y + 'px',
          width: this.props.width + 'px',
          transform: (this.props.inserting && moving ? 'scale(' + this.props.scale + ',' + this.props.scale + ')' : '')
        } }
        scale={ this.props.inserting && moving ? 1 : this.props.scale }
        started={ this.props.inserting ? this.props.inserting : null }
        position={ position }
        draggableMouseOver={this.props.draggableMouseOver}
        draggableMouseOut={this.props.draggableMouseOut}
        draggableHovered={this.props.draggableHovered}
        onStarted={ this.props.onPlacing }
        onMoved={ this.handleMoved }
        onStopped={ this.handleStopped }
        disabled={ this.props.disabled }
      >
        <div
          className='draggable-wrapper'
          onDoubleClick={ this.props.onEdit }
        >
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
            isContent={ this.props.contentClass !== 'branchingquestion' }
            onEdit={ () => this.handleSubMenuAction('onEdit') }
            onPreview={ () => this.handleSubMenuAction('onPreview') }
            onCopy={ () => this.handleSubMenuAction('onCopy') }
            onDelete={ () => { this.props.onDelete(); this.props.draggableMouseOut(); } }
          />
        }
        {
          this.props.hasLoopBack &&
          <div
            className='loop-back'
            onClick={() => this.props.highlightLinkedContent()}
          />
        }
        { !this.props.disabled &&
          <div className='dropzone-wrapper'/>
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
  scale: PropTypes.number,
  draggableMouseOver: PropTypes.func,
  draggableMouseOut: PropTypes.func,
  draggableHovered: PropTypes.number
};
