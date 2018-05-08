import React from 'react';
import PropTypes from 'prop-types';

import Tabs from './components/TabPanel';
import Tab from './components/Tab';
import ContentTypeMenu from './components/ContentTypeMenu';
import Canvas from './components/Canvas';
import TabViewSettings from './components/TabViewSettings';
import TabViewTranslations from './components/TabViewTranslations';
import TabViewTutorial from './components/TabViewTutorial';
import TabViewMetadata from './components/TabViewMetadata';
import EditorOverlay from './components/EditorOverlay';

export default class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      translations: props.translations,
      settings: props.settings,
      libraries: props.libraries
    };
  }

  /**
   * Update settings
   * TODO: For a more general solution such as the fullscreen editor, this
   *       should be more abstract
   *
   * @param {Event} event - Change event.
   */
  handleSettingsChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    const settings = this.state.settings;
    settings[[name]] = value;
    this.setState({settings: settings});

    this.props.updateParams(settings);
  }

  handleTranslationsChange = (event) => {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    const translations = this.state.translations;

    // TODO: Change the data structure of translations!!!
    const pathItems = target.name.split('/');
    const affectedItem = translations
      .reduce((a, b) => a.concat(b), [])
      .filter(t => t.library === pathItems[0] && t.name === pathItems[pathItems.length - 1]);
    affectedItem[0].translation = value;
    this.setState({translations: translations});

    this.props.updateTranslations(affectedItem[0]);
  }

  /**
   * Signal readiness to processSemanticsChunk.
   * TODO: Should probably be completed as intended.
   *
   * @return {boolean} true.
   */
  ready() {
    return true;
  }

  /**
   * Update the form for editing an interaction
   *
   * @param {object} interaction - Parameters to set in form.
   */
  updateForm(interaction, elementFields) {
    this.child.child.updateForm(interaction, elementFields);
  }

  handleMouseDown = (event) => {
    this.setState({
      inserting: event
    });
  }

  handleInserted = () => {
    this.setState({
      inserting: null
    });
  }

  render() {
    return (
      <Tabs className="tab-view-wrapper">
        <Tab title="add content" className="bs-editor-content-tab has-submenu">
          <ContentTypeMenu
            libraries={ this.state.libraries } // TODO: Load libraries in this widget?
            onMouseDown={ this.handleMouseDown }
          />
          <Canvas
            inserting={ this.state.inserting }
            onInserted={ this.handleInserted }
            onRef={ref => (this.child = ref)}
            saveData={this.props.saveData}
            removeData={this.props.removeData}
            main={this.props.main} // TODO: A lot of stuff being passed through – use props.children instead?
          />
        </Tab>
        <Tab title="settings" className="bs-editor-settings-tab">
          <TabViewSettings
            value={this.state.settings}
            startImageChooser={this.props.startImageChooser}
            endImageChooser={this.props.endImageChooser}
            onChange={this.handleSettingsChange}
          />
        </Tab>
        <Tab title="translations" className="bs-editor-translations-tab">
          <TabViewTranslations
            translations={this.state.translations}
            onChange={this.handleTranslationsChange}
          />
        </Tab>
        <Tab title="tutorial" className="bs-editor-tutorial-tab">
          <TabViewTutorial />
        </Tab>
        <Tab title="metadata" className="bs-editor-metadata-tab">
          <TabViewMetadata
            value=""
          />
        </Tab>
      </Tabs>
    );
  }
}

Editor.propTypes = {
  libraries: PropTypes.array,
  settings: PropTypes.object,
  updateParams: PropTypes.func
};

// TODO Proptypes for endImageChooser and startImageChooser
