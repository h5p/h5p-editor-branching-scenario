import React from 'react';
import TooltipButton from './TooltipButton';
import './TabViewMetadata.scss';
import {t} from '../helpers/translate';

export default class TabViewMetadata extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.metadataForm.appendTo(this.form);
  }

  render() {
    return (
      <div id="metadata" className="tab tab-view-full-page large-padding" >
        <span className="tab-view-title">{t('metadata')}</span>
        <span className="tab-view-description">{t('addMetadata')}</span>
        <div className="tab-view-white-box" >
          <fieldset>
            <legend className="tab-view-info">
              {t('metadata')}
              <TooltipButton
                text={t('metadataDescription')}
                tooltipClass={ 'tooltip below' }
              />
            </legend>
            <div ref={ element => this.form = element } />
          </fieldset>
        </div>
      </div>
    );
  }
}
