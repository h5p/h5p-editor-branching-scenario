import React from 'react';
import './Dialog.scss';

const Dialog = (props) => {
  return (
    <div className={`confirmation-dialog ${props.classes}`}>
      <div className='confirmation-dialog-header'>
        {props.icon}
        <span className='header-text'>{props.headerText}</span>
      </div>
      <div className='confirmation-dialog-body'>
        <p className='confirmation-question'>{props.body}</p>
        {props.children}
        <div className='dialog-buttons'>
          <a
            className='dialog-confirm'
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

export default Dialog;
