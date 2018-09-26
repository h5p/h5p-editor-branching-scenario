import React from 'react';
import TooltipButton from './TooltipButton';

export default class TabViewSettings extends React.Component {
  constructor(props) {
    super(props);

    this.refStartImageChooser = React.createRef();
    this.refEndImageChooser = React.createRef();
    this.refScoringOption= React.createRef();

    const scoringOptionField = H5PEditor.findSemanticsField(
      'scoringOption',
      this.props.main.field
    );
    const scoringOptionWrapper = document.createElement('div');
    scoringOptionWrapper.classList.add('h5p-behavioural-settings');
    const params = this.props.main.params;


    H5PEditor.processSemanticsChunk(
      [scoringOptionField],
      params,
      H5PEditor.$(scoringOptionWrapper),
      this.props.main
    );

    // Grab the select and listen for any changes to it
    H5PEditor.followField(this.props.main, 'scoringOption', () => {
      // Update scoring option
      this.setState({
        scoring: params.scoringOption
      });
      this.props.updateScoringOption();
    });

    this.scoringOptionWrapper = scoringOptionWrapper;

    // TODO: This needs to come from app and needs to be sanitized
    this.l10n = {
      tooltipStartingScreen: 'Starting screen is an intro screen that should give a learner additional information about the course',
      tooltipEndScenario: 'Each alternative that does not have a custom end screen set - will lead to a default end screen.',
      tooltipEndFeedback: 'You can customize the feedback, set a different text size and color using textual editor.'
    };

    this.state = {
      scoring: params.scoringOption
    };
  }

  componentDidMount() {
    /*
		 * This is hacking the old widget to quickly suit the new prerequisites.
		 * TODO: Create a new widget that can also be used in the fullscreen editor later
		 */
    this.props.startImageChooser.appendTo(this.refStartImageChooser.current);
    const startImage = document.getElementById('startImage').firstChild;
    startImage.removeChild(startImage.childNodes[0]);

    this.props.startImageChooser.on('changedImage', event => {
      // Pretend to be a React event
      event.target = {
        type: 'h5p-image',
        name: 'startImage',
        value: event.data
      };
      this.props.onChange(event);
    });

    // Same as above for default endscreen image
    this.props.endImageChooser.appendTo(this.refEndImageChooser.current);
    const endImage = document.getElementById('endImage').firstChild;
    endImage.removeChild(endImage.childNodes[0]);

    this.props.endImageChooser.on('changedImage', event => {
      // Pretend to be a React event
      event.target = {
        type: 'h5p-image',
        name: 'endImage',
        value: event.data
      };
      this.props.onChange(event);
    });

    // Allow buttons inside labels being clickable
    const manualFocus = document.getElementsByClassName('manual-focus');
    for (let i = 0; i < manualFocus.length; i++) {
      manualFocus[i].addEventListener('click', event => {
        event.preventDefault();
        if (manualFocus[i].htmlFor) {
          document.getElementById(manualFocus[i].htmlFor).focus();
        }
      });
    }

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
            <div className="field text importance-low">
              <label className="h5peditor-label-wrapper" htmlFor="startTitle">
                <span className="h5peditor-label h5peditor-required">Course title{/* TODO: Use title from semantics */}</span>
              </label>
              <input
                className="h5peditor-text"
                id="startTitle"
                type="text"
                name="startTitle"
                value={ this.props.value.startTitle }
                placeholder="Title for your course"
                onChange={ this.props.onChange }
              />
            </div>
            <div className="field text importance-low">
              <label className="h5peditor-label-wrapper" htmlFor="startSubtitle">
                <span className="h5peditor-label h5peditor-required">Course details{/* TODO: Use title from semantics */}</span>
              </label>
              <input
                className="h5peditor-text"
                id="startSubtitle"
                type="text"
                name="startSubtitle"
                value={ this.props.value.startSubtitle }
                placeholder="Details about the course"
                onChange={ this.props.onChange }
              />
            </div>
            <div className="field importance-low">
              <label className="h5peditor-label-wrapper" htmlFor="startImage">
                <span className="h5peditor-label">Course image{/* TODO: Use title from semantics */}</span>
              </label>
              <div
                id="startImage"
                name="startImage"
                ref={ this.refStartImageChooser }
              />
            </div>
          </fieldset>
          <fieldset>
            <legend className="tab-view-info">
              Configure the default "End scenario" screen
              <TooltipButton
                text={ this.l10n.tooltipEndScenario }
              />
            </legend>
            {
              this.state.scoring === 'static-end-score' &&
              <div className="h5p-end-score-wrapper field text importance-low">
                <label className="h5peditor-label-wrapper" htmlFor="endScreenScore">
                  <span className="h5peditor-label h5peditor-required">Score for the default end scenario{/* TODO: Use title from semantics */}</span>
                </label>
                <input
                  className="h5peditor-text"
                  id="endScreenScore"
                  type="number"
                  name="endScreenScore"
                  value={ this.props.value.endScreenScore }
                  onChange={ this.props.onChange }
                />
              </div>
            }
            <div className="field text importance-low">
              <label className="h5peditor-label-wrapper tab-view-info manual-focus" htmlFor="endFeedback">
                <span className="h5peditor-label h5peditor-required">Textual feedback for the user{/* TODO: Use title from semantics */}
                  <TooltipButton
                    text={ this.l10n.tooltipEndFeedback }
                  /></span>
              </label>
              <input
                className="h5peditor-text"
                id="endFeedback"
                type="text"
                name="endFeedback"
                placeholder="Some feedback for the user"
                value={ this.props.value.endFeedback }
                onChange={ this.props.onChange }
              />
            </div>
            <div className="field text importance-low">
              <label className="h5peditor-label-wrapper" htmlFor="endImage">
                <span className="h5peditor-label">Default end scenario image{/* TODO: Use title from semantics */}</span>
              </label>
              <div
                id="endImage"
                name="endImage"
                ref={ this.refEndImageChooser }
              />
            </div>
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
