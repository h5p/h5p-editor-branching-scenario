import React from 'react';
import loading from "../../../assets/loading.gif";
import { t } from '../../helpers/translate';
import './LoadingPreview.scss';


//https://wordpress.org/support/topic/loading-gif-without-alt-attribute/
const LoadingPreview = () => {
  return (
    <div className='loading-wrapper'>
      <img className='loading-graphics' src={loading} alt="" />
      <div className='loading-text'>{t('previewLoading')}</div>
    </div>
  );
};

export default LoadingPreview;