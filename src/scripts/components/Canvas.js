import React from 'react';
import PropTypes from 'prop-types';

import './Canvas.scss';
import StartScreen from './StartScreen.js';
import Draggable from './Draggable.js';
import Tip from './Tip.js';
import Dropzone from './Dropzone.js';
import Content from './Content.js';
import Tree from './Tree.js';
import ConfirmationDialog from './dialogs/ConfirmationDialog.js';
import EditorOverlay from './EditorOverlay';
import QuickInfoMenu from './QuickInfoMenu';
import BlockInteractionOverlay from './BlockInteractionOverlay';
import { getMachineName, getAlternativeName, isBranching, hasNextContent } from '../helpers/Library';
import {t} from '../helpers/translate';

/*global H5P*/
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      placing: null,
      isPlacingOnBQ: false,
      deleting: null,
      inserting: null,
      editing: null,
      editorContents: {
        top: {
          icon: '',
          title: '',
          saveButton: t('saveChanges'),
          closeButton: t('close')
        },
        content: {
        }
      },
      dzSpecs: {
        width: 42,
        height: 32
      },
      insertingId: null,
      content: this.props.content,
      dialog: null,
      panning: {
        x: 0,
        y: 0
      },
      setNextContentId: null,
      tips: null
    };
  }

  /**
   * React hook
   */
  componentDidMount() {
    // Trigger the initial default end scenarios count
    this.props.onContentChanged(null, this.countDefaultEndScenarios());

    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  /**
   * React hook
   */
  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  /**
   * React hook
   */
  static getDerivedStateFromProps(nextProps, state) {
   
    if (nextProps.inserting && nextProps.insertingId !== state.insertingId) {
      return ({ // Set new state on inserting
        insertingId: nextProps.insertingId,
        tips: null,
        placing: -1,
        library: nextProps.inserting.library
      });
    }

    return null;
  }

  /**
   * Event handler
   */
  handleDocumentKeyDown = (event) => {
    switch (event.which) {
      case 46: // Delete
        if (this.state.placing !== null) {
          this.handleContentDelete(this.state.placing);
        }
    }
  }

  /**
   * @param {number} id - Dropzone ID.
   */
  handlePlacing = (id) => {
    if (this.state.placing !== null && this.state.placing !== id) {
      this.setState({
        tips: false,
        isPlacingOnBQ: (id > -1 && this.state.content[id].params.type.params.branchingQuestion) ? true : false,
        deleting: id,
        confirmReplace: true,
        dialog: 'replace'
      }, this.setIsEditing);
    }
    else {
      // Start placing
      this.setState({
        placing: id
      });
    }
  }

   /**
   * Handle mouse over event on existing content
   * @param {number} id - Dropzone ID.
   */
  handleMouseOver = (id) => {
    if (this.state.placing !== null && this.state.placing !== id && this.state.content[id] !== undefined) {
      this.handleContentHighlight(this.state.placing, this.state.content[id]);
    }
  }

  /**
   * Hide Tips
   */
  handleMouseLeft = () => {
    this.handleTreeFocus();
  }

  /**
   * Implement Tips Highlight
   * By dragging new/existing component to another
   *
   * @param {number} newContentType ID of existing content type.
   * @param {number} currentContentType ID of New content type.
   */
  handleContentHighlight = (newContentType, currentContentType) => {
    let newContentTypeTitle, scenario = 'NEW_CONTENT_ON_EXISTING_CONTENT';
    // Placing existing content on another existing content
    if (this.state.placing > -1) {
      scenario = 'EXISTING_CONTENT_ON_EXISTING_CONTENT';
    }
    // Check if newContentType is new content (drag from left side navigation)
    if (newContentType === -1) {
      // Tips - Scenario 5, 8 & 11
      // Sometimes BS editor crashes because of undefined data
      if (this.props.getNewContent(this.getNewContentParams()).params.type.metadata === undefined) {
        return false;
      }
      newContentTypeTitle = this.props.getNewContent(this.getNewContentParams()).params.type.metadata.contentType;
      if (this.props.inserting && this.props.inserting.pasted) {
        newContentTypeTitle = this.props.inserting.pasted.generic.metadata.title;
        scenario = 'PASTED_CONTENT_ON_EXISTING_CONTENT';
      }
      if (this.props.inserting && this.props.inserting.library.name.split(' ')[0] === 'H5P.BranchingQuestion') {
        scenario = 'NEW_BQ_ON_EXISTING_CONTENT';
      }
      if (this.props.inserting && this.props.inserting.pasted && this.props.inserting.library.name.split(' ')[0] === 'H5P.BranchingQuestion') {
        scenario = 'PASTED_BQ_ON_EXISTING_CONTENT';
      }
    }else{
      newContentTypeTitle = this.state.content[newContentType].params.type.metadata.title;
    }

    // Tips - Scenario 3 & 6
    // For dragndrop and non-dragndrop highlight events the object is different which needs extra care
    const content = (currentContentType.props !== undefined) ? this.state.content[currentContentType.props.id] : currentContentType;
    // Prevent Tip if user moves new BQ on existing BQ
    if ((content.params === undefined) || (this.props.inserting && this.props.inserting.library.name.split(' ')[0] === 'H5P.BranchingQuestion' && content.params.type.params.branchingQuestion)) {
      return false;
    }
    if (content.params.type.params.branchingQuestion) {
      scenario = 'NEW_CONTENT_ON_EXISTING_BQ';
      if (this.props.inserting && this.props.inserting.pasted) {
        newContentTypeTitle = this.props.inserting.pasted.generic.metadata.title;
        scenario = 'PASTED_CONTENT_ON_EXISTING_BQ';
      }
      // Placing existing content on existing branching question
      if (this.state.placing > -1) {
        scenario = 'EXISTING_CONTENT_ON_EXISTING_BQ';
      }
    }
    
    this.setState({
      tips: {
        scenario: scenario,
        newContentTypeTitle: newContentTypeTitle,
        currentContentTypeTitle: content.params.type.metadata.title
      }
    });
    return this.props.onHighlight;
  }

  /**
   * Hide Tips
   * In order to remove tips, on focus of tree reset tips to null
   */
  handleTreeFocus = () => {
    this.setState({ 
      tips: null
    });
  }

  /**
   * Implement Tips Highlight
   * By dragging new/existing component to Dropzones
   */
  handleDropzoneHighlight = (existingContentId) => {
    if (this.state.insertingId) {
      // Tips - Scenario 1
      this.setState({
        tips: {
          scenario: 'NEW_CONTENT_ON_DROPZONE',
          newContentTypeTitle: this.state.library.title
        }
      });
    }

    // Tips - Existing content of canvas is placing on dropzone
    if (this.state.placing > -1) {
      this.setState({
        tips: {
          scenario: 'EXISTING_CONTENT_ON_DROPZONE',
          currentContentTypeTitle: this.state.content[this.state.placing].params.type.metadata.title
        }
      });
    }

    if (this.props.inserting && this.props.inserting.pasted) {
      // Tips - Scenario 4
      const contentTitle = this.props.inserting.pasted.generic.metadata.title
        ? this.props.inserting.pasted.generic.metadata.title
        : this.state.library.title;

      this.setState({
        tips: {
          scenario: 'PASTED_CONTENT_ON_DROPZONE',
          newContentTypeTitle: contentTitle
        }
      });
    }

    if (this.props.inserting && this.props.inserting.library.name.split(' ')[0] === 'H5P.BranchingQuestion') {
      if ((existingContentId != undefined && existingContentId === -1) || (this.tree.tips.currentContentTypeId !== null && this.tree.tips.currentContentTypeId.props.nextContentId === undefined)) {
        // Tips - When user trying to drop new BQ on last dropzone(s)
        this.setState({
          tips: {
            scenario: 'NEW_BQ_ON_LT_DROPZONE',
            newContentTypeTitle: this.state.library.title
          }
        });
      }else{
        // Tips - Scenario 7
        this.setState({
          tips: {
            scenario: 'NEW_BQ_ON_DROPZONE',
            newContentTypeTitle: this.state.library.title
          }
        });
      }
    }

    if (this.props.inserting && this.props.inserting.pasted && this.props.inserting.library.name.split(' ')[0] === 'H5P.BranchingQuestion') {
      // Tips - Scenario 10
      const contentTitle = this.props.inserting.pasted.generic.metadata.title
        ? this.props.inserting.pasted.generic.metadata.title
        : this.state.library.title;
        
      this.setState({
        tips: {
          scenario: 'PASTED_BQ_ON_DROPZONE',
          newContentTypeTitle: contentTitle
        }
      });
    }
  }

  /**
   * Get "the" parent node.
   *
   * Assumes that this.renderedNodes holds all nodes in order of appearance
   * and chooses the closest one before the child as "the" parent although
   * more nodes may be parents.
   *
   * @param {number} id ID of child.
   * @return {object} Parent node.
   */
  getParent = (id, contentNodes) => {
    return this.tree.processed
      .slice(0, this.tree.processed.indexOf(id)) // get all node IDs that were rendered on top
      .filter(candidate => candidate > -1) // except end scenarios
      .map(candidate => contentNodes[candidate]) // get nodes to IDs
      .filter(candidate => { // get all parents of the child
        if (isBranching(candidate)) {
          return candidate.params.type.params.branchingQuestion.alternatives
            .some(alt => alt.nextContentId === id);
        }
        return candidate.params.nextContentId === id;
      })
      .slice(-1).pop(); // return the closest parent
  }

  /**
   * TODO
   */
  handleDropped = (id, dropzone) => {
    if (!dropzone || dropzone instanceof Content && dropzone.props.disabled) {
      this.setState({
        placing: null,
        tips: null
      });
      this.props.onDropped(); // TODO: See handlePlacing. Should be called after setstate or could it be done differently.
      return;
    }

    if (dropzone instanceof Content && !this.state.editing) {
      // Replace existing node
      this.handlePlacing(dropzone.props.id);
    }
    else {
      // Put new node or put existing node at new place
      this.placeInTree(id, dropzone.props.nextContentId, dropzone.props.parent, dropzone.props.alternative);
    }
  }

  /**
   * TODO
   */
  handleDropzoneClick = (nextContentId, parent, alternative) => {
    if (this.state.placing === null) {
      return;
    }
    this.placeInTree(this.state.placing, nextContentId, parent, alternative);
  }

  /**
   * TODO
   */
  handleContentEdit = (id) => {
    // Workaround for Chrome keeping hover state on the draggable
    H5PEditor.$(this.tree[`draggable-${id}`].element.element).click();

    this.setState({
      editing: id,
      placing: null
    }, this.setIsEditing);
  }

  /**
   * TODO: Move to Content ?
   */
  handleContentCopy = (id) => {
    const clipboardItem = new H5P.ClipboardItem(this.state.content[id].params, 'type', 'H5PEditor.BranchingScenario');
    H5P.clipboardify(clipboardItem);
  }

  /**
   * TODO
   */
  handleContentDelete = (id) => {
    this.setState({
      deleting: id,
      dialog: 'delete'
    }, this.setIsEditing);
  }

  /**
   * Get titles of all children nodes sorted by ID.
   *
   * @param {number} start ID of start node.
   * @param {number} [skip] Exclude single item
   * @param {number} [skipBranch] Exclude item + descendants
   * @return {string[]} Titles.
   */
  getChildrenTitles = (start, skip = null, skipBranch = null) => {
    return this.getChildrenIds(start, true, false, skipBranch)
      .filter(id => id !== skip)
      .sort((a, b) => a - b)
      .map(id => {
        return getAlternativeName(this.state.content[id]);
      });
  }

  /**
   * Get IDs of all children nodes.
   *
   * @param {number} start ID of start node.
   * @param {boolean} [includeBranching=true] If false, ids of BQs will not be returned.
   * @param {boolean} [sub=false] If true, sub call.
   * @param {number} [skip] Exclude item
   * @return {number[]} IDs.
   */
  getChildrenIds = (start, includeBranching = true, sub = false, skip = null) => {
    if (start < 0 || start === skip) {
      return [];
    }
    const node = this.state.content[start];
    let childrenIds = [];
    let nextIds = [];
    const nodeIsBranching = isBranching(node);

    // Check for BQ inclusion and ignore very first start node
    if (sub && (!nodeIsBranching || nodeIsBranching && includeBranching)) {
      childrenIds.push(start);
    }

    // Get next nodes
    if (!nodeIsBranching) {
      nextIds = [node.params.nextContentId];
    }
    else {
      const alternatives = node.params.type.params.branchingQuestion.alternatives || [];
      nextIds = alternatives.map(alt => alt.nextContentId);
    }

    nextIds
      .filter(id => id !== undefined && id > -1)
      .filter(id => this.tree.processed.indexOf(id) > this.tree.processed.indexOf(start)) // prevent loops
      // TODO: Not very react like...
      .forEach(id => {
        childrenIds = childrenIds.concat(this.getChildrenIds(id, includeBranching, true, skip));
      });

    // Remove any duplicates
    return childrenIds.filter((id, idx) => childrenIds.indexOf(id) === idx);
  }

  /**
   * TODO
   */
  getNewContentParams = () => {
    if (this.props.inserting && this.props.inserting.pasted) {
      /**
       * Help check if we support the pasted content type
       * @private
       * @param {string} lib
       * @return {boolean}
       */
      const supported = (lib) => {
        for (var i = 0; i < this.props.libraries.length; i++) {
          if (this.props.libraries[i].restricted !== true && this.props.libraries[i].name === lib) {
            return true; // Library is supported and allowed
          }
        }

        return false;
      };

      if (this.props.inserting.pasted.from === 'H5PEditor.BranchingScenario' &&
          (!this.props.inserting.pasted.generic || supported(this.props.inserting.pasted.generic.library))) {
        // Non generic part = must be content from another BS
        if (!isBranching({params: this.props.inserting.pasted.specific})) {
          this.props.inserting.pasted.specific.nextContentId = -1;
          // Note for BS alternatives this is done in <ContentTypeMenu>
        }
        return this.props.inserting.pasted.specific;
      }
      else if (this.props.inserting.pasted.generic && supported(this.props.inserting.pasted.generic.library)) {
        // Supported library from another content type
        return {
          type: this.props.inserting.pasted.generic,
          showContentTitle: false
        };
      }
    }

    // For Branching Question we have to add defaults that can be used until the editor is loaded
    return {
      type: {
        library: this.state.library.name,
        params: this.state.library.className !== 'branchingquestion' ? {} : {
          branchingQuestion: {
            alternatives: [
              {
                nextContentId: -1
              },
              {
                nextContentId: -1
              }
            ]
          }
        },
        subContentId: H5P.createUUID()
      },
      showContentTitle: false
    };
  }

  /**
   * Update nextContentId for content or alternative params.
   *
   * @param {object} leaf Params of node whose nextContentId should be updated
   * @param {number} id ID of node that was added/moved
   * @param {number} nextId nextContentId of node that was added/moved
   * @param {number} nextContentId ID that needs to be updated
   * @param {number} bumpIdsUntil Node id to update to at max
   */
  updateNextContentId = (leaf, id, nextId, nextContentId, bumpIdsUntil) => {
    let skipBumping = false;

    if (id === 0 && leaf.nextContentId === nextId) {
      // Special case, the top node has been moved and the next node is now the
      // new top node. Now this leaf used to loop to the next node, but should
      // now point to the new top node.
      leaf.nextContentId = 0;
      skipBumping = true;
    }

    // Make old parent point directly to our old children
    if (leaf.nextContentId === id) {
      if (this.hasChangedOldParentLink === false) {
        leaf.nextContentId = (nextId < 0 ? undefined : nextId);
        this.hasChangedOldParentLink = true;
      }
      else if (nextContentId === 0) {
        // Update old loops to point to the new top node
        leaf.nextContentId = 0;
        skipBumping = true;
      }
    }

    // Make our new parent aware of us
    if (nextContentId !== undefined && leaf.nextContentId === nextContentId && nextContentId !== 0) {
      if (this.hasChangedNewParentLink === false) {
        leaf.nextContentId = id;
        this.hasChangedNewParentLink = true;
      }
    }

    // Bump nextContentIds for the parts of the array that changed
    if (!skipBumping && leaf.nextContentId > -1 && leaf.nextContentId < bumpIdsUntil) {
      leaf.nextContentId++;
    }
  }

  /**
   * Attach child to existing node.
   *
   * @param {object} content Content node.
   * @param {number} id Id of child node.
   */
  static attachChild(content, nextContentId) {
    if (nextContentId === undefined || nextContentId < 0) {
      nextContentId = -1;
    }

    if (!isBranching(content)) {
      content.params.nextContentId = nextContentId;
      return;
    }

    // Fill up empty alternatives first before creating new one
    if (nextContentId > -1) {
      const alternatives = content.params.type.params.branchingQuestion.alternatives;
      // Currently always using alternative 1.
      // Note that if we are to add new alternative objects here we must find
      // a way to let the Editor know or it will be using the wrong object.
      const pos = 0;
      //const pos = alternatives.map(alt => alt.nextContentId).indexOf(-1);
      alternatives[pos].nextContentId = nextContentId;
    }
  }

  /**
   * Replace a child in a node. If oldChild is specified, newChild will only
   * get set if currentChild is oldChild.
   * TODO: Could be a static ?
   *
   * @param {object} content Content node.
   * @param {number} newChildId Id of new child.
   * @param {number} [oldChildId] Id of old child
   */
  replaceChild = (content, newChildId, oldChildId) => {
    if (!content || newChildId === undefined) {
      return;
    }

    // Info node
    if (!isBranching(content)) {
      if (!oldChildId || content.params.nextContentId === oldChildId) {
        content.params.nextContentId = newChildId;
      }
      return;
    }

    // BQ
    const alternatives = content.params.type.params.branchingQuestion.alternatives;
    if (oldChildId) {
      alternatives.forEach(alt => {
        if (alt.nextContentId === oldChildId) {
          alt.nextContentId = newChildId;
        }
      });
    }
    else {
      Canvas.attachChild(content, newChildId);
    }
  }

  /**
   * place a node in the tree (which isn't a tree technically).
   *
   * @param {number} id ID of node to be placed or -1 if new node.
   * @param {number} nextContentId ID of next node.
   * @param {number} parent ID of the parent node.
   * @param {number} alternative Number of dropzone alternative.
   */
  placeInTree(id, nextContentId, parent, alternative) {
    this.setState((prevState, props) => {
      let newState = {
        placing: null,
        tips: null,
        editing: null,
        inserting: null,
        content: [...prevState.content],
      };

      // Handle inserting of new node
      if (id === -1) {
        newState.content.push(this.props.getNewContent(this.getNewContentParams()));
        id = newState.content.length - 1;
        newState.editing = id;
        if (id === 0) {
          if (!isBranching(newState.content[0])) {
            newState.content[0].params.nextContentId = -1; // Use default end scenario as default end scenario
          }
          // This is the first node added, nothing more needs to be done.
          props.onDropped(); // TODO: Shouldn't this really be called after the state is set?
          return newState;
        }
      }

      // When placing after a leaf node keep track of it so we can update it
      // after processing the new content array
      if (parent !== undefined) {
        parent = newState.content[parent];
      }
      const parentIsBranching = (parent && isBranching(parent));

      // Prevent loops from being attached to parent node later
      let nextId = newState.content[id].params.nextContentId;
      if (this.tree.processed.indexOf(nextId) < this.tree.processed.indexOf(id)) {
        nextId = -1;
      }

      // Handle adding new top node before the current one
      let bumpIdsUntil = -1;
      if (nextContentId === 0) {
        // We are the new top node, we must move to the top of the array
        newState.content.splice(0, 0, newState.content[id]);

        // Update and use correct ID for editing
        if (newState.editing !== null) {
          newState.editing = 0;
        }

        // Mark IDs for bumping due to array changes
        bumpIdsUntil = id + 1;

        // Remove old entry
        newState.content.splice(bumpIdsUntil, 1);

        // Place the previous top node after this one
        Canvas.attachChild(newState.content[0], 1);
      }

      // Handle moving current top node to somewhere else
      if (id === 0) {

        // Place our current next node at the top
        newState.content.splice(0, 0, newState.content[nextId]);

        // Mark nextContentIds for bumping due to array changes
        bumpIdsUntil = nextId + 1;

        // Remove old entry
        newState.content.splice(bumpIdsUntil, 1);

        // Start using our new children
        Canvas.attachChild(newState.content[1], nextContentId === nextId ? nextId + 1 : nextContentId);

        // There is no parent so there is nothing to update.
        this.hasChangedOldParentLink = true;
      }
      else {
        // One node can have multiple parents through loops.
        // When moving we only want to change the value for the first parent
        // (not the loops). That is why we have this variable
        this.hasChangedOldParentLink = false;
      }
      this.hasChangedNewParentLink = false; // Only update the first new parent

      if (nextContentId !== 0 && id !== 0) {
        let successorId = nextContentId;

        // Keep loop if noded being moved had one
        if (!isBranching(newState.content[id])) {
          const loopCandidateId = newState.content[id].params.nextContentId;
          if (successorId === undefined &&
              this.tree.processed.indexOf(loopCandidateId) < this.tree.processed.indexOf(id)) {
            successorId = loopCandidateId;
          }
        }

        Canvas.attachChild(newState.content[id], successorId);
      }

      const processed = [];
      const recursiveTreeUpdate = (branch, branchingParent = null, branchingParentId = null) => {
        branch.forEach((index, num) => {
          if (index === undefined || index === -1) {
            return; // Skip
          }

          // Determine if content or alternative
          const isContent = (branchingParent === null);
          const content = isContent ? newState.content[index] : null;

          if (isContent) {
            // Prevent loops and double processing of content
            if (processed.indexOf(index) !== -1) {
              return;
            }
            processed.push(index);
          }

          const isBranchingContent = isContent && isBranching(content);
          const alternative = isContent ? null : branchingParent.params.type.params.branchingQuestion.alternatives[num];

          // Update IDs
          if (!isBranchingContent && !(nextContentId === 0 && ((index === 0 && isContent) || branchingParentId === 0))) { // Skip update for new top nodes (already updated) or Branching Question (update alternatives instead)
            this.updateNextContentId((isContent ? content.params : alternative), id, nextId, nextContentId, bumpIdsUntil);
          }

          // Update subtree first
          const nextBranch = isBranchingContent ? Canvas.getBranchingChildren(content) : [isContent ? content.params.nextContentId : alternative.nextContentId];
          if (nextBranch) {
            recursiveTreeUpdate(nextBranch, isBranchingContent ? content : null, isBranchingContent ? index : null);
          }
        });
      };
      recursiveTreeUpdate([0]);

      // Update parent directly when placing a new leaf node
      if (parent !== undefined) {
        if (parentIsBranching) {
          parent.params.type.params.branchingQuestion.alternatives[alternative].nextContentId = (id === 0 ? 1 : id);
        }
        else {
          parent.params.nextContentId = (id === 0 ? 1 : id);
        }
      }

      props.onDropped(); // TODO: Shouldn't this really be called after the state is set?
      return newState;
    }, () => {
      this.contentChanged();
      this.setIsEditing();
    });
  }

  /**
   * TODO
   */
  getLibrary(library) {
    for (var i = 0; i < this.props.libraries.length; i++) {
      if (this.props.libraries[i].name === library) {
        return this.props.libraries[i];
      }
    }

    const name = getMachineName(library);
    const title = name.replace('H5P.', '');
    return {
      title: title,
      name: name,
      className: title.toLocaleLowerCase()
    };
  }

  /**
   * TODO
   */
  static getBranchingChildren(content) {
    if (!content.params.type || !content.params.type.params ||
        !content.params.type.params.branchingQuestion ||
        !content.params.type.params.branchingQuestion.alternatives ||
        !content.params.type.params.branchingQuestion.alternatives.length) {
      return; // No alternatives today
    }

    let children = [];
    content.params.type.params.branchingQuestion.alternatives.forEach(alternative => {
      children.push(alternative.nextContentId); // Other question or end scenario
    });

    return children;
  }

  /**
   * Check if content has feedback.
   * TODO: Reuse merge with <Tree>
   *
   * @param {object} input Content or alternative.
   * @return {boolean} True, if there's some feedback item given, else false.
   */
  hasFeedback = (input) => {
    input = input.params || input;

    return input.feedback !== undefined && (
      (input.feedback.title && input.feedback.title.trim() !== '') ||
      input.feedback.subtitle ||
      input.feedback.image ||
      input.feedback.endScreenScore !== undefined
    );
  }

  /**
   * Check if input has an end screen, could be default or custom.
   *
   * @param {object} input Content or alternative.
   * @return {boolean} True, if input has an end screen, else false.
   */
  hasEndScreen = (input) => {
    if (input.params && isBranching(input)) {
      // Branching Questions never have an end screen themselves
      return false;
    }
    input = input.params || input;

    return input.nextContentId === -1 || input.nextContentId === undefined;
  }

  /**
   * Check if input has a custom end screen.
   *
   * @param {object} input Content or alternative.
   * @return {boolean} True, if input has a custom end screen, else false.
   */
  hasCustomEndScreen = (input) => {
    if (input.params && isBranching(input)) {
      // Branching Questions never have an end screen themselves
      return false;
    }
    input = input.params || input;

    return this.hasEndScreen(input) && this.hasFeedback(input);
  }

  /**
   * Remove an info node. Not intended for branching questions.
   *
   * @param {object[]} content Content nodes.
   * @param {number} deleteId Id of node to be deleted.
   */
  spliceInfoNode = (content, deleteId) => {
    if (deleteId >= content.length) {
      return;
    }

    // Special case: First node to be deleted, swap it with successor
    if (deleteId === 0 && content.length > 1 && content[0].params.nextContentId !== -1) {
      const swapId = content[0].params.nextContentId;
      this.swapNodes(content, 0, content[deleteId].params.nextContentId);
      content[swapId].params.nextContentId = 0;
      deleteId = swapId;
    }

    // Retrieve node to be deleted
    const deleteNode = content[deleteId];

    // Update the links away from delete node
    this.replaceNodeIds(content, deleteId, deleteNode.params.nextContentId);

    // Adjust nextContentIds to account for removed node
    this.setNodeOffset(content, deleteId, -1);
    this.tree.processed = this.tree.processed
      .map(nodeId => (nodeId > deleteId) ? nodeId - 1  : nodeId);

    // Remove node from data structure
    content.splice(deleteId, 1);
    this.tree.processed = this.tree.processed
      .filter(nodeId => nodeId !== deleteId);
    // TODO: Isn't there a better way to do this?

    H5PEditor.removeChildren(deleteNode.formChildren);
  }

  /**
   * Splice a Branching Question.
   *
   * @param {object[]} content Content with nodes.
   * @param {number} deleteId Id of BQ to be deleted.
   */
  spliceBranchingQuestion = (content, deleteId) => {
    // Compile list of nodes that need to be removed
    let children = this.getChildrenIds(deleteId, true, true);

    while (children.length > 0) {
      // Will delete from the bottom up, getChildrenIds provides correct order
      const deleteId = children.pop();

      // Here works for BQs as well, as they'll never have children
      this.spliceInfoNode(content, deleteId);

      // Account for node removal
      children = children.map(childId => childId > deleteId ? childId -= 1 : childId);
    }
  }

  /**
   * Replace next content ids.
   *
   * @param {object[]} content Nodes.
   * @param {number} oldId Id to be replaced.
   * @param {number} newId Replacing id.
   * @param {object} [options={}] Options.
   * @param {boolean} [options.keepLoops] If true, loops will not be filtered.
   */
  replaceNodeIds = (content, oldId, newId, options = {}) => {
    content.forEach((itemNode, index) => {
      let nodesToCheck;
      if (isBranching(itemNode)) {
        nodesToCheck = itemNode.params.type.params.branchingQuestion.alternatives || [];
      }
      else {
        nodesToCheck = [itemNode.params];
      }

      nodesToCheck.forEach(node => {
        if (node.nextContentId === oldId) {
          if (options.keepLoops !== true &&
              this.tree.processed.indexOf(newId) <= this.tree.processed.indexOf(index)) {
            node.nextContentId = -1;
          }
          else {
            node.nextContentId = newId;
          }
        }
      });
    });
  }

  /**
   * Add an offset to a node's next content ids.
   *
   * @param {object[]} content Content with nodes.
   * @param {number} maxUntouchedId Highest id that will not be changed.
   * @param {number} offest Offset.
   */
  setNodeOffset = (content, maxUntouchedId, offset) => {
    content.forEach(itemNode => {
      let nodesToCheck;
      if (isBranching(itemNode)) {
        nodesToCheck = itemNode.params.type.params.branchingQuestion.alternatives || [];
      }
      else {
        nodesToCheck = [itemNode.params];
      }

      nodesToCheck.forEach(node => {
        if (node.nextContentId > maxUntouchedId) {
          node.nextContentId = node.nextContentId + offset;
        }
      });
    });
  }

  /**
   * Remove a node.
   *
   * @param {object[]} content Content with nodes.
   * @param {number} deleteId Id of node to be removed.
   */
  removeNode = (content, deleteId) => {
    if (isBranching(content[deleteId])) {
      this.spliceBranchingQuestion(content, deleteId);
    }
    else {
      this.spliceInfoNode(content, deleteId);
    }
  }

  /**
   * TODO
   */
  handleDelete = () => {
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        deleting: null,
        dialog: null,
        setNextContentId: null,
        content: [...prevState.content]
      };

      if (prevState.setNextContentId !== null) {
        // Handle delete when dialog is displayed upon changing nextContent through <BranchingOptions>
        const editingNode = newState.content[prevState.editing];
        const alternative = hasNextContent(editingNode, prevState.deleting);
        if (alternative === -1) {
          editingNode.params.nextContentId = prevState.setNextContentId;
        }
        else if (alternative !== null) {
          if (prevState.setNextContentId !== -2) { // -2 = deleting entire alternative (handled by H5PEditor)
            // Update alternative
            editingNode.params.type.params.branchingQuestion.alternatives[alternative].nextContentId = prevState.setNextContentId;
          }
          // We have to manually trigger the editor sub-react update
          this.editorOverlay.renderBranchingOptions[alternative](prevState.setNextContentId);
        }

        this.removeNode(newState.content, prevState.deleting);

        // Update editing ID after remove to avoid dialog crashing...
        for (let i = 0; i < newState.content.length; i++) {
          if (newState.content[i] === editingNode) {
            newState.editing = i;
          }
        }

        return newState;
      }
      else {
        // Stop inserting new <Content>
        newState.inserting = null;

        // Close <EditorOverlay>
        newState.editing = null;

        // Stop placing <Content>
        newState.placing = null;
      }

      if (prevState.placing !== null && prevState.placing !== prevState.deleting) {
        // Replace node

        // Keep next node as successor
        const nextContentId = (isBranching(prevState.content[prevState.deleting])) ? -1 : prevState.content[prevState.deleting].params.nextContentId;

        // Remove form
        newState.content[prevState.deleting].formChildren.forEach(child => child.remove());

        if (prevState.placing === -1) {
          // Replace with fresh node

          newState.content[prevState.deleting] = this.props.getNewContent(this.getNewContentParams());
          Canvas.attachChild(newState.content[prevState.deleting], nextContentId);
          newState.editing = prevState.deleting;
        }
        else {
          // Replace info node with existing info node (BQs can't be repalced or moved)

          // If both nodes are adjacent, we can just delete
          if (newState.content[prevState.placing].params.nextContentId !== prevState.deleting &&
            newState.content[prevState.deleting].params.nextContentId !== prevState.placing) {

            // BQs take their children with them and don't leave a node to attach
            const nodeToAttach = isBranching(newState.content[prevState.placing]) ?
              -1 :
              newState.content[prevState.placing].params.nextContentId;

            // Handle first node being moved somewhere else (has no predecessor)
            const newFirstNode = (prevState.placing === 0) ?
              newState.content[prevState.placing].params.nextContentId :
              undefined;

            // Point parent of "placing" to successor of "placing"
            this.replaceChild(
              this.getParent(prevState.placing, newState.content),
              nodeToAttach,
              prevState.placing
            );

            // Point "placing" to successor of "deleting"
            this.replaceChild(
              newState.content[prevState.placing],
              newState.content[prevState.deleting].params.nextContentId,
              newState.content[prevState.placing].params.nextContentId
            );

            if (prevState.deleting === 0) {
              // Point "deleting" to "placing" (special case for first node)
              this.replaceChild(
                newState.content[prevState.deleting],
                prevState.placing
              );
            }
            else {
              // Point parent of "deleting" to "placing"
              this.replaceChild(
                this.getParent(prevState.deleting, newState.content),
                prevState.placing,
                prevState.deleting
              );
            }

            if (newFirstNode) {
              this.swapNodes(newState.content, 0, newFirstNode);
            }
          }

          this.removeNode(newState.content, prevState.deleting);
        }

        this.tree[`draggable-${prevState.deleting}`].dehighlight();

        if (this.props.inserting) {
          // Stop inserting
          this.props.onDropped();
        }
      }
      else if (prevState.deleting !== null) {
        // Delete node
        this.removeNode(newState.content, prevState.editing !== null ? prevState.editing : prevState.deleting);
      }

      return newState;
    }, () => {
      this.contentChanged();
      this.setIsEditing();
    });
  }

  /**
   * Swap position of two nodes in tree.
   *
   * @param {content} Content.
   * @param {number} nodeId1 Id of node 1.
   * @param {number} nodeId2 Id of node 2.
   */
  swapNodes = (content, nodeId1, nodeId2) => {
    // Update links
    content.forEach(node => {
      const successorIds = (isBranching(node)) ?
        node.params.type.params.branchingQuestion.alternatives :
        [node.params];

      successorIds.forEach(alt => {
        if (alt.nextContentId === nodeId1) {
          alt.nextContentId = nodeId2;
        }
        else if (alt.nextContentId === nodeId2) {
          alt.nextContentId = nodeId1;
        }
      });
    });

    // Swap node position
    const tmp = content[nodeId1];
    content[nodeId1] = content[nodeId2];
    content[nodeId2] = tmp;
  }

  /**
   * TODO
   */
  handleCancel = () => {
    if (this.state.deleting !== null && this.tree[`draggable-${this.state.deleting}`]) {
      this.tree[`draggable-${this.state.deleting}`].dehighlight();
    }

    // Cancel delete confirmation dialog
    const newState = {
      deleting: null,
      dialog: null
    };

    if (this.state.setNextContentId !== null) {
      // Handle cancel when dialog is displayed upon changing nextContent through <BranchingOptions>
      newState.setNextContentId = null;

      const alternative = hasNextContent(this.state.content[this.state.editing], this.state.deleting);
      if (alternative === -1) {
        this.editorOverlay.forceUpdate();
      }
    }
    else {
      // Stop placing content
      newState.placing = null;

      // Close <EditorOverlay>
      newState.editing = null;

      // Stop inserting new content
      newState.inserting = null;
    }

    this.setState(newState, this.setIsEditing);

    if (this.props.inserting) {
      // Stop inserting
      this.props.onDropped();
    }
  }

  /**
   * React hook
   */
  componentDidUpdate() {
    // Center the tree
    if (this.props.center && this.tree && this.tree.element && this.tree['draggable-0']) {
      // Center on 1st node or the whole tree
      // TODO: Would it be cleaner if we stored the width in the state through a ref= callback?
      // e.g. https://stackoverflow.com/questions/35915257/get-the-height-of-a-component-in-react
      const treeWrapWidth = this.treewrap.getBoundingClientRect().width;
      if (treeWrapWidth !== 0) {
        const panning = {
          x: 0,
          y: 0
        };

        if (this.props.centerWholeTree) {
          // Centering the whole tree and not just the top node
          panning.x = (treeWrapWidth - this.tree.element.getBoundingClientRect().width) / 2;
        }
        else {
          const center = (treeWrapWidth / 2) - ((this.props.nodeSize.width * this.props.scale) / 2);
          panning.x = (center - (this.tree['draggable-0'].props.position.x * this.props.scale));
        }

        this.setState({
          panning: panning
        }, this.props.onCanvasCentered);
      }
    }

    // Center inital dropzone
    if (this.initialDropzone) {
      const treeWrapWidth = this.treewrap.getBoundingClientRect().width;
      if (treeWrapWidth !== 0) {
        const center = (treeWrapWidth / 2) - (41.59 / 2);
        this.initialDropzone.element.style.left = center + 'px';
      }
    }

    // Translate the tree
    if (this.props.translate && !this.props.center) {
      this.setState(prevState => {
        return {
          panning: {
            x: prevState.panning.x + this.props.translate.x,
            y: prevState.panning.y + this.props.translate.y
          }
        };
      }, this.props.onCanvasTranslated);
    }
  }

  /**
   * Go through content state and count how many default end scenarios
   * that are present.
   *
   * @return {number}
   */
  countDefaultEndScenarios = () => {
    let numMissingEndScenarios = 0;
    this.state.content.forEach(content => {
      if (isBranching(content)) {
        const alternatives = content.params.type.params.branchingQuestion.alternatives || [];
        alternatives.forEach(alternative => {
          if (this.hasEndScreen(alternative) && !this.hasCustomEndScreen(alternative)) {
            numMissingEndScenarios++;
          }
        });
      }
      else if (this.hasEndScreen(content) && !this.hasCustomEndScreen(content)) {
        numMissingEndScenarios++;
      }
    });
    return numMissingEndScenarios;
  }

  /**
   * Trigger callbacks after the content state has changed
   */
  contentChanged = () => {
    this.props.onContentChanged(this.state.content.map(content =>
      content.params
    ), this.countDefaultEndScenarios());
  }

  /**
   * Set isEditing state of parent
   */
  setIsEditing = () => {
    this.props.onIsEditing(this.state.editing !== null || this.state.dialog !== null);
  }

  /**
   * TODO
   */
  handleEditorDone = () => {
    // Update content state for Canvas (params are updated by reference)
    this.setState({
      editing: null,
      inserting: null
    }, () => {
      this.contentChanged();
      this.setIsEditing();
    });
  };

  /**
   * TODO
   */
  handleEditorRemove = () => {
    this.setState(prevState => {
      return {
        editing: null,
        inserting: null,
        placing: prevState.editing,
        deleting: prevState.editing,
        dialog: 'delete'
      };
    }, () => {
      this.contentChanged();
      this.setIsEditing();
    });
  }

  /**
   * Convert camel case to kebab case.
   *
   * @param {string} camel - Camel case.
   * @return {string} Kebab case.
   */
  static camelToKebab (camel) {
    return camel.split('').map((char, i) => {
      if (i === 0) {
        return char.toLowerCase();
      }
      if (char === char.toUpperCase()) {
        return `-${char.toLowerCase()}`;
      }
      return char;
    }).join('');
  }

  /**
   * TODO
   */
  panningLimits = (position) => {
    // Limits, you have to have them
    const treewrapRect = this.treewrap.getBoundingClientRect();
    const treeRect = this.tree.element.getBoundingClientRect();

    const padding = (this.props.scale * 64); // Allow exceeding by this much

    const wideLoad = (treeRect.width + (padding * 4) > treewrapRect.width);
    const highLoad = (treeRect.height + padding > treewrapRect.height);


    // Limit X movement
    if (wideLoad) {
      if (position.x > padding) {
        position.x = padding; // Max X
      }
      else if ((treewrapRect.width - position.x - (padding * 4)) > treeRect.width) {
        position.x = (treewrapRect.width - treeRect.width - (padding * 4)); // Min X
      }
    }
    else {
      if (position.x < (padding / 2)) {
        position.x = (padding / 2); // Min X
      }
      else if ((position.x + treeRect.width + padding) > treewrapRect.width) {
        position.x = (treewrapRect.width - treeRect.width - padding); // Max X
      }
    }

    // Limit Y movement
    if (highLoad) {
      if (position.y > padding) {
        position.y = padding; // Max Y
      }
      else if ((treewrapRect.height - position.y - padding * 4) > treeRect.height) {
        position.y = (treewrapRect.height - treeRect.height - padding * 4); // Min Y
      }
    }
    else {
      if (position.y < 0) {
        position.y = 0; // Min Y
      }
      else if ((position.y + treeRect.height + padding) > treewrapRect.height) {
        position.y = (treewrapRect.height - treeRect.height - padding); // Max Y
      }
    }
  }

  /**
   * TODO
   */
  handleMoved = (position) => {
    this.setState({
      panning: position
    });
  }

  /**
   * TODO
   */
  handleStopped = (moved) => {
    if (!moved) {
      // Stop highlighting
      this.props.onHighlight(null);

      // Defer until after dropzone click handler
      setTimeout(() => {
        // Stop click-to-place placing
        if (this.state.placing !== null && this.state.deleting === null) {
          this.setState({
            placing: null,
            tips: null
          });
          this.props.onDropped();
        }
      }, 0);
    }
  }

  /**
   * TODO
   */
  handleNextContentChange = (params, newId, render = null) => {
    if (params.nextContentId > -1) {
      // Check that there's still a reference to the content that's not a loop
      let found = 0;
      for (let i = 0; i < this.state.content.length; i++) {
        const hasReference = hasNextContent(this.state.content[i], params.nextContentId, true);
        const isLooping = this.tree.processed.indexOf(params.nextContentId) < this.tree.processed.indexOf(i);
        // TODO: Not very React like...

        if (hasReference && !isLooping) {
          found += hasNextContent(this.state.content[i], params.nextContentId, true);
        }

        if (found > 1) {
          break;
        }
      }

      if (found < 2 && this.tree.processed.indexOf(params.nextContentId) > this.tree.processed.indexOf(this.state.editing)) {
        // TODO: Not very React like... maybe a function for this instead?
        // Display delete dialog
        this.setState({
          setNextContentId: newId,
          deleting: params.nextContentId,
          dialog: 'delete' + (newId === -2 ? ' alternative' : '')  // -2 = deleting entire alternative (handled by H5PEditor)
        }, this.setIsEditing);
        return true;
      }
    }

    // Skip update when trying to delete the entire alternative
    if (newId !== -2) {
      // No need to display confirm dialog, just update
      params.nextContentId = newId;
      if (render !== null) {
        render(newId);
      }
      else {
        this.forceUpdate();
      }
    }
  }

  /**
   * TODO
   */
  renderConfirmationDialogContent = () => {
    if (this.state.setNextContentId === -2 || this.state.setNextContentId !== null) {  // -2 = deleting entire alternative (handled by H5PEditor)
      const children = this.getChildrenTitles(this.state.deleting, null, this.state.setNextContentId);
      // Add self to list of content
      children.unshift(getAlternativeName(this.state.content[this.state.deleting]));
      return (
        <div className='confirmation-details'>
          <p>{t('shiftConfirmationAlternative')}:</p>
          <ul>
            { children.map((title, index) =>
              <li key={index}>{title}</li>
            ) }
          </ul>
        </div>
      );
    }
    else if (isBranching(this.state.content[this.state.deleting])) {
      return (
        <div className='confirmation-details'>
          <p>{t('shiftConfirmationBranch')}:</p>
          <ul>
            { this.getChildrenTitles(this.state.deleting, this.state.placing).map((title, index) =>
              <li key={index}>{title}</li>
            ) }
          </ul>
        </div>
      );
    }
    else {
      return (
        <div className='confirmation-details'>
          <p>{t('contentDeletionConfirmation')}</p>
        </div>
      );
    }
  }

  /**
   * React hook
   */
  render() {
    // Use global context to keep track of all dropzone elements in the tree
    this.dropzones = [];

    const interaction = this.state.content[this.state.editing];

    let validAlternatives = [];
    if (interaction) {
      // Determine valid alternatives for the content being edited
      this.state.content.forEach((content, index) => {
        if (index !== this.state.editing) {
          validAlternatives.push({
            id: index,
            label: getAlternativeName(content),
          });
        }
      });
    }

    return (
      <div className={ 'wrapper' + (this.props.isTourActive ? ' tour-fade' : '') }>
        { this.state.editing !== null &&
          <EditorOverlay
            ref={ node => this.editorOverlay = node }
            content={ interaction }
            semantics={ this.props.semantics }
            validAlternatives={ validAlternatives }
            scoringOption={ this.props.scoringOption }
            onRemove={ this.handleEditorRemove }
            onDone={ this.handleEditorDone }
            onNextContentChange={ this.handleNextContentChange }
            isInserting={ this.props.inserting }
            moveDown={ this.state.dialog !== null }
            scoringOption={ this.props.scoringOption }
          />
        }
        { (this.state.deleting !== null || this.state.editing !== null) &&
          <BlockInteractionOverlay />
        }
        { !! this.props.inserting && this.state.placing &&
          <Content
            inserting={ this.props.inserting }
            ref={ element => this['draggable--1'] = element }
            width={ this.props.nodeSize.insertingWidth }
            selected={ this.state.placing === -1 }
            onMove={ () => this.tree.handleMove(-1, this['draggable--1']) }
            onDropped={ () => this.tree.handleDropped(-1, this['draggable--1']) }
            contentClass={ this.props.inserting.library.className }
            position={ this.props.inserting.position }
            onPlacing={ () => this.handlePlacing(-1) }
            scale={ this.props.scale }
            onMouseOver={ this.handleMouseOver }
            onMouseOut={ this.handleMouseLeft }
          >
            { this.props.inserting.library.title }
          </Content>
        }
        <div className={`canvas${this.state.placing !== null ? ' placing-draggable' : ''}`}>
          { this.state.tips &&
            <Tip 
              scenario={ this.state.tips.scenario }
              currentContentTypeTitle={ this.state.tips.currentContentTypeTitle }
              newContentTypeTitle={ this.state.tips.newContentTypeTitle } />
          }
          <Draggable
            ref={ node => this.treewrap = node }
            className={ 'treewrap' + (this.props.highlight !== null ? ' dark' : '') }
            position={ this.state.panning }
            limits={ this.panningLimits }
            onMoved={ this.handleMoved }
            onStopped={ this.handleStopped }
          >
            { !this.props.libraries &&
              <div key={ 'loading' } className="loading">{t('loading')}</div>
            }
            { this.props.libraries &&
              <Tree
                ref={ node => this.tree = node }
                content={ this.state.content }
                panning={ this.state.panning }
                scale={ this.props.scale }
                highlight={ this.props.highlight }
                onlyThisBall={ this.props.onlyThisBall }
                nodeSize={ this.props.nodeSize }
                placing={ this.state.placing }
                library={ this.state.library }
                getLibrary={ library => this.getLibrary(library) }
                dropzones={ this.dropzones }
                scoringOption={ this.props.scoringOption }
                onPlacing={ this.handlePlacing }
                onMouseOver={ this.handleMouseOver }
                onMouseOut={ this.handleMouseLeft }
                onDropped={ this.handleDropped }
                onEdit={ this.handleContentEdit }
                onPreview={ this.props.onContentPreview }
                onCopy={ this.handleContentCopy }
                onDelete={ this.handleContentDelete }
                onHighlightLoop={ this.props.onHighlight }
                onHighlight={ this.handleContentHighlight }
                onDropzoneHighlight={ this.handleDropzoneHighlight }
                onFocus={ this.handleTreeFocus }
                onDropzoneClick={ this.handleDropzoneClick }
                draggableMouseOver={this.props.draggableMouseOver}
                draggableMouseOut={this.props.draggableMouseOut}
                draggableHovered={this.props.draggableHovered}
              />
            }
          </Draggable>
          { !this.state.content.length &&
            <StartScreen
              handleClick={ this.props.onDropped }
              handleTutorialClick={ this.props.handleOpenTutorial }
            >
              <Dropzone
                key={ 'f---9/undefined-dz-0' }
                ref={ element => { this.initialDropzone = element; this.dropzones.push(element); } }
                nextContentId={ -9 }
                parent={ undefined }
                alternative={ 0 }
                position={ {x: 361.635, y: 130} }
                elementClass={ 'dropzone' + (!this.props.inserting ? ' disabled' : '') }
                style={ {
                  left: '361.635px',
                  top: '130px'
                } }
                onFocus={ () => this.handleDropzoneHighlight() }
                onMouseOut={ () => this.handleTreeFocus() }
                onClick={ () => this.handleDropzoneClick(-9, undefined, 0) }
              />
            </StartScreen>
          }
          { this.state.content.length &&
            <QuickInfoMenu
              fade={ this.props.highlight !== null }
              onTutorialOpen={ this.props.handleOpenTutorial }
            />
          }
        </div>
        { this.state.dialog !== null &&
          <ConfirmationDialog
            action={ this.state.dialog }
            isBQ= { this.state.isPlacingOnBQ }
            onConfirm={ this.handleDelete }
            onCancel={ this.handleCancel }
          >
            { this.renderConfirmationDialogContent() }
          </ConfirmationDialog>
        }
      </div>
    );
  }
}

Canvas.propTypes = {
  width: PropTypes.number,
  inserting: PropTypes.object,
  highlight: PropTypes.number,
  onlyThisBall: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  scale: PropTypes.number,
  center: PropTypes.bool,
  onCanvasCentered: PropTypes.func,
  translate: PropTypes.object,
  onCanvasTranslated: PropTypes.func,
  onContentPreview: PropTypes.func,
  draggableMouseOver: PropTypes.func,
  draggableMouseOut: PropTypes.func,
  draggableHovered: PropTypes.number,
  isTourActive: PropTypes.bool
};
