import React from 'react';
import '../styles/editor-branching-scenario.css';

import Tabs from './components/TabPanel';
import Tab from './components/Tab';

export default class Editor extends React.Component {
    render(){
      return (
        <Tabs className="tabs-wrapper">
            <Tab active="true" title="Tab One">
							Tab One content
						</Tab>
            <Tab title="Tab Two">
            	Tab Two Content
            </Tab>
        </Tabs>    
      );
    }
}
