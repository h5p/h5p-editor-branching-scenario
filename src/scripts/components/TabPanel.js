import React from 'react';
import './TabPanel.scss';

export default class Tabs extends React.Component {

  constructor(props) {
    super(props);
  }

  renderNavItem = (key) => {
    let tab = this.props.children[key];

    return (
      <li
        key={ key }
        title={ tab.props.title }
        className={[tab.props.className, this.props.activeIndex == key ? 'active' : ''].join(' ')}
        onClick={ () => this.props.onChange(key) }>
      </li>
    );
  }

  render() {

    let index = 0;
    let active = this.props.activeIndex;

    let tabs = React.Children.map(this.props.children, function(child) {
      return React.cloneElement(child, {
        active: child.props.active === true ? true : (active == index++)
      });
    });

    const tabsClasses = 'tabs' + (this.props.isHidden ? ' hidden' : '');
    return (
      <div className={tabsClasses}>
        <ul className="tabs-nav">
          { Object.keys(this.props.children).map(this.renderNavItem) }
        </ul>
        { tabs }
      </div>
    );
  }
}
