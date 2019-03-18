import React from 'react';

export default class Tour extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="tour-box" style={ this.props.position }>
        <div className="tour-circle">
          <div className="tour-dialog">
            Use this button to go in and out of
            full-screen mode.<br/>
            <button type="button" className="tour-button" onClick={ this.props.onClose }>I got it</button>
          </div>
        </div>
      </div>
    );
  }
}
