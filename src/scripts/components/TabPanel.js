import React from 'react';

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

	renderNavItem(key) {
		let tab = this.props.children[key];

		return (
			<li key={ key }>	
				<a href="#" onClick={ this.handleOnClick.bind(this, key) }>
					{ tab.props.title } 
				</a>
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
			<div className={ this.props.className }> 
				<ul className="tabs-nav">
          { Object.keys(this.props.children).map(this.renderNavItem.bind(this)) }
				</ul>
				<div>
					{ tabs } 
				</div>	
			</div>
		)
	} 
}


