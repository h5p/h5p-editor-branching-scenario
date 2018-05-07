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
      activeIndex: 0,
      translations: props.translations,
      settings: props.settings,
      libraries: props.libraries,
      dragging: false,
      mouse: {
        x: 0,
        y: 0
      },
      rel: {
        x: 0,
        y: 0
      },
      pos: {
        x: 0,
        y: 0
      },
    };

    window.addEventListener('mouseup', this.handleMouseUp);
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

  onTranslationsChange(event) {
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

  handleMouseDown = (e, data) => {
    if (data) {
      this.setState({
        dragging: true,
        draggable: data,
        mouse: {
          x: e.pageX,
          y: e.pageY
        },
        rel : {
          x: data.xPos,
          y: data.yPos
        },
        pos : {
          x: e.pageX - data.xPos,
          y: e.pageY - 65
        }
      });
      window.addEventListener('mousemove', this.handleMouseMove);
    }

    else {
      this.setState({
        mouse: {
          x: e.pageX,
          y: e.pageY
        }
      });
    }

    e.persist();
    //Will prevent forms from working correctly
    //e.stopPropagation();
    //e.preventDefault();
  }

  handleMouseMove = (e) => {
    this.setState({
      mouse: {
        x: e.pageX,
        y: e.pageY
      },
      pos: {
        x: e.pageX - this.state.rel.x,
        y: e.pageY - 65
      }
    });
    e.stopPropagation();
    e.preventDefault();
  }

  /**
   * Signal readiness to processSemanticsChunk.
   * TODO: Should probably be completed as intended.
   *
   * @return {boolean} true.
   */
  ready () {
    return true;
  }

  /**
   * Update the form for editing an interaction
   *
   * @param {object} interaction - Parameters to set in form.
   */
  updateForm (interaction, elementFields) {
    this.child.child.updateForm(interaction, elementFields);
  }

  handleMouseUp = (e) => {
    this.setState({
      dragging: false
    });
    window.removeEventListener('mousemove', this.handleMouseMove);
    e.stopPropagation();
    e.preventDefault();
  }

  navigateToTutorial = () => {
    this.setState({
      activeIndex: 3 
    });
  }

  setActiveIndex = (key) => {
    this.setState({
      activeIndex: key
    });
  }

  render() {
    return (
      <Tabs className="tab-view-wrapper"
        activeIndex={ this.state.activeIndex}
        setActiveIndex={ key => this.setActiveIndex(key)}
      >
        <Tab
          onMouseUp={ this.handleMouseUp }
          title="add content"
          className="bs-editor-content-tab has-submenu">
          <ContentTypeMenu
            libraries={ this.state.libraries }
            onMouseDown={ this.handleMouseDown  }
          />
          <Canvas
            onRef={ref => (this.child = ref)}
            active={this.state.active}
            dragging={this.state.dragging}
            draggable={this.state.draggable}
            mouseX={this.state.mouse.x}
            mouseY={this.state.mouse.y}
            posX={this.state.pos.x}
            posY={this.state.pos.y}
            width={this.state.draggable ? parseInt(this.state.draggable.wdith): null}
            onMouseDown={ this.handleMouseDown }
            saveData={this.props.saveData}
            removeData={this.props.removeData}
            main={this.props.main}
            navigateToTutorial={this.navigateToTutorial} 
          />
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
          <TabViewTranslations
            translations={this.state.translations}
            onChange={(event) => this.onTranslationsChange(event)}
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
