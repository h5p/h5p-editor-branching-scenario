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
              { this.props.nextContentLabel || 'Special action after this content' }
            </span>
          </label>
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
            >Custom end scenario</option>
            {
              this.props.validAlternatives.length > 0 &&
              <option
                key="old-content"
                value="old-content"
              >Jump to another branch</option>
            }
          </select>
        </div>
        {
          this.props.nextContentId >= 0 &&
          <div className="field text importance-low">
            <label className="h5peditor-label-wrapper" htmlFor="nextPath">
              <span className="h5peditor-label h5peditor-required">Select a branch to jump to{/* TODO: Use title from semantics */}</span>
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
