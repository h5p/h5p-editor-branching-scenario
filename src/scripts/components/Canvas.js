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
import { getMachineName, getAlternativeName, isBranching, hasNextContent } from '../helpers/Library';

/*global H5P*/
export default class Canvas extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      placing: null,
      deleting: null,
      inserting: null,
      editing: null,
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
      setNextContentId: null
    };
  }

  componentDidMount() {
    // Trigger the initial default end scenarios count
    this.props.onContentChanged(null, this.countDefaultEndScenarios());

    document.addEventListener('keydown', this.handleDocumentKeyDown);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleDocumentKeyDown);
  }

  static getDerivedStateFromProps(nextProps, state) {
    if (nextProps.inserting && nextProps.insertingId !== state.insertingId) {
      return ({ // Set new state on inserting
        insertingId: nextProps.insertingId,
        placing: -1,
        library: nextProps.inserting.library
      });
    }
    return null;
  }

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
        deleting: id,
        confirmReplace: true,
        dialog: 'replace'
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
        if (isBranching(candidate)) {
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

    // Dropzone with largest intersection
    const dropzone = (intersections.length > 0) ? intersections[0] : null;

    if (!dropzone || dropzone instanceof Content && dropzone.props.disabled) {
      this.setState({
        placing: null
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

  handleDropzoneClick = (nextContentId, parent, alternative) => {
    if (this.state.placing === null) {
      return;
    }
    this.placeInTree(this.state.placing, nextContentId, parent, alternative);
  }

  handleContentEdit = (id) => {
    // Workaround for Chrome keeping hover state on the draggable
    H5PEditor.$(this[`draggable-${id}`].element.element).click();

    this.setState({
      editing: id,
      placing: null
    });
  }

  handleContentCopy = (id) => {
    const clipboardItem = new H5P.ClipboardItem(this.state.content[id].params, 'type', 'H5PEditor.BranchingScenario');
    H5P.clipboardify(clipboardItem);
  }

  handleContentDelete = (id) => {
    this.setState({
      deleting: id,
      dialog: 'delete'
    });
  }

  /**
   * Get titles of all children nodes sorted by ID.
   *
   * @param {number} start ID of start node.
   * @param {number} skip Exclude
   * @return {string[]} Titles.
   */
  getChildrenTitles = (start, skip = null) => {
    return this.getChildrenIds(start, true)
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
   * @return {number[]} IDs.
   */
  getChildrenIds = (start, includeBranching = true, sub = false) => {
    if (start < 0) {
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
      .filter(id => this.renderedNodes.indexOf(id) > this.renderedNodes.indexOf(start)) // prevent loops
      .forEach(id => {
        childrenIds = childrenIds.concat(this.getChildrenIds(id, includeBranching, true));
      });

    // Remove any duplicates
    return childrenIds.filter((id, idx) => childrenIds.indexOf(id) === idx);
  }

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
      leaf.nextContentId = id;
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
        Canvas.attachChild(newState.content[1], nextContentId === 1 ? 2 : nextContentId);

        // There is no parent so there is nothing to update.
        this.hasChangedOldParentLink = true;
      }
      else {
        // One node can have multiple parents through loops.
        // When moving we only want to change the value for the first parent
        // (not the loops). That is why we have this variable
        this.hasChangedOldParentLink = false;
      }

      if (nextContentId !== 0 && id !== 0) {
        Canvas.attachChild(newState.content[id], nextContentId);
      }

      const processed = [];
      const recursiveTreeUpdate = (branch, branchingParent = null) => {
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
          if (!isBranchingContent && !(nextContentId === 0 && index === 0)) { // Skip update for new top nodes (already updated) or Branching Question (update alternatives instead)
            this.updateNextContentId((isContent ? content.params : alternative), id, nextId, nextContentId, bumpIdsUntil);
          }

          // Update subtree first
          const nextBranch = isBranchingContent ? Canvas.getBranchingChildren(content) : [isContent ? content.params.nextContentId : alternative.nextContentId];
          recursiveTreeUpdate(nextBranch, isBranchingContent ? content : null);
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
    }, this.contentChanged);
  }

  renderDropzone(id, position, parent, num, parentIsBranching) {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }

    const isInitial = (id === -9); // -9 is a special case for the first drop zone since it behaves a bit differently
    return ( !this.state.editing &&
      <Dropzone
        key={ ((id < 0) ? 'f-' + '-' + id + '/' + parent : id) + '-dz-' + num }
        ref={ element => { if (isInitial) { this.initialDropzone = element; } this.dropzones.push(element); } }
        nextContentId={ nextContentId }
        parent={ parent }
        alternative={ num }
        position={ position }
        elementClass={ 'dropzone' + (isInitial && !this.props.inserting ? ' disabled' : '') }
        style={
          {
            left: position.x + 'px',
            top: position.y + 'px'
          }
        }
        onClick={ () => this.handleDropzoneClick(nextContentId, parent, num) }
      />
    );
  }

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

    const parentIsBranching = (parent !== undefined && isBranching(this.state.content[parent]));

    let firstX, lastX, bigY = y + (this.props.nodeSize.spacing.y * 7.5); // The highest we'll ever be

    // x position of first alternative (of a subtree)
    let firstAlternativeX;

    branch.forEach((id, num) => {
      let drawAboveLine = false;
      const content = this.state.content[id];
      const contentIsBranching = (content && isBranching(content));

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

      const branchY = y + distanceYFactor * this.props.nodeSize.spacing.y;

      // Determine if we have any children
      const children = (hasBeenDrawn ? null : (contentIsBranching ? Canvas.getBranchingChildren(content) : (content ? [content.params.nextContentId] : null)));

      if (x !== 0 && num > 0) {
        x += this.props.nodeSize.spacing.x; // Add spacing between nodes
      }

      // Draw subtree first so we know where to position the node
      const subtree = children ? this.renderTree(children, x, branchY, id, renderedNodes) : null;
      const subtreeWidth = subtree ? subtree.x - x : 0;

      // Determine position of node
      let position = {
        x: x,
        y: branchY - (this.props.nodeSize.spacing.y * 2) // *2 for the element itself
      };

      if (subtreeWidth >= this.props.nodeSize.width) {
        // Center parent above subtree
        position.x += ((subtree.x - x) / 2) - (this.props.nodeSize.width / 2);
      }

      let highlightCurrentNode = false;
      if (content && !hasBeenDrawn) {
        const library = this.getLibrary(content.params.type.library);
        const hasCustomFeedback = content.params.feedback.title && content.params.feedback.title.trim() !== ''
          || content.params.feedback.subtitle
          || content.params.feedback.image
          || content.params.feedback.endScreenScore !== undefined;
        const hasDefaultEndScreen = !hasCustomFeedback
          && content.params.nextContentId !== undefined
          && content.params.nextContentId < 0
          && content.params.nextContentId === this.props.highlight;

        const isHighlightingContent = hasDefaultEndScreen
          || this.props.highlight === id
          || this.props.onlyThisBall === id;

        if (isHighlightingContent) {
          highlightCurrentNode = true;
        }

        const hasCustomEndScreen = hasCustomFeedback
          && content.params.nextContentId === -1;

        const contentHasLoopBack = (subtree === null || subtree.nodes.length === 0)
          && content.params.nextContentId >= 0;

        const isPlacingBranchingQuestion = this.state.placing === -1 &&
          this.state.library && this.state.library.title === 'Branching Question';

        // Draw node
        const label = Content.getTooltip(content);
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
            width={ this.props.nodeSize.width }
            selected={ this.state.placing === id }
            onPlacing={ () => this.handlePlacing(id) }
            onMove={ () => this.handleMove(id) }
            onDropped={ () => this.handleDropped(id) }
            contentClass={ library.className }
            onEdit={ () => this.handleContentEdit(id) }
            onCopy={ () => this.handleContentCopy(id) }
            onDelete={ () => this.handleContentDelete(id) }
            disabled={ (contentIsBranching && (this.state.placing === null || isPlacingBranchingQuestion)) || this.isDropzoneDisabled(id) }
            tooltip={ label }
            scale={ this.props.scale }
            hasCustomEndScreen={ hasCustomEndScreen }
            hasLoopBack={ contentHasLoopBack}
            highlightLinkedContent={() => {
              this.highlightLinkedContent(
                content.params.nextContentId,
                id
              );
            }}
          >
            { label }
          </Content>
        );
        drawAboveLine = true;
      }

      const isLoop = (parentIsBranching && !drawAboveLine && id > -1);
      const nodeWidth = (content && !isLoop? (this.props.nodeSize.width / 2) : 21); // Half width actually...
      const nodeCenter = position.x + nodeWidth;

      distanceYFactor -= parentIsBranching ? 4.5 : 2; // 2 = height factor of Draggable
      const aboveLineHeight = this.props.nodeSize.spacing.y * distanceYFactor; // *3.5 = enough room for DZ

      // Add vertical line above (except for top node)
      if (content && id !== 0 && drawAboveLine) {
        const compensation = (parentIsBranching ? 3 : 0);
        nodes.push(
          <div key={ id + '-vabove' } className={ 'vertical-line' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: nodeCenter + 'px',
            top: (position.y - aboveLineHeight + compensation) + 'px',
            height: (aboveLineHeight - compensation - 3) + 'px'
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
          <div key={ id + '-vbelow' } className={ 'vertical-line' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: nodeCenter + 'px',
            top: (position.y + this.props.nodeSize.height) + 'px',
            height: (this.props.nodeSize.spacing.y / 2) + 'px'
          } }/>
        );

        // Add horizontal line below
        nodes.push(
          <div key={ id + '-hbelow' } className={ 'horizontal-line' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: subtree.firstAlternativeX + 'px',
            top: (position.y + this.props.nodeSize.height + (this.props.nodeSize.spacing.y / 2)) + 'px',
            width: (subtree.dX + 2) + 'px'
          } }/>
        );
      }

      if (parentIsBranching) {
        const alternatives = this.state.content[parent].params.type.params.branchingQuestion.alternatives;

        // Offset for centering alternatives below BQ node if their total width < node width
        const alternativesEmpty = alternatives.filter((alt,index) => {
          if (alt.nextContentId === undefined) {
            return true; // Avoid crashing
          }
          const isRenderedInOtherTree = alt.nextContentId === -1 ? true
            : renderedNodes.indexOf(alt.nextContentId) > -1;

          let isRenderedAsChild = false;
          // Check if node is rendered as child if we're on the corresponding index
          if (num >= index) {
            isRenderedAsChild = nodes.some(node => {
              return node.key === alt.nextContentId.toString();
            });
          }
          const isRenderedAsPreviousAlt = branch.indexOf(alt.nextContentId) !== index;

          let isEmpty = num >= index
            ? isRenderedInOtherTree && !isRenderedAsChild
            : isRenderedInOtherTree;

          isEmpty = isEmpty || (!isRenderedAsChild && isRenderedAsPreviousAlt);

          return alt.nextContentId < 0 || isEmpty;
        }).length;
        const width = alternativesEmpty * this.state.dzSpecs.width +
          (alternatives.length - alternativesEmpty) * this.props.nodeSize.width +
          (alternatives.length - 1) * this.props.nodeSize.spacing.x;
        const alternativesOffsetX = (this.props.nodeSize.width > width) ? ((this.props.nodeSize.width - width) / 2) : 0;

        // Remember position of first alternative for rendering parent node
        if (num === 0) {
          firstAlternativeX = alternativesOffsetX + nodeCenter;
        }

        // Add vertical line above alternative ball
        nodes.push(
          <div key={ parent + '-vabovebs-' + num } className={ 'vertical-line' + (this.props.highlight !== null ? ' fade' : '') } style={ {
            left: alternativesOffsetX + nodeCenter + 'px',
            top: ((position.y - aboveLineHeight - (this.props.nodeSize.spacing.y * (branch.length > 1 ? 2 : 2.5))) + (branch.length > 1 ? 3 : 1)) + 'px',
            height: ((this.props.nodeSize.spacing.y * (branch.length > 1 ? 0.375 : 1)) - (branch.length > 1 ? 1 : 1)) + 'px'
          } }/>
        );

        const key = parent + '-abox-' + num;

        const alternative = alternatives[num];
        const hasFeedback = !!(alternative
          && alternative.feedback
          && (alternative.feedback.title && alternative.feedback.title.trim() !== ''
            || alternative.feedback.subtitle
            || alternative.feedback.image
            || alternative.feedback.endScreenScore !== undefined
          ));

        let alternativeBallClasses = 'alternative-ball';
        let hasLoopBack = false;
        if (!drawAboveLine) {
          if (id > -1) {
            // Loop to existing node
            alternativeBallClasses += ' loop';
            hasLoopBack = true;
          }
          else if (id === -1) {
            // Default or custom end scenario
            alternativeBallClasses += hasFeedback
              ? ' endscreenCustom'
              : ' endscreen';
          }
        }

        // Do not highlight custom end scenarios
        const highlightingDefaultEndings = this.props.highlight === -1;
        const highlightingLink = this.props.highlight >= 0
          && this.props.onlyThisBall !== null;
        let fadeOut = false;
        if (highlightingDefaultEndings) {
          // Fade out if we have a custom ending or no ending
          fadeOut = hasFeedback || id !== -1;
        }
        else if (highlightingLink) {
          const isLinkedHighlight = this.props.onlyThisBall === key;
          fadeOut = !isLinkedHighlight;
        }

        if (fadeOut) {
          if (this.props.onlyThisBall === null || this.props.onlyThisBall !== key) {
            alternativeBallClasses += ' fade';
          }
        }

        // Add alternatives ball
        const alternativeText = alternatives[num].text;
        nodes.push(
          <div key={ key }
            className={ alternativeBallClasses }
            aria-label={ /* TODO: l10n */ 'Alternative ' + (num + 1) }
            onDoubleClick={() => {
              this.handleContentEdit(parent);
            }}
            style={ {
              left: (alternativesOffsetX + nodeCenter - (this.props.nodeSize.spacing.y * 0.75) - 1) + 'px',
              top: (position.y - aboveLineHeight - (this.props.nodeSize.spacing.y * 1.5)) + 'px'
            } }>A{ num + 1 }
            {
              hasLoopBack &&
              <div
                className='loop-back'
                onClick={() => this.handleBallTouch(hasBeenDrawn ? id : -1, key)}
              />
            }
            <div className="dark-tooltip">
              <div className="dark-text-wrap">{ !alternativeText ? /* TODO: l10n */ 'Alternative ' + (num + 1) : alternativeText }</div>
            </div>
          </div>
        );

        // Add dropzone under empty BQ alternative if not of BQ being moved
        if (this.state.placing !== null && (!content || hasLoopBack) && (!this.isDropzoneDisabled(parent) || this.isOuterNode(this.state.placing, parent) || !isBranching(this.state.content[this.state.placing]))) {
          nodes.push(this.renderDropzone(-1, {
            x: alternativesOffsetX + nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y - this.state.dzSpecs.height - ((aboveLineHeight - this.state.dzSpecs.height) / 2) // for fixed tree
            // y: position.y - 42 + 2 * this.props.nodeSize.spacing.y // for expandable tree
          }, parent, num));
        }
      }

      // Add dropzones when placing, except for below the one being moved and for end scenarios
      if (!hasBeenDrawn && this.state.placing !== null && this.state.placing !== id && id >= 0) {
        const dzDistance = ((aboveLineHeight - this.state.dzSpecs.height) / 2);

        // Add dropzone above
        if (content && this.state.placing !== parent && (!this.isDropzoneDisabled(id) || this.isOuterNode(this.state.placing, id))) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y - this.state.dzSpecs.height - dzDistance // for fixed tree
            // y: position.y - 42 - dzDistance - ((id === 0) ? (42 / 2) : 0) // for expandable tree
          }, parentIsBranching ? parent : undefined, parentIsBranching ? num : 0, parentIsBranching));
        }

        // Add dropzone below if there's no subtree (or BQ implicitly with no alternatives)
        if (content && !isBranching(content) && (!subtree || !subtree.nodes.length) && !this.isDropzoneDisabled(id)) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y + (this.props.nodeSize.spacing.y * 2) + dzDistance // for fixed tree
            // y: position.y + (this.props.nodeSize.spacing.y * 2) + dzDistance + ((this.state.placing === parent) ? (this.state.dzSpecs.height / 2) : 0) // for expandable tree
          }, id, parentIsBranching ? num + 1 : 1));
        }
      }

      // Increase same level offset + offset required by subtree
      const elementWidth = (content ? (parentIsBranching && !drawAboveLine && id > -1 ? this.state.dzSpecs.width : this.props.nodeSize.width) : this.state.dzSpecs.width);
      x += (subtreeWidth >= this.props.nodeSize.width ? subtreeWidth : elementWidth);

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
      dX: (firstX !== undefined ? lastX - firstX : 0), // Width of this subtree level only (used for pretty trees)
      firstAlternativeX: firstAlternativeX
    };
  }

  handleBallTouch = (id, onlyThisBall) => {
    if (id > -1) {
      this.props.onHighlight(id, onlyThisBall);
    }
  }

  highlightLinkedContent = (nextContentId, currentContentId) => {
    if (nextContentId > -1 && currentContentId > -1) {
      this.props.onHighlight(nextContentId, currentContentId);
    }
  };

  handleDelete = () => {
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        deleting: null,
        dialog: null,
        setNextContentId: null,
        content: [...prevState.content]
      };

      // TODO: Don't place large named functions inside other functions, find a cleaner and easier to understand way of doing this.
      // If we can find a simple way to group/prefix content state mutating functions that would be great.

      /**
       * Delete node.
       *
       * @param {number[]} ids Id of node to be removed.
       * @param {boolean} removeChildren If true, remove children. Adopt otherwise.
       * @param {number} [skipChild=null] Avoid removing this part of the subtree
       */
      const removeNode = (ids, removeChildren=false, skipChild = null) => {
        if (typeof ids === 'number') {
          ids = [ids];
        }

        ids.forEach(id => {
          const node = newState.content[id];
          removeChildren = removeChildren || isBranching(node);

          // If node to be removed loops backwards or to itself, use default end scenario
          let renderedNodes = this.renderedNodes.filter(node => node > -1);

          // If node: delete this node. If BQ: delete this node and its children
          let deleteIds;
          if (isBranching(node)) {
            const alternatives = node.params.type.params.branchingQuestion.alternatives || [];
            deleteIds = alternatives
              .filter(alt => alt.nextContentId > -1 &&
                alt.nextContentId !== skipChild &&
                renderedNodes.indexOf(alt.nextContentId) > renderedNodes.indexOf(id)) // Filter end scenarios and loops
              .map(alt => alt.nextContentId).concat(id);
          }
          else {
            deleteIds = [id];
          }

          deleteIds
            .filter((id, idx) => id !== undefined && deleteIds.indexOf(id) === idx) // Remove duplicates and empties
            .sort((a, b) => b - a) // Delete nodes with highest id first to account for node removal
            .forEach(deleteId => {
              // node to be removed, will always be an info node, no BQ
              const deleteNode = newState.content[deleteId];

              let successorId = -1;
              if (deleteNode.params.nextContentId > -1) {
                if (renderedNodes.indexOf(deleteNode.params.nextContentId) > renderedNodes.indexOf(deleteId)) {
                  successorId = deleteNode.params.nextContentId;
                }
                else if (skipChild) {
                  successorId = skipChild;
                }
              }

              // Keep track if first node is being deleted to swap nodes later
              const newFirstNode = (deleteId === 0) ? successorId - 1 : undefined;

              // Exchange all links pointing to node to be deleted to its successor instead.
              newState.content.forEach((node, index) => {
                const affectedNodes = (isBranching(node)) ?
                  node.params.type.params.branchingQuestion.alternatives || []:
                  [node.params];

                affectedNodes.forEach(affectedNode => {
                  if (affectedNode.nextContentId === deleteId) {
                    // Updated next content but also avoid looping back to self or other node that was deleted
                    affectedNode.nextContentId = ((successorId === index || renderedNodes.indexOf(deleteId) < index) ?
                      -1 :
                      successorId
                    );
                  }
                  // Account Id for upcoming node removal
                  if (affectedNode.nextContentId !== undefined && affectedNode.nextContentId >= deleteId) {
                    affectedNode.nextContentId -= 1;
                  }
                  if (skipChild > deleteId) {
                    skipChild -= 1;
                  }
                });
              });

              // Remove node in rendered nodes and update indices
              renderedNodes = renderedNodes
                .filter(node => node !== deleteId)
                .map(node => (node >= deleteId) ? node - 1  : node);

              // Remove node
              newState.content.splice(deleteId, 1);

              // Purge children
              if (removeChildren === true) {
                let childrenIds;
                if (isBranching(deleteNode)) {
                  const alternatives = deleteNode.params.type.params.branchingQuestion.alternatives || [];
                  childrenIds = alternatives.map(alt => alt.nextContentId);
                }
                else {
                  childrenIds = [deleteNode.params.nextContentId];
                }
                childrenIds = childrenIds
                  .filter((id, idx) => renderedNodes.indexOf(id) > renderedNodes.indexOf(deleteId - 1) && id !== skipChild && childrenIds.indexOf(id) === idx) // Ignore backlinks and duplicates
                  .sort((a, b) => b - a); // Delete nodes with highest id first to account for node removal

                removeNode(childrenIds, true, skipChild);
              }

              // Swap nodes to set new first node
              if (newFirstNode > -1) {
                this.swapNodes(newState.content, 0, newFirstNode);
              }

              // Remove form
              H5PEditor.removeChildren(deleteNode.formChildren);
            });
        });
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

        removeNode(prevState.deleting, true, prevState.setNextContentId);

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

          removeNode(prevState.deleting, false, prevState.placing);
        }
      }
      else if (prevState.deleting !== null) {
        // Delete node
        removeNode(prevState.editing !== null ? prevState.editing : prevState.deleting);
      }

      return newState;
    }, this.contentChanged);
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

  handleCancel = () => {
    if (this.state.deleting !== null && this[`draggable-${this.state.deleting}`]) {
      this[`draggable-${this.state.deleting}`].dehighlight();
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

    this.setState(newState);
  }

  componentDidUpdate() {
    // Center the tree
    if (this.props.center && this.tree && this['draggable-0']) {
      // Center on 1st node
      // TODO: Would it be cleaner if we stored the width in the state through a ref= callback?
      // e.g. https://stackoverflow.com/questions/35915257/get-the-height-of-a-component-in-react
      const treeWrapWidth = this.treewrap.getBoundingClientRect().width;
      if (treeWrapWidth !== 0) {
        const center = (treeWrapWidth / 2) - ((this.props.nodeSize.width * this.props.scale) / 2);
        this.setState({
          panning: {
            x: (center - (this['draggable-0'].props.position.x * this.props.scale)),
            y: 0
          }
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
          const hasFeedback = !!(alternative.feedback
            && (alternative.feedback.title
              || alternative.feedback.subtitle
              || alternative.feedback.image
              || alternative.feedback.endScreenScore !== undefined
            ));
          if (alternative.nextContentId === -1 && !hasFeedback) {
            numMissingEndScenarios++;
          }
        });
      }
      else if (content.params.nextContentId === -1) {
        const hasCustomEnding = content.params.feedback
          && (
            content.params.feedback.title
            || content.params.feedback.subtitle
            || content.params.feedback.image
            || content.params.feedback.endScreenScore !== undefined
          );

        if (!hasCustomEnding) {
          numMissingEndScenarios++;
        }
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

  handleEditorDone = () => {
    // Update content state for Canvas (params are updated by reference)
    this.setState({
      editing: null,
      inserting: null
    }, this.contentChanged);
  };

  handleEditorRemove = () => {
    this.setState(prevState => {
      return {
        editing: null,
        inserting: null,
        placing: prevState.editing,
        deleting: prevState.editing,
        dialog: 'delete'
      };
    }, this.contentChanged);
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

  panningLimits = (position) => {
    // Limits, you have to have them
    const treewrapRect = this.treewrap.getBoundingClientRect();
    const treeRect = this.tree.getBoundingClientRect();

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
      else if ((treewrapRect.height - position.y - padding) > treeRect.height) {
        position.y = (treewrapRect.height - treeRect.height - padding); // Min Y
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
          this.props.onDropped();
        }
      }, 0);
    }
  }

  // For debugging
  logNodes = caller => {
    console.log('NODES', caller);
    this.state.content.forEach((node, index) => {
      const target = (isBranching(node)) ?
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

    // No BQ shall be able to replace BQs
    this.state.content.forEach((node, index) => {
      if (isBranching(node) && isBranching(this.state.content[id])) {
        dropzonesDisabled.push(index);
      }
    });

    // BQs shall not be droppable on their children
    if (isBranching(this.state.content[id])) {
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
    if (!this.dropzonesDisabled || id === undefined || id === null || id < 0) {
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
    return this.getChildrenIds(focusId, true, true).indexOf(nodeId) === -1;
  }

  handleNextContentChange = (params, newId, render = null) => {
    if (params.nextContentId > -1) {
      // Check that there's still a reference to the content
      let found = 0;
      for (let i = 0; i < this.state.content.length; i++) {
        found += hasNextContent(this.state.content[i], params.nextContentId, true);
        if (found > 1) {
          break;
        }
      }

      if (found < 2 && this.renderedNodes.indexOf(params.nextContentId) > this.renderedNodes.indexOf(this.state.editing)) {
        // Display delete dialog
        this.setState({
          setNextContentId: newId,
          deleting: params.nextContentId,
          dialog: 'delete' + (newId === -2 ? ' alternative' : '')  // -2 = deleting entire alternative (handled by H5PEditor)
        });
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

  renderConfirmationDialogContent = () => {
    if (this.state.setNextContentId === -2 || this.state.setNextContentId !== null) {  // -2 = deleting entire alternative (handled by H5PEditor)
      const children = this.getChildrenTitles(this.state.deleting);
      // Add self to list of content
      children.unshift(getAlternativeName(this.state.content[this.state.deleting]));
      return (
        <div className='confirmation-details'>
          <p>If you proceed, you will lose all the content attached to this alternative:</p>
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
          <p>If you proceed, you will lose all the content attached to this contents alternatives:</p>
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
          <p>You will lose this content, but the children will be attached to the parent content.</p>
        </div>
      );
    }
  }

  render() {
    this.dropzones = [];
    this.dropzonesDisabled = (this.state.placing !== null) ? this.getDisabledDropzones(this.state.placing) : [];

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
            label: getAlternativeName(content),
          });
        }
      });
    }

    return (
      <div className="wrapper">
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
        <div className={`canvas${this.state.placing !== null ? ' placing-draggable' : ''}`}>
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
              handleClick={ this.props.onDropped }
              handleTutorialClick={ this.props.handleOpenTutorial }
            >
              { this.renderDropzone(-9, {
                x: 361.635,
                y: 130
              }) }
            </StartScreen>
          }
          { tree.nodes.length &&
            <QuickInfoMenu
              fade={ this.props.highlight !== null }
              onTutorialOpen={ this.props.handleOpenTutorial }
            />
          }
        </div>
        { this.state.dialog !== null &&
          <ConfirmationDialog
            action={ this.state.dialog }
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
  onCanvasTranslated: PropTypes.func
};
