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
        <li>{ this.props.isContent ? 'Content Options' : 'Branching Question Options' }</li>
        <li className='edit-content' onClick={ this.props.onEdit }>{ this.props.isContent ? 'Edit content' : 'Edit question or alternatives' }</li>
        <li className='copy-content' onClick={ this.props.onCopy }>Copy</li>
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
