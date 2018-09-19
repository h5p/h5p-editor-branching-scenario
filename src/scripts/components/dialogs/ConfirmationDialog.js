import React from 'react';
import Dialog from "./Dialog";
import './ConfirmationDialog.scss';

const ConfirmationDialog = (props) => {
  return (
    <Dialog
      icon={<span className={props.icon}/>}
      headerText={props.headerText}
      body={props.body}
      handleConfirm={props.handleConfirm}
      handleCancel={props.handleCancel}
      textConfirm={props.textConfirm}
      textCancel={props.textCancel}
    >
      {
        props.confirmationDetails &&
        <div className='confirmation-details'>
          <p>{props.confirmationDetails}</p>
          {
            props.confirmationDetailsList &&
            <ul>{props.confirmationDetailsList}</ul>
          }
        </div>
      }
    </Dialog>
  );
};

export default ConfirmationDialog;
