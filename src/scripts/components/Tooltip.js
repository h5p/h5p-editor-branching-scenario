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

  handleClick = () => {
    this.setState(prevState => ({
      showTooltip: !prevState.showTooltip
    }));
  }

  render() {
    if(this.state.showTooltip) {
      return (
        <div className="tooltip-wrapper">
          <a className="tooltip-button" onClick={ this.handleClick }/>
          <div className="tooltip">
            { this.props.children }
          </div>
        </div>
      )
    }
    else {
      return (
        <div className="tooltip-wrapper">
          <a className="tooltip-button" onClick={ this.handleClick }/>
        </div>
      )
    }
  }
}

Tooltip.propTypes = {
  children: PropTypes.array
}
