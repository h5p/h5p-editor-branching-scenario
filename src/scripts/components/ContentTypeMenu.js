import React from 'react';
import './ContentTypeMenu.scss';
import Tooltip from './Tooltip';

export default class ContentTypeMenu extends React.Component {

  constructor(props) {
    super(props);
    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  handleMouseDown(e, data) {
    const positionData = this.refs.contentTypeButton.getBoundingClientRect();

    const mouseDownData = {
      contentClass: e.currentTarget.className,
      xPos: positionData.x,
      yPos: positionData.y,
      width: positionData.width,
      height: positionData.height,
      top: positionData.top
    }
    this.props.onMouseDown(e, mouseDownData);
    e.stopPropagation();
    e.preventDefault();
  }

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
        <li className="video" title="Add New Video" ref={"contentTypeButton"} onMouseDown={this.handleMouseDown} onMouseUp={this.props.onMouseUp}>Video</li>
          <li className="presentation" title="Add New Course Presentation">Presentation</li>
          <li className="text" title="Add New Text">Text</li>
          <li className="image" title="Add New Image">Image</li>
          <li className="interactive-video " title="Add New Interactive Video">Interac. Video</li>
          <li className="image-hotspots" title="Add New Image Hotspots">Hotspots</li>
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
