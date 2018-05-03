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
   * Update the React ref for the form.
   * Could go in the constructor if the form is not kept permanently, but created/destroyed as needed
   *
   * @param {jQuery} $form - Form returned by processSemanticsChunk.
   */
  updateForm ($form) {
    this.refForm.current.innerHTML = '';
    $form.appendTo(this.refForm.current);
  }

  render() {
    const className = `editor-overlay ${this.props.state}`;
    return (
      <div className={className} >
        <div className='top'>
          <span className="icon">{this.props.editorContents.top.icon}</span>
          <span className="title">{this.props.editorContents.top.title}</span>
          <span className="buttons">
          <button className="buttonBlue">{this.props.editorContents.top.saveButton}</button>
          <button className="button" onClick={this.props.closeForm}>{this.props.editorContents.top.closeButton}</button>
          </span>
        </div>
        <div className='content' ref={this.refForm} />
      </div>
    );
  }
}
