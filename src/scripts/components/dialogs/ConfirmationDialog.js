import React from 'react';
import Dialog from "./Dialog";
import replaceGraphics from "../../../assets/replace.gif";
import './ConfirmationDialog.scss';
import {t} from '../../helpers/translate';

const ConfirmationDialog = (props) => {
  let title, question, confirm, graphics, altText;
  switch (props.action) {
    case 'delete':
      title = t('deleteContent');
      question = t('confirmDeleteContent');
      confirm = t('delete');
      break;

    case 'delete alternative':
      title = t('deleteAlternative');
      question = t('confirmDeleteAlternative');
      confirm = t('delete');
      break;

    case 'replace':
      title = t('replaceContent');
      question = t('confirmReplaceContent');
      confirm = t('replace');
      // Add graphics only for non-BQ contents
      if (!props.isBQ) {
        graphics = replaceGraphics;
      }
      altText = t('replaceContent');
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
      textCancel={ t('cancel') }
      styleConfirm={ 'dialog-confirm-red' }
    >
      { props.children }
    </Dialog>
  );
};

export default ConfirmationDialog;
