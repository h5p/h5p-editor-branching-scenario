import React from 'react';
import './TabViewTranslations.scss';

export default class TabViewTranslations extends React.Component {
  constructor(props) {
    super(props);

    this.commonFields = React.createRef();
  }

  componentDidMount() {
    H5PEditor.setCommonFieldsWrapper(this.props.parent, this.commonFields.current);
  }

  render() {
    return (
      <div id="translate-interface" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Interface Translations</span>
        <span className="tab-view-description">All content types fields included in this <strong>Branching Scenario</strong> can be customized. Below are the fields that are translateable. Note that you have to open the editor of a content type for the interface translations to be loaded and appear in this list.</span>
        <div className="tab-view-white-box" ref={this.commonFields} />
      </div>
    );
  }
}
