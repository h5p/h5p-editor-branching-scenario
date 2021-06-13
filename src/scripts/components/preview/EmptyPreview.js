import React from 'react';
import './EmptyPreview.scss';
import PropTypes from "prop-types";
import {t} from '../../helpers/translate';

const EmptyPreview = (props) => {
  return (
    <div className='empty-preview-wrapper'>
      <div className='empty-preview-icon' />
      <div className='empty-preview-title'>{t('noPreviewContentTitle')}</div>
      <div className='empty-preview-description'>
        <a className='editor-link' onClick={props.goToEditor} href='#'>
          {t('noPreviewContentText')}
        </a>
      </div>
    </div>
  );
};

export default EmptyPreview;

EmptyPreview.propTypes = {
  goToEditor: PropTypes.func,
};