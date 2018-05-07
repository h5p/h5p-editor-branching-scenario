import React from 'react';
import './EditorOverlay.scss';

export default class EditorOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.refForm = React.createRef();
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

  /**
   * Update the form for editing an interaction
   *
   * @param {object} interaction - Parameters to set in form.
   */
  updateForm (interaction, elementFields) {
    interaction = interaction || {};
    if (!interaction.content) {
      interaction.content = {};
      //return; // TODO: Error handling
    }
    interaction.content.library = interaction.content.library || 'H5P.Image';
    interaction.content.params = interaction.content.params || {};
    this.interaction = interaction;

    this.passReadies = false;

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(elementFields, interaction.content.params, interaction.$form, this.props.main);
    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     * TODO: When working, don't keep the component, but create/destroy it as
     *       needed and put this in the constructor. Makes more sense.
     */
    this.refForm.current.innerHTML = '';
    interaction.$form.appendTo(this.refForm.current);
  }

  /*
   * Return data from the form to the callback function.
   */
  saveData = () => {
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

  render() {
    const className = `editor-overlay ${this.props.state}`;
    return (
      <div className={className} >
        <div className='top'>
          <span className="icon">{this.props.editorContents.top.icon}</span>
          <span className="title">{this.props.editorContents.top.title}</span>
          <span className="buttons">
          <button className="buttonBlue" onClick={this.saveData}>
            {this.props.editorContents.top.saveButton}
          </button>
          <button className="button" onClick={this.removeData}>
            {this.props.editorContents.top.closeButton}
          </button>
          </span>
        </div>
        <div className='content' ref={this.refForm} />
      </div>
    );
  }
}
