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

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  /**
   * Handle closing on dismissal.
   *
   * @param {Event} event Click event.
   */
  handleDocumentClick = (event) => {
    if (event.target !== this.tooltip) {
      this.props.onClose();
    }
  }

  render() {
    // Use to override default style
    const tooltipClass = this.props.tooltipClass || 'tooltip';

    return (
      <div
        ref={ node => this.tooltip = node }
        className={ tooltipClass }
        dangerouslySetInnerHTML={ { __html: this.props.text } }
      />
    );
  }
}

Tooltip.propTypes = {
  children: PropTypes.array
};
