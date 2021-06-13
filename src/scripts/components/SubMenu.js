import React from 'react';
import PropTypes from 'prop-types';
import './SubMenu.scss';
import {t} from '../helpers/translate';

export default class SubMenu extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let elementClass = 'submenu';

    return (
      <ul className={ elementClass }>
        <li>{ this.props.isContent ? t('contentOptions') : t('branchingQuestionOptions') }</li>
        <li
          className='preview-content'
          onClick={ this.props.onPreview }
        >{t('startPreview')}</li>
        <li className='edit-content' onClick={ this.props.onEdit }>{ this.props.isContent ? t('editContent') : t('editQuestionOrAlternative') }</li>
        <li className='copy-content' onClick={ this.props.onCopy }>{t('copy')}</li>
        <li className='delete-content' onClick={ this.props.onDelete }>{t('delete')}</li>
      </ul>
    );
  }
}

SubMenu.propTypes = {
  onPreview: PropTypes.func,
  onEdit: PropTypes.func,
  onCopy: PropTypes.func,
  onDelete: PropTypes.func
};
