import React from 'react';
import loading from "../../../assets/loading.gif";
import './LoadingPreview.scss';

const LoadingPreview = () => {
  return (
    <div className='loading-wrapper'>
      <img className='loading-graphics' src={loading} alt='loading...' />
      <div className='loading-text'>Preview is loading...</div>
    </div>
  );
};

export default LoadingPreview;