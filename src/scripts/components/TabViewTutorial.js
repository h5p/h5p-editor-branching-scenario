import React from 'react';

export default class TabViewTutorial extends React.Component {
  render() {
    return (
      <div id="help" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Tutorial</span>
        <span className="tab-view-description">Learn how to use <strong>Branching Questions</strong> Editor</span>
        <div className="tab-view-white-box">
					Detailed info, step by step, how to use this content type. Links to examples and tutorials. <br /><br />Go <a href="#">back</a> to create content.
        </div>
      </div>
    );
  }
}
