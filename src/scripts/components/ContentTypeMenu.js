import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);
		this.state = {};
  }

  componentDidMount() {
		// Load the libraries
		const self = this;
    window.H5PEditor.LibraryListCache.getLibraries(this.props.libraries, function(libraries) {

			let loadedLibraries = [] 

      for (var i = 0; i < libraries.length; i++) {
        if (libraries[i].restricted !== true) {
					loadedLibraries.push(libraries[i].title)
        }
      }

			self.setState({
				loadedLibraries: loadedLibraries 
			});
    }); 
	}

	renderDnDButtons() {
		if (!this.state.loadedLibraries) {
			return ''
		}

		let listItems = this.state.loadedLibraries.map(name => {
			return <li 
				key={ Math.random() } 
				className={ name.replace(/\s/g, '') }
				ref= { name.replace(/\s/g, '') } 
				handleMouseDown={ this.handleMouseDown } 
				handleMouseUp={ this.handleMouseUp } 
				> 
					{ name }
				</li> 
		});

		return (
			<ul className="content-type-buttons">
			  { listItems } 
			</ul>
		)
	}

  handleMouseDown = (e, data) => {
    const positionData = this.refs[e.currentTarget.className].getBoundingClientRect();

    const mouseDownData = {
      contentClass: e.currentTarget.className,
      xPos: positionData.x,
      yPos: positionData.y,
      width: positionData.width,
      height: positionData.height,
      top: positionData.top
    }
    this.props.handleMouseDown(e, mouseDownData);
    e.stopPropagation();
    e.preventDefault();
  }

  render() {
    return (
      <div className="content-type-menu">
        <label className="label-info">
          Info Content
          <Tooltip>
            Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
				{ this.renderDnDButtons() }
        <label className="label-info">
          Branching Content
          <Tooltip>
            Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
        <ul className="content-type-buttons">
          <li className="branching-question purple" title="Add New Branching Question">Branching Question</li>
        </ul>
      </div>
    )
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  handleMouseDown: PropTypes.func
}
