import React from 'react';

export default class TabViewTranslations extends React.Component {
  renderChildren() {
    // TODO: Titles
    const fieldsets = (this.props.translations || [])
      .map(items => {
        return (<fieldset key={items[0].library}>
          <legend>{items[0].library}</legend>
          {items.map((item, index) => <div key={index}>
            <label htmlFor={item.name}>
              {item.label}
            </label>
            <input
              type='text'
              key={item.name}
              name={item.library + '/' + ((item.path.length > 0) ? item.path.join('/') + '/' : '') + item.name}
              value={item.translation}
              placeholder={item.default}
              onChange={this.props.onChange}
            />
          </div>)}
        </fieldset>);
      });

    return fieldsets;
  }

  render() {
    return (
      <div id="translate-interface" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Interface Translations</span>
        <span className="tab-view-description">All content types fields included in this <strong>Branching Questions</strong> can be customized. Below are the fields that are translateable</span>
        <div className="tab-view-white-box">
          <form>
            {this.renderChildren()}
          </form>
        </div>
      </div>
    );
  }
}
