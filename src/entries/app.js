import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../scripts/editor';
import { isBranching } from '../scripts/helpers/Library';
import {t} from "../scripts/helpers/translate";

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
    this.endScreenButtonText = t('endScreenButtonText');
    this.proceedButtonText = t('proceed');
    this.startScreenButtonText = t('startScreenButtonText');
    this.title = t('branchingScenarioTitle');

    this.params.content = this.params.content || [];

    this.params.endScreens = this.params.endScreens || [];
    this.params.endScreens[0] = this.params.endScreens[0] || {
      endScreenTitle: '',
      endScreenSubtitle: '',
      contentId: -1
    };

    this.params.scoringOptionGroup = this.params.scoringOptionGroup || { scoringOption: 'no-score' };

    // Sanitize missing nextContentId; can never be undefined
    this.params.content.forEach(item => {
      if (isBranching(item.type.library)) {
        const alternatives = item.type.params.branchingQuestion.alternatives || [];
        alternatives.forEach(alt =>
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

    this.passReadies = true;
    parent.ready(() => this.passReadies = false);

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

    // Keep reference to original function
    const getLibraryMetadataSettings = H5PEditor.Library.prototype.getLibraryMetadataSettings;

    // Override the function in core
    H5PEditor.Library.prototype.getLibraryMetadataSettings = (library) => {
      if (library.name === 'H5P.AdvancedText' || library.name === 'H5P.Image') {
        return {
          disable: false,
          disableExtraTitleField: false
        };
      }
      
      // For all other libraries, use the function from core
      return getLibraryMetadataSettings(library);
    };

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

    if (content.params.nextContentId !== undefined && isBranching(content)) {
      // Branching Questions with nextContentId will crash on delete...
      delete content.params.nextContentId;
    }

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

    const feedbackDescriptionId = H5PEditor.getDescriptionId(H5PEditor.getNextFieldId({
      name: 'feedback'
    }));

    // Add description to feedback group
    const description = document.createElement('div');
    description.setAttribute('id', feedbackDescriptionId);
    description.classList.add('h5p-feedback-description');
    description.classList.add('h5peditor-field-description');
    description.textContent = t('feedbackDescription');

    feedbackGroup.querySelector('.title').setAttribute('aria-describedby', feedbackDescriptionId);

    const groupWrapper = feedbackGroup.querySelector('.content');
    groupWrapper.insertBefore(description, groupWrapper.firstChild);

    content.formChildren = this.children;

    // For BS we need to know when the sub form is ready/loaded
    const type = H5PEditor.findField('type', {
      children: content.formChildren
    });
    type.hide();
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
   * Validate the current field.
   *
   * @returns {boolean} True if validatable.
   */
  BranchingScenarioEditor.prototype.validate = function () {
    let valid = true;

    // settings
    valid = this.validateChunk(this.children);

    // metadata
    if (valid) {
      valid = this.validateChunk(this.parent.metadataForm.children);
    }

    // translations
    if (valid) {
      valid = this.validateChunk(this.findTranslationFields(this.parent.commonFields));
    }

    // content
    if (valid) {
      valid = this.validateChunk(this.content.reduce((a, b) => a.concat(b), []));
    }

    return valid;
  };

  /**
   * Find translation fields.
   *
   * @param {object} chunk Chunk to check for fields.
   * @return {object[]} Fields.
   */
  BranchingScenarioEditor.prototype.findTranslationFields = function (chunk) {
    let fields = [];

    if (typeof chunk !== 'object') {
      return fields;
    }

    for (let item in chunk) {
      const candidate = chunk[item];
      if (typeof candidate === 'object' && typeof candidate.instance !== 'undefined') {
        fields.push(candidate.instance);
      }
      else {
        fields = fields.concat(this.findTranslationFields(candidate));
      }
    }

    return fields;
  };

  /**
   * Validate a chunk of children.
   *
   * @param {object[]} chunk Chunk of children.
   * @return {boolean} True, if all children can be validated.
   */
  BranchingScenarioEditor.prototype.validateChunk = function (chunk) {
    return chunk.every(child => {
      if (typeof child.validate === 'function') {
        return child.validate() !== false;
      }
      return true;
    });
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
   * Collect functions to execute once the tree is complete.
   *
   * @param {function} ready
   */
  BranchingScenarioEditor.prototype.remove = function () {
    // Reset editor width
    document.documentElement.style.maxWidth = document.body.style.maxWidth = '';
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

    // Keep track of when we can exit semi-fullscreen
    let exitSemiFullscreen;

    // Use full width
    document.documentElement.style.maxWidth = document.body.style.maxWidth = 'none';

    /**
     * Runs after semi-fullscreen has been entered.
     *
     * @private
     */
    const handleEnterSemiFullscreen = function () {
      // Center tree after entering fullscreen
      self.editor.setState({
        center: true,
        fullscreen: true
      });
      // TODO: It would be better if we could center on the current tree center the user has set, like zoom does!

      // Make some things a little bit bigger
      //document.documentElement.style.fontSize = '18px';

      // Remove any open wysiwyg fields (they do not automatically resize)
      if (H5PEditor.Html) {
        H5PEditor.Html.removeWysiwyg();
      }
    };

    /**
     * Runs after semi-fullscreen has been exited.
     *
     * @private
     */
    const handleExitSemiFullscreen = function () {
      exitSemiFullscreen = null;

      // Center tree after exiting fullscreen
      self.editor.setState({
        center: true,
        fullscreen: false
      });
      // TODO: It would be better if we could center on the current tree center the user has set, like zoom does!

      // Reset size
      //document.documentElement.style.fontSize = '';

      // Remove any open wysiwyg fields (they do not automatically resize)
      if (H5PEditor.Html) {
        H5PEditor.Html.removeWysiwyg();
      }
    };

    /**
     * Handles toggling of semi-fullscreen mode.
     *
     * @private
     * @param {boolean} on
     */
    function toggleSemiFullscreen(on) {
      if (on) {
        if (!exitSemiFullscreen) {
          exitSemiFullscreen = H5PEditor.semiFullscreen($wrapper, handleEnterSemiFullscreen, handleExitSemiFullscreen);
        }
      }
      else {
        if (exitSemiFullscreen) {
          exitSemiFullscreen();
        }
      }
    }

    this.editor = ReactDOM.render(
      (<Editor
        parent={ this.parent }
        content={ this.content }
        getNewContent={ this.getNewContent.bind(this) }
        libraries={ this.libraries }
        onContentChanged={ this.handleContentChanged.bind(this) }
        onToggleFullscreen={ toggleSemiFullscreen }
        main={ this }
      />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})();
