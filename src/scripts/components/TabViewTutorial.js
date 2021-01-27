import React from 'react';
import './TabViewTutorial.scss';
import {t} from '../helpers/translate';

export default class TabViewTutorial extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="help" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">{t('tutorial')}</span>
        <span className="tab-view-description">{t('tutorialDescription')}</span>
        <div className="tab-view-white-box">
          <iframe
            src="https://documentation.h5p.com/content/1290532202058682888/embed"
            width="100%"
            height="100%"
            frameBorder="0"
            allowFullScreen="allowfullscreen"
            allow="geolocation *; microphone *; camera *; midi *; encrypted-media *">
          </iframe>
        </div>
      </div>
    );
  }
}
