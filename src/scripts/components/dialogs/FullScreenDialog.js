import React from 'react';
import Dialog from "./Dialog";
import './FullScreenDialog.scss';
import {t} from '../../helpers/translate';

const FullScreenDialog = (props) => {
  return (
    <Dialog
      classes='full-screen-dialog'
      headerText={t('fullScreenMode')}
      body={t('fullScreenRecommendation')}
      textConfirm={t('editFullScreen')}
      textCancel={t('editWindow')}
      handleConfirm={props.handleConfirm}
      handleCancel={props.handleCancel}
    />
  );
};

export default FullScreenDialog;
