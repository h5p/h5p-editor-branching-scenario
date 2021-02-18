import React from 'react';
import PropTypes from 'prop-types';
import './Tip.scss';
import {t} from '../helpers/translate';

const Tip = (props) => {
  let message;
  switch(props.scenario){
    case 'NEW_CONTENT_ON_DROPZONE':
      message = t('newContentOnDropzone', {':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'EXISTING_CONTENT_ON_DROPZONE':
      message = t('existingContentOnDropzone', {':exitingContentName' : props.currentContentTypeTitle});
      break;
    case 'EXISTING_CONTENT_ON_EXISTING_CONTENT':
      message = t('existingContentOnExisitingContent', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'EXISTING_CONTENT_ON_EXISTING_BQ':
      message = t('existingContentOnExisitingBQ', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'NEW_CONTENT_ON_EXISTING_CONTENT':
      message = t('newContentOnExisitingContent', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'NEW_CONTENT_ON_EXISTING_BQ':
      message = t('newContentOnExisitingBQ', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'PASTED_CONTENT_ON_DROPZONE':
      message = t('pastedContentOnDropzone', {':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'PASTED_CONTENT_ON_EXISTING_CONTENT':
      message = t('pastedContentOnExisitingContent', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'PASTED_CONTENT_ON_EXISTING_BQ':
      message = t('pastedContentOnExisitingBQ', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'NEW_BQ_ON_DROPZONE':
      message = t('newBQOnDropzone');
      break;
    case 'NEW_BQ_ON_EXISTING_CONTENT':
      message = t('newBQOnExisitingContent', {':exitingContentName' : props.currentContentTypeTitle});
      break;
    case 'PASTED_BQ_ON_DROPZONE':
      message = t('pastedBQOnDropzone', {':newContentTypeName' : props.newContentTypeTitle});
      break;
    case 'PASTED_BQ_ON_EXISTING_CONTENT':
      message = t('pastedBQOnExisitingContent', {':exitingContentName' : props.currentContentTypeTitle, ':newContentTypeName' : props.newContentTypeTitle});
      break;
  }

  return (
    <div className='tips'>
      {message}
    </div>
  );
};

Tip.propTypes = {
  scenario: PropTypes.string,
  currentContentType: PropTypes.string,
  newContentType: PropTypes.string
};

export default Tip;
