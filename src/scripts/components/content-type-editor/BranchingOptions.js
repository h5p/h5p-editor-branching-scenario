import React from 'react';
import PropTypes from 'prop-types';
import './BranchingOptions.scss';

export default class BranchingOptions extends React.Component {

  constructor(props) {
    super(props);
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
        this.updateContentSelected(this.props.validAlternatives[0].id);
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
          <label className='h5peditor-label-wrapper'>
            <span className='h5peditor-label'>
              { this.props.nextContentLabel || 'Next content' }
            </span>
          </label>
          <div className='h5peditor-field-description'>
            { this.props.nextContentDescription || 'You can choose to: 1. End scenario 2. Send a user to an existing content/question or 3. Send a user to a new content/question. If you want to send a user to a new content/question, close this popup and create a new content/question below this content.' }
          </div>
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
          <div className="field text importance-low">
            <label className="h5peditor-label-wrapper" htmlFor="nextPath">
              <span className="h5peditor-label h5peditor-required">Select a path to send a user to{/* TODO: Use title from semantics */}</span>
            </label>
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
