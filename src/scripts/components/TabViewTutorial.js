import React from 'react';
import './TabViewTutorial.scss';

export default class TabViewTutorial extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div id="help" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Tutorial</span>
        <span className="tab-view-description">Learn how to use <strong>Branching Scenario</strong> editor</span>
        <div className="tab-view-white-box">
          <iframe
            src="https://jelenas-chocolate-factory.h5p.com/content/1290505124378050537/embed"
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
