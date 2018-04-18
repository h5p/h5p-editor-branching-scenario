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

    // TODO: Sanitization (in Branching Scenario)
    this.params = $.extend({
      title: 'foobar',
      startScreen : {
        startScreentitle: '',
        startScreenSubtitle: ''
      }
    }, params);
    setValue(field, this.params);

    // TODO: Match semantics with design
    this.settings = {
      startTitle: '',
      startSubtitle: '',
      startImage: undefined,
      endScore: 0,
      endFeedback: '',
      endImage: undefined,
      optionsSkipToAQuestion: false,
      optionsConfirmOnAlternative: false,
      optionsTryAnotherChoice: false,
      optionsDisplayScore: false
    };

    this.passReadies = true;
    parent.ready(() => this.passReadies = false);
  }

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
     />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})(H5P.jQuery);
