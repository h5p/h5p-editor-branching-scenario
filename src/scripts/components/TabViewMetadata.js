import React from 'react';
import TooltipButton from './TooltipButton';
import './TabViewMetadata.scss';

export default class TabViewMetadata extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.metadataForm.appendTo(this.form);
  }

  render() {
    return (
      <div id="metadata" className="tab tab-view-full-page large-padding" >
        <span className="tab-view-title">Metadata</span>
        <span className="tab-view-description">Add metadata for main content</span>
        <div className="tab-view-white-box" >
          <form>
            <fieldset>
              <legend className="tab-view-info">
                Metadata
                <TooltipButton
                  text="Metadata help users to reuse your content."
                  tooltipClass={ 'tooltip below' }
                />
              </legend>
              <div ref={ element => this.form = element } />
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}
