import React from 'react';
import PropTypes from 'prop-types';
import './QuickInfoMenu.scss';

export default class QuickInfoMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: this.props.expanded
    };
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
    const elementClass = `legend ${(this.state.expanded === true) ? 'expanded' : ''}`;

    return (
      <div id="legend" className={ elementClass }>
        <span>{ this.props.l10n.quickInfo }
          <a href="#" className="close" onClick={ this.handleToggle }>
            { this.state.expanded ? this.props.l10n.hide : this.props.l10n.show }
          </a>
        </span>
        { this.state.expanded &&
          <ul className="legend-content">
            <li><strong>{ this.props.l10n.dropzoneTerm }</strong> { this.props.l10n.dropzoneText }</li>
            <li><strong>{ this.props.l10n.contentTerm }</strong> { this.props.l10n.contentText }</li>
            <li><strong>{ this.props.l10n.branchingQuestionTerm }</strong> { this.props.l10n.branchingQuestionText }</li>
            <li>{ this.props.l10n.alternative }</li>
            <li>{ this.props.l10n.defaultEndScenario }</li>
            <li>{ this.props.l10n.customEndScenario }</li>
            <li>{ this.props.l10n.existingQuestion }</li>
            <li>{ this.props.l10n.stepByStep } <a href='#' onClick={ this.props.handleOpenTutorial }>{ this.props.l10n.tutorial }</a></li>
          </ul>
        }
      </div>
    );
  }
}

QuickInfoMenu.propTypes = {
  expanded: PropTypes.bool,
  l10n: PropTypes.object,
  onOpenTutorial: PropTypes.func
};
