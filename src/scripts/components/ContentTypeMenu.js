import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import TooltipButton from './TooltipButton';
import { isBranching, getMachineName, find } from '../helpers/Library';
import {t} from '../helpers/translate';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);

    this.l10n = {
      tooltipInfo: t('tooltipInfo'),
      tooltipBranching: t('tooltipBranching'),
      tooltipReuse: t('tooltipReuse')
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
      this.setCanPaste(this.props.libraries);
    }
  }

  handleMouseDown = (event, library) => {
    if (event.button !== 0) {
      return; // Only handle left click
    }

    // Get library from clipboard
    let pasted;
    let inUse = library;
    if (library === 'reuse-question') {

      // Inform user if content cannot be pasted
      if (this.state.canPaste.canPaste === false) {
        this.displayNoPasteExplanation();
      }

      // Sanitization
      const clipboard = H5P.getClipboard();
      if (!clipboard || !clipboard.generic || !clipboard.generic.library) {
        return;
      }

      library = (this.props.libraries) ?
        find(this.props.libraries, library => library.name === clipboard.generic.library) :
        undefined;
      if (typeof library === 'undefined') {
        return;
      }

      // Pasted Branching Questions should not have next nodes
      if (isBranching(library.name)) {
        clipboard.generic.params.branchingQuestion.alternatives.forEach(alt => {
          alt.nextContentId = -1;
        });
      }

      pasted = clipboard;
    }

    // Prevent
    this.setState({
      inUse: (inUse === 'reuse-question') ? inUse : library
    });

    this.props.onMouseDown({
      target: event.target,
      startX: event.pageX,
      startY: event.pageY,
      position: {
        x: event.currentTarget.offsetLeft,
        y: event.currentTarget.offsetTop
      },
      library: library,
      // Cloned here, because the clipboard is deliberately cached in core
      pasted: pasted ? H5P.jQuery.extend(true, {}, pasted) : null
    });
  }

  /**
   * Display info on why content cannot be pasted.
   */
  displayNoPasteExplanation = () => {
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

  /**
   * set state for canPaste.
   *
   * @param {object} libraries Libraries available.
   */
  setCanPaste = (libraries) => {
    // Transform libraries to expected format
    libraries = libraries.map(lib => {
      const library = H5P.libraryFromString(lib.name);
      library.name = getMachineName(lib.name);
      return library;
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
        <div className="loading">{t('loading')}</div>
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
        key={ className }
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
        <div className="loading">{t('loading')}</div>
      );
    }
    const bs = find(this.props.libraries, library => library.className === 'branchingquestion');
    let className = bs.className;
    if (this.props.inserting && this.props.inserting.library === bs && this.state.inUse === bs) {
      className += ' greyout';
    }

    return (
      <ul className="content-type-buttons">
        <li ref={ element => element ? this.props.onNodeSize(element.getBoundingClientRect()) : undefined } className={ className } title={t('addNew') + ' ' + t('branchingQuestion')} onMouseDown={ event => this.handleMouseDown(event, bs) }>{t('branchingQuestion')}</li>
      </ul>
    );
  }

  renderReuseButton() {
    if (!this.props.libraries) {
      return (
        <div className="loading">{t('loading')}</div>
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
          title={t('addFromClipboard')}
          onMouseDown={ event => this.handleMouseDown(event, 'reuse-question') }
        >
          {t('paste')}
        </li>
      </ul>
    );
  }

  render() {
    return (
      <div className="content-type-menu">
        <div className={ 'info-container-buttons' + ( this.props.tourState === 'branching-node' ? ' tour-fade' : '' ) }>
          <label className="label-info">
            {t('contentInfo')}
            <TooltipButton
              text={ this.l10n.tooltipInfo }
              tooltipClass={ 'tooltip below' }
            />
          </label>
          { this.renderDnDButtons() }
        </div>
        <div className={ 'branching-container-buttons' + ( this.props.tourState === 'content-node' ? ' tour-fade' : '' ) }>
          <label className="label-info">
            {t('contentBranching')}
            <TooltipButton
              text={ this.l10n.tooltipBranching }
            />
          </label>
          { this.renderSecondButtons() }
        </div>
        <div className={ 'reuse-container-buttons' + ( this.props.tourState ? ' tour-fade' : '' ) }>
          <label className="label-info">
            {t('contentReuse')}
            <TooltipButton
              text={ this.l10n.tooltipReuse }
            />
          </label>
          { this.renderReuseButton() }
        </div>
      </div>
    );
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  tourState: PropTypes.string,
  handleMouseDown: PropTypes.func
};
