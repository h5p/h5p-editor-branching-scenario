import React from 'react';
import PropTypes from 'prop-types';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      active: props.active
    };
  }

  componentDidMount() {
    // Load the libraries
    const self = this;
    window.H5PEditor.LibraryListCache.getLibraries(this.props.libraries, function(libraries) {
      // TODO: Move to Editor – Canvas needs to know the names

      let loadedLibraries = [];
      for (var i = 0; i < libraries.length; i++) {
        if (libraries[i].restricted !== true) {
          loadedLibraries.push(libraries[i].title);
        }
      }

      self.setState({
        loadedLibraries: loadedLibraries
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ active: nextProps.active });
  }

  handleMouseDown = (event) => {
    if (event.button !== 0) {
      return; // Only handle left click
    }

    this.props.onMouseDown({
      target: event.currentTarget,
      startX: event.pageX,
      startY: event.pageY
    });

    event.stopPropagation();
    event.preventDefault();
  }

  renderDnDButtons() {
    if (!this.state.loadedLibraries) {
      return '';
    }

    let listItems = this.state.loadedLibraries.map(name => {

      if (name === 'Branching Question') {
        return '';
      }

      return <li
        key={ Math.random() }
        className={ name.replace(/\s/g, '') }
        onMouseDown={ this.handleMouseDown }
      >
        { name }
      </li>;
    });

    return (
      <ul className="content-type-buttons">
        { listItems }
      </ul>
    );
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
          <li className="branching-question" title="Add New Branching Question">Branching Question</li>
        </ul>
      </div>
    );
  }
}

ContentTypeMenu.propTypes = {
  libraries: PropTypes.array,
  handleMouseDown: PropTypes.func
};
