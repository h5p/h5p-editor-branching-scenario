import React from 'react';
import PropTypes from 'prop-types';
import './Toolbar.scss';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.zoomLevels = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5];

    this.state = {
      showInfoPopup: false
    };
  }

  handleShowPopup = () => {
    this.setState({ showInfoPopup: true });
  }

  handleClosePopup = () => {
    this.setState({ showInfoPopup: false });
  }

  handleHighlight = () => {
    this.props.onHighlight(-1);
    this.handleClosePopup();
  }

  /**
   * Change zoom.
   *
   * @param {bolean} zoomin Zoom direction. true = zoom in, false = zoom out.
   */
  handleZoom = (zoomin = true) => {
    let newScale;

    // Get closest zoom level
    let pos = this.zoomLevels.indexOf(this.props.scale);
    if (pos === -1) {
      if (this.props.scale < this.zoomLevels[0]) {
        pos = 0;
      }
      else if (this.props.scale > this.zoomLevels[this.zoomLevels.length-1]) {
        pos = this.zoomLevels.length - 1;
      }
      else {
        pos = this.zoomLevels.indexOf(this.zoomLevels.find(level => level > this.props.scale));
      }
    }

    // Zoom
    if (zoomin) {
      newScale = (pos + 1 >= this.zoomLevels.length) ? this.props.scale : this.zoomLevels[pos + 1];
    }
    else {
      newScale = (pos <= 0) ? this.props.scale : this.zoomLevels[pos - 1];
    }

    this.props.onZoom(newScale);
  }

  render() {
    // TODO: l10n

    let infoPopupClass = 'info-popup';
    if (this.state.showInfoPopup) {
      infoPopupClass += ' visible';
    }

    return (
      <div className="toolbar">
        <div className="zoom-wrapper">
          <span
            className="zoom-in"
            onClick={ () => this.handleZoom(true) }
          />
          <span className="zoom-status">
            { `${Math.round(this.props.scale * 100)} %`}
          </span>
          <span
            className="zoom-out"
            onClick={ () => this.handleZoom(false) }
          />
          <span
            className="fit-to-canvas-icon"
            onClick={ this.props.onFitToCanvas }
          />
          <span
            className="fit-to-canvas-text"
            onClick={ this.props.onFitToCanvas }
          >
            Zoom to fit
          </span>
        </div>
        <div
          className="missing-end-scenarios"
          role="button"
          tabIndex="0"
          onClick={ this.handleShowPopup }
        >{ this.props.numDefaultEndScenarios }</div>
        <div className={ infoPopupClass }>
          { this.props.numDefaultEndScenarios } alternatives will lead to the default <em>End Scenario</em>.
          { !!this.props.numDefaultEndScenarios &&
            <span> Click <span className="highlight-end-scenarios-button" role="button" tabIndex="0" onClick={ this.handleHighlight }>here</span> to highlight these.</span>
          }

          <div className="close-info-popup-button" onClick={ this.handleClosePopup } aria-label="Close"></div>
        </div>
      </div>
    );
  }
}

Toolbar.propTypes = {
  numDefaultEndScenarios: PropTypes.number,
  onHighlight: PropTypes.func
};
