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

export default class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      translations: props.translations,
      settings: props.settings,
      libraries: props.libraries,
      active: false,
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

  update(paramsObject) {
    this.setState(paramsObject);
  }

  handleMouseDown = (e, data) => {
    if (data) {
      this.setState(prevState => {
        return {
          dragging: true,
          active: !prevState.active,
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
          },
        };
      });
      window.addEventListener('mousemove', this.handleMouseMove);
    }

    else {
      this.setState(prevState => {
        return {
          active: !prevState.active,
          mouse: {
            x: e.pageX,
            y: e.pageY
          }
        };
      });
    }

    e.persist();
    e.stopPropagation();
    e.preventDefault();
  }

  handleMouseUp = (e) => {
    this.setState({
      dragging: false
    });
    window.removeEventListener('mousemove', this.handleMouseMove);
    e.stopPropagation();
    e.preventDefault();
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

  render() {
    return (
      <Tabs className="tab-view-wrapper">
        <Tab
          onMouseUp={ this.handleMouseUp }
          title="add content"
          className="bs-editor-content-tab has-submenu">
          <ContentTypeMenu
            libraries={ this.state.libraries }
            onMouseDown={ this.handleMouseDown  }
            active={ this.state.active }
          />
          <Canvas
            active={this.state.active}
            dragging={this.state.dragging}
            draggable={this.state.draggable}
            mouseX={this.state.mouse.x}
            mouseY={this.state.mouse.y}
            posX={this.state.pos.x}
            posY={this.state.pos.y}
            width={this.state.draggable ? parseInt(this.state.draggable.wdith): null}
            onMouseDown={ this.handleMouseDown  }
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
            value="TODO: fetch metadata"
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
