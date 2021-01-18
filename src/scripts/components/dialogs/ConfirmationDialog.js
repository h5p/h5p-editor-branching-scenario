import React from 'react';
import Dialog from "./Dialog";
import replaceGraphics from "../../../assets/replace.gif";
import './ConfirmationDialog.scss';

const ConfirmationDialog = (props) => {
  let title, question, confirm, graphics, altText;

  switch (props.action) {
    case 'delete':
      title = 'Delete Content'; // TODO: l10n
      question = 'Are you sure you want to delete this content?';
      confirm = 'Delete';
      break;

    case 'delete alternative':
      title = 'Delete Alternative'; // TODO: l10n
      question = 'Are you sure you want to delete this alternative?';
      confirm = 'Delete';
      break;

    case 'replace':
      title = 'Replace Content'; // TODO: l10n
      question = 'Are you sure you want to replace this content?';
      confirm = 'Replace';
      graphics = replaceGraphics;
      altText = 'Replace Content';
      break;
  }

  return (
    <Dialog
      icon={ <span className={ 'icon-' + props.action }/> }
      action={ props.action }
      graphics={ graphics }
      graphicsAltText={ altText }
      headerText={ title }
      body={ question }
      handleConfirm={ props.onConfirm }
      handleCancel={ props.onCancel }
      textConfirm={ confirm }
      textCancel={ 'Cancel' }
      styleConfirm={ 'dialog-confirm-red' }
    >
      { props.children }
    </Dialog>
  );
};

export default ConfirmationDialog;
