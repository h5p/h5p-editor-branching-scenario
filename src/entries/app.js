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

    this.elementFields = this.findField('content', this.field.fields);
    this.libraries = this.findField('type', this.elementFields.field.fields).options;

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

    const testCases = {
      empty: [
      ],

      // Simple path of 5 successive nodes
      simplePath: [
        {
          contentTitle: 'Text 1',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 1"}
          }
        },
        {
          contentTitle: 'Text 2',
          nextContentId: 2,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 2"}
          }
        },
        {
          contentTitle: 'Text 3',
          nextContentId: 3,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 3"}
          }
        },
        {
          contentTitle: 'Text 4',
          nextContentId: 4,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 4"}
          }
        },
        {
          contentTitle: 'Text 5',
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 5"}
          }
        }
      ],

      // 5 nodes with a cycle
      cyclePath: [
        {
          contentTitle: 'Text 1',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 1"}
          }
        },
        {
          contentTitle: 'Text 2',
          nextContentId: 2,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 2"}
          }
        },
        {
          contentTitle: 'Text 3',
          nextContentId: 3,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 3"}
          }
        },
        {
          contentTitle: 'Text 4',
          nextContentId: 4,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 4"}
          }
        },
        {
          contentTitle: 'Text 5',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 5"}
          }
        }
      ],

      // Simple branching
      branching1: [
        {
          contentTitle: 'Text 1',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 1"}
          }
        },
        {
          type: {
            library: 'H5P.BranchingQuestion 1.0',
            params: {
              question: "<p>hello, who are you?</p>",
              alternatives: [
                {
                  text: 'A1',
                  nextContentId: 2,
                  addFeedback: false
                },
                {
                  text: 'A2',
                  nextContentId: 5,
                  addFeedback: false
                }
              ]
            }
          },
          contentTitle: 'branch'
        },
        {
          contentTitle: 'Text 2',
          nextContentId: 4,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 2"}
          }
        },
        {
          contentTitle: 'Text 3',
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 3"}
          }
        },
        {
          contentTitle: 'Text 4',
          nextContentId: 5,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 4"}
          }
        },
        {
          contentTitle: 'Text 5',
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 5"}
          }
        },
      ],

      // Branching
      branching2: [
        {
          nextContentId: 1,
          type: {
            library: 'H5P.Video 1.3',
            params: {}
          }
        },
        {
          type: {
            library: 'H5P.BranchingQuestion 1.0',
            params: {
              question: "<p>hello, who are you?</p>",
              alternatives: [
                {
                  text: 'A1',
                  nextContentId: 2,
                  addFeedback: false
                },
                {
                  text: 'A2',
                  //nextContentId: 6,
                  addFeedback: false
                },
                {
                  text: 'A3',
                  nextContentId: 3,
                  addFeedback: false
                }
              ]
            }
          },
          contentTitle: 'the void'
        },
        {
          type: {
            library: 'H5P.InteractiveVideo 1.17',
            params: {}
          },
          contentTitle: 'Some nice IV action'
        },
        {
          type: {
            library: 'H5P.BranchingQuestion 1.0',
            params: {
              question: "<p>hello, who are you?</p>",
              alternatives: [
                {
                  text: 'A1',
                  nextContentId: 4,
                  addFeedback: false
                },
                {
                  text: 'A2',
                  nextContentId: 5,
                  addFeedback: false
                }
              ]
            }
          },
          contentTitle: 'Just some text ...'
        },
        {
          nextContentId: 6,
          type: {
            library: 'H5P.Image 1.0',
            params: {}
          },
          contentTitle: 'An image intro!'
        },
        {
          type: {
            library: 'H5P.Image 1.0',
            params: {}
          },
          contentTitle: 'What image?'
        },
        {
          type: {
            library: 'H5P.Image 1.0',
            params: {}
          },
          contentTitle: 'That image!'
        }
      ],

      // Branching with Loop
      branchingLoopAlternative: [
        {
          contentTitle: 'Text 1',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 1"}
          }
        },
        {
          type: {
            library: 'H5P.BranchingQuestion 1.0',
            params: {
              question: "<p>hello, who are you?</p>",
              alternatives: [
                {
                  text: 'A1',
                  nextContentId: 2,
                  addFeedback: false
                },
                {
                  text: 'A2',
                  nextContentId: 3,
                  addFeedback: false
                }
              ]
            }
          },
          contentTitle: 'branch'
        },
        {
          contentTitle: 'Text 2',
          nextContentId: 4,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 2"}
          }
        },
        {
          contentTitle: 'Text 3',
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 3"}
          }
        },
        {
          contentTitle: 'Text 4',
          nextContentId: 5,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 4"}
          }
        },
        {
          contentTitle: 'Text 5',
          nextContentId: 3,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 5"}
          }
        },
      ],

      // Branching with Loop
      branchingEndScreenAlternative: [
        {
          contentTitle: 'Text 1',
          nextContentId: 1,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 1"}
          }
        },
        {
          type: {
            library: 'H5P.BranchingQuestion 1.0',
            params: {
              question: "<p>hello, who are you?</p>",
              alternatives: [
                {
                  text: 'A1',
                  nextContentId: 2,
                  addFeedback: false
                },
                {
                  text: 'A2',
                  nextContentId: -99,
                  addFeedback: false
                }
              ]
            }
          },
          contentTitle: 'branch'
        },
        {
          contentTitle: 'Text 2',
          nextContentId: 4,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 2"}
          }
        },
        {
          contentTitle: 'Text 3',
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 3"}
          }
        },
        {
          contentTitle: 'Text 4',
          nextContentId: 5,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 4"}
          }
        },
        {
          contentTitle: 'Text 5',
          nextContentId: 3,
          type: {
            library: 'H5P.AdvancedText 1.1',
            params: {"text": "Text 5"}
          }
        },
      ],

    };

    // For testing, line can be removed afterwards
    // this.params.content = testCases.branching2;

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

    /**
     * Flatten semantics.
     * Unsanitized. Will keep track of the old path, so it can be "reverted" later.
     *
     * @param {object} field - Semantics field to start with flattening.
     * @param {object[]} [path] - Start path to be added.
     * @return {object[]} Flattened semantics.
     */
    const flattenSemantics = function (field, path = []) {
      if (!Array.isArray(field)) {
        field = [field];
      }

      let results = [];
      const currentPath = path.slice();

      field
        .filter(field => field !== undefined)
        .forEach(field => {
          const nextPathItem = field.name ? [field.name] : [];
          field.path = currentPath;
          results.push(field);
          if (field.type === 'group') {
            results = results.concat(flattenSemantics(field.fields, currentPath.concat(nextPathItem)));
          }
          if (field.type === 'list') {
            results = results.concat(flattenSemantics(field.field.fields, currentPath.concat(nextPathItem).concat([field.field.name])));
          }
        });

      return results;
    };

    /**
     * Check if field properties match a filter in a given way.
     * TODO: Better solution, step 1: Do the filtering via a function such as semanticsFilter(semantics, filterFunction)
     * TODO: Better solution, step 2: Build a semantics class with a function such as filter(filterFunction)
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

    /*
     * This is terribly slow! Maybe it's better to pull the common semantics fields from somewhere else?
     * Also: IE 11 doesn't support promises (and async/await) and'd need a Polyfill or an oldfashioned
     * solution.
     *
     * This complete approach is crap.
     */
    const promise = new Promise(resolve => {
      // Add all libraries that are not used but options in semantics
      let librariesUsed = this.libraries.filter((library, index, array) => array.indexOf(library) === index);

      const allSemantics = [];
      librariesUsed.forEach(libraryName => {
        H5PEditor.loadLibrary(libraryName, result => {
          allSemantics.push({library: libraryName, semantics: {
            type: 'group',
            fields: result
          }});
          if (allSemantics.length === librariesUsed.length) {
            resolve(allSemantics);
          }
        });
      });
    });
    promise.then((results) => {
      this.allSemantics = results.filter(result => result.semantics.fields !== null);
      this.allSemantics.forEach(result => {
        // Can contain "common" group fields with further "common" text fields nested inside
        const firstFilter = filterSemantics(result.semantics, {property: 'common', value: true});
        let fields = filterSemantics(firstFilter, {property: 'type', value: 'text'});
        fields.forEach(field => {
          field.library = result.library;
        });
      });
      this.buildContentEditorForms();
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
   * Build editors for existing content, so common fields are available
   * on load
   */
  BranchingScenarioEditor.prototype.buildContentEditorForms = function () {
    // Render all forms up front, so common fields are available
    this.params.content.forEach((contentParams) => {
      var elementFields = this.getSemantics(contentParams.type.library);
      var $form = H5P.jQuery('<div/>');
      H5PEditor.processSemanticsChunk(
        elementFields,
        contentParams.type.params,
        $form,
        this,
        contentParams.type.library
      );

      contentParams.$form = $form;
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
   * Get semantics fields for a library.
   *
   * @param {string} libraryName - Library name.
   * @return {object} Semantics for library.
   */
  BranchingScenarioEditor.prototype.getSemantics = function (libraryName) {
    let elementFields = {};
    if (this.allSemantics) {
      const testLibrary = this.allSemantics.filter(item => item.library.indexOf(libraryName) !== -1)[0];
      elementFields = testLibrary.semantics.fields;
    }
    return elementFields;
  };

  /**
   * Validate the current field.
   *
   * @returns {boolean} True if validatable.
   */
  BranchingScenarioEditor.prototype.validate = function () {
    // TODO: Run validate on all subcontent types
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

  BranchingScenarioEditor.prototype.findField = function (name, fields) {
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].name === name) {
        return fields[i];
      }
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
        getSemantics={ this.getSemantics.bind(this) }
      />), $wrapper.get(0)
    );
  };

  return BranchingScenarioEditor;
})();
