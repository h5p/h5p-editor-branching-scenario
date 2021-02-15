import React from 'react';
import './Dropzone.scss';

export default class Dropzone extends React.Component {
  constructor(props) {
    super(props);
  }

  getPoints() {
    const raw = this.element.getBoundingClientRect();
    return [{
      x: raw.left,
      y: raw.top
    }, {
      x: raw.left + raw.width,
      y: raw.top + raw.height
    }];
  }

  overlap(points) {
    const local = this.getPoints();
    return !(points[1].y < local[0].y ||
      points[0].y > local[1].y ||
      points[1].x < local[0].x ||
      points[0].x > local[1].x );
  }

  /**
   * Get intersecting area.
   *
   * @param {object[]} edges Edges of other item: [0] = upper left corner, [1] = lower right corner
   * @param {float} edges.x X coordinate.
   * @param {float} edges.y Y coordinate.
   * @param {float} Intersection area.
   */
  intersection(edges) {
    const local = this.getPoints();

    const intersectionX = Math.min(local[1].x, edges[1].x) - Math.max(local[0].x, edges[0].x);
    if (intersectionX <= 0) {
      return 0;
    }

    const intersectionY = Math.min(local[1].y, edges[1].y) - Math.max(local[0].y, edges[0].y);
    if (intersectionY <= 0) {
      return 0;
    }

    return intersectionX * intersectionY;
  }

  highlight() {
    this.element.classList.add('highlight');
    this.props.onFocus();
  }

  dehighlight() {
    this.element.classList.remove('highlight');
  }

  /**
   * Get type.
   *
   * @return {string} Type.
   */
  getType = () => {
    return this.props.type;
  }

  render() {
    return (
      <div
        ref={ node => this.element = node }
        className={ this.props.elementClass }
        style={ this.props.style }
        onFocus={ this.props.onFocus }
        onClick={ this.props.onClick }
        onMouseOver={ this.props.onFocus }
        onMouseOut={ this.props.onMouseOut }
        type={ this.props.type }
      >
        { this.props.innerHTML }
      </div>
    );
  }
}
