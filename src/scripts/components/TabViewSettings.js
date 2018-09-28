import React from 'react';
import PropTypes from 'prop-types';
import TooltipButton from './TooltipButton';
import './TabViewSettings.scss';

export default class TabViewSettings extends React.Component {
  constructor(props) {
    super(props);

    this.refStartScreen = React.createRef();
    this.refEndScreen = React.createRef();
    this.refScoringOption= React.createRef();

    const params = this.props.main.params;

    // Prepare fields for separate fieldsets
    const startScreenFields = H5PEditor.findSemanticsField(
      'startScreen',
      this.props.main.field
    );
    this.startScreenWrapper = document.createElement('div');

    const endScreenFields = H5PEditor.findSemanticsField(
      'endScreens',
      this.props.main.field
    );
    this.endScreenWrapper = document.createElement('div');

    const scoringOptionField = H5PEditor.findSemanticsField(
      'scoringOption',
      this.props.main.field
    );
    this.scoringOptionWrapper = document.createElement('div');

    // Fill fields
    H5PEditor.processSemanticsChunk(
      startScreenFields.fields,
      params.startScreen,
      H5PEditor.$(this.startScreenWrapper),
      this.props.main
    );
    // Backup children
    let children = [].concat(this.props.main.children);

    H5PEditor.processSemanticsChunk(
      endScreenFields.field.fields,
      params.endScreens[0],
      H5PEditor.$(this.endScreenWrapper),
      this.props.main
    );
    children = children.concat(this.props.main.children);

    H5PEditor.processSemanticsChunk(
      [scoringOptionField],
      params,
      H5PEditor.$(this.scoringOptionWrapper),
      this.props.main
    );
    children = children.concat(this.props.main.children);

    // Restore children
    this.props.main.children = children;

    // Grab the select and listen for any changes to it
    this.$scoringField = H5PEditor.$(this.endScreenWrapper).find('.field-name-endScreenScore');
    H5PEditor.followField(this.props.main, 'scoringOption', () => {
      // Can't use showWhen, because we don't have access to scoringOption in endScreen chunk
      this.$scoringField.toggleClass('no-display', params.scoringOption !== 'static-end-score');

      this.props.updateScoringOption();
    });

    // TODO: This needs to come from app and needs to be sanitized
    this.l10n = {
      tooltipStartingScreen: 'Starting screen is an intro screen that should give a learner additional information about the course',
      tooltipEndScenario: 'Each alternative that does not have a custom end screen set - will lead to a default end screen.',
      tooltipEndFeedback: 'You can customize the feedback, set a different text size and color using textual editor.'
    };
  }

  componentDidMount() {
    this.refStartScreen.current.appendChild(this.startScreenWrapper);
    this.refEndScreen.current.appendChild(this.endScreenWrapper);
    this.refScoringOption.current.appendChild(this.scoringOptionWrapper);
  }

  render() {
    return (
      <div id="settings" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Settings</span>
        <span className="tab-view-description">Below are the settings for your <strong>Branching Questions</strong></span>
        <div className="tab-view-white-box">
          <fieldset>
            <legend className="tab-view-info">
              Configure starting screen
              <TooltipButton
                text={ this.l10n.tooltipStartingScreen }
                tooltipClass={ 'tooltip below' }
              />
            </legend>
            <div
              ref={ this.refStartScreen }
              className='h5p-scoring-option-wrapper'
            />
          </fieldset>
          <fieldset>
            <legend className="tab-view-info">
            Configure the default "End scenario" screen
              <TooltipButton
                text={ this.l10n.tooltipEndScenario }
              />
            </legend>
            <div
              ref={ this.refEndScreen }
              className='h5p-scoring-option-wrapper'
            />
          </fieldset>
          <fieldset>
            <legend className="tab-view-info">Behavioural settings</legend>
            <div
              ref={this.refScoringOption}
              className='h5p-scoring-option-wrapper'
            />
          </fieldset>
        </div>
      </div>
    );
  }
}

TabViewSettings.propTypes = {
  main: PropTypes.object,
  updateScoringOption: PropTypes.func
};
