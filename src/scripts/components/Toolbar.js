import React from 'react';
import PropTypes from 'prop-types';
import './Toolbar.scss';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.zoomLevels = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5];

    this.state = {
      showInfoPopup: false,
      scale: 1.5
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
    this.setState(prevState => {
      const newState = prevState;

      const pos = this.zoomLevels.indexOf(prevState.scale);

      if (zoomin) {
        newState.scale = (pos + 1 >= this.zoomLevels.length) ? prevState.scale : this.zoomLevels[pos + 1];
      }
      else {
        newState.scale = (pos <= 0) ? prevState.scale : this.zoomLevels[pos - 1];
      }

      return newState;
    }, () => this.props.onZoom(this.state.scale));
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
            { `${Math.round(this.state.scale * 100)} %`}
          </span>
          <span
            className="zoom-out"
            onClick={ () => this.handleZoom(false) }
          />
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
