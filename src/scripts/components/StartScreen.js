import React from 'react';
import PropTypes from 'prop-types';
import './StartScreen.scss';
import {t} from '../helpers/translate';

export default class StartScreen extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="startscreen-wrapper" onClick={this.props.handleClick}>
        <div className="startscreen-header">
          <h1>{t('noContentAdded')}</h1>
          <p>{t('dragIconFromMenu')}</p>
          { this.props.children }
        </div>
        <div className="startscreen-footer">
          <p><a onClick={this.props.handleTutorialClick}>{t('stepByStepTutorial')}</a></p>
        </div>
      </div>
    );
  }
}

StartScreen.propTypes = {
  handleClick: PropTypes.func,
  handleTutorialClick: PropTypes.func
};
