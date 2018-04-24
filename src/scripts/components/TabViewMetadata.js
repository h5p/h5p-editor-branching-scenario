import React from 'react';

export default class TabViewMetadata extends React.Component {
  render() {
    return (
      <div id="metadata" className="tab tab-view-full-page large-padding" >
        <span className="tab-view-title">Metadata</span>
        <span className="tab-view-description">Add metadata for main content</span>
        <div className="tab-view-white-box">
          {this.props.value}
        </div>
      </div>
    );
  }
}
