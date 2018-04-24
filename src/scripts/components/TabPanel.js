import React from 'react';
import './TabPanel.scss';

export default class Tabs extends React.Component {

  constructor() {
    super();

    this.state = {
      activeIndex: 0
    };
  }

  handleOnClick(key, event) {
    event.preventDefault();

    this.setState({
      activeIndex: key
    });
  }

  renderNavItem = (key) => {
    let tab = this.props.children[key];

    return (
      <li
        key={ key }
        className={[tab.props.className, this.state.activeIndex == key ? 'active' : ''].join(' ')}
        onClick={ this.handleOnClick.bind(this, key) }>
      </li>
    )
  }

  render() {

    let index = 0;
    let active = this.state.activeIndex;

    let tabs = React.Children.map(this.props.children, function(child) {
      return React.cloneElement(child, {
        active: child.props.active === true ? true : (active == index++)
      });
    })

    return (
      <div className="tabs">
        <ul className="tabs-nav">
          { Object.keys(this.props.children).map(this.renderNavItem) }
        </ul>
        { tabs }
      </div>
    )
  }
}
