import React from 'react';
import ReactDOM from 'react-dom';
import './EditorOverlay.scss';
import Dropzone from './Dropzone.js';
import BranchingOptions from "./content-type-editor/BranchingOptions";
import BranchingQuestionOptions from "./content-type-editor/BranchingQuestionOptions";

/*global H5PEditor, H5P*/
export default class EditorOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.refForm = React.createRef();
    this.passReadies = false;

    const content = this.props.content[this.props.id] || {};
    content.contentTitle = content.contentTitle || content.type.library.split('.')[1];

    const library = content.type.library.split(' ')[0];
    this.isBranchingQuestion = library === 'H5P.BranchingQuestion';

    content.$form = H5P.jQuery('<div/>');

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(this.props.elementFields, content.type.params, content.$form, this.props.main);

    // TODO: l10n object
    this.state = {
      saveButton: "Save changes", // TODO: Needs to be translatable
      closeButton: "close", // TODO: Needs to be translatable
      showNextPathDropzone: false,
      showNextPathChooser: content.nextContentId > -1,
      branchingOptions: (content.nextContentId > -1) ? "old-content" : 'end-scenario',
      content: content
    };

    this.validAlternatives = this.props.content.map((content, index) => {
      return Object.assign({}, content, {contentId: index});
    }).filter((alt, index) => {
      return alt.type.library.split(' ')[0] !== 'H5P.BranchingQuestion' &&
        this.props.id !== index;
    });

    if (this.isBranchingQuestion) {
      // TODO: refactor
      const widget = this.props.main.children[0];

      if (widget && widget.setAlternatives) {
        widget.setAlternatives(
          (nextContentId, selectorWrapper, listIndex) => {
            const branchingUpdated = (value) => {
              widget.setNextContentId(listIndex, value);
            };

            ReactDOM.render((
              <BranchingQuestionOptions
                handleOptionChange={this.handleOptionChange.bind(this)}
                value={this.state.branchingOptions}
                content={this.props.content}
                showNextPathChooser={this.state.showNextPathChooser}
                showNextPathDropzone={this.state.showNextPathDropzone}
                renderNextPathDropzone={this.renderNextPathDropzone.bind(this)}
                renderNextPathChooser={this.renderNextPathChooser.bind(this)}
                onNextPathDrop={this.props.onNextPathDrop.bind(this)}
                nextContentId={nextContentId}
                validAlternatives={this.validAlternatives}
                branchingUpdated={branchingUpdated}
                alternativeIndex={listIndex}
              />
            ), selectorWrapper);

            // Set default value to end scenario
            if (nextContentId === '') {
              widget.setNextContentId(listIndex, -1);
            }
          });
      }
    }
  }

  /*
   * This is used to pass a reference "child" to the parent. I am eager to
   * learn a better way of updating the DOM from outside a component
   * (I know, you shouldn't), because the H5P core gives me DOM elements, not
   * something I can simply pass as a state.
   */
  componentDidMount() {
    this.props.onRef(this);

    // Try to listen to everything in the form
    // TODO: Also catch the CKEditor, Drag'n'Drop, etc.
    this.state.content.$form.on('keypress click change blur', () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });

    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     */
    this.state.content.$form.appendTo(this.refForm.current);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  /**
   * Update title in header as it is changed in the title field.
   *
   * @param {object} event - Change event.
   */
  handleUpdateTitle = (event) => {
    const value = event.target.value;

    this.setState(prevState => {
      const newState = prevState;
      newState.content.contentTitle = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  };

  handleOptionChange = (event) => {
    const value = event.target.value;

    switch (value) {
      case 'end-scenario':
        this.setState({
          nextContentId: -1,
          showNextPathDropzone: false,
          showNextPathChooser: false,
          branchingOptions: value
        });
        break;
      case 'new-content':
        this.setState({
          showNextPathDropzone: true,
          showNextPathChooser: false,
          branchingOptions: value
        });
        break;
      case 'old-content':
        this.setState(prevState => {
          const newState = prevState;

          newState.showNextPathDropzone = false;
          newState.showNextPathChooser = true;
          newState.branchingOptions = value;
          newState.content.nextContentId = (prevState.content.nextContentId < 0) ? 0 : prevState.content.nextContentId;

          return newState;
        });
        break;
    }

    this.props.onContentChanged(this.props.id, this.state.content);
  };

  renderNextPathDropzone() {
    return (
      <Dropzone
        ref={element => this.props.onNextPathDrop(element)}
        elementClass={'dropzone-editor-path'}
        innerHTML={'Drag any content type from a menu on the left side and drop it here to create new content/question'}
      />
    );
  }

  updateNextContentId = (event) => {
    const value = (typeof event === 'number') ? event : parseInt(event.target.value);

    this.setState(prevState => {
      const newState = prevState;
      newState.content.nextContentId = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  };

  renderNextPathChooser() {
    return (
      <div>
        <label htmlFor="nextPath">Select a path to send a user to</label>
        <select name="nextPath" value={this.state.content.nextContentId} onChange={this.updateNextContentId}>
          {
            this.validAlternatives.map(content => (
              <option
                key={'next-path-' + this.props.content.indexOf(content)}
                value={this.props.content.indexOf(content)}>{`${content.type.library.split(' ')[0].split('.')[1].replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')}: ${content.contentTitle}`}
              </option>
            ))
          }
        </select>
      </div>
    );
  }

  // TODO: The editor-overlay-branching-options could be put in their own component
  render() {
    return (
      <div className='editor-overlay'>
        <div className='editor-overlay-header'>
          <span
            className={['editor-overlay-title', this.props.icon].join(' ')}
          >{this.state.content.contentTitle}</span>
          <span className="buttons">
            <button
              className="buttonBlue"
              onClick={() => {
                this.props.onFormSaved(this.props.id, this.state.content);
              }}
            >{this.state.saveButton}</button>
            <button
              className="button"
              onClick={this.props.onFormClosed}
            >{this.state.closeButton}</button>
          </span>
        </div>

        <div className='editor-overlay-content'>
          <div>
            <label className="editor-overlay-label" htmlFor="title">Title<span
              className="editor-overlay-label-red">*</span></label>
            <input
              name="title" className='editor-overlay-titlefield' type="text"
              value={this.state.content.contentTitle} onChange={this.handleUpdateTitle}/>
          </div>

          <div className='editor-overlay-semantics' ref={this.refForm}/>

          {
            !this.isBranchingQuestion &&
            <BranchingOptions
              handleOptionChange={this.handleOptionChange.bind(this)}
              value={this.state.branchingOptions}
              content={this.props.content}
              showNextPathChooser={this.state.showNextPathChooser}
              showNextPathDropzone={this.state.showNextPathDropzone}
              renderNextPathDropzone={this.renderNextPathDropzone.bind(this)}
              renderNextPathChooser={this.renderNextPathChooser.bind(this)}
            />
          }
        </div>

      </div>
    );
  }
}
