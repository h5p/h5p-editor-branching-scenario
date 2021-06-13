import React from 'react';
import PropTypes from 'prop-types';
import TooltipButton from './TooltipButton';
import './TabViewSettings.scss';
import {t} from '../helpers/translate';

export default class TabViewSettings extends React.Component {
  constructor(props) {
    super(props);

    this.refStartScreen = React.createRef();
    this.refEndScreen = React.createRef();
    this.refScoringOption= React.createRef();
    this.refBehaviour= React.createRef();

    const params = this.props.main.params;

    // Prepare fields for separate fieldsets
    const startScreenField = H5PEditor.findSemanticsField(
      'startScreen',
      this.props.main.field
    );
    this.startScreenWrapper = document.createElement('div');

    const endScreenField = H5PEditor.findSemanticsField(
      'endScreens',
      this.props.main.field
    );
    this.endScreenWrapper = document.createElement('div');

    const scoringOptionField = H5PEditor.findSemanticsField(
      'scoringOption',
      this.props.main.field
    );

    const scoringOptionGroupField = H5PEditor.findSemanticsField(
      'scoringOptionGroup',
      this.props.main.field
    );
    this.scoringOptionWrapper = document.createElement('div');

    const behaviourField = H5PEditor.findSemanticsField(
      'behaviour',
      this.props.main.field
    );
    this.behaviourWrapper = document.createElement('div');

    // Fill fields
    H5PEditor.processSemanticsChunk(
      [startScreenField],
      params,
      H5PEditor.$(this.startScreenWrapper),
      this.props.main
    );
    // Backup children
    let children = [].concat(this.props.main.children);

    const fakeParams = {};
    fakeParams[endScreenField.field.name] = params.endScreens[0];
    H5PEditor.processSemanticsChunk(
      [endScreenField.field],
      fakeParams,
      H5PEditor.$(this.endScreenWrapper),
      this.props.main
    );
    children = children.concat(this.props.main.children);

    H5PEditor.processSemanticsChunk(
      [scoringOptionGroupField],
      params,
      H5PEditor.$(this.scoringOptionWrapper),
      this.props.main
    );
    children = children.concat(this.props.main.children);

    H5PEditor.processSemanticsChunk(
      [behaviourField],
      params,
      H5PEditor.$(this.behaviourWrapper),
      this.props.main
    );
    children = children.concat(this.props.main.children);

    // Restore children
    this.props.main.children = children;

    // Grab the select and listen for any changes to it
    this.$scoringField = H5PEditor.$(this.endScreenWrapper).find('.field-name-endScreenScore');
    H5PEditor.followField(this.props.main, scoringOptionGroupField.name + '/' + scoringOptionField.name, () => {
      // Can't use showWhen, because we don't have access to scoringOption in endScreen chunk
      this.$scoringField.toggleClass('no-display', params.scoringOptionGroup.scoringOption !== undefined && params.scoringOptionGroup.scoringOption !== 'static-end-score');

      this.props.updateScoringOption();
    });

    this.l10n = {
      tooltipStartingScreen: t('tooltipStartingScreen'),
      tooltipEndScenario: t('tooltipEndScenario'),
      tooltipEndFeedback: t('tooltopEndFeedback'),
      tooltipScoringOptions: `<span class='tooltip-title'>${t('tooltipStaticScoreTitle')}</span><p>${t('tooltipStaticScoreText')}</p>
                              <span class='tooltip-title'>${t('tooltipDynamicScoreTitle')}</span><p>${t('tooltipDynamicScoreText')}</p>
                              <span class='tooltip-title'>${t('tooltipNoScoreTitle')}</span><p>${t('tooltipNoScoreText')}</p>`
    };
  }

  componentDidMount() {
    this.refStartScreen.current.appendChild(this.startScreenWrapper);
    this.refEndScreen.current.appendChild(this.endScreenWrapper);
    this.refScoringOption.current.appendChild(this.scoringOptionWrapper);
    this.refBehaviour.current.appendChild(this.behaviourWrapper);
  }

  render() {
    return (
      <div id="settings" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">{t('settings')}</span>
        <span className="tab-view-description">{t('branchingQuestionSettingsDescription')}</span>
        <div className="tab-view-white-box">
          <fieldset>
            <legend className="tab-view-info">
              {t('configureStartScreen')}
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
              {t('configureEndScenario')}
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
            <legend className="tab-view-info">
              {t('scoringOptions')}
              <TooltipButton
                text={ this.l10n.tooltipScoringOptions }
                tooltipClass={ 'tooltip wide' }
              />
            </legend>
            <div
              ref={this.refScoringOption}
              className='h5p-scoring-option-wrapper'
            />
          </fieldset>
          <fieldset>
            <legend className="tab-view-info">
              {t('behaviouralSettings')}
            </legend>
            <div
              ref={this.refBehaviour}
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
