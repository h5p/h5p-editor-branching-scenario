import React from 'react';
import PropTypes from 'prop-types';
import './StartScreen.scss';

export default class StartScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="startscreen-wrapper">
        <div className="startscreen-header">
          <h1>Your Branching Questions Set is empty</h1>
          <p>To create content drag the icons from the left menu to the dropzone below</p>
          { this.props.children }
        </div>
        <div className="startscreen-footer">
          <p>Step by step <a onClick={this.props.handleClicked}>tutorial</a> on how to use Branching Question</p>
        </div>
      </div>
    );
  }
}

StartScreen.propTypes = {
  handleClicked: PropTypes.func
};
