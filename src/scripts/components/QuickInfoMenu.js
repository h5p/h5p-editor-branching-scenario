import React from 'react';
import PropTypes from 'prop-types';

import { isDecendantOf } from '../helpers/DOM';
import './QuickInfoMenu.scss';
import {t} from '../helpers/translate';

export default class QuickInfoMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false
    };
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleDocumentClick);
  }

  /**
   * Reset visibility on any document action
   */
  handleDocumentClick = (event) => {
    if (this.state.expanded && !isDecendantOf(this.legend, event.target)) {
      this.setState({
        expanded: false
      });
    }
  }

  /**
   * Toggle visibility of quick info menu
   */
  handleToggle = () => {
    this.setState(prevState => {
      return {
        expanded: !prevState.expanded
      };
    });
  }

  /**
   * Render quick info menu
   */
  render () {
    const expanded = (this.state.expanded ? ' expanded' : '');
    const fade = (this.props.fade ? ' fade' : '');

    return (
      <div className={ 'legend' + expanded + fade } onClick={ this.handleToggle } ref={ element => this.legend = element }>
        <span>{t('quickInfo')}
          <span className="close link-look">
            { this.state.expanded ? t('hide') : t('show') }
          </span>
        </span>
        <div className={ 'legend-content' + expanded }>
          <ul>
            <li><strong>{t('dropzone')}</strong>- {t('legendDropzone')}</li>
            <li><strong>{t('content')}</strong></li>
            <li><strong>{t('branchingQuestion')}</strong>- {t('legendBranchingQuestion')}</li>
            <li>{t('legendAlternative')}</li>
            <li>{t('legendPathEndDefault')}</li>
            <li>{t('legendPathEndCustom')}</li>
            <li>{t('legendPathRetread')}</li>
            <li><span className="link-look" onClick={ this.props.onTutorialOpen }>{t('stepByStepTutorial')}</span></li>
          </ul>
        </div>
      </div>
    );
  }
}

QuickInfoMenu.propTypes = {
  fade: PropTypes.bool,
  l10n: PropTypes.object,
  onOpenTutorial: PropTypes.func
};
