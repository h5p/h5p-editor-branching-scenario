import React from 'react';
import PropTypes from "prop-types";
import Content from "../Content";
import './PreviewSelector.scss';

export default class PreviewSelector extends React.Component {
  static defaultValue = 'start';

  constructor(props) {
    super(props);

    const initialValue = props.initialContentId !== null
      ? props.initialContentId
      : PreviewSelector.defaultValue;

    if (initialValue !== PreviewSelector.defaultValue) {
      this.navigateToContent(initialValue);
    }

    this.state = {
      value: initialValue,
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

  setContentId = (id) => {
    // Restart
    if (id === PreviewSelector.defaultValue) {
      this.props.previewInstance.trigger('restarted');
      return;
    }

    this.setState({
      value: id,
    });

    this.navigateToContent(id);
  };

  navigateToContent(id) {
    this.props.previewInstance.trigger('navigated', {
      nextContentId: id,
    });
  }

  render() {
    return (
      <div className='preview-scene-selection-wrapper'>
        <div className='preview-introduction'>Preview Branching Questions set from:</div>
        <div className='preview-selector'>
          <select
            className='scene-selector'
            value={this.state.value}
            onChange={e => this.setContentId(e.target.value)}
            disabled={this.props.isDisabled}
          >
            <option value={PreviewSelector.defaultValue}>Preview from the beginning</option>
            {
              this.props.params.branchingScenario.content.map((content) => {
                return (
                  <option
                    key={content.contentId}
                    value={content.contentId}
                  >{Content.stripHTML(content.type.metadata.title)}</option>
                );
              })
            }
          </select>
        </div>
      </div>
    );
  }
}

PreviewSelector.propTypes = {
  previewInstance: PropTypes.object,
  params: PropTypes.object,
  isDisabled: PropTypes.bool,
  initialContentId: PropTypes.number,
};