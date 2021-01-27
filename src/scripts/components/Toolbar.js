import React from 'react';
import PropTypes from 'prop-types';
import { find } from '../helpers/Library';
import {t} from '../helpers/translate';
import './Toolbar.scss';

export default class Toolbar extends React.Component {
  constructor(props) {
    super(props);

    this.zoomLevels = [0.1, 0.25, 0.33, 0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5];
    this.zoomFitPadding = 0.9; // Percentage
    this.defaultScale = 1;

    this.state = {
      showInfoPopup: false,
      scale: this.defaultScale
    };
  }

  handleShowPopup = () => {
    this.setState({
      showInfoPopup: true
    });
  }

  handleClosePopup = () => {
    this.setState({
      showInfoPopup: false
    });
  }

  handleHighlight = () => {
    this.props.onHighlight(-1);
    this.handleClosePopup();
  }

  /**
   * Handle changed scale.
   *
   * @param {number} scale Scale to set canvas to.
   * @param {object} [options] Extra options.
   * @param {boolean} [options.center] If true, center canvas.
   * @param {object} [params.translate] Offsets for translating canvas.
   * @param {number} [params.translate.x] X offset.
   * @param {number} [params.translate.y] Y offset.
   */
  handleScaleChanged = (scale, options) => {
    if (!scale) {
      return;
    }

    // Limit scale to bounds of zoom levels
    scale = Math.max(scale, this.zoomLevels[0]);
    scale = Math.min(scale, this.zoomLevels[this.zoomLevels.length-1]);

    this.setState({
      scale: scale
    });

    // Notify parent
    this.props.onScaleChanged(scale, { center: options.center, translate: options.translate });
  }

  /**
   * Change zoom.
   *
   * @param {bolean} zoomin Zoom direction. true = zoom in, false = zoom out.
   */
  handleZoom = (zoomin = true) => {
    if (this.props.disabled) {
      return;
    }

    let newScale;

    // Get closest zoom level
    let pos = this.zoomLevels.indexOf(this.state.scale);
    if (pos === -1) {
      if (this.state.scale < this.zoomLevels[0]) {
        pos = 0;
      }
      else if (this.state.scale > this.zoomLevels[this.zoomLevels.length-1]) {
        pos = this.zoomLevels.length - 1;
      }
      else {
        pos = this.zoomLevels.indexOf(find(this.zoomLevels, level => level > this.state.scale));
      }
    }

    // Zoom
    if (zoomin) {
      newScale = (pos + 1 >= this.zoomLevels.length) ? this.state.scale : this.zoomLevels[pos + 1];
    }
    else {
      newScale = (pos <= 0) ? this.state.scale : this.zoomLevels[pos - 1];
    }

    // Determine translation offest with new scale
    const contentRect = this.props.contentRect.getBoundingClientRect();
    this.handleScaleChanged(
      newScale, {
        translate: {
          x: (contentRect.width - contentRect.width / this.state.scale * newScale) / 4,
          y: (contentRect.height - contentRect.height / this.state.scale * newScale) / 4
        }
      }
    );
  }

  /**
   * Fit tree to canvas.
   */
  handleFitToCanvas = () => {
    if (!this.props.containerRect || !this.props.contentRect) {
      return;
    }

    const containerRect = this.props.containerRect.getBoundingClientRect();
    const contentRect = this.props.contentRect.getBoundingClientRect();

    const ratioWrap = containerRect.width / containerRect.height;
    const ratioNode = contentRect.width / contentRect.height;

    const factor = (ratioNode < ratioWrap) ?
      containerRect.height * this.zoomFitPadding / contentRect.height :
      containerRect.width * this.zoomFitPadding / contentRect.width;

    // Zoom to fit should be limited to default scale when upscaling
    const newScale = Math.min(this.defaultScale, this.state.scale * factor);

    this.handleScaleChanged(newScale, { center: true });
  }

  render() {
    let infoPopupClass = 'info-popup';
    if (this.state.showInfoPopup) {
      infoPopupClass += ' visible';
    }

    let zoomOutClass = 'zoom-out';
    if (this.props.disabled || this.state.scale <= this.zoomLevels[0]) {
      // Disable zoom out
      zoomOutClass += ' disabled';
    }

    let zoomInClass = 'zoom-in';
    if (this.props.disabled || this.state.scale >= this.zoomLevels[this.zoomLevels.length - 1]) {
      // Disable zoom out
      zoomInClass += ' disabled';
    }

    return (
      <div className={ 'toolbar' + (this.props.isTourActive ? ' tour-fade' : '') }>
        <div className="zoom-wrapper">
          <span
            className={ zoomOutClass }
            title={t('zoomOut')}
            tabIndex="0"
            role="button"
            onClick={ () => this.handleZoom(false) }
          />
          <span className="zoom-status">
            { `${Math.round(this.state.scale * 100)} %`}
          </span>
          <span
            className={ zoomInClass }
            title={t('zoomIn')}
            tabIndex="0"
            role="button"
            onClick={ () => this.handleZoom(true) }
          />
          <span
            className={ 'fit-to-canvas' + (this.props.disabled ? ' disabled' : '') }
            title={t('zoomToFit')}
            tabIndex="0"
            role="button"
            onClick={ this.handleFitToCanvas }
          >
            {t('zoomToFit')}
          </span>
        </div>
        <div
          className="missing-end-scenarios"
          title={`${this.props.numDefaultEndScenarios} ${t('alternativeWithoutCustomEnd')}`}
          role="button"
          tabIndex="0"
          onClick={ this.handleShowPopup }
        >{ this.props.numDefaultEndScenarios }</div>
        <div className={ infoPopupClass }>
          { this.props.numDefaultEndScenarios } {(t('alternativesMissing'))}
          { !!this.props.numDefaultEndScenarios &&
            <span> <span className="highlight-end-scenarios-button" role="button" tabIndex="0" onClick={ this.handleHighlight }>{t('clickHereToHighlight')}</span></span>
          }

          <div className="close-info-popup-button" onClick={ this.handleClosePopup } aria-label={t('close')}></div>
        </div>
      </div>
    );
  }
}

Toolbar.propTypes = {
  numDefaultEndScenarios: PropTypes.number,
  onHighlight: PropTypes.func,
  scale: PropTypes.number,
  onScaleChanged: PropTypes.func,
  containerRect: PropTypes.object,
  contentRect: PropTypes.object,
  isTourActive: PropTypes.bool
};
