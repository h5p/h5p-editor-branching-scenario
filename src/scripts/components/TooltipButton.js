import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from './Tooltip';
import './TooltipButton.scss';

export default class TooltipButton extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      showTooltip: false
    };
  }

  /**
   * Handle click on button.
   */
  handleClick = () => {
    this.setState(prevState => {
      return {
        showTooltip: !prevState.showTooltip
      };
    });
  }

  render() {
    const tooltipClass = this.props.tooltipClass || 'tooltip';

    return (
      <div className="tooltip-wrapper">
        <a className="tooltip-button" onClick={ this.handleClick } />
        { this.state.showTooltip &&
          <Tooltip
            text={ this.props.text }
            tooltipClass={ tooltipClass }
            onClose={ this.handleClick }
          />
        }
      </div>
    );
  }
}

TooltipButton.propTypes = {
  children: PropTypes.array
};
