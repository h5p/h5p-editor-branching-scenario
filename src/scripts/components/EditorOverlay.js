import React from 'react';
import './EditorOverlay.scss';
import Dropzone from './Dropzone.js';

export default class EditorOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      icon: '',
      title: '',
      saveButton: "Save changes", // TODO: Needs to be translatable
      closeButton: "close", // TODO: Needs to be translatable
      nextContentId: undefined,
      showNextPathDropzone: false,
      showNextPathChooser: false,
      nextPath: '',
      branchingOptions: ''
    };

    this.refForm = React.createRef();
  }

  /*
   * This is used to pass a reference "child" to the parent. I am eager to
   * learn a better way of updating the DOM from outside a component
   * (I know, you shouldn't), because the H5P core gives me DOM elements, not
   * something I can simply pass as a state.
   */
  componentDidMount () {
    this.props.onRef(this);
  }

  componentWillUnmount () {
    this.props.onRef(undefined);
  }

  reset () {
    this.setState({
      icon: '',
      title: '',
      //nextContentId: -1,
      showNextPathDropzone: false,
      showNextPathChooser: false,
      nextPath: '',
      branchingOptions: ''
    });
  }

  /**
   * Update title in header as it is changed in the title field.
   *
   * @param {object} event - Change event.
   */
  handleUpdateTitle = (event) => {
    const value = event.target.value;
    this.setState({title: value});
    this.interaction.contentTitle = value;
    this.props.onContentChanged;
  }

  /**
   * Update the form for editing an interaction
   *
   * @param {number} contentId - ContentID.
   * @param {object} interaction - Parameters to set in form.
   * @param {object} elementFields - Semantics fields for validation.
   * @param {object} extras - Additional parameters.
   * @param {string} extras.state - Particular state.
   */
  updateForm (contentId, interaction, elementFields, extras) {
    this.reset();
    // Holds the reference to the object we're modifying
    this.interaction = interaction || {};
    this.extras = extras;

    const icon = `editor-overlay-icon-${this.camelToKebab(this.interaction.type.library.split('.')[1])}`;
    const title = this.interaction.contentTitle || this.interaction.type.library.split('.')[1];
    this.setState({contentId: contentId, icon: icon, title: title});

    this.passReadies = false;

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(elementFields, this.interaction.type.params, this.interaction.$form, this.props.main);
    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     * TODO: When working, don't keep the component, but create/destroy it as
     *       needed and put this in the constructor. Makes more sense.
     */

    this.refForm.current.innerHTML = '';

    // Try to listen to everything in the form
    // TODO: Also catch the CKEditor, Drag'n'Drop, etc.
    this.interaction.$form.on('keypress click change blur', () => {
      this.props.onContentChanged;
    });

    if (this.interaction.nextContentId) {
      // TODO: The options for changing the next node might be restricted here
      this.setState({
        branchingOptions: 'old-content',
        showNextPathChooser: true,
        nextPath: this.interaction.nextContentId
      });
    }
    else {
      this.props.onContentChanged(contentId, -1);
    }

    this.interaction.$form.appendTo(this.refForm.current);
  }

  /**
   * Convert camel case to kebab case.
   *
   * @param {string} camel - Camel case.
   * @return {string} Kebab case.
   */
  camelToKebab (camel) {
    return camel.split('').map((char, i) => {
  		if (i === 0) {
  			return char.toLowerCase();
  		}
      if (char === char.toUpperCase()) {
  			return `-${char.toLowerCase()}`;
  		}
  		return char;
	   }).join('');
  }

  handleOptionChange = (event) => {
    switch (event.target.value) {
      case 'end-scenario':
        this.setState({
          nextContentId: undefined, // TODO: Check if this causes trouble, should be -1 eventually, or changed in BS
          showNextPathDropzone: false,
          showNextPathChooser: false
        });
        break;
      case 'new-content':
        this.setState({
          showNextPathDropzone: true,
          showNextPathChooser: false
        });
        break;
      case 'old-content':
        this.setState({
          showNextPathDropzone: false,
          showNextPathChooser: true
        });
        break;
    }

    this.setState({branchingOptions: event.target.value});
    this.props.onContentChanged
  }

  /**
   * Check form for validity.
   *
   * @param {object} interaction - Interaction object.
   * @return {boolean} True if valid form entries.
   */
  isValid (interaction) {
    var valid = true;
    var elementKids = this.props.main.children;
    for (var i = 0; i < elementKids.length; i++) {
      if (elementKids[i].validate() === false) {
        valid = false;
      }
    }
    return valid;
  }

  /**
   * Return data from the form to the callback function.
   *
   * @return {number} ContentId of saved interaction.
   */
  handleSaveData = () => {
    // Check if all required form fields can be validated
    if (!this.isValid(this.interaction)) {
      return;
    }

    delete this.interaction.$form;
    this.props.onContentChanged;
    this.props.closeForm();

    return this.props.handleNeedNodeId(this.interaction);
  }

  /*
   * Remove data.
   */
  handleRemoveData = () => {
    if (this.extras && this.extras.state === 'new') {
      this.props.onRemoveData();
    }
    this.props.closeForm();
  }

  renderNextPathDropzone () {
    return (
      <Dropzone
        ref={ element => this.props.onNextPathDrop(element) }
        elementClass={ 'dropzone-editor-path'}
        innerHTML={ 'Drag any content type from a menu on the left side and drop it here to create new content/question' }
      />
    );
  }

  updateNextContentId = (event) => {
    this.setState({
      nextContentId: event.target.value,
      nextPath: event.target.value
    })
    this.props.onContentChanged(this.state.contentId, parseInt(event.target.value));
  }

  renderNextPathChooser () {
    return (
      <div>
        <label htmlFor="nextPath">Select a path to send a user to</label>
        <select name="nextPath" value={this.state.nextPath} onChange={ this.updateNextContentId }>
          { this.props.content
            .filter((node, index) => {
              return (
                node.type.library.split(' ')[0] !== 'H5P.BranchingQuestion' &&
                  this.props.handleNeedNodeId(this.interaction) !== this.props.handleNeedNodeId(node)
              )
            })
            .map(node =>
              <option
                key={ 'next-path-' + this.props.handleNeedNodeId(node) }
                value={ this.props.handleNeedNodeId(node) }>
                  {`${node.type.library.split(' ')[0].split('.')[1].replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')}: ${node.contentTitle}`}
              </option>)
          }
        </select>
      </div>
    );
  }

  // TODO: The editor-overlay-branching-options could be put in their own component
  render () {

    // Update the params
    this.props.onContentChanged;

    const visibilityClass = this.props.visibility ? 'active' : 'inactive';

    const className = `editor-overlay ${visibilityClass}`;
    return (
      <div className={className} >
        <div className='editor-overlay-header'>
          <span className={['editor-overlay-title', this.state.icon].join(' ')}>{this.state.title}</span>
          <span className="buttons">
          <button className="buttonBlue" onClick={this.handleSaveData}>
            {this.state.saveButton}
          </button>
          <button className="button" onClick={this.handleRemoveData}>
            {this.state.closeButton}
          </button>
          </span>
        </div>

        <div className='editor-overlay-content'>
          <div>
            <label className="editor-overlay-label" htmlFor="title">Title<span className="editor-overlay-label-red">*</span></label>
            <input name="title" className='editor-overlay-titlefield' type="text" value={this.state.title} onChange={this.handleUpdateTitle} />
          </div>

          <div className='editor-overlay-semantics' ref={this.refForm} />

          <div className='editor-overlay-branching-options'>
            <select value={ this.state.branchingOptions } onChange={ this.handleOptionChange }>
              <option key="branching-option-0" value="end-scenario">End scenario here</option>
              <option key="branching-option-1" value="new-content">Send a viewer to a new content/question</option>
              { this.props.content.length > 1 &&
                <option key="branching-option-2" value="old-content">Send a viewer to an existing content/question</option>
              }
            </select>

            { this.state.showNextPathDropzone &&
              this.renderNextPathDropzone()
            }

            { this.state.showNextPathChooser &&
              this.renderNextPathChooser()
            }
          </div>
        </div>

      </div>
    );
  }
}
