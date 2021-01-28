import React from 'react';
import PropTypes from "prop-types";
import {t} from '../../helpers/translate';

const PreviewInfoPopup = (props) => {
  return (
    <div className='info-popup visible'>
      <div
        className='info-popup-header'
      >{t('previewMode')}</div>
      <div
        className='info-popup-body'
      >{t('previewModeBody')}</div>
      <div
        className="close-info-popup-button"
        onClick={ props.hideInfoPopup }
        aria-label={t('close')}
      />
    </div>
  );
};

PreviewInfoPopup.propTypes = {
  hideInfoPopup: PropTypes.func,
};

export default PreviewInfoPopup;
