import React from 'react';

export default class TabViewTranslations extends React.Component {
	render() {
		return (
			<div id="translate-interface" className="tab tab-view-full-page large-padding">
				<span className="tab-view-title">Interface Translations</span>
				<span className="tab-view-description">All content types fields included in this <strong>Branching Questions</strong> can be customized. Below are the fields that are translateable</span>
					<div className="tab-view-white-box">
						<form>
							<fieldset>
								<legend>Branching Scenario Translations</legend>
							</fieldset>
							<fieldset>
								<legend>Interactive Video Translations</legend>
							</fieldset>
							<fieldset>
								<legend>Presentation Translations</legend>
							</fieldset>
							<fieldset>
								<legend>Video Translations</legend>
							</fieldset>
							<fieldset>
								<legend>Hotspots Translations</legend>
							</fieldset>
						</form>
				</div>
			</div>
		)
	}
}
