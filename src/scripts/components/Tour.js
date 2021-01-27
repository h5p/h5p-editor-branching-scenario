import React from 'react';
import {t} from '../helpers/translate';

export default class Tour extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className={ "tour-box " + this.props.markerPosition } style={ this.props.position }>
        <div className="tour-circle">
          <div className="tour-dialog">
            {this.props.message}
            <br/>
            <button type="button" className="tour-button" onClick={ this.props.onClose }>{t('iGotIt')}</button>
          </div>
        </div>
      </div>
    );
  }
}
