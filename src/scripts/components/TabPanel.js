import React from 'react';
import PropTypes from 'prop-types';
import './TabPanel.scss';

export default class Tabs extends React.Component {

  constructor(props) {
    super(props);
  }

  renderNavItem = (key) => {
    let tab = this.props.children[key];

    return (
      <li
        key={key}
        title={tab.props.title}
        className={[tab.props.className, this.props.activeIndex == key ? 'active' : ''].join(' ')}
        onClick={() => this.props.onChange(key)}>
      </li>
    );
  }

  render() {

    let index = 0;
    let active = this.props.activeIndex;

    let tabs = React.Children.map(this.props.children, function (child) {
      return React.cloneElement(child, {
        active: child.props.active === true ? true : (active == index++)
      });
    });

    const tabsClasses = 'tabs' + (this.props.isHidden ? ' hidden' : '') + (this.props.tour.fadeActive === false ? ' tour-fade' : '');
    const tabListClasses = 'tabs-nav' + (this.props.tour.fadeActive === true ? ' tour-fade' : '');
    return (
      <div className={tabsClasses}>
        <ul className={tabListClasses}>
          {Object.keys(this.props.children).map(this.renderNavItem)}
        </ul>
        {tabs}
      </div>
    );
  }
}

Tabs.propTypes = {
  tour: PropTypes.oneOfType([
    PropTypes.shape({
      fadeActive: PropTypes.bool.isRequired
    }), PropTypes.bool]
  )
};