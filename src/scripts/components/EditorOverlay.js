import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import './EditorOverlay.scss';
import Canvas from './Canvas';
import BranchingOptions from "./content-type-editor/BranchingOptions";
import { isBranching } from '../helpers/Library';
import Content from "./Content";
import {t} from '../helpers/translate';

export default class EditorOverlay extends React.Component {

  constructor(props) {
    super(props);

    // NOTE: This component will have to be remounted when props.content changed
    // in order to update the generic H5PEditor part.
    // Does not update parent state until close.

    // Reference to the React form wrapper
    this.form = React.createRef();

    // Reference to the feedback form wrapper
    this.feedbackForm = React.createRef();

    // Useful multiple places later
    this.isBranchingQuestion = isBranching(this.props.content);

    // Show Branching options by default for all forms
    this.state = {
      isSubFrom: false
    }

    this.validAltCount = this.props.validAlternatives
      ? this.props.validAlternatives.length : 0;
  }

  componentDidMount() {
    this.attachEditorForm();
  }

  componentDidUpdate() {
    const validAltCount = this.props.validAlternatives
      ? this.props.validAlternatives.length : 0;

    // Alternatives has been deleted
    if (validAltCount !== this.validAltCount) {
      this.attachEditorForm();
      this.validAltCount = validAltCount;
    }
  }

  /**
   * (Re-)Generates editor form from valid alternatives
   */
  attachEditorForm() {
    // Remove all children
    const feedbackForm = this.feedbackForm.current;
    while (feedbackForm.firstChild) {
      feedbackForm.removeChild(feedbackForm.firstChild);
    }

    // Move feedback group to feedback form
    feedbackForm.appendChild(this.props.content.feedbackFormWrapper);

    // Remove all children
    const form = this.form.current;
    while (form.firstChild) {
      form.removeChild(form.firstChild);
    }

    // Insert editor form
    form.appendChild(this.props.content.formWrapper);

    // Listen for the ready event from the sub form
    if (this.props.content.ready === true) {
      this.ready();
    }
    else {
      this.props.content.ready = this.ready;
    }
  }

  ready = () => {
    // This will run once the sub content form is loaded
    if (this.isBranchingQuestion) {
      // Create and render a sub React DOM inside one of the editor widgets
      const bqField = this.findField('type/branchingQuestion');
      this.addBranchingOptionsToEditor(bqField, this.props.validAlternatives,
        this.props.content.params.type.params.branchingQuestion.alternatives);

      bqField.children.forEach(child => {
        if (child.getName !== undefined && child.getName() === 'alternatives') {
          child.widget.setConfirmHandler((item, id, buttonOffset, confirm) => {
            if (this.props.onNextContentChange(this.props.content.params.type.params.branchingQuestion.alternatives[id], -2, null)) {  // -2 = deleting entire alternative (handled by H5PEditor)
              // Delete dialog is displayed
              this.renderBranchingOptions[id] = confirm;
            }
            else {
              // Use default list dialog
              child.widget.defaultConfirmHandler(item, id, buttonOffset, confirm);
            }

          });
          return false; // Stop loop
        }
      });

      // Hide the showContentTitle checkbox for BQ content
      const showContentTitleField = this.findField('showContentTitle');
      showContentTitleField.$item.remove();

      // hides the contentBehaviour group so it can be moved into Branching Options object.
      const contentBehaviourGroup = this.findField('contentBehaviour');
      if (contentBehaviourGroup && contentBehaviourGroup.$item[0]) {
        contentBehaviourGroup.$item[0].remove();
      }
    }

    const library = this.findField('type');
    const titleField = H5PEditor.findField('title', library.metadataForm);
    titleField.$input.on('change', () => this.forceUpdate());

    // Change label and description of "requires finishing" field if they can be more specific.
    this.modifyRequiresFinishingField(library);

    const fm = (library.children[0] instanceof H5P.DragNBar.FormManager ? library.children[0] : (library.children[0].children && library.children[0].children[1] instanceof H5P.DragNBar.FormManager ? library.children[0].children[1] : null));
    if (fm) {
      fm.on('formopened', e => {
        const library = this.findField('type').params.library.split(' ')[0];
        if (library === "H5P.CoursePresentation" || library === "H5P.InteractiveVideo" ) {
          this.setState({ isSubFrom: true });
          this.handleVisibilityOfFields(false);
        }
      });

      fm.on('formclose', e => {
        const library = this.findField('type').params.library.split(' ')[0];
        if (library === "H5P.CoursePresentation" || library === "H5P.InteractiveVideo" ) {
          this.setState({ isSubFrom: false });
          this.handleVisibilityOfFields(true);
        }
      });

      // Use the form manager's buttons instead of ours
      fm.setAlwaysShowButtons(true);
      fm.off('formremove'); // Remove any old listeners just in case
      fm.off('formdone');
      fm.on('formremove', e => {
        if (e.data === 1) {
          this.handleRemove();
        }
      });
      fm.on('formdone', e => {
        if (e.data === 1) {
          this.handleDone();
        }
      });
    }

    // Force visuals to resize after initial render
    H5P.$window.trigger('resize');
  }

  /**
   * Change field for required finished field to suit current interaction.
   * @param {object} library Library type object.
   */
  modifyRequiresFinishingField(library = {}) {
    const machineName = (library.params && library.params.library) ? library.params.library.split(' ')[0] : null;
    const requiresFinishingField = this.findField('forceContentFinished');
    if (!machineName || !requiresFinishingField || !requiresFinishingField.$item) {
      return; // Nothing to do.
    }

    // Set individual overrides depending on interaction type
    if (machineName === 'H5P.CoursePresentation') {
      this.overrideBooleanField(
        requiresFinishingField.$item,
        {
          label: t('requiresFinishingCoursePresentationLabel'),
          description: t('requiresFinishingCoursePresentationDescription')
        }
      );
    }
    else if (machineName === 'H5P.InteractiveVideo' || machineName === 'H5P.Video') {
      this.overrideBooleanField(
        requiresFinishingField.$item,
        {
          label: t('requiresFinishingVideoLabel'),
          description: t('requiresFinishingVideoDescription')
        }
      );
    }
    else {
      /*
       * Pull request that introduced option to block proceeding until interaction
       * is finished was more general than design that was created later. It
       * can also block proceeding based on xAPI completed statements, but
       * there are no interactions of that sort included yet - remove settings here for now.
       */
      requiresFinishingField.$item.remove();
    }
  }

  /**
   * Override form's boolean fields DOM properties.
   * @param {H5P.jQuery} $item DOM element of boolean field.
   * @param {object} [params] Parameters.
   * @param {string} [params.label] Override for label.
   * @param {string} [params.description] Override for description.
   */
  overrideBooleanField($item, params = {}) {
    if (!$item) {
      return;
    }

    if (params.label) {
      const $label = $item.find('.h5peditor-label');
      const $input = $label.find('input').detach();
      $label.html(params.label).prepend($input);
    }
    if (params.description) {
      $item.find('.h5peditor-field-description').html(params.description);
    }
  }

  /**
   * Adds branching options to content
   * For Branching Question this means that the branching options
   * must be added to each alternative that can be chosen
   */
  addBranchingOptionsToEditor(branchingQuestionEditor, validAlternatives, alternatives) {
    if (!branchingQuestionEditor) {
      throw Error('Unable to locate Branching Question Editor. Did someone change Core?');
    }
    this.renderBranchingOptions = [];

    // Add <BranchingOptions> to each alternative in Branching Question
    branchingQuestionEditor.setAlternatives((listIndex, selectorWrapper, feedbackGroup) => {
      let nextContentId = (typeof alternatives === 'undefined' || listIndex + 1 > alternatives.length) ?
        -1 :
        alternatives[listIndex].nextContentId;

      const branchingUpdated = (value) => {
        this.props.onNextContentChange(alternatives[listIndex], parseInt(value), render);
      };

      const render = (nextContentId) => {
        ReactDOM.render((
          <BranchingOptions
            nextContentId={ nextContentId }
            validAlternatives={validAlternatives}
            onChangeContent={branchingUpdated}
            alternativeIndex={listIndex}
            nextContentLabel={t('specialActionSelected')}
            feedbackGroup={ feedbackGroup }
            scoringOption={ this.props.scoringOption }
          />
        ), selectorWrapper);
      };
      this.renderBranchingOptions[listIndex] = render;

      // Set default value to end scenario
      const normalizedNextContentId = nextContentId === '' ? -1 : nextContentId;
      branchingQuestionEditor.setNextContentId(
        listIndex,
        normalizedNextContentId
      );
      render(nextContentId);
    });
  }

  /**
   * Makes it easy to find a field in the current content form
   */
  findField = (path) => {
    return H5PEditor.findField(path, {
      children: this.props.content.formChildren,
    });
  }

  /**
   * Run validate on H5PEditor widgets.
   * @return {boolean}
   */
  validate = () => {
    let valid = true;
    for (let i = 0; i < this.props.content.formChildren.length; i++) {
      if (this.props.content.formChildren[i].validate() === false) {
        valid = false;
      }
    }
    return valid;
  }

  handleNextContentIdChange = (value) => {
    this.props.onNextContentChange(this.props.content.params, parseInt(value));
  };

  /**
   * Handle click on "remove".
   */
  handleRemove = () => {
    this.finalizeForm();
    this.props.onRemove();
  }

  /**
   * Handle visibility of behavioural fields depends on scenario
   */
  handleVisibilityOfFields = (display) => {
    // Show fields for the parent form
    if (display) {
      this.findField('showContentTitle').$item[0].style.display = "block";
      this.findField('forceContentFinished').$item[0].style.display = "block";
      this.findField('contentBehaviour').$item[0].style.display = "block";
      this.findField('proceedButtonText').$item[0].style.display = "block";
    }
    else{ 
      this.findField('showContentTitle').$item[0].style.display = "none";
      this.findField('forceContentFinished').$item[0].style.display = "none";
      this.findField('contentBehaviour').$item[0].style.display = "none";
      this.findField('proceedButtonText').$item[0].style.display = "none";
    }
  }

  /**
   * Handle click on "done".
   */
  handleDone = () => {
    this.finalizeForm();

    // Update Canvas state
    this.props.onDone();
  }


  /**
   * Validate and update form on closing.
   */
  finalizeForm = () => {
    // Validate all form children to save their current value
    this.validate();

    // Remove any open wysiwyg fields
    if (H5PEditor.Html) {
      H5PEditor.Html.removeWysiwyg();
    }

    if (this.isBranchingQuestion) {
      // Change non-selected "Next Content" to default end scenario.
      const alternatives = this.props.content.params.type.params.branchingQuestion.alternatives || [];
      alternatives.forEach((alternative, index) => {
        if (alternative.nextContentId === undefined) {
          alternatives[index].nextContentId = -1;
        }
      });

      // Collapse branching question list alternatives
      const branchingQuestionEditor = this.findField('type/branchingQuestion');
      if (branchingQuestionEditor) {
        branchingQuestionEditor.collapseListAlternatives();
      }
    }
  }

  render() {
    const library = this.props.content.params.type.library.split(' ')[0];
    const iconClass = `editor-overlay-title editor-overlay-icon-${Canvas.camelToKebab(library.split('.')[1])}`;
    let scoreClass = this.props.scoringOption === 'no-score'
      ? ' hide-scores' : '';
    if (this.props.scoringOption === 'dynamic-score') {
      scoreClass = ' dynamic-score';
    }

    let wrapperClass = 'editor-overlay';
    if (this.isBranchingQuestion) {
      wrapperClass += ' h5p-branching-question';
    }
    if (this.props.moveDown) {
      wrapperClass += ' move-down';
    }
    if (library === 'H5P.CoursePresentation' || library === 'H5P.InteractiveVideo') {
      wrapperClass += ' inconspicuous';
    }
    const feedbackGroupClass = this.props.content.params.nextContentId !== -1 ? ' hide-score' : '';

    const metadata = this.props.content.params.type.metadata;
    const hasMetadataTitle = metadata
      && metadata.title
      && metadata.title.trim().length > 0;

    let title = hasMetadataTitle
      ? Content.stripHTML(metadata.title)
      : Content.getTooltip(this.props.content, true);

    const feedbackGroupField = (!this.isBranchingQuestion ? this.findField('feedback') : null);

    const behaviourGroupField = this.findField('contentBehaviour');

    return (
      <div className={ wrapperClass }>
        <div className='editor-overlay-header' >
          <span
            className={ iconClass }
          >{ title }</span>
          <span className="buttons">
            <button
              className="button-remove"
              onClick={ this.handleRemove }
            >
              {t('remove')}
            </button>
            <button
              className="button-blue"
              onClick={ this.handleDone }
            >
              {t('done')}
            </button>
          </span>
        </div>

        <div className={`editor-overlay-content${scoreClass}`}>
          <div className='editor-overlay-semantics' ref={ this.form }/>
          { !this.state.isSubFrom &&
            
            <div>
              <BranchingOptions
                isBranchingQuestion ={ this.isBranchingQuestion }
                nextContentId={ this.props.content.params.nextContentId }
                validAlternatives={ this.props.validAlternatives }
                onChangeContent={ this.handleNextContentIdChange }
                isInserting={ this.props.isInserting }
                feedbackGroup={ feedbackGroupField }
                contentBehaviourGroup={ behaviourGroupField }
                scoringOption={ this.props.scoringOption }
              />
            </div>
          }
          <div
            className={`editor-overlay-feedback-semantics${feedbackGroupClass}`}
            ref={ this.feedbackForm }
          />
        </div>

      </div>
    );
  }
}

EditorOverlay.propTypes = {
  content: PropTypes.object,
  validAlternatives: PropTypes.array,
  onDone: PropTypes.func
};
