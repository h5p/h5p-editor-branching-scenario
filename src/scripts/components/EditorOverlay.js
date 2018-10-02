import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import './EditorOverlay.scss';
import Canvas from './Canvas';
import BranchingOptions from "./content-type-editor/BranchingOptions";
import { isBranching } from '../helpers/Library';

export default class EditorOverlay extends React.Component {

  constructor(props) {
    super(props);

    // NOTE: This component will have to be remounted when props.content changed
    // in order to update the generic H5PEditor part.
    // Does not update parent state until close.

    // Reference to the React form wrapper
    this.form = React.createRef();

    // Reference to the feedback form wrapper
    this.feedbackForm = React.createRef();

    // Reference to the React title field
    this.title = React.createRef();

    this.titleListenerName = 'input.metadata-subcontent-sync';

    // Reference to the React label wrapper
    this.labelWrapper = React.createRef();

    // Useful multiple places later
    this.isBranchingQuestion = isBranching(this.props.content);
  }

  componentDidMount() {
    // Move feedback group to feedback form
    this.feedbackForm.current.appendChild(this.props.content.feedbackFormWrapper);

    // Insert editor form
    this.form.current.appendChild(this.props.content.formWrapper);

    // Get metadata button from form and use it for custom title
    H5PEditor.$(this.props.content.formWrapper)
      .find('.h5p-metadata-button-wrapper')
      .clone(true, true)
      .appendTo(H5PEditor.$(this.labelWrapper.current));

    // Listen for the ready event from the sub form
    if (this.props.content.ready === true) {
      this.ready();
    }
    else {
      this.props.content.ready = this.ready;
    }
  }

  ready = () => {
    // This will run once the sub content form is loaded
    if (this.isBranchingQuestion) {
      // Create and render a sub React DOM inside one of the editor widgets
      this.addBranchingOptionsToEditor(H5PEditor.findField(
        'type/branchingQuestion', {
          children: this.props.content.formChildren,
        }
      ), this.props.validAlternatives, this.props.content.params.type.params.branchingQuestion.alternatives);
    }

    const library = H5PEditor.findField('type', {
      children: this.props.content.formChildren,
    });
    const titleField = H5PEditor.findField('title', library.metadataForm);
    titleField.$input.on('change', () => this.forceUpdate());

    // Force visuals to resize after initial render
    H5P.$window.trigger('resize');
  }

  componentWillUnmount() {
    if (this.$metadataFormTitle) {
      this.$metadataFormTitle.off(this.titleListenerName);
    }
    if (this.$editorFormTitle) {
      this.$editorFormTitle.off(this.titleListenerName);
    }
  }

  /**
   * Adds branching options to content
   * For Branching Question this means that the branching options
   * must be added to each alternative that can be chosen
   */
  addBranchingOptionsToEditor(branchingQuestionEditor, validAlternatives, alternatives) {
    if (!branchingQuestionEditor) {
      throw Error('Unable to locate Branching Question Editor. Did someone change Core?');
    }
    this.renderBranchingOptions = [];

    // Add <BranchingOptions> to each alternative in Branching Question
    branchingQuestionEditor.setAlternatives((listIndex, selectorWrapper) => {
      let nextContentId = alternatives[listIndex].nextContentId;

      const branchingUpdated = (value) => {
        this.props.onNextContentChange(alternatives[listIndex], parseInt(value), render);
      };

      const render = (nextContentId) => {
        ReactDOM.render((
          <BranchingOptions
            nextContentId={ nextContentId }
            validAlternatives={validAlternatives}
            onChangeContent={branchingUpdated}
            alternativeIndex={listIndex}
            nextContentLabel={'Special action if selected'}
          />
        ), selectorWrapper);
      };
      this.renderBranchingOptions[listIndex] = render;

      // Set default value to end scenario
      const normalizedNextContentId = nextContentId === '' ? -1 : nextContentId;
      branchingQuestionEditor.setNextContentId(
        listIndex,
        normalizedNextContentId
      );
      render(nextContentId);
    });
  }

  /**
   * Run validate on H5PEditor widgets.
   * @return {boolean}
   */
  validate = () => {
    let valid = true;
    for (let i = 0; i < this.props.content.formChildren.length; i++) {
      if (this.props.content.formChildren[i].validate() === false) {
        valid = false;
      }
    }
    return valid;
  }

  handleNextContentIdChange = (value) => {
    this.props.onNextContentChange(this.props.content.params, parseInt(value));
  };

  handleDone = () => {
    // Validate all form children to save their current value
    const valid = this.validate();
    if (!valid) {
      return; // Don't close form yet
    }

    // Remove any open wysiwyg fields
    if (H5PEditor.Html) {
      H5PEditor.Html.removeWysiwyg();
    }

    if (this.isBranchingQuestion) {
      // Change non-selected "Next Content" to default end scenario.
      const alternatives = this.props.content.params.type.params.branchingQuestion.alternatives;
      alternatives.forEach((alternative, index) => {
        if (alternative.nextContentId === undefined) {
          alternatives[index].nextContentId = -1;
        }
      });
    }

    // Collapse branching question list alternatives
    if (this.isBranchingQuestion) {
      const branchingQuestionEditor = H5PEditor.findField(
        'type/branchingQuestion', {
          children: this.props.content.formChildren,
        }
      );

      if (branchingQuestionEditor) {
        branchingQuestionEditor.collapseListAlternatives();
      }
    }

    // Update Canvas state
    this.props.onDone();
  }

  render() {
    const iconClass = `editor-overlay-title editor-overlay-icon-${Canvas.camelToKebab(this.props.content.params.type.library.split('.')[1].split(' ')[0])}`;
    let scoreClass = this.props.scoringOption === 'no-score'
      ? ' hide-scores' : '';
    if (this.props.scoringOption === 'dynamic-score') {
      scoreClass = ' dynamic-score';
    }
    const overlayClass = this.isBranchingQuestion ? ' h5p-branching-question' : '';
    const feedbackGroupClass = this.props.content.params.nextContentId !== -1 ? ' hide-score' : '';

    return (
      <div className={`editor-overlay${overlayClass}`}>
        <div className='editor-overlay-header'>
          <span
            className={ iconClass }
          >{ this.props.content.params.type.metadata ? this.props.content.params.type.metadata.title : 'New' }</span>
          <span className="buttons">
            <button
              className="button-remove"
              onClick={ this.props.onRemove }
            >
              Remove { /* TODO: l10 */ }
            </button>
            <button
              className="button-blue"
              onClick={ this.handleDone }
            >Done{/* TODO: l10n */}</button>
          </span>
        </div>

        <div className={`editor-overlay-content${scoreClass}`}>
          <div className='editor-overlay-semantics' ref={ this.form }/>
          {
            !this.isBranchingQuestion &&
            <BranchingOptions
              nextContentId={ this.props.content.params.nextContentId }
              validAlternatives={ this.props.validAlternatives }
              onChangeContent={ this.handleNextContentIdChange }
              isInserting={ this.props.isInserting }
            />
          }
          <div
            className={`editor-overlay-feedback-semantics${feedbackGroupClass}`}
            ref={ this.feedbackForm }
          />
        </div>

      </div>
    );
  }
}

EditorOverlay.propTypes = {
  content: PropTypes.object,
  validAlternatives: PropTypes.array,
  onDone: PropTypes.func
};
