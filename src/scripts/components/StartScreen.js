import React from 'react';
import PropTypes from 'prop-types';
import './StartScreen.scss';

export default class StartScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="startscreen-wrapper" onClick={this.props.handleClick}>
        <div className="startscreen-header">
          <h1>No content has been added yet</h1>
          <p>To create content drag the icons from the left menu to the dropzone below</p>
          { this.props.children }
        </div>
        <div className="startscreen-footer">
          <p><a onClick={this.props.handleTutorialClick}>Step by step tutorial</a> on how to use Branching Scenario</p>
        </div>
      </div>
    );
  }
}

StartScreen.propTypes = {
  handleClick: PropTypes.func,
  handleTutorialClick: PropTypes.func
};
