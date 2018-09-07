import React from 'react';

// TODO: Merge with BracnhingQuestionOptions and fix translations and rely less on props
export default class BranchingOptions extends React.Component {
  render() {
    return (
      <div className='editor-overlay-branching-options'>
        <select
          value={this.props.branchingOptions}
          onChange={this.props.handleOptionChange}
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
          this.props.showNextPathDropzone &&
          this.props.renderNextPathDropzone()
        }

        {
          this.props.showNextPathChooser &&
          this.props.renderNextPathChooser()
        }
      </div>
    );
  }
}