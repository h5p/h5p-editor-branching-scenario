import React from 'react';
import './Preview.scss';
import PropTypes from "prop-types";
import PreviewSelector from "./PreviewSelector";
import EmptyPreview from "./EmptyPreview";
import LoadingPreview from "./LoadingPreview";
import PreviewInfoPopup from "./PreviewInfoPopup";

export default class Preview extends React.Component {
  constructor(props) {
    super(props);
    this.previewContainer = React.createRef();

    this.state = {
      isInitialized: false,
    };
  }

  componentDidMount() {
    if (this.props.hasLoadedLibraries && !this.state.isInitialized) {
      this.initializeInstance();
    }

    window.addEventListener('resize', this.handleWindowResize);
  }

  componentDidUpdate() {
    if (this.props.hasLoadedLibraries && !this.state.isInitialized) {
      this.initializeInstance();
    }
  }

  handleWindowResize = () => {
    this.resizeTimeout = null;
    if (!this.resizeTimeout) {
      // Throttle centering to ~15fps
      this.resizeTimeout = setTimeout(() => {
        this.resizeTimeout = null;
        if(this.preview) {
          this.preview.trigger('resize');
        }
      }, 66);
    }
  };

  initializeInstance() {
    // Do not initialize empty branching scenarios
    if (this.props.params.branchingScenario.content.length <= 0) {
      return;
    }

    // Remove existing instance
    this.setState({
      isInitialized: false,
    });
    const previewContainer = this.previewContainer.current;
    if (previewContainer.firstChild) {
      previewContainer.removeChild(previewContainer.firstChild);
    }

    const branchingScenario = Object.keys(H5PEditor.libraryLoaded)
      .filter((library) => {
        return library.split(' ')[0] === 'H5P.BranchingScenario';
      })[0];

    // Flag passed into BS to prevent XAPI statements being fired whilst in Preview.
    this.props.params.branchingScenario.preventXAPI = true;

    this.preview = H5P.newRunnable(
      {
        library: branchingScenario,
        params: this.props.params
      },
      H5PEditor.contentId || 1,
      H5P.jQuery(previewContainer)
    );
    this.setState({
      isInitialized: true,
    });
  }

  render() {
    if (this.props.params.branchingScenario.content.length <= 0) {
      return (
        <div className='preview-container'>
          <EmptyPreview goToEditor={this.props.goToEditor}/>
        </div>
      );
    }

    if (!this.state.isInitialized) {
      return (
        <div className='preview-container'>
          <LoadingPreview/>
          <div className='preview-wrapper'>
            <div ref={this.previewContainer}/>
          </div>
        </div>
      );
    }

    return (
      <div className={ 'preview-container' + (this.props.tour ? ' tour-fade' : '') }>
        <PreviewSelector
          previewInstance={this.preview}
          params={this.props.params}
          initialContentId={this.props.previewId}
        />
        <div className='preview-wrapper h5p-frame'>
          <div ref={this.previewContainer}/>
        </div>
        {
          this.props.isShowingInfoPopup &&
          <PreviewInfoPopup hideInfoPopup={this.props.hideInfoPopup}/>
        }
      </div>
    );
  }
}

Preview.propTypes = {
  params: PropTypes.object,
  hasLoadedLibraries: PropTypes.bool,
  isShowingInfoPopup: PropTypes.bool,
  previewId: PropTypes.number,
  goToEditor: PropTypes.func,
  hideInfoPopup: PropTypes.func,
};
