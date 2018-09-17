import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import TooltipButton from './TooltipButton';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);

    // TODO: This needs to come from app and needs to be sanitized
    this.l10n = {
      tooltipInfo: 'Add Informational content to the <strong>Branching Question Set.</strong>',
      tooltipBranching: 'Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>',
      tooltipReuse: 'Add content from the clipboard to the <strong>Branching Question Set.</strong>'
    };

    this.state = {
      canPaste: {
        canPaste: null, // null to implicitly track that setCanPaste has not run yet
        reason: 'pasteNoContent'
      }
    };
  }

  componentDidMount() {
    H5P.externalDispatcher.on('datainclipboard', () => {
      if (this.props.libraries) {
        this.setCanPaste(this.props.libraries);
      }
    });
  }

  componentWillUnmount() {
    H5P.externalDispatcher.off('datainclipboard');
  }

  componentDidUpdate() {
    // Set canPaste only once as soon as the libraries have been loaded
    if (this.state.canPaste.canPaste === null && this.props.libraries) {
      this.state.canPaste.canPaste = false;
      this.setCanPaste(this.props.libraries);
    }
  }

  handleMouseDown = (event, library) => {
    if (event.button !== 0) {
      return; // Only handle left click
    }

    // Get library from clipboard
    let defaults;
    let inUse = library;
    if (library === 'reuse-question') {

      // Inform user if content cannot be pasted
      if (this.state.canPaste.canPaste === false) {
        if (this.state.canPaste.reason === 'pasteTooOld' || this.state.canPaste.reason === 'pasteTooNew') {
          this.confirmPasteError(this.state.canPaste.description, document, () => {});
        }
        else {
          H5PEditor.attachToastTo(
            this.reuseButton,
            this.state.canPaste.description,
            {position: {
              horizontal: 'center',
              vertical: 'above',
              noOverflowX: true
            }}
          );
        }
      }

      // Sanitization
      const clipboard = H5P.getClipboard();
      if (!clipboard || !clipboard.generic || !clipboard.generic.library) {
        return;
      }

      library = (this.props.libraries) ?
        this.props.libraries.find(library => library.name === clipboard.generic.library) :
        undefined;
      if (typeof library === 'undefined') {
        return;
      }

      // Pasted Branching Questions should not have next nodes
      if (library.name.indexOf ('H5P.BranchingQuestion ') === 0) {
        clipboard.generic.params.branchingQuestion.alternatives.forEach(alt => {
          alt.nextContentId = -1;
        });
      }

      defaults = {
        params: clipboard.generic.params,
        specific: clipboard.specific
      };
    }

    // Prevent
    this.setState({
      inUse: (inUse === 'reuse-question') ? inUse : library
    });

    const raw = event.currentTarget.getBoundingClientRect();
    this.props.onMouseDown({
      target: event.target,
      startX: event.pageX,
      startY: event.pageY,
      position: {
        x: raw.left - 1,
        y: raw.top - 58
      },
      library: library,
      defaults: defaults
    });
  }

  /**
   * set state for canPaste.
   *
   * @param {object} libraries Libraries available.
   */
  setCanPaste = (libraries) => {
    // Transform libraries to expected format
    libraries = libraries.map(lib => {
      const name = lib.name.split(' ')[0];
      lib = H5P.libraryFromString(lib.name);
      lib.name = name;
      return lib;
    });

    this.setState({
      canPaste: H5PEditor.canPastePlus(H5P.getClipboard(), libraries)
    });
  }

  /**
   * Confirm replace if there is content selected.
   *
   * @param {string} message Message.
   * @param {number} top Offset.
   * @param {function} next Next callback.
   */
  confirmPasteError = (message, top, next) => {
    // Confirm changing library
    const confirmReplace = new H5P.ConfirmationDialog({
      headerText: H5PEditor.t('core', 'pasteError'),
      dialogText: message,
      cancelText: ' ',
      confirmText: H5PEditor.t('core', 'ok')
    }).appendTo(document.body);
    confirmReplace.on('confirmed', next);
    confirmReplace.show(top);
  };

  renderDnDButtons() {
    if (!this.props.libraries) {
      return (
        <div className="loading">Loading…</div>
      );
    }

    let listItems = this.props.libraries.map(library => {
      if (library.className === 'branchingquestion') {
        return '';
      }

      let className = library.className;
      if (this.props.inserting && this.props.inserting.library === library && this.state.inUse === library) {
        className += ' greyout';
      }

      return <li
        key={ Math.random() }
        className={ className }
        onMouseDown={ event => this.handleMouseDown(event, library) }
      >
        { library.title }
      </li>;
    });

    return (
      <ul className="content-type-buttons">
        { listItems }
      </ul>
    );
  }

  renderSecondButtons() {
    if (!this.props.libraries) {
      return (
        <div className="loading">Loading…</div>
      );
    }
    const bs = this.props.libraries.find(library => library.className === 'branchingquestion');
    let className = bs.className;
    if (this.props.inserting && this.props.inserting.library === bs && this.state.inUse === bs) {
      className += ' greyout';
    }

    return (
      <ul className="content-type-buttons">
        <li className={ className } title="Add New Branching Question" onMouseDown={ event => this.handleMouseDown(event, bs) }>Branching Question</li>
      </ul>
    );
  }

  renderReuseButton() {
    if (!this.props.libraries) {
      return (
        <div className="loading">Loading…</div>
      );
    }

    let className = 'reuse-question';
    if (this.props.inserting && this.state.inUse === className) {
      className += ' greyout';
    }
    if (!this.state.canPaste.canPaste) {
      className += ' disabled';
    }

    return (
      <ul className="content-type-buttons">
        <li
          ref={ node => this.reuseButton = node }
          className={ className }
          title="Add from clipboard"
          onMouseDown={ event => this.handleMouseDown(event, 'reuse-question') }
        >
          From a clipboard
        </li>
      </ul>
    );
  }

  render() {
    // TODO: Keep width constant during loading. Fix only one loading message for the entire menu?
    return (
      <div className="content-type-menu">
        <label className="label-info">
          Info Content
          <TooltipButton
            text={ this.l10n.tooltipInfo }
            tooltipClass={ 'tooltip below' }
          />
        </label>
        { this.renderDnDButtons() }
        <label className="label-info">
          Branching Content
          <TooltipButton
            text={ this.l10n.tooltipBranching }
          />
        </label>
        { this.renderSecondButtons() }
        <label className="label-info">
          Reuse Content
          <TooltipButton
            text={ this.l10n.tooltipReuse }
          />
        </label>
        { this.renderReuseButton() }
      </div>
    );
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  handleMouseDown: PropTypes.func
};
