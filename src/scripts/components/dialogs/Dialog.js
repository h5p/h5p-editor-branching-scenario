import React from 'react';
import './Dialog.scss';

const Dialog = (props) => {
  return (
    <div className={`confirmation-dialog ${typeof props.classes !== 'undefined' ? props.classes : ''}`}>
      <div className='confirmation-dialog-header'>
        {props.icon}
        <span className='header-text'>{props.headerText}</span>
      </div>
      <div className='confirmation-dialog-body'>
        {
          props.action === 'replace' ?
            <div className='confirmation-dialog-body-split'>
              <div className='confirmation-dialog-body-left-content'>
                <p className='confirmation-question'>{props.body}</p>
                {props.children}
              </div>
              <div className='confirmation-dialog-body-right-content'>
                <img className='replace-graphics' src={props.graphics} alt='replace content?' />
              </div>
            </div>
            :
            <div className="confirmation-dialog-body-content">
              <p className='confirmation-question'>{props.body}</p>
              {props.children}
            </div>
        }
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

export default Dialog;
