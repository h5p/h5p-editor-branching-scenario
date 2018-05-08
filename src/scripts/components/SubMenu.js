import React from 'react';
import PropTypes from 'prop-types';
import './SubMenu.scss'

export default class SubMenu extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    return (
      <ul className='submenu'>
        <li>Content Options</li>
        <li className='start-preview'>Start preview</li>
        <li className='edit-content'>Edit content</li>
        <li className='delete'>Delete</li>
      </ul>
    )
  }
}
