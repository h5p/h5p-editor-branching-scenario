import React from 'react';
import PropTypes from "prop-types";

const PreviewInfoPopup = (props) => {
  return (
    <div className='info-popup visible'>
      <div
        className='info-popup-header'
      >Preview Mode.</div>
      <div
        className='info-popup-body'
      >This is how the user will see your content.</div>
      <div
        className="close-info-popup-button"
        onClick={ props.hideInfoPopup }
        aria-label="Close"
      />
    </div>
  );
};

PreviewInfoPopup.propTypes = {
  hideInfoPopup: PropTypes.func,
};

export default PreviewInfoPopup;
