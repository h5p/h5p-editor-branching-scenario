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

    this.buildContentEditorForms();
  }

  /**
   * Build editors for existing content, so common fields are available
   * on load
   */
  BranchingScenarioEditor.prototype.buildContentEditorForms = function () {
    // Note that this is just the initial array, it will be maintained as a state in <Canvas>
    this.content = [];
    // Render all forms up front, so common fields are available
    this.params.content.forEach(params => this.content.push(this.getNewContent(params)));
  };

  /**
   * Create Content object with editor form and params
   *
   * @param {Object} params
   * @return {Object} Contnet object
   */
  BranchingScenarioEditor.prototype.getNewContent = function (params) {
    // To be restored once done (processSemanticsChunk() replaces current children)
    const children = this.children;

    // Create content object that holds the editor form and params
    const content = {
      formWrapper: document.createElement('div'),
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
    content.formChildren = this.children;

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
        parent={this.parent}
        content={ this.content }
        getNewContent={ this.getNewContent.bind(this) }
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
