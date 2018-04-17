import React from 'react';

export default class TabViewSettings extends React.Component {
	render() {
		return (
      <div id="settings" className="tab tab-view-full-page large-padding">
        <span className="tab-view-title">Settings</span>
        <span className="tab-view-description">Below are the settings for your <strong>Branching Questions</strong></span>
        <div className="tab-view-white-box">
          <form>
            <fieldset>
              <legend className="tab-view-info">Configure starting screen
                <span className="tab-view-info-tip">Starting screen is an intro screen that should give a learner additional information about the course</span>
              </legend>
              <label htmlFor="startTitle">Course title</label>
              <input
                id="startTitle"
                type="text"
                name="startTitle"
                value={this.props.startTitle}
                placeholder="Title for your course"
                onChange={this.props.onChange}
              />
              <label htmlFor="startSubtitle">Course details</label>
              <input
                id="startSubtitle"
                type="text"
                name="startSubtitle"
                value={this.props.startSubtitle}
                placeholder="Details about the course"
                onChange={this.props.onChange}
              />
              <label htmlFor="startImage">Upload the image</label>
              <input
                id="startImage"
                type="file"
                name="startImage"
                onChange={this.props.onChange}
              />
            </fieldset>
            <fieldset>
              <legend className="tab-view-info">Configure the default "End Scenario" screen
                <span className="tab-view-info-tip">Each alternative that does not have a custom end screen set - will lead to a default end screen.</span>
              </legend>
              <label htmlFor="endScore">Score for the default end scenario</label>
              <input
                id="endScore"
                type="number"
                name="endScore"
                value={this.props.endScore}
                onChange={this.props.onChange}
              />
              <label className="tab-view-info" htmlFor="endFeedback">Textual feedback for the user
                <span className="tab-view-info-tip">You can customize the feedback, set a different text size and color using textual editor.</span>
              </label>
              <input
                id="endFeedback"
                type="text"
                name="endFeedback"
                placeholder="Some feedback for the user"
                value={this.props.endFeedback}
                onChange={this.props.onChange}
              />
              <label htmlFor="endImage">Upload the image</label>
              <input
                id="endImage"
                type="file"
                name="endImage"
                onChange={this.props.onChange}
              />
            </fieldset>
            <fieldset>
              <legend className="tab-view-info">Behavioural settings</legend>
              <input
                id="optionsSkipToAQuestion"
                type="checkbox"
                name="optionsSkipToAQuestion"
                checked={this.props.optionsSkipToAQuestion}
                onChange={this.props.onChange}
              />Show "Skip to a question" button<br />
              <input
                id="optionsConfirmOnAlternative"
                type="checkbox"
                name="optionsConfirmOnAlternative"
                checked={this.props.optionsConfirmOnAlternative}
                onChange={this.props.onChange}
              />Show "Confirm" after you select an alternative<br />
              <input
                id="optionsTryAnotherChoice"
                type="checkbox"
                name="optionsTryAnotherChoice"
                checked={this.props.optionsTryAnotherChoice}
                onChange={this.props.onChange}
              />Show "Try another choice" after an answer <br />
              <input
                id="optionsDisplayScore"
                type="checkbox"
                name="optionsDisplayScore"
                checked={this.props.optionsDisplayScore}
                onChange={this.props.onChange}
              />Display score<br />
            </fieldset>
          </form>
        </div>
    </div>
		)
	}
}
