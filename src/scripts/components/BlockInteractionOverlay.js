import React from 'react';
import './BlockInteractionOverlay.scss';

export default class BlockInteractionOverlay extends React.Component {
  render() {
    return (
      <div className={ "block-interaction-overlay" }
      >
        {this.props.children}
      </div>
    );
  }
}
