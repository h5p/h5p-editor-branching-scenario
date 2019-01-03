import React from 'react';
import './EmptyPreview.scss';
import PropTypes from "prop-types";

const EmptyPreview = (props) => {
  return (
    <div className='empty-preview-wrapper'>
      <div className='empty-preview-icon' />
      <div className='empty-preview-title'>No content to preview</div>
      <div className='empty-preview-description'>
        <span>You haven't created any content. Go back to the </span>
        <a
          className='editor-link'
          onClick={props.goToEditor}
          href='#'
        >editor</a>
        <span> to create content.</span>
      </div>
    </div>
  );
};

export default EmptyPreview;

EmptyPreview.propTypes = {
  goToEditor: PropTypes.func,
};