import React from 'react';
import PropTypes from 'prop-types';
import './Tooltip.scss';

export default class Tooltip extends React.Component {

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
    this.toggle();
  }

  /**
   * Toogle tooltip.
   *
   * @param {boolean} [visible] If set, visibility will be set accordingly, toggled otherwise.
   */
  toggle = visible => {
    this.setState(prevState => ({
      showTooltip: typeof visible === 'boolean' ? visible : !prevState.showTooltip
    }));
  }

  render() {
    // Use to override default style
    const tooltipClass = this.props.tooltipClass || 'tooltip';

    return (
      <div className="tooltip-wrapper">
        <a ref={ 'button' } className="tooltip-button" onClick={ this.handleClick } />
        { this.state.showTooltip &&
          <div
            ref={ 'tooltip' }
            className={ tooltipClass }
            dangerouslySetInnerHTML={ { __html: this.props.text } }
          />
        }
      </div>
    );
  }
}

Tooltip.propTypes = {
  children: PropTypes.array
};
