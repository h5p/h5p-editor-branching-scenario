import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../scripts/editor';

/*global H5PEditor, H5P*/
H5PEditor.widgets.branchingScenario = H5PEditor.BranchingScenario = (function ($) {
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

    this.params = params || {};
    setValue(field, this.params);

    // TODO: Match semantics with design
    // TODO: Sanitized access more elegantly
    this.params.startScreen = this.params.startScreen || {};
    this.params.startScreen.startScreenTitle = this.params.startScreen.startScreenTitle || '';
    this.params.startScreen.startScreenSubtitle = this.params.startScreen.startScreenSubtitle || '';

    this.settings = {
      startTitle: this.params.startScreen.startScreenTitle,
      startSubtitle: this.params.startScreen.startScreenSubtitle,
      //startImage: this.params.startScreen.startScreenImage.path, // TODO: Adapt to use widget
      endScore: 0, // TODO: Doesn't have a match in current semantics
      endFeedback: '', // TODO: Doesn't have a match in current semantics
      //endImage: this.params.endScreens[0].endScreenImage.path, // TODO: Adapt to use widget
      optionsSkipToAQuestion: false, // TODO: Doesn't have a match in current semantics
      optionsConfirmOnAlternative: false, // TODO: Doesn't have a match in current semantics
      optionsTryAnotherChoice: false, // TODO: Doesn't have a match in current semantics
      optionsDisplayScore: false // TODO: Doesn't have a match in current semantics
    };

    this.passReadies = true;
    parent.ready(() => this.passReadies = false);
  }

  BranchingScenarioEditor.prototype.updateParams = function (data) {
    // TODO Switch here if we accept data from more than one component
    this.params.startScreen.startScreenTitle = data.startTitle;
    this.params.startScreen.startScreenSubtitle = data.startSubtitle;

    // TODO: Adapt to use widget
    //this.params.startScreen.startScreenImage.path = data.startImage;
    //this.params.endScreens[0].endScreenImage.path = data.endImage;
  };

  /**
   * Validate the current field.
   *
   * @returns {boolean} True if validatable.
   */
  BranchingScenarioEditor.prototype.validate = function () {
    // TODO: Run validate on all subcontent types to trigger the storing of values
    return true;
  };

  /**
   * Append Editor to DOM.
   *
   * @param {jQuery} $wrapper - Container in DOM.
   */
  BranchingScenarioEditor.prototype.appendTo = function ($wrapper) {
    $wrapper.parent().css('padding', 0);

    ReactDOM.render(
     (<Editor
       settings={this.settings}
       updateParams={this.updateParams.bind(this)}
     />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})(H5P.jQuery);
