import React from 'react';
import Dialog from "./Dialog";
import './FullScreenDialog.scss';

const FullScreenDialog = (props) => {
  return (
    <Dialog
      classes='full-screen-dialog'
      headerText='Full screen mode'
      body='We strongly recommend to use Branching Scenario editor in full-screen mode, for better editing experience.'
      textConfirm='Edit in full-screen'
      textCancel='Edit in window-mode'
      handleConfirm={props.handleConfirm}
      handleCancel={props.handleCancel}
    />
  );
};

export default FullScreenDialog;
