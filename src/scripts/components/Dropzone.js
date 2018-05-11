import React from 'react';
import './Dropzone.scss';

export default class Dropzone extends React.Component {
  constructor(props) {
    super(props);
  }

  getPoints() {
    const raw = this.refs.element.getBoundingClientRect();
    return [{
      x: raw.x,
      y: raw.y
    }, {
      x: raw.x + raw.width,
      y: raw.y + raw.height
    }]
  }

  overlap(points) {
    const local = this.getPoints();
    return !(points[1].y < local[0].y ||
             points[0].y > local[1].y ||
             points[1].x < local[0].x ||
             points[0].x > local[1].x )
  }

  highlight() {
    this.refs.element.classList.add('highlight');
  }

  dehighlight() {
    this.refs.element.classList.remove('highlight');
  }

  render() {
    return (
      <div
        ref={ 'element' }
        className={ this.props.elementClass }
        style={ this.props.style }
        onClick={ this.props.onClick }
      >
        { this.props.innerHTML }
      </div>
    );
  }
}
