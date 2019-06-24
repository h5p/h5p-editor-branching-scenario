import React from 'react';
import PropTypes from 'prop-types';
import './BehaviouralSettings.scss';

export default class BehaviouralSettings extends React.Component {

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    if (this.props.behaviourGroup !== undefined) {
      // Use behaviourGroup from semantics as content
      this.contentPlaceholder.parentNode.replaceChild(this.props.behaviourGroup.$group.get(0), this.contentPlaceholder);
    }
  }

  render() {
    return (
      <div ref={ element => this.contentPlaceholder = element }></div>
    );
  }
}

BehaviouralSettings.propTypes = {
  behaviourGroup: PropTypes.object
};
