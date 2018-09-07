import React from 'react';
import Dropzone from "../Dropzone";
import './BranchingQuestionEditor.scss';

// TODO: Merge with BranchingOptions.js and refactor

export default class BranchingQuestionOptions extends React.Component {

  constructor(props) {
    super(props);
    const nextContentId = parseInt(this.props.nextContentId);

    this.state = {
      showNextPathDropzone: false,
      showNextPathChooser: nextContentId >= 0,
      existingContentId: nextContentId, // TODO: Merge these options
    };
  }

  static getAlternativeName(content) {
    return content.type.library.split(' ')[0]
      .split('.')[1]
      .replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5');
  }

  handleExistingContentChange(e) {
    const newValue = e.target.value;
    this.setState({
      existingContentId: newValue,
    });
    this.props.branchingUpdated(newValue);
  }

  handleMainOptionChange(e) {
    var newValue = e.target.value;
    switch (newValue) {
      case 'end-scenario':
        this.props.branchingUpdated(-1);
        this.setState({
          showNextPathDropzone: false,
          showNextPathChooser: false,
        });
        break;

      case 'new-content':
        this.setState({
          showNextPathDropzone: true,
          showNextPathChooser: false,
        });

        break;

      case 'old-content':
        this.setState({
          showNextPathDropzone: false,
          showNextPathChooser: true,
        });
        var nextContentId = this.props.validAlternatives[0].contentId;
        this.props.branchingUpdated(nextContentId);
        break;
    }
  }

  render() {
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
          onChange={this.handleMainOptionChange.bind(this)}
        >
          <option
            key="branching-option-0"
            value="end-scenario"
          >End scenario here
          </option>
          <option
            key="branching-option-1"
            value="new-content"
          >Send a viewer to a new content/question
          </option>
          {
            this.props.content.length > 1 &&
            <option
              key="branching-option-2"
              value="old-content"
            >Send a viewer to an existing content/question</option>
          }
        </select>

        {
          this.state.showNextPathDropzone &&
          <Dropzone
            ref={element => this.props.onNextPathDrop(element)}
            elementClass={'dropzone-editor-path'}
            innerHTML={'Drag any content type from a menu on the left side and drop it here to create new content/question'}
            alternative={this.props.alternativeIndex}
            type={ 'nextPathDrop' }
          />
        }

        {
          this.state.showNextPathChooser &&
          <div>
            <label htmlFor="nextPath">Select a path to send a user to</label>
            <select
              name="nextPath"
              value={this.state.existingContentId}
              onChange={this.handleExistingContentChange.bind(this)}
            >
              {
                this.props.validAlternatives.map(content => (
                  <option
                    key={'next-path-' + content.contentId}
                    value={content.contentId}
                  >{BranchingQuestionOptions.getAlternativeName(content)}</option>
                ))
              }
            </select>
          </div>
        }
      </div>
    );
  }
}
