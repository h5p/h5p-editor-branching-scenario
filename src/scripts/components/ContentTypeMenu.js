import React from 'react';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {
  render() {
    return (
      <div className="content-type-menu">
        <label className="label-info">
          Info Content
          <Tooltip>
            Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
        <ul className="content-type-buttons">
          <li className="video blue" title="Add New Video">Video</li>
          <li className="presentation blue" title="Add New Course Presentation">Presentation</li>
          <li className="text blue" title="Add New Text">Text</li>
          <li className="image blue" title="Add New Image">Image</li>
          <li className="interactive-video blue" title="Add New Interactive Video">Interac. Video</li>
          <li className="image-hotspots blue" title="Add New Image Hotspots">Hotspots</li>
        </ul>
        <label className="label-info">
          Branching Content
          <Tooltip>
            Add Branching Question to create a custom path in the <strong>Branching Question Set.</strong>
          </Tooltip>
        </label>
        <ul className="content-type-buttons">
          <li className="branching-question purple" title="Add New Branching Question">Branching Question</li>
        </ul>
      </div>
    )
  }
}
