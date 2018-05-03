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

    // Working around core ... :-(
    this.parent = props.parent;

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

    // For testing the editor overlay, press § (shift-3)
    document.addEventListener('keydown', event => {
      if (event.keyCode === 51 && this.child) {
        this.child.toggleEditorOverlay();
      }
    });
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

  /**
   * Set all semantics by outside component.
   * Expects {library: 'machineName', semantics{...}}
   *
   * @param {object[]} semantics - All semantics used (should be enlarged to all possible)
   */
  setSemantics(semantics) {
    this.allSemantics = semantics;
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
    //Will prevent forms from working correctly
    //e.stopPropagation();
    //e.preventDefault();
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
   * @param {string} libraryName - Name of the interaction library to use.
   * @param {object} [elementParams] - Parameters to set in form.
   */
  updateForm (libraryName = 'H5P.Image', elementParams = {}) {
    this.passReadies = false;

    const $form = H5P.jQuery('<div/>');

    let elementFields = {};
    if (this.allSemantics) {
      const testLibrary = this.allSemantics.filter(item => item.library.indexOf(libraryName) !== -1)[0];
      elementFields = testLibrary.semantics.fields;
    }

    // Attach the DOM to $form
    H5PEditor.processSemanticsChunk(elementFields, elementParams, $form, this.parent);
    /*
     * React doesn't allow DOM or jQuery elements, so this is a workaround
     * to update the form overlay components contents.
     * TODO: When working, don't keep the component, but create/destroy it as
     *       needed. Makes more sense. This will probably go into the
     *       component's constructor then.
     */
    this.child.child.updateForm($form);
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
            onRef={ref => (this.child = ref)}
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
