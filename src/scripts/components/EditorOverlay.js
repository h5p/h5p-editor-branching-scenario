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
   * @param {string} libraryName - Name of the interaction library to use.
   * @param {object} [elementParams] - Parameters to set in form.
   */
  updateForm (libraryName = 'H5P.Image', elementParams = {}) {
    this.passReadies = false;

    const $form = H5P.jQuery('<div/>');

    let elementFields = {};
    const allSemantics = this.props.main.getAllSemantics();
    if (allSemantics) {
      const testLibrary = allSemantics.filter(item => item.library.indexOf(libraryName) !== -1)[0];
      elementFields = testLibrary.semantics.fields;
    }

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(elementFields, elementParams, $form, this.props.main);
    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     * TODO: When working, don't keep the component, but create/destroy it as
     *       needed and put this in the constructor. Makes more sense.
     */
    this.refForm.current.innerHTML = '';
    $form.appendTo(this.refForm.current);
  }

  /*
   * Return data from the form to the callback function.
   */
  saveData = () => {
    // TODO: Replace foo with parameters from the form, cmp. e.g. IV
    this.props.saveData('foo');
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
          <button className="button" onClick={this.props.closeForm}>
            {this.props.editorContents.top.closeButton}
          </button>
          </span>
        </div>
        <div className='content' ref={this.refForm} />
      </div>
    );
  }
}
