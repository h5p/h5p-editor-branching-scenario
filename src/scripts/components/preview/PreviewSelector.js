import React from 'react';
import PropTypes from "prop-types";
import './PreviewSelector.scss';
import {getAlternativeName} from "../../helpers/Library";
import {t} from '../../helpers/translate';

export default class PreviewSelector extends React.Component {
  static defaultValue = 'start';

  constructor(props) {
    super(props);

    this.previewSceneSelectId = H5PEditor.getNextFieldId({
      name: 'previewScene'
    });

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
        <label className='preview-introduction' htmlFor={this.previewSceneSelectId}>
          {t('previewSelectorTitle')}:
        </label>
        <div className='preview-selector field'>
          <select
            id={ this.previewSceneSelectId }
            className='scene-selector'
            value={this.state.value}
            onChange={e => this.setContentId(e.target.value)}
            disabled={this.props.isDisabled}
          >
            <option value={PreviewSelector.defaultValue}>{t('previewFromBeginning')}</option>
            {
              this.props.params.branchingScenario.content.map((content) => {
                const alternativeName = getAlternativeName({
                  params: content,
                });
                return (
                  <option
                    key={content.contentId}
                    value={content.contentId}
                  >{alternativeName}</option>
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
