import React from 'react';
import TooltipButton from './TooltipButton';

export default class TabViewSettings extends React.Component {
  constructor (props) {
    super(props);

    this.refStartImageChooser = React.createRef();
    this.refEndImageChooser = React.createRef();

    // TODO: This needs to come from app and needs to be sanitized
    this.l10n = {
      tooltipStartingScreen: 'Starting screen is an intro screen that should give a learner additional information about the course',
      tooltipEndScenario: 'Each alternative that does not have a custom end screen set - will lead to a default end screen.',
      tooltipEndFeedback: 'You can customize the feedback, set a different text size and color using textual editor.'
    };
  }

  componentDidMount () {
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
  }

  render () {
    return (
      <div id="settings" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Settings</span>
        <span className="tab-view-description">Below are the settings for your <strong>Branching Questions</strong></span>
        <div className="tab-view-white-box">
          <form>
            <fieldset>
              <legend className="tab-view-info">
                Configure starting screen
                <TooltipButton
                  text={ this.l10n.tooltipStartingScreen }
                  tooltipClass={ 'tooltip below' }
                />
              </legend>
              <label htmlFor="startTitle">Course title</label>
              <input
                id="startTitle"
                type="text"
                name="startTitle"
                value={ this.props.value.startTitle }
                placeholder="Title for your course"
                onChange={ this.props.onChange }
              />
              <label htmlFor="startSubtitle">Course details</label>
              <input
                id="startSubtitle"
                type="text"
                name="startSubtitle"
                value={ this.props.value.startSubtitle }
                placeholder="Details about the course"
                onChange={ this.props.onChange }
              />
              <label htmlFor="startImage">Upload the image</label>
              <div
                id="startImage"
                name="startImage"
                ref={ this.refStartImageChooser }
              />
            </fieldset>
            <fieldset>
              <legend className="tab-view-info">
                Configure the default "End Scenario" screen
                <TooltipButton
                  text={ this.l10n.tooltipEndScenario }
                />
              </legend>
              <label htmlFor="endScore">Score for the default end scenario</label>
              <input
                id="endScore"
                type="number"
                name="endScore"
                value={ this.props.value.endScore }
                onChange={ this.props.onChange }
              />
              <label className="tab-view-info manual-focus" htmlFor="endFeedback">
                Textual feedback for the user
                <TooltipButton
                  text={ this.l10n.tooltipEndFeedback }
                />
              </label>
              <input
                id="endFeedback"
                type="text"
                name="endFeedback"
                placeholder="Some feedback for the user"
                value={ this.props.value.endFeedback }
                onChange={ this.props.onChange }
              />
              <label htmlFor="endImage">Upload the image</label>
              <div
                id="endImage"
                name="endImage"
                ref={ this.refEndImageChooser }
              />
            </fieldset>
            <fieldset>
              <legend className="tab-view-info">Behavioural settings</legend>
              <input
                id="optionsSkipToAQuestion"
                type="checkbox"
                name="optionsSkipToAQuestion"
                checked={ this.props.value.optionsSkipToAQuestion }
                onChange={ this.props.onChange }
              />Show "Skip to a question" button<br />
              <input
                id="optionsConfirmOnAlternative"
                type="checkbox"
                name="optionsConfirmOnAlternative"
                checked={ this.props.value.optionsConfirmOnAlternative }
                onChange={ this.props.onChange }
              />Show "Confirm" after you select an alternative<br />
              <input
                id="optionsTryAnotherChoice"
                type="checkbox"
                name="optionsTryAnotherChoice"
                checked={ this.props.value.optionsTryAnotherChoice }
                onChange={ this.props.onChange }
              />Show "Try another choice" after an answer <br />
              <input
                id="optionsDisplayScore"
                type="checkbox"
                name="optionsDisplayScore"
                checked={ this.props.value.optionsDisplayScore }
                onChange={ this.props.onChange }
              />Display score<br />
            </fieldset>
          </form>
        </div>
      </div>
    );
  }
}
