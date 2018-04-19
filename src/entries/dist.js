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

    this.translations = [];

    /**
     * Get all the machine names of content types used.
     *
     * @param {object} [params] - Parameters.
     * @return {object[]} Array of machine names of content types used.
     */
    const getLibraryNames = function (params = {}, results = []) {
      if (!Array.isArray(results) || results.some(result => typeof result !== 'string')) {
        return [];
      }

      if (!params.content || !Array.isArray(params.content)) {
        return results;
      }

      params.content.forEach(content => {
        if (!content.content || typeof content.content !== 'object') {
          return;
        }
        if (content.content.library && typeof content.content.library === 'string' && !results.includes(content.content.library)) {
          results.push(content.content.library);
        }
      });

      return results;
    };

    /**
     * Flatten semantics. Unsanitized.
     *
     * @param {object} field - Semantics field to start with flattening.
     * @return {object[]} Flattened semantics.
     */
    const flattenSemantics = function(field) {
      if (!Array.isArray(field)) {
        field = [field];
      }

      let results = [];

      field.forEach(field => {
        results.push(field);
        if (field.type === 'group') {
          results = results.concat(flattenSemantics(field.fields));
        }
        if (field.type === 'list') {
          results.push(field.field);
          results = results.concat(flattenSemantics(field.field.fields));
        }
      });

      return results;
    };

    /**
     * Check if field properties match a filter in a given way.
     *
     * @param {object} field - Semantics field.
     * @param {object} filter - Filter.
     * @param {string} filter.property - Field property to compare with.
     * @param {number|string|boolean} filter.value - Property value to compare with.
     * @param {string} filter.mode - Comparator between properties, e.g. "===" or "!==".
     * @return {boolean} True, if property matches value given the mode.
     */
    const fieldMatchesFilter = function(field, filter) {
      if (!field || !filter || typeof filter.value === 'undefined') {
        return false;
      }

      if (!filter.mode) {
        filter.mode = '===';
      }

      // More comparators could be added
      switch (filter.mode) {
        case '===':
          return (field[filter.property] === filter.value);
        case '!==':
          return (field[filter.property] !== filter.value);
      }

      return false;
    };

    /**
     * Check if particular comnbination of property filters is given.
     *
     * @param {object} field - Semantics field.
     * @param {object[]} filters - List of filters.
     * @param {string} filters[].property - Field property to compare with.
     * @param {number|string|boolean} filters[].value - Property value to compare with.
     * @param {string} filters[].[mode] - Comparator between properties, e.g. "===" (default) or "!==".
     * @param {string} [mode] - Comparator between filters, e.g. "||" (default) or "&&".
     * @return {boolean} True, if property combination matches mode.
     */
    const andOrOr = function (field, filters = {}, mode = '||') {
      if (!field) {
        return false;
      }

      switch (mode) {
        case '||':
          return filters.some(filter => fieldMatchesFilter(field, filter));
        case '&&':
          return filters.every(filter => fieldMatchesFilter(field, filter));
      }

      return false;
    };

    /**
     * Filter semantics for particular property combinations.
     *
     * @param {object} field - Semantics field.
     * @param {object[]} filters - List of filters.
     * @param {string} filters[].property - Field property to compare with.
     * @param {number|string|boolean} filters[].value - Property value to compare with.
     * @param {string} filters[].[mode] - Comparator between properties, e.g. "===" (default) or "!==".
     * @param {string} [mode] - Comparator between filters, e.g. "||" (default) or "&&".
     */
    const filterSemantics = function (field, filters = [], mode = '||') {
      if (!Array.isArray(filters)) {
        filters = [filters];
      }

      const flatSemantics = flattenSemantics(field);
      return flatSemantics.filter(semantic => andOrOr(semantic, filters, mode));
    };

    // This is terribly slow! Maybe it's better to pull the common semantics fields from somewhere else?
    const promise = new Promise((resolve, reject) => {
      const libraryNames = getLibraryNames(this.params, [parent.currentLibrary]);
      const allSemantics = [];
      libraryNames.forEach(libraryName => {
        H5PEditor.loadLibrary(libraryName, result => {
          allSemantics.push({library: libraryName, semantics: {
            type: 'group',
            fields: result
          }});
          if (allSemantics.length === libraryNames.length) {
            resolve(allSemantics);
          }
        });
      });
    });

    promise.then((results) => {
      results.forEach(result => {
        // Can contain "common" group fields with further "common" text fields nested inside
        const firstFilter = filterSemantics(result.semantics, {property: 'common', value: true});

        // Flatten out the firstFilter to get a plain structure
        this.translations[result.library] = filterSemantics(firstFilter, {property: 'type', value: 'text'});
      });
      /*
       * TODO:
       * this.translations now contains all translatable fields as
       *
       * [
       *   {
       *     "Library Machine Name x.y": [
       *       {name: ...},
       *       {name: ...}
       *     ]
       *   }
       * ]
       *
       * BUT the procedure is too slow, and we still don't have the values from params and would have
       * to get them, too. There must be a smarter way!
       */
      console.log(this.translations);
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
  }

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
    // TODO: Run validate on all subcontent types to trigger the storing of values
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
   * Append Editor to DOM.
   *
   * @param {jQuery} $wrapper - Container in DOM.
   */
  BranchingScenarioEditor.prototype.appendTo = function ($wrapper) {
    $wrapper.parent().css('padding', 0);

    ReactDOM.render(
     (<Editor
       settings={this.settings}
       startImageChooser={this.startImageChooser}
       endImageChooser={this.endImageChooser}
       updateParams={this.updateParams.bind(this)}
     />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})(H5P.jQuery);
