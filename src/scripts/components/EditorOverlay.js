import React from 'react';
import './EditorOverlay.scss';
import Dropzone from './Dropzone.js';

/*global H5PEditor, H5P*/
export default class EditorOverlay extends React.Component {
  constructor(props) {
    super(props);

    this.refForm = React.createRef();
    this.passReadies = false;

    const content = this.props.content[this.props.id] || {};
    content.contentTitle = content.contentTitle || content.type.library.split('.')[1];

    content.$form = H5P.jQuery('<div/>');

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(this.props.elementFields, content.type.params, content.$form, this.props.main);

    // TODO: l10n object
    this.state = {
      saveButton: "Save changes", // TODO: Needs to be translatable
      closeButton: "close", // TODO: Needs to be translatable
      showNextPathDropzone: false,
      showNextPathChooser: content.nextContentId > -1,
      branchingOptions: (content.nextContentId > -1) ? "old-content" : 'end-scenario',
      content: content
    };
  }

  /*
   * This is used to pass a reference "child" to the parent. I am eager to
   * learn a better way of updating the DOM from outside a component
   * (I know, you shouldn't), because the H5P core gives me DOM elements, not
   * something I can simply pass as a state.
   */
  componentDidMount () {
    this.props.onRef(this);

    // Try to listen to everything in the form
    // TODO: Also catch the CKEditor, Drag'n'Drop, etc.
    this.state.content.$form.on('keypress click change blur', () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });

    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay component's contents.
     */
    this.state.content.$form.appendTo(this.refForm.current);
  }

  componentWillUnmount () {
    this.props.onRef(undefined);
  }

  /**
   * Update title in header as it is changed in the title field.
   *
   * @param {object} event - Change event.
   */
  handleUpdateTitle = (event) => {
    const value = event.target.value;

    this.setState(prevState => {
      const newState = prevState;
      newState.content.contentTitle = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  }

  handleOptionChange = (event) => {
    switch (event.target.value) {
      case 'end-scenario':
        this.setState({
          nextContentId: -1,
          showNextPathDropzone: false,
          showNextPathChooser: false,
          branchingOptions: event.target.value
        });
        break;
      case 'new-content':
        this.setState({
          showNextPathDropzone: true,
          showNextPathChooser: false,
          branchingOptions: event.target.value
        });
        break;
      case 'old-content':
        this.setState({
          showNextPathDropzone: false,
          showNextPathChooser: true,
          branchingOptions: event.target.value
        });
        break;
    }

    this.props.onContentChanged(this.props.id, this.state.content);
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
    const value = parseInt(event.target.value);

    this.setState(prevState => {
      const newState = prevState;
      newState.content.nextContentId = value;

      return newState;
    }, () => {
      this.props.onContentChanged(this.props.id, this.state.content);
    });
  }

  renderNextPathChooser () {
    return (
      <div>
        <label htmlFor="nextPath">Select a path to send a user to</label>
        <select name="nextPath" value={ this.state.content.nextContentId } onChange={ this.updateNextContentId }>
          { this.props.content
            .filter((content) => {
              return (
                content.type.library.split(' ')[0] !== 'H5P.BranchingQuestion' &&
                  this.props.id !== this.props.content.indexOf(content)
              );
            })
            .map(content =>
              <option
                key={ 'next-path-' + this.props.content.indexOf(content) }
                value={ this.props.content.indexOf(content) }>
                {`${content.type.library.split(' ')[0].split('.')[1].replace(/([A-Z])([A-Z])([a-z])|([a-z])([A-Z])/g, '$1$4 $2$3$5')}: ${content.contentTitle}`}
              </option>)
          }
        </select>
      </div>
    );
  }

  // TODO: The editor-overlay-branching-options could be put in their own component
  render () {
    return (
      <div className='editor-overlay'>
        <div className='editor-overlay-header'>
          <span className={ ['editor-overlay-title', this.props.icon].join(' ') }>{ this.state.content.contentTitle }</span>
          <span className="buttons">
            <button className="buttonBlue" onClick={ () => {this.props.onFormSaved(this.props.id, this.state.content);} }>
              { this.state.saveButton }
            </button>
            <button className="button" onClick={ this.props.onFormClosed }>
              { this.state.closeButton }
            </button>
          </span>
        </div>

        <div className='editor-overlay-content'>
          <div>
            <label className="editor-overlay-label" htmlFor="title">Title<span className="editor-overlay-label-red">*</span></label>
            <input name="title" className='editor-overlay-titlefield' type="text" value={ this.state.content.contentTitle } onChange={ this.handleUpdateTitle } />
          </div>

          <div className='editor-overlay-semantics' ref={ this.refForm } />

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
