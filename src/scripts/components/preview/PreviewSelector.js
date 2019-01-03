import React from 'react';
import './Preview.scss';
import PropTypes from "prop-types";

export default class PreviewSelector extends React.Component {
  static defaultValue = 'start';

  constructor(props) {
    super(props);

    this.state = {
      value: PreviewSelector.defaultValue,
    };

    props.previewInstance.on('navigated', e => {
      this.setState({
        value: parseInt(e.data.nextContentId),
      });
    });

    props.previewInstance.on('started', () => {
      this.setState({
        value: 0,
      });
    });

    props.previewInstance.on('restarted', () => {
      this.setState({
        value: PreviewSelector.defaultValue,
      });
    });
  }

  setContentId = (e) => {
    // Restart
    if (e.target.value === PreviewSelector.defaultValue) {
      this.props.previewInstance.trigger('restarted');
      return;
    }

    const contentId = e.target.value;
    this.props.previewInstance.trigger('navigated', {
      nextContentId: contentId,
    });

    this.setState({
      value: e.target.value,
    });
  };

  render() {
    return (
      <select
        value={this.state.value}
        onChange={this.setContentId}
        disabled={this.props.isDisabled}
      >
        <option value={PreviewSelector.defaultValue}>Preview from the beginning</option>
        {
          this.props.params.branchingScenario.content.map((content) => {
            return (
              <option
                key={content.contentId}
                value={content.contentId}
              >{content.type.metadata.title}</option>
            );
          })
        }
      </select>
    );
  }
}

PreviewSelector.propTypes = {
  previewInstance: PropTypes.object,
  params: PropTypes.object,
  isDisabled: PropTypes.bool,
};