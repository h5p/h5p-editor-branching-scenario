import React from 'react';
import './TabViewTranslations.scss';

export default class TabViewTranslations extends React.Component {
  constructor(props) {
    super(props);

    this.commonFields = React.createRef();
  }

  componentDidMount() {
    // Remove header, should not be included in custom editor
    this.props.parent.$common.find('p.desc').remove();

    H5PEditor.setCommonFieldsWrapper(this.props.parent, this.commonFields.current);
  }

  render() {
    return (
      <div id="translate-interface" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Translations</span>
        <span className="tab-view-description">The language and labels used in all content types can be customised by editing the fields below.</span>
        <div className="tab-view-white-box" ref={this.commonFields} />
      </div>
    );
  }
}
