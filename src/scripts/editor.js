import React from 'react';
import PropTypes from 'prop-types';
import './editor.scss';
import {t} from './helpers/translate';
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
import Preview from "./components/preview/Preview";
import Tour from "./components/Tour";
import { getUserStorage, setUserStorage } from './helpers/UserStorage';

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
      centerWholeTree: false, // Will center on the whole tree and not just the top node
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
      zoomDisabled: !this.props.content || this.props.content.length === 0,
      isShowingPreview: false,
      hasLoadedLibraries: false,
      isShowingPreviewInfoPopup: true,
      draggableHovered: null,
      isEditing: false,
      tour: false
    };
  }

  componentDidMount() {
    // We need to load libraries details before rendering the canvas or menu
    window.H5PEditor.LibraryListCache.getLibraries(this.props.libraries, this.handleLibrariesFetched);

    // Add title field
    const titleField = this.props.main.parent.metadataForm.getExtraTitleField();
    titleField.$item.find('input')[0].placeholder = t('enterTitleHere');
    titleField.$item.prependTo(this.topbar);

    if (H5PEditor.semiFullscreen !== undefined) {
      getUserStorage('h5p-editor-branching-scenario-tour-v1-seen', (seen) => {
        if (seen !== true) {
          this.setTourState('screen-size');
          this.topbar.firstChild.classList.add('tour-fade');
        }
      });
    }

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize);
  }

  setTourState = (tourPosition) => {
    const formRect = document.querySelector(this.state.fullscreen ? '.tree.h5peditor-semi-fullscreen' : '.h5peditor-form').getBoundingClientRect();
    const bufferSize = 18;
    let bufferSpace = 6;
    switch (tourPosition) {
      case 'screen-size': {
        const fsButtonRect = this.topbar.children[2].getBoundingClientRect();
        this.setState({
          tour: {
            state: 'screen-size',
            additionalClass: false,
            markerPosition: 'left-bottom',
            fadeActive: false,
            message: t('fullScreenModeButton'),
            width: (fsButtonRect.width - bufferSize) + 'px',
            height: (fsButtonRect.height - bufferSize) + 'px',
            left: ((fsButtonRect.left + bufferSpace) - formRect.left) + 'px',
            top: ((fsButtonRect.top + bufferSpace) - formRect.top) + 'px'
          }
        });
        break;
      }
      case 'content-node': {
        const icButtonRect = document.querySelector(".info-container-buttons").getBoundingClientRect();
        bufferSpace = 5;
        this.setState({
          tour: {
            state: 'content-node',
            additionalClass: 'content-node-tour',
            markerPosition: 'right-top',
            fadeActive: true,
            message: t('dragContentTypesBelow'),
            width: (icButtonRect.width - bufferSpace) + 'px',
            height: (icButtonRect.height - bufferSpace) + 'px',
            left: (icButtonRect.left - formRect.left) + 'px',
            top: (icButtonRect.top - formRect.top) + 'px'
          }
        });
        break;
      }
      case 'branching-node': {

        const bcButtonRect = document.querySelector(".branching-container-buttons").getBoundingClientRect();
        bufferSpace = 5;
        this.setState({
          tour: {
            state: 'branching-node',
            additionalClass: 'branching-node-tour',
            markerPosition: 'right-top',
            fadeActive: true,
            message: t('dragBranchingQuestionBelow'),
            width: (bcButtonRect.width - bufferSpace) + 'px',
            height: (bcButtonRect.height - bufferSpace) + 'px',
            left: (bcButtonRect.left - formRect.left) + 'px',
            top: (bcButtonRect.top - formRect.top) + 'px'
          }
        });
        break;
      }
    }
  };

  handleWindowResize = () => {
    this.resizeTimeout = null;
    if (!this.resizeTimeout) {
      // Throttle centering to ~15fps
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = null;
        this.setState({
          center: true
        });
        if (this.state.tour) {
          this.setTourState('screen-size');
        }
      }, 66);
    }
  };

  handleLibrariesFetched = (libraries) => {
    let fetchedLibraries = [];
    for (var i = 0; i < libraries.length; i++) {
      if (libraries[i].restricted !== true) {
        fetchedLibraries.push({
          title: libraries[i].title,
          name: libraries[i].uberName,
          className: libraries[i].name.replace('H5P.', '').toLocaleLowerCase()
        });
      }
    }

    this.setState({
      libraries: fetchedLibraries
    });

    this.handleLibrariesLoaded(libraries);
  };

  handleLibrariesLoaded = (libraries) => {
    let librariesLoaded = 0;

    libraries.forEach(library => {
      window.H5PEditor.loadLibrary(library.uberName, () => {
        librariesLoaded += 1;

        // All libraries loaded
        if (librariesLoaded >= libraries.length) {
          this.setState({
            hasLoadedLibraries: true,
          });
        }
      });
    });
  };

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

  handleIsEditing = (value) => {
    this.setState({
      isEditing: value
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
        centerWholeTree: options.center || prevState.center,
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

    // Content added, dialog closed and then check the tour conditions
    if (content !== null && content.length === 1 && this.state.isEditing) {
      if (content[0].type.params.branchingQuestion !== undefined) {
        getUserStorage('h5p-editor-branching-scenario-information-content-tour-v1-seen', (seen) => {
          if (seen !== true) {
            // Initial tour for information content block
            setTimeout(() => {
              if(this.state.activeIndex == 0 && this.state.isEditing === false && this.state.isShowingPreview === false){
                this.setTourState('content-node');
              }
            }, 2000);
          }
        });
      } else {
        getUserStorage('h5p-editor-branching-scenario-branching-content-tour-v1-seen', (seen) => {
          if (seen !== true) {
            // Initial tour for branching node
            setTimeout(() => {
              if(this.state.activeIndex == 0 && this.state.isEditing === false && this.state.isShowingPreview === false){
                this.setTourState('branching-node');
              }
            }, 2000);
          }
        });
      }
    }
  }

  /**
   * Scoring option change listener
   */
  handleScoringOptionChange = () => {
    this.setState({
      scoringOption: this.props.main.params.scoringOptionGroup.scoringOption
    });
  };

  /**
   * Handle centering of Canvas done.
   */
  handleCanvasCentered = () => {
    this.setState({
      center: false,
      centerWholeTree: false
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

  togglePreview = (id) => {
    this.setState((prevState) => {
      return {
        isShowingPreview: !prevState.isShowingPreview,
        previewId: id >= 0 ? id : null,
        draggableHovered: null,
      };
    });
  };

  hidePreviewInfoPopup = () => {
    this.setState({
      isShowingPreviewInfoPopup: false,
    });
  };

  draggableMouseOver = (draggableId) => {
    this.setState({
      draggableHovered: draggableId,
    });
  };

  draggableMouseOut = () => {
    this.setState({
      draggableHovered: null,
    });
  };

  handleCloseTour = () => {
    if (this.state.tour.state === 'screen-size') {
      this.topbar.firstChild.classList.remove('tour-fade');
      setUserStorage('h5p-editor-branching-scenario-tour-v1-seen', true);
    }
    else if (this.state.tour.state === 'branching-node') {
      setUserStorage('h5p-editor-branching-scenario-branching-content-tour-v1-seen', true);
    }
    else if (this.state.tour.state === 'content-node') {
      setUserStorage('h5p-editor-branching-scenario-information-content-tour-v1-seen', true);
    }

    this.setState({
      tour: false
    });
  };

  render() {
    // This might be replaced by callbacks invoked by the refs
    if (!this.treewrap && this.canvas && this.canvas.treewrap && this.canvas.treewrap.element) {
      this.treewrap = this.canvas.treewrap.element;
    }
    if (!this.tree && this.canvas && this.canvas.tree && this.canvas.tree.element) {
      this.tree = this.canvas && this.canvas.tree && this.canvas.tree.element;
    }

    let wrapperClasses = 'bswrapper';
    if (this.state.isShowingPreview) {
      wrapperClasses += ' preview';
    }
    if (this.state.tour) {
      wrapperClasses += ' tour';
    }

    return (
      <div className={wrapperClasses + (this.state.tour.additionalClass ? ' ' + this.state.tour.additionalClass : '')}>
        {
          this.state.showFullScreenDialog &&
          <BlockInteractionOverlay>
            <FullScreenDialog
              handleConfirm={this.onFullScreenDialogAction.bind(this, true)}
              handleCancel={this.onFullScreenDialogAction.bind(this, false)}
            />
          </BlockInteractionOverlay>
        }
        <div
          className={'topbar ' + ((this.state.tour.state === 'branching-node' || this.state.tour.state === 'content-node') ? ' tour-fade' : '')}
          ref={element => this.topbar = element}>
          {
            this.state.isShowingPreview ?
              <button
                className={'preview-button back' + (this.state.tour ? ' tour-fade' : '')}
                title={t('backToEdit')}
                onClick={() => this.togglePreview()}
                disabled={this.state.isEditing}
              >{t('backToEdit')}</button>
              :
              <button
                className={'preview-button' + (this.state.tour ? ' tour-fade' : '')}
                title={t('preview')}
                onClick={() => this.togglePreview()}
                disabled={this.state.isEditing}
              >{t('preview')}</button>
          }
          {H5PEditor.semiFullscreen !== undefined &&
            <div
              className={'fullscreen-button' + (this.state.fullscreen ? ' active' : '') + (this.state.tour ? ' tour-active' : '')}
              title={(this.state.fullscreen ? t('exit') : t('enter')) + ' ' + t('fullScreenMode')}
              role="button"
              tabIndex="0"
              onClick={this.handleToggleFullscreen}
            />
          }
          {this.state.fullscreen &&
            <div
              className={'proceed-button' + (this.state.tour ? ' tour-fade' : '')}
              title={t('proceedToSaveBranchingScenario')}
              role="button"
              tabIndex="0"
              onClick={this.handleToggleFullscreen}
            >{t('proceedToSave')}</div>
          }
        </div>
        <Tabs
          tour={this.state.tour}
          activeIndex={this.state.activeIndex}
          onChange={key => this.setActiveIndex(key)}
          isHidden={this.state.isShowingPreview}
        >
          <Tab
            onMouseUp={this.handleMouseUp}
            title="Create content"
            className="bs-editor-content-tab has-submenu">
            <ContentTypeMenu ref={element => this.contentypemenu = element}
              inserting={this.state.inserting}
              libraries={this.state.libraries}
              tourState={this.state.tour.state}
              onMouseDown={this.handleMouseDown}
              onNodeSize={this.handleNodeSize}
            />
            <Canvas
              ref={node => this.canvas = node}
              inserting={this.state.inserting}
              libraries={this.state.libraries}
              getNewContent={this.props.getNewContent}
              saveData={this.props.saveData}
              content={this.props.content}
              handleOpenTutorial={this.handleOpenTutorial}
              onIsEditing={this.handleIsEditing}
              onContentChanged={this.handleContentChanged}
              onContentPreview={this.togglePreview}
              onHighlight={this.handleHighlight}
              highlight={this.state.highlight}
              onlyThisBall={this.state.onlyThisBall}
              onDropped={this.handleInsertingDone}
              scale={this.state.scale}
              center={this.state.center}
              centerWholeTree={this.state.centerWholeTree}
              onCanvasCentered={this.handleCanvasCentered}
              translate={this.state.translate}
              onCanvasTranslated={this.handleCanvasTranslated}
              scoringOption={this.state.scoringOption}
              nodeSize={this.state.nodeSize}
              insertingId={this.state.insertingId}
              draggableMouseOver={this.draggableMouseOver}
              draggableMouseOut={this.draggableMouseOut}
              draggableHovered={this.state.draggableHovered}
              isTourActive={(this.state.tour ? true : false)}
            />
            <Toolbar
              disabled={this.state.zoomDisabled}
              numDefaultEndScenarios={this.state.numDefaultEndScenarios}
              onHighlight={this.handleHighlight}
              scale={this.state.scale}
              onScaleChanged={this.handleScaleChanged}
              containerRect={this.treewrap} /* TODO: Don't send refs as props on render... */
              contentRect={this.tree} /* TODO: Don't send refs as props on render... */
              isTourActive={(this.state.tour ? true : false)}
            />
          </Tab>
          <Tab title={t('settings')} className="bs-editor-settings-tab">
            <TabViewSettings
              main={this.props.main}
              updateScoringOption={this.handleScoringOptionChange}
            />
          </Tab>
          <Tab title={t('translations')} className="bs-editor-translations-tab">
            <TabViewTranslations
              parent={this.props.parent}
            />
          </Tab>
          <Tab title={t('getHelp')} className="bs-editor-tutorial-tab">
            <TabViewTutorial
              handleOpenCanvas={this.handleOpenCanvas}
            />
          </Tab>
          <Tab title={t('metadata')} className="bs-editor-metadata-tab">
            <TabViewMetadata
              metadataForm={this.props.main.parent.metadataForm}
            />
          </Tab>
        </Tabs>
        {
          this.state.isShowingPreview &&
          <Preview
            tour={this.state.tour}
            params={this.props.parent.params}
            hasLoadedLibraries={this.state.hasLoadedLibraries}
            previewId={this.state.previewId}
            goToEditor={() => this.togglePreview()}
            isShowingInfoPopup={this.state.isShowingPreviewInfoPopup}
            hideInfoPopup={this.hidePreviewInfoPopup}
          />
        }
        {
          this.state.tour &&
          <Tour
            additionalClass={this.state.tour.additionalClass}
            position={this.state.tour}
            onClose={this.handleCloseTour}
            message={this.state.tour.message}
            markerPosition={this.state.tour.markerPosition}
          />
        }
      </div>
    );
  }
}

Editor.propTypes = {
  libraries: PropTypes.array
};
