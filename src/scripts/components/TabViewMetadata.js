import React from 'react';

export default class TabViewMetadata extends React.Component {

  componentDidMount() {
    if (this.props.main.parent.$metadataForm !== undefined) {
      this.props.main.parent.$metadataForm.appendTo(this.form);
    }
  }

  render() {
    return (
      <div id="metadata" className="tab tab-view-full-page large-padding" >
        <span className="tab-view-title">Metadata</span>
        <span className="tab-view-description">Add metadata for main content</span>
        <div className="tab-view-white-box" ref={ element => this.form = element }>
          {this.props.value}
        </div>
      </div>
    );
  }
}
