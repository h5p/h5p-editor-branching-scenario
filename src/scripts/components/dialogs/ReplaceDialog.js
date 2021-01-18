import React from 'react';
import replace from '../../../assets/replace.gif';
import './Dialog.scss';
import './ReplaceDialog.scss';

const ReplaceDialog = (props) => {
  return (
    <div className={`confirmation-dialog ${typeof props.classes !== 'undefined' ? props.classes : ''}`}>
      <div className='confirmation-dialog-header'>
        {props.icon}
        <span className='header-text'>{props.headerText}</span>
      </div>
      <div className='confirmation-dialog-body'>
        <div className='confirmation-dialog-body-split'>
          <div className='confirmation-dialog-body-left-content'>
            <p className='confirmation-question'>{props.body}</p>
            {props.children}
          </div>
          <div className='confirmation-dialog-body-right-content'>
            <img className='replace-graphics' src={replace} alt='replace content?' />
          </div>
        </div>
        <div className='dialog-buttons'>
          <a
            className={props.styleConfirm || 'dialog-confirm'}
            onClick={props.handleConfirm}
          >{props.textConfirm}</a>
          <a
            className='dialog-cancel'
            onClick={props.handleCancel}
          >{props.textCancel}</a>
        </div>
      </div>
    </div>
  );
};

export default ReplaceDialog;
