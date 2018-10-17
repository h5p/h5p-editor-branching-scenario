import React from 'react';
import PropTypes from 'prop-types';
import './BranchingOptions.scss';

export default class BranchingOptions extends React.Component {

  constructor(props) {
    super(props);

    const initialSelectedMainOption = this.props.nextContentId >= 0
      ? 'old-content'
      : (
        this.props.isInserting
          ? 'new-content'
          : 'end-scenario'
      );

    this.state = {
      expanded: false,
      selectedMainOption: initialSelectedMainOption,
    };
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
    this.setState({
      selectedMainOption: newValue,
    });
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
    // TODO: translations
    return (
      <div className='editor-overlay-branching-options'>
        <fieldset className={ 'field group' + (this.state.expanded ? ' expanded' : '' ) }>
          <div
            className="title"
            title="Expand/Collapse"
            role="button"
            onClick={ () => this.setState(prevState => ({expanded: !prevState.expanded})) }
            onKeyPress={ e => { if (e.which === 32) this.setState(prevState => ({expanded: !prevState.expanded}));} }
            tabIndex="0">Branching Options{ /* TODO: l10n */ }
          </div>
          <div className="content">
            <div className='field text importance-low'>
              <label className='h5peditor-label-wrapper'>
                <span className='h5peditor-label'>
                  { this.props.nextContentLabel || 'Special action after this content' }
                </span>
              </label>
              <select
                value={ this.state.selectedMainOption }
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
        </fieldset>
      </div>
    );
  }
}

BranchingOptions.propTypes = {
  nextContentId: PropTypes.number,
  validAlternatives: PropTypes.array,
  onChangeContent: PropTypes.func
};
