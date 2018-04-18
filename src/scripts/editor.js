import React from 'react';

import Tabs from './components/TabPanel';
import Tab from './components/Tab';
import ContentTypeMenu from './components/ContentTypeMenu';
import TabViewSettings from './components/TabViewSettings';
import TabViewTranslations from './components/TabViewTranslations';
import TabViewTutorial from './components/TabViewTutorial';
import TabViewMetadata from './components/TabViewMetadata';

export default class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      settings: props.settings
    };
  }

  /**
   * Update settings
   * TODO: For a more general solution such as the fullscreen editor, this
   *       should be more abstract
   *
   * @param {Event} event - Change event.
   */
  onSettingsChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    const settings = this.state.settings;
    settings[[name]] = value;
    this.setState({settings: settings});

    this.props.updateParams(settings);
  }

  render() {
    return (
      <Tabs className="tab-view-wrapper">
        <Tab
          active="true"
          title="add content"
          className="bs-editor-content-tab has-submenu">
          <ContentTypeMenu />
					Tab One content
				</Tab>
        <Tab title="settings" className="bs-editor-settings-tab">
          <TabViewSettings
            value={this.state.settings}
            startImageChooser={this.props.startImageChooser}
            endImageChooser={this.props.endImageChooser}
            onChange={(event) => this.onSettingsChange(event)}
          />
        </Tab>
        <Tab title="translations" className="bs-editor-translations-tab">
          <TabViewTranslations />
        </Tab>
        <Tab title="tutorial" className="bs-editor-tutorial-tab">
          <TabViewTutorial />
        </Tab>
        <Tab title="metadata" className="bs-editor-metadata-tab">
          <TabViewMetadata
            value="TODO: fetch metadata"
          />
        </Tab>
      </Tabs>
    );
  }
}
