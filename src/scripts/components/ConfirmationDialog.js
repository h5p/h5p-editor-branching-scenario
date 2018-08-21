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
          <span className={ this.props.icon }/>
          <span className='header-text'>
            { this.props.confirmationHeader }
          </span>
        </div>
        <div className='confirmation-dialog-body'>
          <p className='confirmation-question'>{ this.props.confirmationQuestion }</p>
          { this.props.confirmationDetails &&
            <div className='confirmation-details'>
              <p>{ this.props.confirmationDetails }</p>
              { this.props.confirmationDetailsList &&
                <ul>{ this.props.confirmationDetailsList }</ul>
              }
            </div>
          }
          <div className='dialog-buttons'>
            <a className='dialog-confirm' onClick={ this.props.handleConfirm }>{ this.props.textConfirm }</a>
            <a className='dialog-cancel' onClick={ this.props.handleCancel }>{ this.props.textCancel }</a>
          </div>
        </div>
      </div>
    );
  }
}
