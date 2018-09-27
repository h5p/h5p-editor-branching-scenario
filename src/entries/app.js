import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../scripts/editor';
import { isBranching } from '../scripts/helpers/Library';

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
    this.libraryFields = contentFields.field.fields;
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
      if (isBranching(item.type.library)) {
        item.type.params.branchingQuestion.alternatives.forEach(alt =>
          alt.nextContentId = alt.nextContentId !== undefined
            ? alt.nextContentId
            : -1
        );
      }
      else {
        item.nextContentId = item.nextContentId !== undefined
          ? item.nextContentId
          : -1;
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

    this.params.startScreen = this.params.startScreen || {};
    this.params.startScreen.startScreenTitle = this.params.startScreen.startScreenTitle || '';
    this.params.startScreen.startScreenSubtitle = this.params.startScreen.startScreenSubtitle || '';
    this.params.endScreens = this.params.endScreens || [{}];

    this.settings = {
      startTitle: this.params.startScreen.startScreenTitle,
      startSubtitle: this.params.startScreen.startScreenSubtitle,
      startImage: this.params.startScreen.startScreenImage,
      endScreenScore: this.params.endScreens[0].endScreenScore,
      endImage: this.params.endScreens[0].endScreenImage,
    };

    this.passReadies = true;
    parent.ready(() => this.passReadies = false);

    const startScreenImageField = H5PEditor.findSemanticsField(
      'startScreenImage',
      this.field
    );
    this.startImageChooser = new H5PEditor.widgets.image(
      this,
      startScreenImageField,
      this.settings.startImage,
      () => {}
    );

    const endScreenImageField = H5PEditor.findSemanticsField(
      'endScreenImage',
      this.field
    );
    this.endImageChooser = new H5PEditor.widgets.image(
      this,
      endScreenImageField,
      this.settings.endImage,
      () => {}
    );

    this.buildContentEditorForms();
  }

  /**
   * Build editors for existing content, so common fields are available
   * on load
   */
  BranchingScenarioEditor.prototype.buildContentEditorForms = function () {
    // Render all common fields of branching scenario
    const commonFieldsWrapper = document.createElement('div');
    const commonFields = this.field.fields.filter(branchingField => {
      return branchingField.common;
    });
    H5PEditor.processSemanticsChunk(
      commonFields,
      this.params,
      H5P.jQuery(commonFieldsWrapper),
      this,
      this.parent.currentLibrary
    );

    // Note that this is just the initial array, it will be maintained as a state in <Canvas>
    this.content = [];
    // Render all forms up front, so common fields are available
    this.params.content.forEach(params => this.content.push(this.getNewContent(params)));
  };

  /**
   * Create Content object with editor form and params
   *
   * @param {Object} params
   * @return {Object} Content object
   */
  BranchingScenarioEditor.prototype.getNewContent = function (params) {
    // To be restored once done (processSemanticsChunk() replaces current children)
    const children = this.children;

    // Create content object that holds the editor form and params
    const content = {
      formWrapper: document.createElement('div'),
      feedbackFormWrapper: document.createElement('div'),
      formChildren: null,
      params: params
    };

    content.formWrapper.classList.add('editor-overlay-library');

    H5PEditor.processSemanticsChunk(
      this.libraryFields,
      params,
      H5P.jQuery(content.formWrapper),
      this,
      params.type.library
    );

    // Move last feedback group to its own wrapper
    let feedbackGroups = content.formWrapper
      .querySelectorAll('.field-name-feedback');
    const feedbackGroup = feedbackGroups[feedbackGroups.length - 1];

    content.feedbackFormWrapper.appendChild(feedbackGroup);

    // Add description to feedback group
    const description = document.createElement('div');
    description.classList.add('h5p-feedback-description');
    description.classList.add('h5peditor-field-description');
    description.textContent = 'It is recommended to provide feedback that motivates and also provides guidance. Leave all fields empty if you don\'t want the user to get feedback after choosing this alternative/viewing this content.';

    const groupWrapper = feedbackGroup.querySelector('.content');
    groupWrapper.prepend(description);

    content.formChildren = this.children;

    // For BS we need to know when the sub form is ready/loaded
    const type = H5PEditor.findField('type', {
      children: content.formChildren
    });
    if (type.children) {
      content.ready = true;
    }
    else {
      type.change(() => {
        if (typeof content.ready === 'function') {
          content.ready();
        }
        content.ready = true;
      });
    }

    // Restore children
    this.children = children;

    return content;
  };

  /**
   * Update parameters with values delivered by React components.
   *
   * @param {Object} data - Data from React components.
   */
  BranchingScenarioEditor.prototype.updateParams = function (data) {
    this.params.startScreen.startScreenTitle = data.startTitle;
    this.params.startScreen.startScreenSubtitle = data.startSubtitle;
    this.params.startScreen.startScreenImage = data.startImage;
    this.params.endScreens[0].endScreenTitle = data.endFeedback;
    this.params.endScreens[0].endScreenImage = data.endImage;
    this.params.endScreens[0].endScreenScore = data.endScreenScore;
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
    const self = this;

    let fullscreen;
    if (H5PEditor.Fullscreen !== undefined) {
      const formWrapper = $wrapper.parent()[0];
      fullscreen = new H5PEditor.Fullscreen(formWrapper);

      fullscreen.on('entered', function () {
        formWrapper.classList.add('h5peditor-fullscreen');

        // Center tree after entering fullscreen
        self.editor.setState({
          center: true,
          fullscreen: true
        });
        // TODO: It would be better if we could center on the current tree center the user has set, like zoom does!

        document.documentElement.style.fontSize = '18px';

        // Remove any open wysiwyg fields (they do not automatically resize)
        if (H5PEditor.Html) {
          H5PEditor.Html.removeWysiwyg();
        }
      });

      fullscreen.on('exited', function () {
        formWrapper.classList.remove('h5peditor-fullscreen');

        // Center tree after exiting fullscreen
        self.editor.setState({
          center: true,
          fullscreen: false
        });
        // TODO: It would be better if we could center on the current tree center the user has set, like zoom does!

        document.documentElement.style.fontSize = '';

        // Remove any open wysiwyg fields (they do not automatically resize)
        if (H5PEditor.Html) {
          H5PEditor.Html.removeWysiwyg();
        }
      });
    }
    function toggleFullscreen(on) {
      if (fullscreen) {
        if (on) {
          fullscreen.enter();
        }
        else {
          fullscreen.exit();
        }
      }
    }

    this.editor = ReactDOM.render(
      (<Editor
        parent={ this.parent }
        content={ this.content }
        getNewContent={ this.getNewContent.bind(this) }
        libraries={ this.libraries }
        settings={ this.settings }
        startImageChooser={ this.startImageChooser }
        endImageChooser={ this.endImageChooser }
        updateParams={ this.updateParams.bind(this) }
        onContentChanged={ this.handleContentChanged.bind(this) }
        onToggleFullscreen={ toggleFullscreen }
        main={ this }
      />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})();
