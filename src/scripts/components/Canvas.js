import React from 'react';
import PropTypes from 'prop-types';

import './Canvas.scss';
import StartScreen from './StartScreen.js';
import Draggable from './Draggable.js';
import Dropzone from './Dropzone.js';
import Content from './Content.js';
import ConfirmationDialog from './dialogs/ConfirmationDialog.js';
import EditorOverlay from './EditorOverlay';
import QuickInfoMenu from './QuickInfoMenu';
import BlockInteractionOverlay from './BlockInteractionOverlay';
import BranchingOptions from "./content-type-editor/BranchingOptions";

/*global H5P*/
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);

    // TODO: The language strings should be passed by app and sanitized before
    this.l10n = {
      dialogDelete: {
        icon: 'icon-delete',
        confirmationHeader: 'Delete Question',
        confirmationQuestion: 'Are you sure you want to delete this content?',
        confirmationDetailsNO: 'You will lose the question, but all its children will be attached to the previous content/alternative.',
        confirmationDetailsBQ: 'If you proceed, you will lose all the content attached to this contents alternatives:',
        textConfirm: 'Delete',
        textCancel: 'Cancel',
        handleConfirm: this.handleDelete,
        handleCancel: this.handleCancel
      },
      dialogReplace: {
        icon: 'icon-replace',
        confirmationHeader: 'Replace Question',
        confirmationQuestion: 'Do you really want to replace this question?',
        confirmationDetailsNO: 'You will lose the question, but all its children will be attached to the previous content/alternative.',
        confirmationDetailsBQ: 'If you proceed, you will lose all the content attached to this contents alternatives:',
        textConfirm: 'Replace',
        textCancel: 'Cancel',
        handleConfirm: this.handleDelete,
        handleCancel: this.handleCancel
      },
      quickInfoMenu: {
        show: 'Show',
        hide: 'Hide',
        quickInfo: 'Quick Info',
        dropzoneTerm: 'Dropzone',
        dropzoneText: 'It appears when you select or start dragging content',
        contentTerm: 'Content',
        branchingQuestionTerm: 'Branching Question',
        branchingQuestionText: 'Each alternative can lead to different question/content.',
        alternative: 'Alternative leads to another question/content.',
        defaultEndScenario: 'Path ends here (with the default end scenario)',
        customEndScenario: 'Path ends here (with the custom end scenario)',
        existingQuestion: 'Path takes the learner to an existing question/content. Click to see where it leads to.',
        stepByStep: 'Step by Step ',
        tutorial: 'tutorial'
      }
    };

    this.state = {
      placing: null,
      deleting: null,
      inserting: null,
      editing: null,
      freshContent: false,
      editorContents: {
        top: {
          icon: '',
          title: '',
          saveButton: "Save changes",
          closeButton: "close"
        },
        content: {
        }
      },
      nodeSpecs: {
        width: 121,
        height: 32,
        spacing: {
          x: 29,
          y: 16
        }
      },
      dzSpecs: {
        width: 42,
        height: 32
      },
      content: this.props.content,
      dialog: this.l10n.dialogDelete,
      panning: {
        x: 0,
        y: 0
      }
    };
  }

  componentDidMount() {
    // Trigger the initial default end scenarios count
    this.props.onContentChanged(null, this.countDefaultEndScenarios());
  }

  componentWillReceiveProps(nextProps) { // TODO: Deprected ?
    if (nextProps.inserting) {
      this.setState({
        placing: -1,
        library: nextProps.inserting.library
      });
    }
  }

  /**
   * Build dialog contents.
   *
   * @param {number} id - ID of node in question.
   * @param {object} params - Template params for particular case.
   * @return {object} Dialog contents.
   */
  buildDialog = (id, params) => {
    const dialog = params;
    if (Content.isBranching(this.state.content[id])) {
      const nodeTitles = this.getChildrenTitles(id)
        .map((title, index) => <li key={index}>{title}</li>);

      dialog.confirmationDetails = params.confirmationDetailsBQ;
      dialog.confirmationDetailsList = nodeTitles;
    }
    else {
      if (this.state.content[id].params.nextContentId) {
        dialog.confirmationDetails = params.confirmationDetailsNO;
      }
    }
    return dialog;
  }

  /**
   * @param {number} id - Dropzone ID.
   */
  handlePlacing = (id) => {
    if (this.state.placing !== null && this.state.placing !== id) {
      this.setState({
        deleting: id,
        dialog: this.buildDialog(id, this.l10n.dialogReplace) // TODO: Refactor. Uses the wrong state to determine the next. Should be a much cleaner way to handle this.
      });
      this.props.onDropped(); // TODO: Determine if should really run after set state. Note that this triggers a changing in the props which sets the state again through componentWillReceiveProps, which is deprected. Can we find a better way of doing this?
      // I guess only the parent should keep track of this state? yes
    }
    else {
      // Start placing
      this.setState({
        placing: id
      });
    }
  }

  /**
   * Get intersections between dropzones and a draggable.
   *
   * @param {Content} draggable
   * @return {object[]} intersecting objects ordered by intersecting area in decreasing order
   */
  getIntersections(draggable) {
    const points = draggable.getPoints();

    let dropzones = this.dropzones;

    // Only use next path dropzones
    if (this.state.editing) {
      dropzones = dropzones.filter(dropzone => dropzone instanceof Dropzone && dropzone.getType() === 'nextPathDrop');
    }

    // Get largest intersections
    return dropzones
      .filter(dropzone => dropzone && dropzone !== draggable && dropzone.overlap(points))
      .map(dropzone => {
        return {
          dropzone: dropzone,
          intersection: dropzone.intersection(points)
        };
      })
      .sort((a, b) => b.intersection - a.intersection)
      .map(dropzone => dropzone.dropzone);
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
    return this.renderedNodes
      .slice(0, this.renderedNodes.indexOf(id)) // get all node IDs that were rendered on top
      .filter(candidate => candidate > -1) // except end scenarios
      .map(candidate => contentNodes[candidate]) // get nodes to IDs
      .filter(candidate => { // get all parents of the child
        if (Content.isBranching(candidate)) {
          return candidate.params.type.params.branchingQuestion.alternatives
            .some(alt => alt.nextContentId === id);
        }
        return candidate.params.nextContentId === id;
      })
      .slice(-1).pop(); // return the closest parent
  }

  handleMove = (id) => {
    const draggable = this['draggable-' + id];
    const intersections = this.getIntersections(draggable);

    // Highlight dropzones with largest intersection with draggable
    this.dropzones.forEach(dropzone => {
      if (!dropzone || dropzone === draggable || this.isDropzoneDisabled(dropzone.props.id)) {
        return; // Skip
      }

      if (intersections.length === 0 || dropzone !== intersections[0]) {
        dropzone.dehighlight();
      }
      else {
        dropzone.highlight();
      }
    });
  }

  handleDropped = (id) => {
    // Check if the node overlaps with one of the drop zones
    const draggable = this['draggable-' + id];
    const intersections = this.getIntersections(draggable);

    if (intersections.length === 0) {
      this.setState({
        placing: null
      });
      this.props.onDropped(); // TODO: See handlePlacing. Should be called after setstate or could it be done differently.
      return;
    }

    // Dropzone with largest intersection
    const dropzone = intersections[0];

    if (dropzone instanceof Content && !this.state.editing) {
      // Replace existing node
      this.handlePlacing(dropzone.props.id);
    }
    else {
      // Put new node or put existing node at new place
      const defaults = (draggable.props.inserting) ? draggable.props.inserting.defaults : undefined;

      // When info node is moved, check if parent is BQ and needs updating
      if (id > -1) {
        const noNodeToAttach =
          Content.isBranching(this.state.content[id]) || // moved node is BQ, will keep children
          !this.state.content[id].params.nextContentId ||
          this.state.content[id].params.nextContentId < 0;

        if (noNodeToAttach) {
          // Info node has no children that would be attached to *old* parent, latter needs update
          const parent = this.getParent(id, this.state.content);

          if (parent && Content.isBranching(parent)) {
            // Parent is BQ, update needed
            parent.params.type.params.branchingQuestion.alternatives
              .forEach(alt => {
                if (alt.nextContentId === id) {
                  alt.nextContentId = -1;
                }
              });
          }
        }
      }

      this.placeInTree(id, dropzone.props.nextContentId, dropzone.props.parent, dropzone.props.alternative, defaults);
    }
  }

  handleDropzoneClick = (nextContentId, parent, alternative, defaults) => {
    if (this.state.placing === null) {
      return;
    }
    this.placeInTree(this.state.placing, nextContentId, parent, alternative, defaults);
  }

  handleContentEdit = (id) => {
    this.setState({
      editing: id
    });
  }

  handleContentCopy = (id) => {
    const clipboardItem = new H5P.ClipboardItem(this.state.content[id].params, 'type', 'H5PEditor.BranchingScenario');
    H5P.clipboardify(clipboardItem);
  }

  handleContentDelete = (id) => {
    this.setState({
      deleting: id,
      dialog: this.buildDialog(id, this.l10n.dialogDelete) // TODO: See comment in handlePlacing(). There must be a better way to handle this.
    });
  }

  /**
   * Get titles of all children nodes sorted by ID.
   *
   * @param {number} start ID of start node.
   * @return {string[]} Titles.
   */
  getChildrenTitles = (start) => {
    return this.getChildrenIds(start, false)
      .sort((a, b) => a - b)
      .map(id => this.state.content[id].params.contentTitle || this.state.content[id].params.type.library);
    // TODO: Create a function for determining default title - the same is done multiple places but not exactaly the same.
  }

  /**
   * Get IDs of all children nodes.
   *
   * @param {number} start ID of start node.
   * @param {boolean} [includeBranching=true] If false, ids of BQs will not be returned.
   * @param {boolean} [sub=false] If true, sub call.
   * @return {number[]} IDs.
   */
  getChildrenIds = (start, includeBranching = true, sub = false) => {
    if (start < 0) {
      return [];
    }
    const node = this.state.content[start];
    let childrenIds = [];
    let nextIds = [];
    const nodeIsBranching = Content.isBranching(node);

    // Check for BQ inclusion and ignore very first start node
    if (sub && (!nodeIsBranching || nodeIsBranching && includeBranching)) {
      childrenIds.push(start);
    }

    // Get next nodes
    if (!nodeIsBranching) {
      nextIds = [node.params.nextContentId];
    }
    else {
      nextIds = node.params.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId);
    }

    nextIds
      .filter(id => id !== undefined && id > -1)
      .filter(id => this.renderedNodes.indexOf(id) > this.renderedNodes.indexOf(start)) // prevent loops
      .forEach(id => {
        childrenIds = childrenIds.concat(this.getChildrenIds(id, includeBranching, true));
      });

    return childrenIds;
  }

  getNewContentParams = () => {
    return {
      type: {
        library: this.state.library.name,
        params: {},
        subContentId: H5P.createUUID()
      },
      contentTitle: H5PEditor.LibraryListCache.getDefaultTitle(this.state.library.name),
      showContentTitle: false
    };
  }

  /**
   * TODO: Could be a static ?
   *
   * @param {number} id ID of node that was added/moved
   * @param {number} nextContentId ID that needs to be updated
   */
  updateNextContentId(leaf, id, nextId, nextContentId, bumpIdsUntil) {
    // Make old parent point directly to our old children
    if (leaf.nextContentId === id) {
      leaf.nextContentId = (nextId < 0 ? undefined : nextId);
    }

    // Make our new parent aware of us
    if (nextContentId !== undefined && leaf.nextContentId === nextContentId && nextContentId !== 0) {
      leaf.nextContentId = id;
    }

    // Bump IDs of non-end-scenario-nodes if array has changed
    if (leaf.nextContentId >= 0 && leaf.nextContentId < bumpIdsUntil) {
      leaf.nextContentId++;
    }
  }

  /**
   * Attach child to existing node.
   * TODO: Could be a static ?
   *
   * @param {object} content Content node.
   * @param {number} id Id of child node.
   */
  attachChild = (content, nextContentId) => {
    if (nextContentId === undefined || nextContentId < 0) {
      nextContentId = -1;
    }

    if (!Content.isBranching(content)) {
      content.params.nextContentId = nextContentId;
      return;
    }

    // Fill up empty alternatives first before creating new one
    if (nextContentId > -1) {
      const alternatives = content.params.type.params.branchingQuestion.alternatives;
      const pos = alternatives.map(alt => alt.nextContentId).indexOf(-1);
      if (pos === -1) {
        alternatives.push({nextContentId: nextContentId});
      }
      else {
        alternatives[pos] = {nextContentId: nextContentId};
      }
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
    if (!content || !newChildId) {
      return;
    }

    // Info node
    if (!Content.isBranching(content)) {
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
      this.attachChild(content, newChildId);
    }
  }

  /**
   * place a node in the tree (which isn't a tree technically).
   *
   * @param {number} id ID of node to be placed or -1 if new node.
   * @param {number} nextContentId ID of next node.
   * @param {number} parent ID of the parent node.
   * @param {number} alternative Number of dropzone alternative.
   * @param {object} [defaults] Default values for content.
   * @param {object} [defaults.params] Content params.
   * @param {object} [defaults.specific] Specific form options.
   */
  placeInTree(id, nextContentId, parent, alternative, defaults = {}) { // TODO: Better way to transfer defaults since it's only relevant for new nodes, state?
    this.setState((prevState, props) => {
      let newState = {
        placing: null,
        editing: null,
        inserting: null,
        content: [...prevState.content],
      };

      defaults.specific = defaults.specific || {};

      // Handle inserting of new node
      if (id === -1) {
        newState.freshContent = true; // TODO: Is this still needed?
        const defaultParams = this.getNewContentParams();
        // TODO: Is this missing when replacing with new content?
        defaultParams.type.params = defaults.params || defaultParams.type.params;
        defaultParams.contentTitle = defaults.specific.contentTitle || defaultParams.contentTitle;
        newState.content.push(this.props.getNewContent(defaultParams));
        id = newState.content.length - 1;
        newState.editing = id;
        if (id === 0) {
          if (!Content.isBranching(newState.content[0])) {
            newState.content[0].params.nextContentId = -1; // Use default end scenario as default end scenario
          }
          // This is the first node added, nothing more needs to be done.
          props.onDropped(); // TODO: Shouldn't this really be called after the state is set?
          return newState;
        }
      }
      else {
        newState.freshContent = false;
      }

      // When placing after a leaf node keep track of it so we can update it
      // after processing the new content array
      if (parent !== undefined) {
        parent = newState.content[parent];
      }

      const parentIsBranching = (parent && Content.isBranching(parent));

      const nextId = newState.content[id].params.nextContentId;

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
      }

      // Handle moving current top node to somewhere else
      if (id === 0) {
        // Place our current next node at the top
        newState.content.splice(0, 0, newState.content[nextId]);

        // Mark IDs for bumping due to array changes
        bumpIdsUntil = nextId + 1;
      }

      newState.content.forEach((content, index) => {
        if (index === bumpIdsUntil) {
          return; // Duplicate in array, must not be processed twice.
        }

        if (Content.isBranching(content)) {
          var hasAlternatives = content.params.type.params
            && content.params.type.params.branchingQuestion
            && content.params.type.params.branchingQuestion.alternatives;
          if (hasAlternatives) {
            content.params.type.params.branchingQuestion.alternatives.forEach(alternative =>
              this.updateNextContentId(alternative, id, nextId, nextContentId, bumpIdsUntil));
          }
        }
        else {
          this.updateNextContentId(content, id, nextId, nextContentId, bumpIdsUntil);
        }
      });

      // Update parent directly when placing a new leaf node
      if (parent !== undefined) {
        if (parentIsBranching) {
          parent.params.type.params.branchingQuestion.alternatives[alternative].nextContentId = (id === 0 ? 1 : id);
        }
        else {
          parent.params.nextContentId = (id === 0 ? 1 : id);
        }
      }

      // Continue handling new top node
      if (nextContentId === 0) {
        // Remove old entry
        newState.content.splice(bumpIdsUntil, 1);

        // Use the previous top node as children
        this.attachChild(newState.content[0], 1);
      }
      else if (id === 0) {
        // Remove duplicate entry
        newState.content.splice(bumpIdsUntil, 1);

        // Start using our new children
        this.attachChild(newState.content[1], nextContentId === 1 ? 2 : nextContentId);
      }
      else {
        this.attachChild(newState.content[id], nextContentId);
      }

      props.onDropped(); // TODO: Shouldn't this really be called after the state is set?
      return newState;
    });
  }

  renderDropzone(id, position, parent, num, parentIsBranching) {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }

    const defaults = (this.props.inserting) ? this.props.inserting.defaults : {};
    const isInitial = (id === -9);
    return ( !this.state.editing &&
      <Dropzone
        key={ ((id < 0) ? 'f-' + '-' + id + '/' + parent : id) + '-dz-' + num }
        ref={ element => isInitial ? this.initialDropzone = element : this.dropzones.push(element) }
        nextContentId={ nextContentId }
        parent={ parent }
        alternative={ num }
        position={ position }
        elementClass={ 'dropzone' + (isInitial ? ' disabled' : '') }
        style={
          {
            left: position.x + 'px',
            top: position.y + 'px'
          }
        }
        onClick={ () => this.handleDropzoneClick(nextContentId, parent, num, defaults) }
      />
    );
  }

  getLibrary(library) {
    for (var i = 0; i < this.props.libraries.length; i++) {
      if (this.props.libraries[i].name === library) {
        return this.props.libraries[i];
      }
    }

    const name = library.split(' ')[0];
    const title = name.replace('H5P.', '');
    return {
      title: title,
      name: name,
      className: title.toLocaleLowerCase()
    };
  }

  getBranchingChildren(content) { // TODO: Could be a static on <Content> ?
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

  renderTree = (branch, x, y, parent, renderedNodes) => {
    let nodes = [];

    // Avoid drawing the same node twice by keeping track the nodes that have been drawn.
    if (!renderedNodes) {
      renderedNodes = [];
    }

    // Libraries must be loaded before tree can be drawn
    if (!this.props.libraries) {
      nodes.push(
        <div key={ 'loading' } className="loading">Loading…</div>
      );
      branch = []; // Stops rendering
    }

    // Set defaults
    if (branch === undefined) {
      branch = [];
    }
    else if (!Array.isArray(branch)) {
      branch = [branch]; // Must always be array
    }
    if (x === undefined) {
      x = 0; // X level start
    }
    if (y === undefined) {
      y = 0; // Y level start
    }

    const parentIsBranching = (parent !== undefined && Content.isBranching(this.state.content[parent]));

    let firstX, lastX, bigY = y + (this.state.nodeSpecs.spacing.y * 7.5); // The highest we'll ever be
    branch.forEach((id, num) => {
      let drawAboveLine = false;
      const content = this.state.content[id];
      const hasBeenDrawn = (renderedNodes.indexOf(id) !== -1);

      renderedNodes.push(id);

      // Add vertical spacing for each level
      let distanceYFactor = parentIsBranching ? 7.5 : 5; // Normal distance, 2 would draw each element right underneath the previous one

      // Alternate code for "tree expansion"
      // let distanceYFactor = parentIsBranching ? 5.5 : 3; // Normal distance, 2 would draw each element right underneath the previous one
      //
      // // If placing, always keep the top node on its position and don't add space for node that has been clicked for moving.
      // if (this.state.placing !== null && id > 0 && this.state.placing !== id && this.state.placing !== parent) {
      //   distanceYFactor += 2.5; // space for DZ
      // }

      const branchY = y + distanceYFactor * this.state.nodeSpecs.spacing.y;

      // Determine if we are or parent is a branching question
      const contentIsBranching = (content && Content.isBranching(content));

      // Determine if we have any children
      const children = (hasBeenDrawn ? null : (contentIsBranching ? this.getBranchingChildren(content) : (content ? [content.params.nextContentId] : null)));

      if (x !== 0 && num > 0) {
        x += this.state.nodeSpecs.spacing.x; // Add spacing between nodes
      }

      // Draw subtree first so we know where to position the node
      const subtree = children ? this.renderTree(children, x, branchY, id, renderedNodes) : null;
      const subtreeWidth = subtree ? subtree.x - x : 0;

      // Determine position of node
      let position = {
        x: x,
        y: branchY - (this.state.nodeSpecs.spacing.y * 2) // *2 for the element itself
      };

      if (subtreeWidth >= this.state.nodeSpecs.width) {
        // Center parent above subtree
        position.x += ((subtree.x - x) / 2) - (this.state.nodeSpecs.width / 2);
      }

      let highlightCurrentNode = false;
      if (content && !hasBeenDrawn) {
        const library = this.getLibrary(content.params.type.library);
        if ((content.params.nextContentId !== undefined && content.params.nextContentId < 0 && content.params.nextContentId === this.props.highlight) || this.props.highlight === id) {
          highlightCurrentNode = true;
        }

        // Draw node
        nodes.push(
          <Content
            key={ id }
            id={ id }
            fade={ this.props.highlight !== null && !highlightCurrentNode }
            ref={ element => {
              this['draggable-' + id] = element;
              if (!this.isDropzoneDisabled(id)) {
                this.dropzones.push(element);
              }
            } }
            position={ position }
            width={ this.state.nodeSpecs.width }
            selected={ this.state.placing === id }
            onPlacing={ () => this.handlePlacing(id) }
            onMove={ () => this.handleMove(id) }
            onDropped={ () => this.handleDropped(id) }
            contentClass={ library.className }
            onEdit={ () => this.handleContentEdit(id) }
            onCopy={ () => this.handleContentCopy(id) }
            onDelete={ () => this.handleContentDelete(id) }
            disabled={ contentIsBranching }
            tooltip={ Content.getTooltip(content) }
            scale={ this.props.scale }
          >
            { library.title }
          </Content>
        );
        drawAboveLine = true;
      }

      const isLoop = (parentIsBranching && !drawAboveLine && id > -1);
      const nodeWidth = (content && !isLoop? (this.state.nodeSpecs.width / 2) : 21); // Half width actually...
      const nodeCenter = position.x + nodeWidth;

      distanceYFactor -= parentIsBranching ? 4.5 : 2; // 2 = height factor of Draggable
      const aboveLineHeight = this.state.nodeSpecs.spacing.y * distanceYFactor; // *3.5 = enough room for DZ

      // Add vertical line above (except for top node)
      if (content && id !== 0 && drawAboveLine) {
        const compensation = (parentIsBranching ? 3 : 0);
        nodes.push(
          <div key={ id + '-vabove' } className={ 'vertical-line 1' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: nodeCenter + 'px',
            top: (position.y - aboveLineHeight + compensation) + 'px',
            height: (aboveLineHeight - compensation) + 'px'
          } }/>
        );
      }

      // Extra lines for BQ
      if (!hasBeenDrawn &&
          contentIsBranching &&
          content.params.type.params.branchingQuestion &&
          content.params.type.params.branchingQuestion.alternatives &&
          content.params.type.params.branchingQuestion.alternatives.length > 1) {
        // Add vertical line below
        nodes.push(
          <div key={ id + '-vbelow' } className={ 'vertical-line 2' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: nodeCenter + 'px',
            top: (position.y + this.state.nodeSpecs.height) + 'px',
            height: (this.state.nodeSpecs.spacing.y / 2) + 'px'
          } }/>
        );

        // Add horizontal line below
        nodes.push(
          <div key={ id + '-hbelow' } className={ 'horizontal-line' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: (x + (children[0] === undefined || children[0] < 0 ? this.state.dzSpecs.width / 2 : this.state.nodeSpecs.width / 2)) + 'px',
            top: (position.y + this.state.nodeSpecs.height + (this.state.nodeSpecs.spacing.y / 2)) + 'px',
            width: (subtree.dX + 2) + 'px'
          } }/>
        );
      }

      if (parentIsBranching) {
        nodes.push(
          <div key={ parent + '-vabovebs-' + num } className={ 'vertical-line 3' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: nodeCenter + 'px',
            top: ((position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * (branch.length > 1 ? 2 : 2.5))) + (branch.length > 1 ? 2 : 0)) + 'px',
            height: (this.state.nodeSpecs.spacing.y * (branch.length > 1 ? 0.375 : 1)) + 'px'
          } }/>
        );

        const key = parent + '-abox-' + num;

        const bqParams = this.state.content[parent].params.type.params;
        const alternative = bqParams.branchingQuestion
          && bqParams.branchingQuestion.alternatives
          && bqParams.branchingQuestion.alternatives[num];
        const hasFeedback = alternative
          && alternative.addFeedback
          && alternative.feedback
          && alternative.feedback.title;

        let alternativeBallClasses = 'alternative-ball';
        if (!drawAboveLine) {
          if (id > -1) {
            // Loop to existing node
            alternativeBallClasses += ' loop';
          }
          else if (id === -1) {
            // Default or custom end scenario
            alternativeBallClasses += hasFeedback
              ? ' endscreenCustom'
              : ' endscreen';
          }
        }

        // Do not highlight custom end scenarios
        const skipHighlighting = hasFeedback ||
          (
            this.props.highlight !== null
            && (this.props.highlight !== id || highlightCurrentNode)
          );
        if (skipHighlighting) {
          if (this.props.onlyThisBall === null || this.props.onlyThisBall !== key) {
            alternativeBallClasses += ' fade';
          }
        }

        const alternativeText = this.state.content[parent].params.type.params.branchingQuestion.alternatives[num].text;
        nodes.push(
          <div key={ key }
            className={ alternativeBallClasses }
            aria-label={ /* TODO: l10n */ 'Alternative ' + (num + 1) }
            onClick={ () => this.handleBallTouch(hasBeenDrawn ? id : -1, key) }
            style={ {
              left: (nodeCenter - (this.state.nodeSpecs.spacing.y * 0.75) - 1) + 'px',
              top: (position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * 1.5)) + 'px'
            } }>A{ num + 1 }
            <div className="dark-tooltip">
              <div className="dark-text-wrap">{ !alternativeText ? /* TODO: l10n */ 'Alternative ' + (num + 1) : alternativeText }</div>
            </div>
          </div>
        );

        // Add dropzone under empty BQ alternative if not of BQ being moved
        if (this.state.placing !== null && !content && (!this.isDropzoneDisabled(parent) || this.isOuterNode(this.state.placing, parent) || !Content.isBranching(this.state.content[this.state.placing]))) {
          nodes.push(this.renderDropzone(-1, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y - this.state.dzSpecs.height - ((aboveLineHeight - this.state.dzSpecs.height) / 2) // for fixed tree
            // y: position.y - 42 + 2 * this.state.nodeSpecs.spacing.y // for expandable tree
          }, parent, num));
        }
      }

      // Add dropzones when placing, except for below the one being moved and for end scenarios
      if (!hasBeenDrawn && this.state.placing !== null && this.state.placing !== id && id >= 0) {
        const dzDistance = ((aboveLineHeight - this.state.dzSpecs.height) / 2);

        // Add dropzone above
        if (this.state.placing !== parent && (!this.isDropzoneDisabled(id) || this.isOuterNode(this.state.placing, id))) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y - this.state.dzSpecs.height - dzDistance // for fixed tree
            // y: position.y - 42 - dzDistance - ((id === 0) ? (42 / 2) : 0) // for expandable tree
          }, parentIsBranching ? parent : undefined, parentIsBranching ? num : 0, parentIsBranching));
        }

        // Add dropzone below if there's no subtree
        if (content && (!subtree || !subtree.nodes.length) && !this.isDropzoneDisabled(id)) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y + (this.state.nodeSpecs.spacing.y * 2) + dzDistance // for fixed tree
            // y: position.y + (this.state.nodeSpecs.spacing.y * 2) + dzDistance + ((this.state.placing === parent) ? (this.state.dzSpecs.height / 2) : 0) // for expandable tree
          }, id, parentIsBranching ? num + 1 : 1));
        }
      }

      // Increase same level offset + offset required by subtree
      const elementWidth = (content ? this.state.nodeSpecs.width : this.state.dzSpecs.width);
      x += (subtreeWidth >= this.state.nodeSpecs.width ? subtreeWidth : elementWidth);

      if (subtree) {
        // Merge our trees
        nodes = nodes.concat(subtree.nodes);

        if (subtree.y > bigY) {
          bigY = subtree.y;
        }
      }

      if (firstX === undefined) {
        firstX = position.x + nodeWidth;
      }
      lastX = position.x + nodeWidth;
    });

    this.renderedNodes = renderedNodes;

    return {
      nodes: nodes,
      x: x,
      y: bigY,
      dX: (firstX !== undefined ? lastX - firstX : 0) // Width of this subtree level only (used for pretty trees)
    };
  }

  updateNextContentIdAfterReplace(leaf, id, nextId) {
    // Move current children of the moved node to grand parent
    if (leaf.nextContentId === id) {
      leaf.nextContentId = nextId;
    }

    // Decrease all next ID values larger than the deleted node
    if (leaf.nextContentId > id) {
      leaf.nextContentId--;
    }
  }

  handleBallTouch = (id, onlyThisBall) => {
    if (id > -1) {
      this.props.onHighlight(id, onlyThisBall);
    }
  }

  handleDelete = () => {
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        placing: null,
        deleting: null,
        inserting: null,
        editing: null,
        content: [...prevState.content]
      };

      // TODO: Don't place large named functions inside other functions, find a cleaner and easier to understand way of doing this.
      // If we can find a simple way to group/prefix content state mutating functions that would be great.

      /**
       * Delete node.
       *
       * @param {number[]} ids Id of node to be removed.
       * @param {boolean} removeChildren If true, remove children. Adopt otherwise.
       */
      const removeNode = (ids, removeChildren=false) => {
        if (typeof ids === 'number') {
          ids = [ids];
        }

        ids.forEach(id => {
          const node = newState.content[id];
          removeChildren = removeChildren || Content.isBranching(node);

          // If node: delete this node. If BQ: delete this node and its children
          let deleteIds;
          if (Content.isBranching(node)) {
            deleteIds = node.params.type.params.branchingQuestion.alternatives
              .filter(alt => alt.nextContentId >= 0) // Filter end scenarios
              .map(alt => alt.nextContentId).concat(id);
          }
          else {
            deleteIds = [id];
          }

          deleteIds
            .filter(id => id !== undefined)
            .sort((a, b) => b - a) // Delete nodes with highest id first to account for node removal
            .forEach(deleteId => {
              // node to be removed, will always be an info node, no BQ
              const deleteNode = newState.content[deleteId];

              // If node to be removed loops backwards or to itself, use default end scenario
              const renderedNodes = this.renderedNodes.filter(node => node > -1);

              let successorId = -1;
              if (deleteNode.params.nextContentId > -1 && renderedNodes.indexOf(deleteNode.params.nextContentId) > renderedNodes.indexOf(deleteId)) {
                successorId = deleteNode.params.nextContentId;
              }

              // Exchange all links pointing to node to be deleted to its successor instead.
              newState.content.forEach(node => {
                const affectedNodes = (Content.isBranching(node)) ?
                  node.params.type.params.branchingQuestion.alternatives :
                  [node.params];

                affectedNodes.forEach(affectedNode => {
                  if (affectedNode.nextContentId === deleteId) {
                    affectedNode.nextContentId = successorId;
                  }
                  // Account Id for upcoming node removal
                  if (affectedNode.nextContentId !== undefined && affectedNode.nextContentId >= deleteId) {
                    affectedNode.nextContentId -= 1;
                  }
                });
              });

              // Remove node
              newState.content.splice(deleteId, 1);

              // Purge children
              if (removeChildren === true) {
                let childrenIds;
                if (Content.isBranching(deleteNode)) {
                  childrenIds = deleteNode.params.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId);
                }
                else {
                  childrenIds = [deleteNode.params.nextContentId];
                }
                childrenIds = childrenIds
                  .filter(id => renderedNodes.indexOf(id) > renderedNodes.indexOf(deleteId - 1)) // Ignore backlinks
                  .sort((a, b) => b - a); // Delete nodes with highest id first to account for node removal

                removeNode(childrenIds, true);
              }

              // Remove form
              deleteNode.formChildren.forEach(child => child.remove());
            });
        });
      };

      if (prevState.placing !== prevState.deleting) {
        // Replace node
        const nextContentId = prevState.content[prevState.deleting].params.nextContentId;

        // Remove form
        newState.content[prevState.deleting].formChildren.forEach(child => child.remove());

        if (prevState.placing === -1) {
          // Replace with fresh node

          newState.content[prevState.deleting] = this.props.getNewContent(this.getNewContentParams());
          newState.content[prevState.deleting].params.nextContentId = nextContentId;
          newState.editing = prevState.deleting;
        }
        else {
          // Replace with existing node

          // BQs take their children with them and don't leave a node to attach
          const nodeToAttach = Content.isBranching(newState.content[prevState.placing]) ?
            -1 :
            newState.content[prevState.placing].params.nextContentId;

          // Point parent of "placing" to successor of "placing"
          this.replaceChild(
            this.getParent(prevState.placing, newState.content),
            nodeToAttach,
            prevState.placing
          );

          // Point parent of "deleting" to "placing"
          this.replaceChild(
            this.getParent(prevState.deleting, newState.content),
            prevState.placing,
            prevState.deleting
          );

          // Point "placing" to successor of "deleting"
          this.replaceChild(
            newState.content[prevState.placing],
            newState.content[prevState.deleting].params.nextContentId,
            newState.content[prevState.placing].params.nextContentId
          );

          removeNode(prevState.deleting);
        }
      }
      else if (prevState.editing !== null && prevState.freshContent === true || prevState.deleting !== null) {
        // Delete node
        removeNode(prevState.editing !== null ? prevState.editing : prevState.deleting);
      }

      return newState;
    }, this.contentChanged);
  }

  handleCancel = () => { // TODO: What are we canceling? Can this be used for everything?
    this.setState({
      placing: null,
      deleting: null,
      editing: null,
      inserting: null
    });
  }

  componentDidUpdate() {
    // Center the tree
    if (this.props.center && this.tree) {
      let width, posX, y;

      if (this['draggable-1']) {
        // Center on 1st node
        width = this.state.nodeSpecs.width;
        posX = this['draggable-0'].props.position.x;
        y = 0;
      }
      else if (this.dropzones[0]) {
        // Center on top DZ (used for empty scenarios)
        width = 41.59;
        posX = this.dropzones[0].props.position.x;
        y = 122; // Align with StartScreen's hardcoded value
      }

      if (width !== undefined && posX !== undefined && y !== undefined) {
        // Do the centering

        // TODO: Would it be cleaner if we stored the width in the state through a ref= callback?
        // e.g. https://stackoverflow.com/questions/35915257/get-the-height-of-a-component-in-react
        const center = (this.treewrap.getBoundingClientRect().width / 2) - ((width * this.props.scale) / 2);
        this.setState({
          panning: {
            x: (center - (posX * this.props.scale)),
            y: y
          }
        }, this.props.onCanvasCentered);
      }
    }

    // Center inital dropzone
    if (this.initialDropzone) {
      const center = (this.treewrap.getBoundingClientRect().width / 2) - (41.59 / 2);
      this.initialDropzone.element.style.left = center + 'px';
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
      if (Content.isBranching(content)) {
        content.params.type.params.branchingQuestion.alternatives.forEach(alternative => {
          const hasFeedback = alternative.addFeedback
            && alternative.feedback
            && alternative.feedback.title;
          if (alternative.nextContentId === -1 && !hasFeedback) {
            numMissingEndScenarios++;
          }
        });
      }
      else if (content.params.nextContentId === -1) {
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

  handleEditorDone = (params) => {
    // Update content state for Canvas
    this.setState(prevState => {
      let newState = {
        content: [...prevState.content],
        editing: null,
        inserting: null
      };
      newState.content[this.state.editing].params = params;
      return newState;
    }, this.contentChanged);
  };

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

  panningLimits = (position) => {
    // Limits, you have to have them
    const treewrapRect = this.treewrap.getBoundingClientRect();
    const treeRect = this.tree.getBoundingClientRect();

    const wideLoad = (treeRect.width > treewrapRect.width);
    const highLoad = (treeRect.height > treewrapRect.height);

    const padding = (this.props.scale * 64); // Allow exceeding by this much

    // Limit X movement
    if (wideLoad) {
      if (position.x > padding) {
        position.x = padding; // Max X
      }
      else if ((treewrapRect.width - position.x - padding) > treeRect.width) {
        position.x = (treewrapRect.width - treeRect.width - padding); // Min X
      }
    }
    else {
      if (position.x < 0) {
        position.x = 0; // Min X
      }
      else if ((position.x + treeRect.width) > treewrapRect.width) {
        position.x = (treewrapRect.width - treeRect.width); // Max X
      }
    }

    // Limit Y movement
    if (highLoad) {
      if (position.y > padding) {
        position.y = padding; // Max Y
      }
      else if ((treewrapRect.height - position.y - padding) > treeRect.height) {
        position.y = (treewrapRect.height - treeRect.height - padding); // Min Y
      }
    }
    else {
      if (position.y < 0) {
        position.y = 0; // Min Y
      }
      else if ((position.y + treeRect.height) > treewrapRect.height) {
        position.y = (treewrapRect.height - treeRect.height); // Max Y
      }
    }
  }

  handleMoved = (position) => {
    this.setState({
      panning: position
    });
  }

  handleStopped = (moved) => {
    if (!moved) {
      // Stop highlighting
      this.props.onHighlight(null);

      // Defer until after dropzone click handler
      setTimeout(() => {
        // Stop click-to-place placing
        if (this.state.placing !== null && this.state.deleting === null) {
          this.setState({
            placing: null
          });
        }
      }, 0);
    }

    this.props.onDropped(); // TODO: See TODO in handlePlacing()
  }

  // For debugging
  logNodes = caller => {
    console.log('NODES', caller);
    this.state.content.forEach((node, index) => {
      const target = (Content.isBranching(node)) ?
        (node.params.type.params.branchingQuestion && node.params.type.params.branchingQuestion.alternatives ?
          node.params.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId).join(' | ') :
          -1) : node.params.nextContentId;
      console.log(`${index} --> ${target}`);
    });
    console.log('==========');
    console.log('d:', this.state.deleting, 'e:',this.state.editing, 'i:', this.state.inserting, 'p:', this.state.placing);
    console.warn(this.state.content);
  }

  /**
   * Create list of dropzones that Draggable should not be droppable on.
   *
   * @param {number} id Id of draggable.
   * @return {object[]} Ids of dropzones that are "disabled".
   */
  getDisabledDropzones = (id) => {
    if (id < 0) {
      return [];
    }
    // No BQ or info content shall be droppable on itself
    let dropzonesDisabled = [id];

    // No node shall not be able to replace BQs
    this.state.content.forEach((node, index) => {
      if (Content.isBranching(node)) {
        dropzonesDisabled.push(index);
      }
    });

    // BQs shall not be droppable on their children
    if (Content.isBranching(this.state.content[id])) {
      dropzonesDisabled = dropzonesDisabled.concat(this.getChildrenIds(id));
    }

    return dropzonesDisabled.filter((node, index, nodes) => nodes.indexOf(node) === index);
  }

  /**
   * Detect whether a dropzone is "disabled" for a draggable.
   *
   * @param {number} id Id of draggable to check for being disabled.
   * @return {boolean} True, if dropzone is "disabled", else false.
   */
  isDropzoneDisabled = (id) => {
    if (!this.dropzonesDisabled || !id || id < 0) {
      return false;
    }

    return this.dropzonesDisabled.indexOf(id) !== -1;
  }

  /**
   * Test if node is not child of focus node and not focus node itself.
   *
   * @param {number} focusId Id of node to check against.
   * @param {number} nodeId Id of node to test.
   */
  isOuterNode(focusId, nodeId) {
    if (!focusId || !nodeId) {
      return;
    }
    return this.getChildrenIds(focusId, true, true).indexOf(nodeId) === -1;
  }

  render() {
    this.dropzones = [];
    this.dropzonesDisabled = (this.state.placing) ? this.getDisabledDropzones(this.state.placing) : [];

    // Generate the tree
    const tree = this.renderTree(0);

    // Usful for debugging tree rendering
    // this.logNodes('render');

    const interaction = this.state.content[this.state.editing];

    let validAlternatives = [];
    if (interaction) {
      // Determine valid alternatives for the content being edited
      this.state.content.forEach((content, index) => {
        if (index !== this.state.editing) {
          validAlternatives.push({
            id: index,
            label: BranchingOptions.getAlternativeName(content)
          });
        }
      });
    }

    return (
      <div className="wrapper">
        { (this.state.deleting !== null || this.state.editing !== null) &&
          <BlockInteractionOverlay />
        }
        { !! this.props.inserting && this.state.placing &&
          <Content
            inserting={ this.props.inserting }
            ref={ element => this['draggable--1'] = element }
            width={ this.state.nodeSpecs.width }
            selected={ this.state.placing === -1 }
            onMove={ () => this.handleMove(-1) }
            onDropped={ () => this.handleDropped(-1) }
            contentClass={ this.props.inserting.library.className }
            position={ this.props.inserting.position }
            onPlacing={ () => this.handlePlacing(-1) }
            scale={ this.props.scale }
          >
            { this.props.inserting.library.title }
          </Content>
        }
        <div className="canvas">
          <Draggable
            ref={ node => this.treewrap = node }
            className={ 'treewrap' + (this.props.highlight !== null ? ' dark' : '') }
            position={ this.state.panning }
            limits={ this.panningLimits }
            onMoved={ this.handleMoved }
            onStopped={ this.handleStopped }
          >
            <div
              className="nodetree"
              ref={ node => this.tree = node }
              style={ {
                width: tree.x + 'px',
                height: tree.y + 'px',
                transform: 'translate(' + this.state.panning.x + 'px,' + this.state.panning.y + 'px) scale(' + this.props.scale + ',' + this.props.scale + ')'
              } }
            >
              { tree.nodes }
            </div>
          </Draggable>
          { !tree.nodes.length &&
            <StartScreen
              handleClicked={ this.props.handleOpenTutorial }
            >
              { this.renderDropzone(-9, {
                x: 361.635,
                y: 130
              }) }
            </StartScreen>
          }
          { this.state.deleting !== null &&
            <ConfirmationDialog
              icon={ this.state.dialog.icon } // TODO: Just send the whole dialog object? Should probably be improved when the l10n is being fixed.
              headerText={ this.state.dialog.confirmationHeader }
              body={ this.state.dialog.confirmationQuestion }
              confirmationDetails={ this.state.dialog.confirmationDetails }
              confirmationDetailsList={ this.state.dialog.confirmationDetailsList }
              textConfirm={ this.state.dialog.textConfirm }
              textCancel={ this.state.dialog.textCancel }
              handleConfirm={ this.state.dialog.handleConfirm } // TODO: Rename to onConfirm ?
              handleCancel={ this.state.dialog.handleCancel } // TODO: Rename to onCancel ?
            />
          }
          { this.state.editing !== null &&
            <EditorOverlay
              ref={ node => this.editorOverlay = node }
              content={ interaction }
              semantics={ this.props.semantics }
              validAlternatives={ validAlternatives }
              scoringOption={ this.props.scoringOption }
              onDone={ this.handleEditorDone }
            />
          }
          <QuickInfoMenu
            expanded={ false }
            l10n={ this.l10n.quickInfoMenu }
            handleOpenTutorial={ this.props.handleOpenTutorial }
          />
        </div>
      </div>
    );
  }
}

Canvas.propTypes = {
  width: PropTypes.number,
  inserting: PropTypes.object,
  highlight: PropTypes.number,
  onlyThisBall: PropTypes.string,
  scale: PropTypes.number,
  center: PropTypes.bool,
  onCanvasCentered: PropTypes.func,
  translate: PropTypes.object,
  onCanvasTranslated: PropTypes.func
};
