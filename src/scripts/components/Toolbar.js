import React from 'react';
import PropTypes from 'prop-types';
import './Toolbar.scss';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

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

  render() {
    // TODO: l10n

    let infoPopupClass = 'info-popup';
    if (this.state.showInfoPopup) {
      infoPopupClass += ' visible';
    }

    return (
      <div className="toolbar">
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
