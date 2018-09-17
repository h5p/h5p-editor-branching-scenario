import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import './EditorOverlay.scss';
import Canvas from './Canvas';
import Content from './Content';
import BranchingOptions from "./content-type-editor/BranchingOptions";

export default class EditorOverlay extends React.Component {

  constructor(props) {
    super(props);

    // NOTE: This component will have to be remounted when props.content changed
    // in order to update the generic H5PEditor part.
    // Does not update parent state until close.

    // Reference to the React form wrapper
    this.form = React.createRef();

    // Must be the same object used by the editor form
    this.state = this.props.content.params;

    // Useful multiple places later
    this.isBranchingQuestion = Content.isBranching(this.props.content);
  }

  componentDidMount() {
    if (this.isBranchingQuestion) {
      // Create and render a sub React DOM inside one of the editor widgets
      this.addBranchingOptionsToEditor(H5PEditor.findField(
        'type/branchingQuestion', {
          children: this.props.content.formChildren,
        }
      ), this.props.validAlternatives);
    }

    // Insert editor form
    this.form.current.appendChild(this.props.content.formWrapper);
  }

  /**
   * Adds branching options to content
   * For Branching Question this means that the branching options
   * must be added to each alternative that can be chosen
   */
  addBranchingOptionsToEditor(branchingQuestionEditor, validAlternatives) {
    if (!branchingQuestionEditor || !branchingQuestionEditor.setAlternatives) {

      // Re-run when library has loaded
      const library = H5PEditor.findField('type', {
        children: this.props.content.formChildren,
      });

      library.change(() => {
        this.addBranchingOptionsToEditor(
          H5PEditor.findField('type/branchingQuestion', {
            children: this.props.content.formChildren,
          }),
          this.props.validAlternatives,
        );
      });

      return;
    }

    // Add <BranchingOptions> to each alternative in Branching Question
    branchingQuestionEditor.setAlternatives((nextContentId, selectorWrapper, listIndex) => {
      const branchingUpdated = (value) => {
        branchingQuestionEditor.setNextContentId(listIndex, value);
        nextContentId = value;
        render(); // Update with the new state
      };

      const render = () => {
        ReactDOM.render((
          <BranchingOptions
            nextContentId={nextContentId === '' ? undefined : parseInt(nextContentId)}
            validAlternatives={validAlternatives}
            onChangeContent={branchingUpdated}
            alternativeIndex={listIndex}
          />
        ), selectorWrapper);
      };

      // Set default value to end scenario
      const normalizedNextContentId = nextContentId === '' ? -1 : nextContentId;
      branchingQuestionEditor.setNextContentId(
        listIndex,
        normalizedNextContentId
      );
      render();
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

  /**
   * Update title in header as it is changed in the title field.
   *
   * @param {Event} e Change event
   */
  handleUpdateTitle = (e) => {
    this.setState({
      contentTitle: e.target.value
    });
  };

  handleNextContentIdChange = (value) => {
    this.setState({
      nextContentId: value
    });
  };

  handleDone = () => {
    // Validate all form children to save their current value
    this.validate();

    // Remove any open wysiwyg fields
    if (H5PEditor.Html) {
      H5PEditor.Html.removeWysiwyg();
    }

    // Update Canvas state
    this.props.onDone(this.state); // Must use the same params object as H5PEditor
  }

  render() {
    const title = this.state.contentTitle || this.state.type.library.split('.')[1];
    const iconClass = `editor-overlay-title editor-overlay-icon-${Canvas.camelToKebab(this.state.type.library.split('.')[1].split(' ')[0])}`;
    const scoreClass = this.props.scoringOption !== 'static-end-score'
      ? ' hide-scores' : '';
    return (
      <div className='editor-overlay'>
        <div className='editor-overlay-header'>
          <span
            className={ iconClass }
          >{ title }</span>
          <span className="buttons">
            <button
              className="buttonBlue"
              onClick={ this.handleDone }
            >Done{/* TODO: l10n */}</button>
          </span>
        </div>

        <div className={`editor-overlay-content${scoreClass}`}>
          <div>
            <label className="editor-overlay-label" htmlFor="title">Title{/* TODO: l10n */}<span
              className="editor-overlay-label-red">*</span></label>
            <input
              name="title" className='editor-overlay-titlefield' type="text"
              value={ title } onChange={ this.handleUpdateTitle }/>
          </div>

          <div className='editor-overlay-semantics' ref={ this.form }/>
          {
            !this.isBranchingQuestion &&
            <BranchingOptions
              nextContentId={ this.state.nextContentId }
              validAlternatives={ this.props.validAlternatives }
              onChangeContent={ this.handleNextContentIdChange }
            />
          }
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
