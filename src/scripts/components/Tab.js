import React from 'react';
import PropTypes from 'prop-types';
import './Tab.scss';

export default class Tab extends React.Component {
  render() {
    return (
      <div className={ "tab-panel" + (this.props.active === true ? ' active' : '') }>
        { this.props.children }
      </div>
    );
  }
}

Tab.propTypes = {
  active: PropTypes.bool
};
