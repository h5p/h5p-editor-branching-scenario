import React from 'react'
import ReactDOM from 'react-dom'
import Editor from '../scripts/editor'

/*global H5PEditor, H5P*/
H5PEditor.widgets.branchingScenario = H5PEditor.BranchingScenario = (function ($) {

  function BranchingScenarioEditor(parent, field, params, setValue) {
  }

  BranchingScenarioEditor.prototype.appendTo = function ($wrapper) {
   $wrapper.parent().css('padding', 0);

    ReactDOM.render(
     (<Editor/>), $wrapper.get(0)
   )
  }

  return BranchingScenarioEditor;
})(H5P.jQuery);
