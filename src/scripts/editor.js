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

    this.state = {
      insertingId: 0, // Provides unique id for each element being inserted to resolve timing issues
      activeIndex: 0,
      libraries: null, // Needs to be loaded via AJAX
      numDefaultEndScenarios: 0,
      highlight: null,
      onlyThisBall: null,
      scale: 1,
      center: true,
      translate: null,
      scoringOption: null,
      fullscreen: false,
      showFullScreenDialog: false, // TODO: Set to isFullScreenCapable when we want to add it in again
      nodeSize: {
        width: 176,
        height: 32,
        spacing: {
          x: 29,
          y: 17
        }
      },
      zoomDisabled: !this.props.content || this.props.content.length === 0
    };
  }

  componentDidMount() {
    // We need to load libraries details before rendering the canvas or menu
    window.H5PEditor.LibraryListCache.getLibraries(this.props.libraries, this.handleLibrariesLoaded);

    // Add title field
    const titleField = this.props.main.parent.metadataForm.getExtraTitleField();
    titleField.$item.find('input')[0].placeholder = 'Enter title here';
    titleField.$item.appendTo(this.topbar);

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  handleWindowResize = () => {
    this.resizeTimeout = null;
    if (!this.resizeTimeout) {
      // Throttle centering to ~15fps
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = null;
        this.setState({
          center: true
        });
      }, 66);
    }
  };

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

  handleMouseDown = (event) => {
    this.setState(prevState => {
      return {
        inserting: event,
        insertingId: prevState.insertingId + 1,
        highlight: null
      };
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
    const newState = {
      numDefaultEndScenarios: numDefaultEndScenarios
    };

    if (content !== null) {
      this.props.onContentChanged(content);
      newState.zoomDisabled = (content.length === 0);
    }

    this.setState(newState);
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
    this.setState((state) => ({
      insertingId: state.insertingId + 1,
      inserting: null,
    }));
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
    let width;
    if (rect.width) {
      // The canvas nodes are a bit larger than the menu nodes
      width = Math.ceil(rect.width * (176 / 152));
    }
    if ((rect.width && this.state.nodeSize.width !== width) || (rect.height && this.state.nodeSize.height !== rect.height)) {
      this.setState({
        nodeSize: {
          insertingWidth: rect.width,
          width: width,
          height: rect.height,
          spacing: {
            x: 29,
            y: 17
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
          { H5PEditor.semiFullscreen !== undefined &&
            <div
              className={ 'fullscreen-button' + (this.state.fullscreen ? ' active' : '') }
              title={(this.state.fullscreen ? 'Exit' : 'Enter') + ' full-screen mode'}
              role="button"
              tabIndex="0"
              onClick={ this.handleToggleFullscreen }
            />
          }
          { this.state.fullscreen &&
            <div
              className="proceed-button"
              title="Proceed to save your Branching Scenario"
              role="button"
              tabIndex="0"
              onClick={ this.handleToggleFullscreen }
            >Proceed to Save{/* TODO: l10n */}</div>
          }
        </div>
        <Tabs className="tab-view-wrapper"
          activeIndex={ this.state.activeIndex }
          onChange={ key => this.setActiveIndex(key) }
        >
          <Tab
            onMouseUp={ this.handleMouseUp }
            title="Create content"
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
              insertingId={ this.state.insertingId }
            />
            <Toolbar
              disabled={ this.state.zoomDisabled }
              numDefaultEndScenarios={ this.state.numDefaultEndScenarios }
              onHighlight={ this.handleHighlight }
              scale={ this.state.scale }
              onScaleChanged={ this.handleScaleChanged }
              containerRect={ this.treewrap } /* TODO: Don't send refs as props on render... */
              contentRect={ this.tree } /* TODO: Don't send refs as props on render... */
            />
          </Tab>
          <Tab title="Settings" className="bs-editor-settings-tab">
            <TabViewSettings
              main={this.props.main}
              updateScoringOption={this.handleScoringOptionChange}
            />
          </Tab>
          <Tab title="Interface translations" className="bs-editor-translations-tab">
            <TabViewTranslations
              parent={this.props.parent}
            />
          </Tab>
          <Tab title="Get help" className="bs-editor-tutorial-tab">
            <TabViewTutorial
              handleOpenCanvas={ this.handleOpenCanvas }
            />
          </Tab>
          <Tab title="Metadata" className="bs-editor-metadata-tab">
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
  libraries: PropTypes.array
};
