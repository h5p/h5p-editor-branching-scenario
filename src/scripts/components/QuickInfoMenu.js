import React from 'react';
import PropTypes from 'prop-types';

import { isDecendantOf } from '../helpers/DOM';
import './QuickInfoMenu.scss';

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
        <span>{ this.props.l10n.quickInfo }
          <span className="close link-look">
            { this.state.expanded ? this.props.l10n.hide : this.props.l10n.show }
          </span>
        </span>
        <div className={ 'legend-content' + expanded }>
          <ul>
            <li><strong>{ this.props.l10n.dropzoneTerm }</strong> { this.props.l10n.dropzoneText }</li>
            <li><strong>{ this.props.l10n.contentTerm }</strong> { this.props.l10n.contentText }</li>
            <li><strong>{ this.props.l10n.branchingQuestionTerm }</strong> { this.props.l10n.branchingQuestionText }</li>
            <li>{ this.props.l10n.alternative }</li>
            <li>{ this.props.l10n.defaultEndScenario }</li>
            <li>{ this.props.l10n.customEndScenario }</li>
            <li>{ this.props.l10n.existingQuestion }</li>
            <li>{ this.props.l10n.stepByStep } <span className="link-look" onClick={ this.props.handleOpenTutorial }>{ this.props.l10n.tutorial }</span></li>
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
