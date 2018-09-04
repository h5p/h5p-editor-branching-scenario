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
    this.infoTooltipInfo = this.createInfoTooltip(this.l10n.infoTooltipInfo, 'tooltip below');
    this.infoTooltipBranching = this.createInfoTooltip(this.l10n.infoTooltipBranching);
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  /**
   * Create info tooltip component.
   *
   * @param {string} text Text to show in component. Should be validated!
   * @param {string} tooltipClass Classes for tooltip as 'foo bar batz'.
   * @return {JSX} Component.
   */
  createInfoTooltip = (text, tooltipClass) => {
    return (
      <Tooltip
        ref={ tooltip => {
          this.infoTooltips.push(tooltip);
        } }
        text={ text }
        tooltipClass={ tooltipClass }
      />
    );
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
    // TODO: l10n
    return (
      <div className="content-type-menu">
        <label className="label-info">
          Info Content { this.infoTooltipInfo }
        </label>
        { this.renderDnDButtons() }
        <label className="label-info">
          Branching Content { this.infoTooltipBranching }
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
