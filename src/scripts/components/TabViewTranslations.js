import React from 'react';

export default class TabViewTranslations extends React.Component {
  render() {

    // TODO: Titles for the fields
    const translations = this.props.translations || [];

    const fieldsets = translations
      .map(items => <fieldset key={items[0].library}>
        <legend>{items[0].library}</legend>
        {items.map((item, index) =>
          <div key={index}>
            <label htmlFor={item.name}>
              {item.label}
            </label>
            <input
              type='text'
              key={item.name}
              name={item.library + '/' + item.name}
              value={item.translation}
              placeholder={item.default}
              onChange={this.props.onChange}
            />
          </div>)}
      </fieldset>);

    return (
      <div id="translate-interface" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Interface Translations</span>
        <span className="tab-view-description">All content types fields included in this <strong>Branching Questions</strong> can be customized. Below are the fields that are translateable</span>
        <div className="tab-view-white-box">
          <form>
            {fieldsets}
          </form>
        </div>
      </div>
    );
  }
}
