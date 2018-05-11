import React from 'react';
import PropTypes from 'prop-types';
import './SubMenu.scss';

export default class SubMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let elementClass = 'submenu';

    return (
      <ul className={ elementClass }>
        <li>Content Options</li>
        <li className='start-preview' onClick={ this.props.preview }>Start preview</li>
        <li className='edit-content' onClick={ this.props.edit }>Edit content</li>
        <li className='delete' onClick={ this.props.delete }>Delete</li>
      </ul>
    );
  }
}

SubMenu.propTypes = {
  preview: PropTypes.func,
  edit: PropTypes.func,
  delete: PropTypes.func
};
