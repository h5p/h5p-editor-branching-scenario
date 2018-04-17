import React from 'react';
import '../styles/editor-branching-scenario.css';

import Tabs from './components/TabPanel';
import Tab from './components/Tab';

export default class Editor extends React.Component {
    render(){
      return (
        <Tabs>
            <Tab active="true" title="" className="bs-editor-content-tab has-submenu">
              Tab One content
            </Tab>
            <Tab title="" className="bs-editor-settings-tab">
              Tab Two Content
            </Tab>
            <Tab title="" className="bs-editor-translations-tab">
              Tab Three Content
            </Tab>
            <Tab title="" className="bs-editor-tutorial-tab">
              Tab Four Content
            </Tab>
            <Tab title="" className="bs-editor-metadata-tab">
              Tab Five Content
            </Tab>
        </Tabs>
      );
    }
}
