import React from 'react';
import './Preview.scss';
import PropTypes from "prop-types";
import loading from '../../../assets/loading.gif';

export default class Preview extends React.Component {
  constructor(props) {
    super(props);

    this.previewContainer = React.createRef();

    // TODO: Handle props that set which chapter preview should start from

    this.state = {
      isInitialized: false,
    };
  }

  componentDidMount() {
    if (this.props.hasLoadedLibraries && !this.state.isInitialized) {
      this.initializeInstance();
    }
  }

  componentDidUpdate() {
    if (this.props.hasLoadedLibraries && !this.state.isInitialized) {
      this.initializeInstance();
    }
  }

  initializeInstance() {
    const branchingScenario = Object.keys(H5PEditor.libraryLoaded)
      .filter((library) => {
        return library.split(' ')[0] === 'H5P.BranchingScenario';
      })[0];

    H5P.newRunnable(
      {
        library: branchingScenario,
        params: this.props.params
      },
      H5PEditor.contentId,
      H5P.jQuery(this.previewContainer.current),
      false,
      {
        isPreviewing: true,
      }
    );

    this.setState({
      isInitialized: true,
    });
  }

  render() {
    return (
      <div className='preview-container'>
        <div className='preview-scene-selection-wrapper'>
          <div className='preview-introduction'>Preview Branching Questions set from:</div>
          <div className='preview-selector'>
            Selector...
          </div>
        </div>
        {
          !this.state.isInitialized &&
          <div className='loading-wrapper'>
            <img className='loading-graphics' src={loading} alt='loading...' />
            <div className='loading-text'>Preview is loading...</div>
          </div>
        }
        <div className='preview-wrapper'>
          <div ref={this.previewContainer}/>
        </div>
      </div>
    );
  }
}

Preview.propTypes = {
  params: PropTypes.object,
  hasLoadedLibraries: PropTypes.bool,
};