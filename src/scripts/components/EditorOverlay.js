import React from 'react';
import './EditorOverlay.scss';

export default class EditorOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      icon: '',
      title: '',
      saveButton: "Save changes", // TODO: Needs to be translatable
      closeButton: "close", // TODO: Needs to be translatable
      nextContentId: -1,
      showNextPathDropzone: false,
      showNextPathChooser: false
    };

    this.refForm = React.createRef();
    this.handleOptionChange = this.handleOptionChange.bind(this);
    this.updateNextContentId = this.updateNextContentId.bind(this);
  }

  /*
   * This is used to pass a reference "child" to the parent. I am eager to
   * learn a better way of updating the DOM from outside a component
   * (I know, you shouldn't), because the H5P core gives me DOM elements, not
   * something I can simply pass as a state.
   */
  componentDidMount() {
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  reset() {
    this.setState({
      icon: '',
      title: '',
      nextContentId: -1,
      showNextPathDropzone: false,
      showNextPathChooser: false
    });
  }

  updateTitle(event) {
    const target = event.target;
    const value = target.value;

    this.setState({title: value});
  }

  /**
   * Update the form for editing an interaction
   *
   * @param {object} interaction - Parameters to set in form.
   */
  updateForm (interaction, elementFields) {
    this.reset();
    this.interaction = interaction || {};

    if (!this.interaction.content) {
      this.interaction.content = {};
      //return; // TODO: Error handling
    }
    this.interaction.content.library = this.interaction.content.library || '';

    const icon = `editor-overlay-icon-${this.camelToKebab(this.interaction.content.library.split('.')[1])}`;
    const title = (this.interaction.getTitle) ? this.interaction.getTitle() : this.interaction.content.library.split('.')[1];
    this.setState({icon: icon, title: title});

    this.interaction.content.params = this.interaction.content.params || {};

    this.passReadies = false;

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(elementFields, this.interaction.content.params, this.interaction.$form, this.props.main);
    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     * TODO: When working, don't keep the component, but create/destroy it as
     *       needed and put this in the constructor. Makes more sense.
     */

    // Keep track of form fields that have been populated by processSemanticsChunk
    this.interaction.children = this.props.main.children;

    this.refForm.current.innerHTML = '';
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

  handleOptionChange (event) {
    switch (event.target.value) {
      case 'end-scenario':
        this.setState({
          nextContentId: -1,
          showNextPathDropzone: false,
          showNextPathChooser: false
        });
        break;
      case 'new-content':
        this.setState({
          showNextPathDropzone: true,
          showNextPathChooser: false
        });
        // On drop, save this one, open new one
        break;
      case 'old-content':
        this.setState({
          showNextPathDropzone: false,
          showNextPathChooser: true
        });
        break;
    }
  }

  /**
   * Check form for validity.
   *
   * @param {object} interaction - Interaction object.
   * @return {boolean} True if valid form entries.
   */
  isValid (interaction) {
    var valid = true;
    var elementKids = interaction.children;
    for (var i = 0; i < elementKids.length; i++) {
      if (elementKids[i].validate() === false) {
        valid = false;
      }
    }
    return valid;
  }

  /*
   * Return data from the form to the callback function.
   */
  saveData = () => {
    // Check if all required form fields can be validated
    if (!this.isValid(this.interaction)) {
      return;
    }

    // Add state to params
    this.interaction.contentTitle = this.state.title;
    this.interaction.nextContentId = this.state.nextContentId;

    this.props.saveData(this.interaction);
    this.props.closeForm();
  }

  /*
   * Remove data.
   */
  removeData = () => {
    this.props.removeData(this.interaction.contentId);
    this.props.closeForm();
  }

  renderNextPathDropzone () {
    return (
      <div class="editor-path-dropzone">
        Drag any content type from a menu on the left side and drop below this node to create new content/question
      </div>
    );
  }

  updateNextContentId (event) {
    this.setState({nextContentId: event.target.value})
  }

  renderNextPathChooser () {
    return (
      <div>
        <label htmlFor="nextPath">Select a path to send a user to</label>
        <select name="nextPath" onChange={this.updateNextContentId}>
          {this.props.content
            .filter((node, index, array) => {
              return (
                node.type.library.split(' ')[0] !== 'H5P.BranchingQuestion' &&
                index !== array.length - 1
              )
            })
            .map((node, key) =>
              <option
                key={key}
                value={ node.contentId }>
                  {`${node.type.library.split(' ')[0].split('.')[1].replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')}: ${node.contentTitle}`}
              </option>)
          }
        </select>
      </div>
    );
  }

  // TODO: The editor-overlay-branching-options could be put in their own component
  render () {
    const className = `editor-overlay ${this.props.state}`;
    return (
      <div className={className} >
        <div className='editor-overlay-header'>
          <span className={['editor-overlay-title', this.state.icon].join(' ')}>{this.state.title}</span>
          <span className="buttons">
          <button className="buttonBlue" onClick={this.saveData}>
            {this.state.saveButton}
          </button>
          <button className="button" onClick={this.removeData}>
            {this.state.closeButton}
          </button>
          </span>
        </div>

        <div className='editor-overlay-content'>
          <div>
            <label className="editor-overlay-label" htmlFor="title">Title<span className="editor-overlay-label-red">*</span></label>
            <input name="title" className='editor-overlay-titlefield' type="text" value={this.state.title} onChange={this.updateTitle.bind(this)} />
          </div>

          <div className='editor-overlay-semantics' ref={this.refForm} />

          <div className='editor-overlay-branching-options'>
            <select onChange={this.handleOptionChange}>
              <option value="end-scenario">End scenario here</option>
              <option value="new-content">Send a viewer to a new content/question</option>
              { this.props.content.length > 1 &&
                <option value="old-content">Send a viewer to an existing content/question</option>
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
