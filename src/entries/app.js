import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../scripts/editor';

/*global H5PEditor*/
H5PEditor.widgets.branchingScenario = H5PEditor.BranchingScenario = (function () {
  /**
   * Initialize Branching Scenario editor.
   *
   * @class H5PEditor.BranchingScenario
   * @param {Object} parent - Parent.
   * @param {Object} field - Contents.
   * @param {Object} params - Params.
   * @param {function} setValue - Callback.
   */
  function BranchingScenarioEditor(parent, field, params, setValue) {
    this.parent = parent;
    // Fields of semantics
    this.field = field;

    this.setValue = setValue;

    const contentFields = H5PEditor.findSemanticsField('content', this.field);
    const libraryFields = contentFields.field.fields;
    this.libraries = H5PEditor.findSemanticsField('type', contentFields).options;

    this.params = params || {};

    // Defaults for translatable fields
    this.endScreenButtonText = 'Restart the course';
    this.proceedButtonText = "Proceed";
    this.startScreenButtonText = "Start the course";
    this.title = "Branching Scenario Main Title";

    this.params.content = this.params.content || [];

    this.params.endScreens = this.params.endScreens || [];
    this.params.endScreens[0] = this.params.endScreens[0] || {
      endScreenTitle: '',
      endScreenSubtitle: '',
      contentId: -1
    };

    // Sanitize missing nextContentId; can never be undefined
    this.params.content.forEach(item => {
      if (item.type.library.indexOf('H5P.BranchingQuestion') === 0) {
        item.type.params.branchingQuestion.alternatives.forEach(alt =>
          alt.nextContentId = alt.nextContentId || -1
        );
      }
      else {
        item.nextContentId = item.nextContentId || -1;
      }
    });

    setValue(field, this.params);

    // Switch to activate/deactivate the editor popup. Useful for canvas development.
    this.canvasDev = false;
    document.addEventListener('keydown', event => {
      // shift-3
      if (event.keyCode === 51) {
        this.canvasDev = !this.canvasDev;
      }
    });

    // TODO: Match semantics with design
    // TODO: Sanitized access more elegantly
    this.params.startScreen = this.params.startScreen || {};
    this.params.startScreen.startScreenTitle = this.params.startScreen.startScreenTitle || '';
    this.params.startScreen.startScreenSubtitle = this.params.startScreen.startScreenSubtitle || '';
    this.params.endScreens = this.params.endScreens || [{}];

    this.settings = {
      startTitle: this.params.startScreen.startScreenTitle,
      startSubtitle: this.params.startScreen.startScreenSubtitle,
      startImage: this.params.startScreen.startScreenImage,
      endScore: 0, // TODO: Doesn't have a match in current semantics
      endFeedback: '', // TODO: Doesn't have a match in current semantics
      endImage: this.params.endScreens[0].endScreenImage,
      optionsSkipToAQuestion: false, // TODO: Doesn't have a match in current semantics
      optionsConfirmOnAlternative: false, // TODO: Doesn't have a match in current semantics
      optionsTryAnotherChoice: false, // TODO: Doesn't have a match in current semantics
      optionsDisplayScore: false // TODO: Doesn't have a match in current semantics
    };

    this.passReadies = true;
    parent.ready(() => this.passReadies = false);

    // TODO: Make a general function for retrieving particular fields from semantics
    const field1 = this.field.fields[1].fields[2];
    this.startImageChooser = new H5PEditor.widgets.image(this, field1, this.settings.startImage, () => {});

    const field2 = this.field.fields[2].field.fields[2];
    this.endImageChooser = new H5PEditor.widgets.image(this, field2, this.settings.endImage, () => {});

    this.buildContentEditorForms(libraryFields);
  }

  /**
   * Build editors for existing content, so common fields are available
   * on load
   */
  BranchingScenarioEditor.prototype.buildContentEditorForms = function (libraryFields) {
    // Render all forms up front, so common fields are available
    this.params.content.forEach((contentParams) => {
      const $form = H5P.jQuery('<div/>');
      H5PEditor.processSemanticsChunk(
        libraryFields,
        contentParams,
        $form,
        this,
        contentParams.type.library
      );
    });
  };


  /**
   * Update parameters with values delivered by React components.
   *
   * @param {Object} data - Data from React components.
   */
  BranchingScenarioEditor.prototype.updateParams = function (data) {
    // TODO: Switch here if we accept data from more than one component
    this.params.startScreen.startScreenTitle = data.startTitle;
    this.params.startScreen.startScreenSubtitle = data.startSubtitle;
    this.params.startScreen.startScreenImage = data.startImage;
    this.params.endScreens[0].endScreenImage = data.endImage;
  };

  /**
   * Validate the current field.
   *
   * @returns {boolean} True if validatable.
   */
  BranchingScenarioEditor.prototype.validate = function () {
    // TODO: Run validate on all H5PEditor widgets (OK for children of EditorOverlay)
    this.editor.validate();
    return true;
  };

  /**
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   */
  BranchingScenarioEditor.prototype.ready = function (ready) {
    if (this.passReadies) {
      this.parent.ready(ready);
    }
    else {
      this.readies.push(ready);
    }
  };

  /**
   * Set content for H5P params after it has been changed.
   * Workaround for merging React with save-by-reference principle
   *
   * @param {object} content - Content.
   */
  BranchingScenarioEditor.prototype.handleContentChanged = function (content) {
    this.params.content = content;
    this.setValue(this.field, this.params);
  };

  /**
   * Append Editor to DOM.
   *
   * @param {jQuery} $wrapper - Container in DOM.
   */
  BranchingScenarioEditor.prototype.appendTo = function ($wrapper) {
    $wrapper.parent().css('padding', 0);

    this.editor = ReactDOM.render(
      (<Editor
        main={this} // hacky
        parent={this.parent}
        content={ this.params.content }
        libraries={ this.libraries }
        settings={ this.settings }
        startImageChooser={ this.startImageChooser }
        endImageChooser={ this.endImageChooser }
        updateParams={ this.updateParams.bind(this) }
        onContentChanged={ this.handleContentChanged.bind(this) }
      />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})();
