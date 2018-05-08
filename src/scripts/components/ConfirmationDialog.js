import React from 'react';
import './ConfirmationDialog.scss'; 

export default class ConfirmationDialog extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className='confirmation-dialog'>
        <div className='confirmation-dialog-header'> 
          <span className='icon'/>
          <span className='header-text'> 
            Delete Question 
          </span>
        </div>
        <div className='confirmation-dialog-body'>
          Are you sure you want to delete this content?
          <div>
            <a className='dialog-delete' onClick={ this.props.handleDelete }>Delete</a>
            <a className='dialog-cancel' onClick={ this.props.handleCancel }>Cancel</a> 
          </div>
        </div>
      </div> 
    );
  }
}
