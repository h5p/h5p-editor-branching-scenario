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

    // Avoid modifying the content reference, sent back on Done or Save/Update
    this.state = {...this.props.content};

    // Useful multiple places later
    this.isBranchingQuestion = Content.isBranching(this.state);

    // Tell H5PEditor we do not handle the widget's ready callbacks
    this.passReadies = false;
  }

  componentDidMount() {
    // Create and append the H5PEditor widgets to the React DOM
    H5PEditor.processSemanticsChunk(
      this.props.getSemantics(this.state.type.library),
      this.state.type.params,
      H5P.jQuery(this.form.current),
      this
    );

    if (this.isBranchingQuestion) {
      // Create and render a sub React DOM inside one of the editor widgets
      EditorOverlay.addBranchingOptionsToEditor(this.children[0], this.props.validAlternatives);
    }
  }

  componentWillUnmount() {
    // Run remove on H5PEditor widgets
    for (let i = 0; i < this.children.length; i++) {
      this.children[i].remove();
    }
  }

  /**
   * Adds branching options to content
   * For Branching Question this means that the branching options
   * must be added to each alternative that can be chosen
   */
  static addBranchingOptionsToEditor(branchingQuestionEditor, validAlternatives) {
    if (!branchingQuestionEditor || !branchingQuestionEditor.setAlternatives) {
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
            nextContentId={ nextContentId === '' ? undefined : nextContentId }
            validAlternatives={validAlternatives}
            onChangeContent={branchingUpdated}
            alternativeIndex={listIndex}
          />
        ), selectorWrapper);
      };
      render();

      // Set default value to end scenario
      if (nextContentId === '') {
        branchingQuestionEditor.setNextContentId(listIndex, -1);
      }
    });
  }

  /**
   * Run validate on H5PEditor widgets.
   * @return {boolean}
   */
  validate = () => {
    let valid = true;
    for (let i = 0; i < this.children.length; i++) {
      if (this.children[i].validate() === false) {
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
    this.validate();
    this.props.onDone(this.state); // Must use the same params object as H5PEditor
  }

  render() {
    const title = this.state.contentTitle || this.state.type.library.split('.')[1];
    const iconClass = `editor-overlay-title editor-overlay-icon-${Canvas.camelToKebab(this.state.type.library.split('.')[1].split(' ')[0])}`;

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

        <div className='editor-overlay-content'>
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
  getSemantics: PropTypes.func,
  content: PropTypes.object,
  validAlternatives: PropTypes.array,
  onDone: PropTypes.func
};
