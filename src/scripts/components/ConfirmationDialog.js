import React from 'react';
import './ConfirmationDialog.scss'; 

export default class ConfirmationDialog extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='confirmation-dialog'>
        <button onClick={ this.props.handleDelete }>Delete</button>
        <button onClick={ this.props.handleCancel }>Cancel</button> 
      </div> 
    )
  }
}
