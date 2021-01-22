import React from 'react';
import PropTypes from 'prop-types';

import './Tip.scss';

export default class Tip extends React.Component {
  
  constructor(props) {
    super(props);

    this.message = null;
  }

  /**
   * Set tip's message based on the scenario number.
   *
   * @param {number} scenario if content
   */
  renderTips = (scenario) => {
    switch(scenario){
      case 1:
        this.message = 'Drop here to create a new ' + this.props.newContentType;
        break;
      case 2:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with a new ' + this.props.newContentType;
        break;
      case 3:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with a new ' + this.props.newContentType + '. Important! The entire branch below this question will be deleted.';
        break;
      case 4:
        this.message = 'Drop here to paste "' + this.props.newContentType +'"';
        break;
      case 5:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with a "' + this.props.newContentType + '"';
        break;
      case 6:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with "' + this.props.newContentType + '". Important! The entire branch below this question will be deleted.';
        break;
      case 7:
        this.message = 'Drop here to create a new Branching question. The existing structure below this dropzone will attach to the first alternative.';
        break;
      case 8:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with a new Branching question. The existing structure below this content will attach to the first alternative.';
        break;
      case 10:
        this.message = 'Drop here to paste "' + this.props.newContentType + '". The existing structure below this dropzone will attach to the first alternative.';
        break;
      case 11:
        this.message = 'Drop here to replace "' + this.props.currentContentType + '" with a "' + this.props.newContentType + '". The existing structure below this content will attach to the first alternative';
        break;
    }
  }

  render() {
    // Create scenario based tips messages
    this.renderTips(this.props.scenario);

    return (
      <div className='tips'>
        {this.message}
      </div>
    );
  }
}

Tip.propTypes = {
  scenario: PropTypes.number,
  currentContentType: PropTypes.string,
  newContentType: PropTypes.string
};