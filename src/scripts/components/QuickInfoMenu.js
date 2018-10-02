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
        <span>{ 'Quick Info' }
          <span className="close link-look">
            { this.state.expanded ? 'Hide' : 'Show' }
          </span>
        </span>
        <div className={ 'legend-content' + expanded }>
          <ul>
            <li><strong>{ 'Dropzone' }</strong> { 'It appears when you select or start dragging content' }</li>
            <li><strong>{ 'Content' }</strong></li>
            <li><strong>{ 'Branching Question' }</strong> { 'Each alternative can lead to different question/content.' }</li>
            <li>{ 'Alternative leads to another question/content.' }</li>
            <li>{ 'Path ends here (with the default end scenario)' }</li>
            <li>{ 'Path ends here (with the custom end scenario)' }</li>
            <li>{ 'Path takes the learner to an existing question/content. Click to see where it leads to.' }</li>
            <li>{ 'Step by Step' } <span className="link-look" onClick={ this.props.onTutorialOpen }>{ 'tutorial' }</span></li>
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
