import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);

    // TODO: This needs to come from app and needs to be sanitized
    this.l10n = {
      infoTooltipInfo: 'Add Informational content to the <strong>Branching Question Set.</strong>',
      infoTooltipBranching: 'Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>'
    };

    this.infoTooltips = [];
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  /**
   * Set reference to tooltip info.
   *
   * @param {object} ref - Reference.
   * @param {boolean} add - If true, ref will be added, else removed.
   */
  handleRef = (ref, add) => {
    if (add === true) {
      this.infoTooltips.push(ref);
    }
    else {
      this.infoTooltips = this.infoTooltips.filter(tooltip => tooltip !== ref);
    }
  }

  /**
   * Handle closing those info tooltips that are open if dismissed
   *
   * @param {Event} event Click event.
   */
  handleDocumentClick = (event) => {
    this.infoTooltips
      .filter(tooltip => {
        return tooltip.refs.tooltip !== undefined &&
          tooltip.refs.tooltip !== event.target &&
          tooltip.refs.button !== event.target;
      })
      .forEach(tooltip => {
        tooltip.toggle(false);
      });
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
      if (library.title === 'BranchingQuestion') {
        return '';
      }

      // TODO: Temporarily excluded, because of crashing the editor for some reason
      if (library.title === 'CoursePresentation') {
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

  renderSecondButtons() {
    if (!this.props.libraries) {
      return (
        <div className="loading">Loading…</div>
      );
    }
    const bs = this.props.libraries.find(library => library.title === 'BranchingQuestion');

    return (
      <ul className="content-type-buttons">
        <li className="branching-question" title="Add New Branching Question" onMouseDown={ event => this.handleMouseDown(event, bs) }>Branching Question</li>
      </ul>
    );
  }

  render() {
    // TODO: Keep width constant during loading. Fix only one loading message for the entire menu?
    return (
      <div className="content-type-menu">
        <label className="label-info">
          Info Content
          <Tooltip
            text={ this.l10n.infoTooltipInfo }
            tooltipClass={ 'tooltip below' }
            onRef={ this.handleRef }
          />
        </label>
        { this.renderDnDButtons() }
        <label className="label-info">
          Branching Content
          <Tooltip
            text={ this.l10n.infoTooltipBranching }
            onRef={ this.handleRef }
          />
        </label>
        { this.renderSecondButtons() }
      </div>
    );
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  handleMouseDown: PropTypes.func
};
