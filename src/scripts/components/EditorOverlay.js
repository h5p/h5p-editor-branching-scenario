import React from 'react';
import ReactDOM from 'react-dom';
import './EditorOverlay.scss';
import BranchingOptions from "./content-type-editor/BranchingOptions";

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
    H5PEditor.processSemanticsChunk(
      this.props.elementFields,
      content.type.params,
      content.$form,
      this.props.main,
      content.type.library
    );

    // TODO: l10n object
    this.state = {
      content: content
    };

    this.validAlternatives = this.props.content.map((content, index) => {
      return Object.assign({}, content, {contentId: index});
    }).filter((alt, index) => {
      return this.props.id !== index;
    });

    this.addBranchingOptionsToEditor();
  }

  /**
   * Adds branching options to content
   * For Branching Question this means that the branching options
   * must be added to each alternative that can be chosen
   */
  addBranchingOptionsToEditor() {
    if (this.isBranchingQuestion) {
      const branchingQuestionEditor = this.props.main.children[0];

      if (branchingQuestionEditor && branchingQuestionEditor.setAlternatives) {

        // Add <BranchingOptions> to each alternative in Branching Question
        branchingQuestionEditor.setAlternatives(
          (nextContentId, selectorWrapper, listIndex) => {
            const branchingUpdated = (value) => {
              branchingQuestionEditor.setNextContentId(listIndex, value);
            };

            ReactDOM.render((
              <BranchingOptions
                nextContentId={nextContentId}
                validAlternatives={this.validAlternatives}
                onChangeContent={branchingUpdated}
                alternativeIndex={listIndex}
              />
            ), selectorWrapper);

            // Set default value to end scenario
            if (nextContentId === '') {
              branchingQuestionEditor.setNextContentId(listIndex, -1);
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

    // TODO: Content state is maintained in both this component and Canvas. Please only use parent (Canvas).
    this.setState(prevState => {
      const newState = {
        content: prevState.content
      };
      newState.content.contentTitle = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  };

  updateNextContentId = (value) => {
    // TODO: Content state is maintained in both this component and Canvas. Please only use parent (Canvas).
    this.setState(prevState => {
      const newState = {
        content: prevState.content
      };
      newState.content.nextContentId = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  };

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
            >Save changes</button>
            <button
              className="button"
              onClick={this.props.onFormClosed}
            >Close</button>
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
              nextContentId={this.state.content.nextContentId}
              validAlternatives={this.validAlternatives}
              onChangeContent={this.updateNextContentId.bind(this)}
            />
          }
        </div>

      </div>
    );
  }
}
