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
        <li className='edit-content' onClick={ this.props.onEdit }>Edit content</li>
        <li className='copy-content' onClick={ this.props.onCopy }>Copy to a clipboard</li>
        <li className='delete-content' onClick={ this.props.onDelete }>Delete</li>
      </ul>
    );
  }
}

SubMenu.propTypes = {
  onPreview: PropTypes.func,
  onEdit: PropTypes.func,
  onCopy: PropTypes.func,
  onDelete: PropTypes.func
};
