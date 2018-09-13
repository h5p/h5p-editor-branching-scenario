import React from 'react';
import PropTypes from 'prop-types';

import './BranchingOptions.scss';
import Content from '../Content.js';

export default class BranchingOptions extends React.Component {

  constructor(props) {
    super(props);
  }

  /**
   * Determine option label for select
   *
   * @param {Object} content
   * @return {string}
   */
  static getAlternativeName(content) {
    const library = content.type.library.split(' ')[0]
      .split('.')[1]
      .replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5');
    const contentTitle = Content.getTooltip(content);
    return `${library}: ${contentTitle}`;
  }

  handleExistingContentChange = (e) => {
    this.updateContentSelected(e.target.value);
  }

  updateContentSelected = (value) => {
    if (this.props.onChangeContent) {
      this.props.onChangeContent(value);
    }
  }

  handleMainOptionChange = (e) => {
    const newValue = e.target.value;
    switch (newValue) {
      case 'new-content':
        this.updateContentSelected(-1);
        break;

      case 'end-scenario':
        this.updateContentSelected(-1);
        break;

      case 'old-content':
        this.updateContentSelected(this.props.validAlternatives[0].contentId);
        break;
    }
  }

  render() {
    const mainSelectorValue = this.props.nextContentId >= 0
      ? 'old-content'
      : (this.props.nextContentId === -1
        ? 'end-scenario'
        : 'new-content');

    // TODO: translations
    return (
      <div className='editor-overlay-branching-options'>
        <div className='field text importance-low'>
          <div className='h5p-editor-flex-wrapper'>
            <label className='h5peditor-label-wrapper'>
              <span className='h5peditor-label'>Next content</span>
            </label>
          </div>
          <div className='h5peditor-field-description'>If you select a value it is recommended to provide a feedback after each alternatives that leads to a new content. This will ensure a better learning experience for the viewer.</div>
        </div>
        <select
          value={ mainSelectorValue }
          onChange={ this.handleMainOptionChange }
        >
          <option
            key="default"
            value="new-content"
          > - </option>
          <option
            key="end-scenario"
            value="end-scenario"
          >End scenario here</option>
          {
            this.props.validAlternatives.length > 0 &&
            <option
              key="old-content"
              value="old-content"
            >Send a viewer to an existing content/question</option>
          }
        </select>
        {
          this.props.nextContentId >= 0 &&
          <div>
            <label htmlFor="nextPath">Select a path to send a user to</label>
            <select
              name="nextPath"
              value={ this.props.nextContentId }
              onChange={ this.handleExistingContentChange }
            >
              {
                this.props.validAlternatives.map(content => (
                  <option
                    key={ 'next-path-' + content.id }
                    value={ content.id }
                  >{content.label}</option>
                ))
              }
            </select>
          </div>
        }
      </div>
    );
  }
}

BranchingOptions.propTypes = {
  nextContentId: PropTypes.number,
  validAlternatives: PropTypes.array,
  onChangeContent: PropTypes.func
};
