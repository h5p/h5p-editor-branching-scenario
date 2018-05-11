import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);
  }

  handleMouseDown = (event, library) => {
    if (event.button !== 0) {
      return; // Only handle left click
    }

    const raw = event.currentTarget.getBoundingClientRect();
    this.props.onMouseDown({
      target: event.target,
      startX: event.pageX,
      startY: event.pageY,
      position: {
        x: raw.left - 1,
        y: raw.top - 58 // TODO: Determine where offset comes from
      },
      library: library
    });

    event.stopPropagation();
    event.preventDefault();
  }

  renderDnDButtons() {
    if (!this.props.libraries) {
      return (
        <div className="loading">Loading…</div>
      );
    }

    let listItems = this.props.libraries.map(library => {

      if (library.title === 'Branching Question') {
        return '';
      }

      // TODO: Temporarily excluded, because of crashing the editor for some reason
      if (library.title === 'Course Presentation') {
        return '';
      }

      let className = library.title.replace(/\s/g, '');
      if (this.props.inserting && this.props.inserting.library === library) {
        className += ' greyout';
      }

      return <li
        key={ Math.random() }
        className={ className }
        onMouseDown={ event => this.handleMouseDown(event, library) }
      >
        { library.title }
      </li>;
    });

    return (
      <ul className="content-type-buttons">
        { listItems }
      </ul>
    );
  }

  render() {
    return (
      <div className="content-type-menu">
        <label className="label-info">
      Info Content
          <Tooltip>
      Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
        { this.renderDnDButtons() }
        <label className="label-info">
      Branching Content
          <Tooltip>
      Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
        <ul className="content-type-buttons">
          <li className="branching-question" title="Add New Branching Question">Branching Question</li>
        </ul>
      </div>
    );
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  handleMouseDown: PropTypes.func
};
