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

  render() {
    const style = {
      left: this.props.position.x + 'px',
      top: this.props.position.y + 'px'
    };

    let elementClass = 'dropzone';
    if (this.props.highlight) {
      elementClass += ' highlight';
    }

    return (
      <div
        ref={ 'element' }
        className={ elementClass }
        style={ style }
        onClick={ this.props.onClick }
      />
    );
  }
}
