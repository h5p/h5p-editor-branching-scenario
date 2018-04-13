import React from 'react';
import './Tab.css'

export default class Tab extends React.Component {
	render() {
		return (
			<div className={ "tab-panel" + (this.props.active ? ' active' : '') }>
				{ this.props.children } 
			</div> 
		)
	}		
}

