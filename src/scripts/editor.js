import React from 'react';
import PropTypes from 'prop-types';
import './editor.scss';

import './components/Editor.scss';
import Tabs from './components/TabPanel';
import Tab from './components/Tab';
import ContentTypeMenu from './components/ContentTypeMenu';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import TabViewSettings from './components/TabViewSettings';
import TabViewTranslations from './components/TabViewTranslations';
import TabViewTutorial from './components/TabViewTutorial';
import TabViewMetadata from './components/TabViewMetadata';
import FullScreenDialog from "./components/dialogs/FullScreenDialog";
import BlockInteractionOverlay from "./components/BlockInteractionOverlay";

export default class Editor extends React.Component {
  constructor(props) {
    super(props);

    const isFullScreenCapable = H5PEditor.Fullscreen !== undefined;

    this.state = {
      activeIndex: 0,
      settings: props.settings,
      libraries: null, // Needs to be loaded via AJAX
      numDefaultEndScenarios: 0,
      highlight: null,
      onlyThisBall: null,
      scale: 1,
      center: true,
      translate: null,
      scoringOption: null,
      fullscreen: false,
      showFullScreenDialog: isFullScreenCapable,
      nodeSize: {
        width: 176,
        height: 32,
        spacing: {
          x: 29,
          y: 16
        }
      }
    };
  }

  componentDidMount() {
    // We need to load libraries details before rendering the canvas or menu
    window.H5PEditor.LibraryListCache.getLibraries(this.props.libraries, this.handleLibrariesLoaded);

    // Add title field
    const titleField = this.props.main.parent.metadataForm.getExtraTitleField();
    titleField.$item.appendTo(this.topbar);
  }

  handleLibrariesLoaded = (libraries) => {
    let loadedLibraries = [];
    for (var i = 0; i < libraries.length; i++) {
      if (libraries[i].restricted !== true) {
        loadedLibraries.push({
          title: libraries[i].title,
          name: libraries[i].uberName,
          className: libraries[i].name.replace('H5P.', '').toLocaleLowerCase()
        });
      }
    }

    this.setState({
      libraries: loadedLibraries
    });
  }

  /**
   * Update settings
   * TODO: For a more general solution such as the fullscreen editor, this
   *       should be more abstract
   *
   * @param {Event} event - Change event.
   */
  handleSettingsChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    if (name === 'endScreenScore') {
      value = parseInt(value);
    }

    // TODO: It seems the next state depends on the current, this should be handled inside the setState() updater using prevState.
    const settings = this.state.settings;
    settings[[name]] = value;
    this.setState({settings: settings});

    // TODO: maintained in parent as well? We don't really need to have a local state then
    this.props.updateParams(settings);
  }

  validate = () => {
    if (this.canvas.state.editing !== null) {
      this.canvas.editorOverlay.handleDone(); // Trigger saving and closing of form
    }
  }

  handleMouseDown = (event) => {
    this.setState({
      inserting: event,
      highlight: null
    });
  }

  handleOpenCanvas = () => {
    this.setState({
      activeIndex: 0
    });
  }

  handleOpenTutorial = () => {
    this.setState({
      activeIndex: 3
    });
  }

  // Those can probably be merged into one abstract function
  setActiveIndex = (key) => {
    this.setState({
      activeIndex: key
    });
  }

  handleOpenEditor = (inserting) => {
    this.setState({
      inserting: inserting
    });
  }

  /**
   * Handle highlighting default end scenarios.
   *
   * @param {number} id Id of scenario to be highlighted.
   * @param {} onlyThisBall
   */
  handleHighlight = (id, onlyThisBall) => {
    this.setState({
      highlight: id,
      onlyThisBall: onlyThisBall === undefined ? null : onlyThisBall
    });
  }

  /**
   * Handle changed scale.
   *
   * @param {number} scale Scale to set canvas to.
   * @param {object} [options] Extra options.
   * @param {boolean} [options.center] If true, center canvas.
   * @param {object} [params.translate] Offsets for translating canvas.
   * @param {number} [params.translate.x] X offset.
   * @param {number} [params.translate.y] Y offset.
   */
  handleScaleChanged = (scale, options) => {
    this.setState(prevState => {
      const newState = {
        scale: scale || prevState.scale,
        center: options.center || prevState.center,
        translate: options.translate || prevState.translate
      };
      return newState;
    });
  }

  handleContentChanged = (content, numDefaultEndScenarios) => {
    if (content) {
      this.props.onContentChanged(content);
    }

    this.setState({
      numDefaultEndScenarios: numDefaultEndScenarios
    });
  }

  /**
   * Scoring option change listener
   */
  handleScoringOptionChange = () => {
    this.setState({
      scoringOption: this.props.main.params.scoringOption
    });
  };

  /**
   * Handle centering of Canvas done.
   */
  handleCanvasCentered = () => {
    this.setState({
      center: false
    });
  }

  /**
   * Handle translation of Canvas done.
   */
  handleCanvasTranslated = () => {
    this.setState({
      translate: null
    });
  }

  /**
   * Handle inserting in Canvas
   */
  handleInsertingDone = () => {
    this.setState({
      inserting: null
    });
  }

  handleToggleFullscreen = () => {
    this.setState(prevState => {
      this.props.onToggleFullscreen(!prevState.fullscreen);
      return {
        fullscreen: !prevState.fullscreen
      };
    });
  }

  onFullScreenDialogAction = (enableFullScreen) => {
    if (enableFullScreen) {
      this.props.onToggleFullscreen(true);
    }

    this.setState({
      showFullScreenDialog: false,
    });
  };

  handleNodeSize = (rect) => {
    if ((rect.width && this.state.nodeSize.width !== rect.width) || (rect.height && this.state.nodeSize.height !== rect.height)) {
      this.setState({
        nodeSize: {
          width: rect.width,
          height: rect.height,
          spacing: {
            x: 29,
            y: 16
          }
        },
      });
    }
  }

  render() {
    // This might be replaced by callbacks invoked by the refs
    if (!this.treewrap && this.canvas && this.canvas.treewrap && this.canvas.treewrap.element) {
      this.treewrap = this.canvas.treewrap.element;
    }
    if (!this.tree && this.canvas && this.canvas.tree) {
      this.tree = this.canvas && this.canvas.tree;
    }

    return (
      <div className="bswrapper">
        {
          this.state.showFullScreenDialog &&
          <BlockInteractionOverlay>
            <FullScreenDialog
              handleConfirm={this.onFullScreenDialogAction.bind(this, true)}
              handleCancel={this.onFullScreenDialogAction.bind(this, false)}
            />
          </BlockInteractionOverlay>
        }
        <div className="topbar" ref={ element => this.topbar = element }>
          { H5PEditor.Fullscreen !== undefined &&
            <div className={ 'fullscreen-button' + (this.state.fullscreen ? ' active' : '') } role="button" tabIndex="0" onClick={ this.handleToggleFullscreen }/>
          }
          { this.state.fullscreen &&
            <div className="proceed-button" role="button" tabIndex="0" onClick={ this.handleToggleFullscreen }>Proceed to Save{/* TODO: l10n */}</div>
          }
        </div>
        <Tabs className="tab-view-wrapper"
          activeIndex={ this.state.activeIndex }
          onChange={ key => this.setActiveIndex(key) }
        >
          <Tab
            onMouseUp={ this.handleMouseUp }
            title="add content"
            className="bs-editor-content-tab has-submenu">
            <ContentTypeMenu
              inserting={ this.state.inserting }
              libraries={ this.state.libraries }
              onMouseDown={ this.handleMouseDown }
              onNodeSize={ this.handleNodeSize }
            />
            <Canvas
              ref={ node => this.canvas = node }
              inserting={ this.state.inserting }
              libraries={ this.state.libraries }
              getNewContent={ this.props.getNewContent }
              saveData={this.props.saveData}
              content={ this.props.content }
              handleOpenTutorial={ this.handleOpenTutorial }
              onOpenEditor={ this.handleOpenEditor }
              onContentChanged={ this.handleContentChanged }
              onHighlight={ this.handleHighlight }
              highlight={ this.state.highlight }
              onlyThisBall={ this.state.onlyThisBall }
              onDropped={ this.handleInsertingDone }
              scale={ this.state.scale }
              center={ this.state.center }
              onCanvasCentered={ this.handleCanvasCentered }
              translate={ this.state.translate }
              onCanvasTranslated={ this.handleCanvasTranslated }
              scoringOption={ this.state.scoringOption }
              nodeSize={ this.state.nodeSize }
            />
            <Toolbar
              numDefaultEndScenarios={ this.state.numDefaultEndScenarios }
              onHighlight={ this.handleHighlight }
              scale={ this.state.scale }
              onScaleChanged={ this.handleScaleChanged }
              containerRect={ this.treewrap }
              contentRect={ this.tree }
            />
          </Tab>
          <Tab title="settings" className="bs-editor-settings-tab">
            <TabViewSettings
              main={this.props.main}
              value={this.state.settings}
              startImageChooser={this.props.startImageChooser}
              endImageChooser={this.props.endImageChooser}
              onChange={this.handleSettingsChange}
              updateScoringOption={this.handleScoringOptionChange}
            />
          </Tab>
          <Tab title="translations" className="bs-editor-translations-tab">
            <TabViewTranslations
              parent={this.props.parent}
            />
          </Tab>
          <Tab title="tutorial" className="bs-editor-tutorial-tab">
            <TabViewTutorial
              handleOpenCanvas={ this.handleOpenCanvas }
            />
          </Tab>
          <Tab title="metadata" className="bs-editor-metadata-tab">
            <TabViewMetadata
              metadataForm={ this.props.main.parent.metadataForm }
            />
          </Tab>
        </Tabs>
      </div>
    );
  }
}

Editor.propTypes = {
  libraries: PropTypes.array,
  settings: PropTypes.object,
  updateParams: PropTypes.func,
  startImageChooser: PropTypes.instanceOf(H5PEditor.widgets.image),
  endImageChooser: PropTypes.instanceOf(H5PEditor.widgets.image),
};
