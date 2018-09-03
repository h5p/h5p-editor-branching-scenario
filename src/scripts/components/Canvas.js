import React from 'react';
import PropTypes from 'prop-types';
import './Canvas.scss';
import StartScreen from './StartScreen.js';
import Draggable from './Draggable.js';
import Dropzone from './Dropzone.js';
import ConfirmationDialog from './ConfirmationDialog.js';
import EditorOverlay from './EditorOverlay';
import QuickInfoMenu from './QuickInfoMenu';

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
      clickHandeled: false,
      placing: null,
      deleting: null,
      inserting: null,
      editing: null,
      editorOverlayVisible: false,
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
      nodeSpecs: { // TODO: Get from DOM ?
        width: 121,
        height: 32,
        spacing: {
          x: 29,
          y: 16
        }
      },
      content: this.props.content,
      dialog: this.l10n.dialogDelete
    };

    console.log('%c Welcome back, Frode!', 'font: bold 50px OpenSans; text-align: center; padding: 0.75em; color: red; text-shadow: 2px 2px 0 rgb(217,31,38), 4px 4px 0 rgb(226,91,14), 6px 6px 0 rgb(245,221,8), 9px 9px 0 rgb(5,148,68), 11px 11px 0 rgb(2,135,206), 13px 13px 0 rgb(4,77,145), 15px 15px 0 rgb(42,21,113)');
  }

  componentDidMount() {
    // Handle document clicks (for exiting placing mode/state)
    document.addEventListener('click', this.handleDocumentClick);
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick);
  }

  componentWillReceiveProps(nextProps) {
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
    if (this.contentIsBranching(this.state.content[id])) {
      const nodeTitles = this.getChildrenTitles(id)
        .map((title, index) => <li key={index}>{title}</li>);

      dialog.confirmationDetails = params.confirmationDetailsBQ;
      dialog.confirmationDetailsList = nodeTitles;
    }
    else {
      if (this.state.content[id].nextContentId) {
        dialog.confirmationDetails = params.confirmationDetailsNO;
      }
    }
    return dialog;
  }

  handleDocumentClick = () => {
    if (this.state.clickHandeled) {
      this.setState({
        clickHandeled: false
      });
    }
    else if (this.state.placing !== null && this.state.deleting === null) {
      this.setState({
        placing: null
      });
    }
  }

  /**
   * @param {number} id - Dropzone ID.
   */
  handlePlacing = (id) => {
    if (this.state.placing !== null && this.state.placing !== id) {
      this.setState({
        clickHandeled: true,
        deleting: id,
        dialog: this.buildDialog(id, this.l10n.dialogReplace)
      });
    }
    else {
      // Start placing
      this.setState({
        clickHandeled: true,
        placing: id
      });
    }
  }

  /**
   * Get intersections between dropzones and a draggable.
   *
   * @param {Draggable} draggable Draggable object.
   * @return {object[]} intersecting objects ordered by intersecting area in decreasing order
   */
  getIntersections(draggable) {
    const points = draggable.getPoints();

    // Get largest intersections
    return this.dropzones
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

  handleMove = (id) => {
    const draggable = this['draggable-' + id];
    const intersections = this.getIntersections(draggable);

    // Highlight dropzones with largest intersection with draggable
    this.dropzones.forEach(dropzone => {
      if (!dropzone || dropzone === draggable || intersections.length === 0) {
        return; // Skip
      }

      if (dropzone === intersections[0]) {
        dropzone.highlight();
      }
      else {
        dropzone.dehighlight();
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
      return;
    }

    // Dropzone with largest intersection
    const dropzone = intersections[0];

    if (dropzone instanceof Draggable && !this.state.editorOverlayVisible) {
      // Replace existing node
      this.handlePlacing(dropzone.props.id);
    }
    else if (!this.state.editing) {
      // Put existing node at new place
      this.placeInTree(id, dropzone.props.nextContentId, dropzone.props.parent, dropzone.props.alternative);
    }
    else {
      // Add next element in editor
      const parentId = this.state.editing;
      // Here we retrieve the content from EditorOverlay, because CKEditor changes are not caught
      this.handleFormSaved(this.state.editing, this.state.editorOverlay.state.content);
      if (parentId !== undefined) {
        this.placeInTree(id, dropzone.props.nextContentId, parentId, dropzone.props.alternative);
      }
    }
  }

  handleDropzoneClick = (nextContentId, parent, alternative) => {
    if (this.state.placing === null) {
      return;
    }

    this.placeInTree(this.state.placing, nextContentId, parent, alternative);
  }

  handleEditContent = (id) => {
    this.setState({
      editing: id
    });
  }

  handleDeleteContent = (id) => {
    this.setState({
      deleting: id,
      dialog: this.buildDialog(id, this.l10n.dialogDelete)
    });

  }

  /**
   * Get titles of all children nodes sorted by ID.
   *
   * @param {number} start ID of start node.
   * @return {string[]} Titles.
   */
  getChildrenTitles = (start) => {
    return this.getChildrenIds(start)
      .sort((a, b) => a - b)
      .map(id => this.state.content[id].contentTitle || this.state.content[id].type.library);
  }

  /**
   * Get IDs of all children nodes.
   *
   * @param {number} start ID of start node.
   * @return {number[]} IDs.
   */
  getChildrenIds = (start) => {
    const node = this.state.content[start];
    let childrenIds = [];
    let nextIds = [];

    if (!this.contentIsBranching(node)) {
      childrenIds.push(start);
      nextIds = [node.nextContentId];
    }
    else {
      nextIds = node.type.params.alternatives.map(alt => alt.nextContentId);
    }

    nextIds
      .filter(id => id !== undefined && id > start) // id > start prevents loops
      .forEach(id => {
        childrenIds = childrenIds.concat(this.getChildrenIds(id));
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
      contentTitle: this.state.library.name.split('.')[1], // TODO: There's probably a better default
      showContentTitle: false,
    };
  }

  contentIsBranching(content) {
    return content.type.library.split(' ')[0] === 'H5P.BranchingQuestion';
  }

  /**
   * @param {number} id ID of node that was added/moved
   * @param {number} nextContentId ID that needs to be updated
   */
  updateNextContentId(leaf, id, nextId, nextContentId, bumpIdsUntil) {
    // Make old parent point directly to our old children
    if (leaf.nextContentId === id) {
      leaf.nextContentId = (nextId < 0 ? undefined : nextId);
    }

    // Make our new parent aware of us
    if (nextContentId !== undefined && leaf.nextContentId === nextContentId) {
      leaf.nextContentId = id;
    }

    // Bump IDs if array has changed
    if (leaf.nextContentId < bumpIdsUntil) {
      leaf.nextContentId++;
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
    this.setState(prevState => {
      let newState = {
        placing: null,
        content: [...prevState.content],
      };

      // Handle inserting of new node
      if (id === -1) {
        newState.content.push(this.getNewContentParams());
        id = newState.content.length - 1;
        newState.inserting = id;
        if (id === 0) {
          // This is the first node added, nothing more needs to be done.
          return newState;
        }
      }

      // When placing after a leaf node keep track of it so we can update it
      // after processing the new content array
      if (parent !== undefined) {
        parent = newState.content[parent];
      }

      const parentIsBranching = (parent && parent.type.library.split(' ')[0] === 'H5P.BranchingQuestion');

      const nextId = newState.content[id].nextContentId;
      // TODO: Make a solution for Branching Question. Here setState() is
      // called twice, but only for BranchingQuestion content that's added.
      // Crashes, because it still works on the old prevState. What causes
      // this 2nd call?

      // Handle adding new top node before the current one
      let bumpIdsUntil = -1;
      if (nextContentId === 0) {
        // We are the new top node, we must move to the top of the array
        newState.content.splice(0, 0, newState.content[id]);
        newState.inserting = 0;

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

        if (this.contentIsBranching(content)) {
          if (content.type.params &&
              content.type.params.alternatives) {
            content.type.params.alternatives.forEach(alternative =>
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
          parent.type.params.alternatives[alternative].nextContentId = (id === 0 ? 1 : id);
        }
        else {
          parent.nextContentId = (id === 0 ? 1 : id);
        }
      }

      // Continue handling new top node
      if (nextContentId === 0) {
        // Remove old entry
        newState.content.splice(bumpIdsUntil, 1);

        // Use the previous top node as children
        newState.content[0].nextContentId = 1;
        // TODO: What to do if we are branching?
      }
      else if (id === 0) {
        // Remove duplicate entry
        newState.content.splice(bumpIdsUntil, 1);

        // Start using our new children
        newState.content[1].nextContentId = (nextContentId === 1 ? 2 : nextContentId);
        // TODO: What to do if we are branching?
      }
      else {
        if (this.contentIsBranching(newState.content[id])) {
          // Nothing to do here?
        }
        else {
          newState.content[id].nextContentId = (nextContentId < 0 ? undefined : nextContentId);
        }
      }

      return newState;
    }, () => {
      if (this.state.inserting === null || this.state.deleting !== null) {
        return;
      }
      this.handleInserted(this.state.inserting);
    });
  }

  renderDropzone(id, position, parent, num, parentIsBranching) {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }
    return ( !this.state.editorOverlayVisible &&
      <Dropzone
        key={ ((id < 0) ? 'f-' + '-' + id : id) + '-dz-' + num }
        ref={ element => this.dropzones.push(element) }
        nextContentId={ nextContentId }
        parent={ parent }
        alternative={ num }
        position={ position }
        elementClass={ 'dropzone' }
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

  getLibraryTitle(library) {
    if (!this.props.libraries) {
      return library;
    }

    for (var i = 0; i < this.props.libraries.length; i++) {
      if (this.props.libraries[i].name === library) {
        return this.props.libraries[i].title;
      }
    }

    return library;
  }

  getBranchingChildren(content) {
    if (!content.type || !content.type.params ||
        !content.type.params.alternatives ||
        !content.type.params.alternatives.length) {
      return; // No alternatives today
    }

    let children = [];
    content.type.params.alternatives.forEach(alternative => {
      children.push(alternative.nextContentId); // Other question or end scenario
    });

    return children;
  }

  renderTree = (branch, x, y, parent, renderedNodes) => {
    let nodes = [];

    // Keep track of nodes that have already been rendered (there might be cycles)
    renderedNodes = renderedNodes || [];

    // Libraries must be loaded before tree can be drawn
    if (!this.props.libraries || this.props.translations.length === 0) {
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
      y = 100; // Y level start
    }

    const parentIsBranching = (parent !== undefined && this.state.content[parent].type.library.split(' ')[0] === 'H5P.BranchingQuestion');

    let firstX, lastX;
    branch.forEach((id, num) => {
      let drawAboveLine = false;
      const content = this.state.content[id];

      // Add vertical spacing for each level
      let distanceYFactor = parentIsBranching ? 8 : 5.5; // Normal distance, 2 would draw each element right underneath the previous one

      // Alternate code for "tree expansion"
      // let distanceYFactor = parentIsBranching ? 5.5 : 3; // Normal distance, 2 would draw each element right underneath the previous one
      //
      // // If placing, always keep the top node on its position and don't add space for node that has been clicked for moving.
      // if (this.state.placing !== null && id > 0 && this.state.placing !== id && this.state.placing !== parent) {
      //   distanceYFactor += 2.5; // space for DZ
      // }

      const branchY = y + distanceYFactor * this.state.nodeSpecs.spacing.y;

      // Determine if we are or parent is a branching question
      const contentIsBranching = (content && content.type.library.split(' ')[0] === 'H5P.BranchingQuestion');

      // Determine if we have any children that are not looping to upper nodes
      const children = (contentIsBranching ? this.getBranchingChildren(content) : (content ? [content.nextContentId] : null));

      if (x !== 0 && num > 0) {
        x += this.state.nodeSpecs.spacing.x; // Add spacing between nodes
      }

      // Exclude branches that are looping back to earlier nodes
      let newChildren = children;
      if (newChildren) {
        newChildren = (typeof children === 'number' ? [children] : children)
          .filter(child => child < 0 || child > id);
      }

      // Draw subtree first so we know where to position the node
      const subtree = newChildren ? this.renderTree(newChildren, x, branchY, id, renderedNodes) : null;
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

      if (content && renderedNodes.indexOf(id) === -1) {
        const libraryTitle = this.getLibraryTitle(content.type.library);

        // Draw node
        nodes.push(
          <Draggable
            key={ id }
            id={ id }
            ref={ element => { this['draggable-' + id] = element; if (this.state.placing !== null && this.state.placing !== id) this.dropzones.push(element); } }
            position={ position }
            width={ this.state.nodeSpecs.width }
            onPlacing={ () => this.handlePlacing(id) }
            onMove={ () => this.handleMove(id) }
            onDropped={ () => this.handleDropped(id) }
            contentClass={ libraryTitle }
            editContent={ () => this.handleEditContent(id) }
            deleteContent={ () => this.handleDeleteContent(id) }
            disabled={ content.type.library.split(' ')[0] === 'H5P.BranchingQuestion' }
          >
            { libraryTitle }
          </Draggable>
        );
        renderedNodes.push(id);
        drawAboveLine = true;
      }

      const nodeWidth = (content ? (this.state.nodeSpecs.width / 2) : 21); // Half width actually...
      const nodeCenter = position.x + nodeWidth;

      distanceYFactor -= parentIsBranching ? 4.5 : 2; // 2 = height factor of Draggable
      const aboveLineHeight = this.state.nodeSpecs.spacing.y * distanceYFactor; // *3.5 = enough room for DZ

      // Add vertical line above (except for top node)
      if (content && id !== 0 && drawAboveLine) {
        nodes.push(
          <div key={ id + '-vabove' } className="vertical-line" style={ {
            left: nodeCenter + 'px',
            top: (position.y - aboveLineHeight) + 'px',
            height: aboveLineHeight + 'px'
          } }/>
        );
      }

      // Extra lines for BQ
      if (contentIsBranching && content.type.params.alternatives && content.type.params.alternatives.length > 1) {
        // Add vertical line below
        nodes.push(
          <div key={ id + '-vbelow' } className="vertical-line" style={ {
            left: nodeCenter + 'px',
            top: (position.y + this.state.nodeSpecs.height) + 'px',
            height: (this.state.nodeSpecs.spacing.y / 2) + 'px'
          } }/>
        );

        // Add horizontal line below
        nodes.push(
          <div key={ id + '-hbelow' } className="horizontal-line" style={ {
            left: (x + (children[0] < 0 ? 42 / 2 : this.state.nodeSpecs.width / 2)) + 'px',
            top: (position.y + this.state.nodeSpecs.height + (this.state.nodeSpecs.spacing.y / 2)) + 'px',
            width: subtree.dX + 'px'
          } }/>
        );
      }

      if (parentIsBranching) {
        const lengthMultiplier = (branch.length > 1 ? 2 : 2.5);
        nodes.push(
          <div key={ parent + '-vabovebs-' + num } className="vertical-line" style={ {
            left: nodeCenter + 'px',
            top: (position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * lengthMultiplier)) + 'px',
            height: (this.state.nodeSpecs.spacing.y * lengthMultiplier) + 'px'
          } }/>
        );

        let alternativeBallClasses = 'alternative-ball';
        if (!drawAboveLine) {
          if (id > 0) {
            // Loop to existing node
            alternativeBallClasses += ' loop';
          }
          else if (id === -1) {
            // Default end scenario
            alternativeBallClasses += ' endscreen';
          }
          else if (id < -1) {
            // Alternative end scenarios
            alternativeBallClasses += ' endscreenCustom';
          }
        }

        nodes.push(
          <div key={ parent + '-abox-' + num } className={ alternativeBallClasses } style={ {
            left: (nodeCenter - (this.state.nodeSpecs.spacing.y * 0.75) + 1) + 'px',
            top: (position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * 1.5)) + 'px'
          } }>A{ num + 1 }</div>
        );

        // Add dropzone under empty BQ alternative
        if (this.state.placing !== null && !content) {
          nodes.push(this.renderDropzone(-1, {
            x: nodeCenter - (42 / 2), // 42 = size of DZ  TODO: Get from somewhere?
            y: position.y + 2 * this.state.nodeSpecs.spacing.y - 42
          }, parent, num));
        }
      }

      // Add dropzones when placing, except for below the one being moved and for end scenarios
      if (this.state.placing !== null && this.state.placing !== id && id >= 0) {
        const dzDistance = ((aboveLineHeight - 42) / 2);

        // Add dropzone above
        if (this.state.placing !== parent) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (42 / 2), // 42 = size of DZ  TODO: Get from somewhere?
            y: position.y - 42 - dzDistance - ((id === 0) ? (42 / 2) : 0)
          }, parentIsBranching ? parent : undefined, parentIsBranching ? num : 0, parentIsBranching));
        }

        // Add dropzone below if there's no subtree
        if (content && (!subtree || !subtree.nodes.length)) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (42 / 2), // 42 = size of DZ  TODO: Get from somewhere?
            y: position.y + (this.state.nodeSpecs.spacing.y * 2) + dzDistance + ((this.state.placing === parent) ? (42 / 2) : 0)
          }, id, parentIsBranching ? num + 1 : 1));
        }
      }

      // Increase same level offset + offset required by subtree
      const elementWidth = (content ? this.state.nodeSpecs.width : 42);
      x += (subtreeWidth >= this.state.nodeSpecs.width ? subtreeWidth : elementWidth);

      if (subtree) {
        // Merge our trees
        nodes = nodes.concat(subtree.nodes);
      }

      if (firstX === undefined) {
        firstX = position.x + nodeWidth;
      }
      lastX = position.x + nodeWidth;
    });

    return {
      nodes: nodes,
      x: x,
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
          removeChildren = removeChildren || this.contentIsBranching(node);

          // If node: delete this node. If BQ: delete this node and its children
          let deleteIds;
          if (this.contentIsBranching(node)) {
            deleteIds = node.type.params.alternatives
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
              // node to be removed
              const deleteNode = newState.content[deleteId];

              // If node to be removed loops backwards or to itself, use default end scenario
              const successorIds = newState.content.map(node => node.nextContentId);
              let successorId = -1;
              if (deleteNode.nextContentId !== undefined && successorIds.indexOf(deleteNode.nextContentId) > successorIds.indexOf(deleteId)) {
                successorId = deleteNode.nextContentId;
              }

              // Exchange all links pointing to node to be deleted to its successor instead.
              newState.content.forEach(node => {
                const affectedNodes = (this.contentIsBranching(node)) ?
                  node.type.params.alternatives :
                  [node];

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
                if (this.contentIsBranching(deleteNode)) {
                  childrenIds = deleteNode.type.params.alternatives.map(alt => alt.nextContentId);
                }
                else {
                  childrenIds = [deleteNode.nextContentId];
                }
                childrenIds = childrenIds
                  .filter(id => id > deleteId - 1) // Ignore backlinks
                  .sort((a, b) => b - a); // Delete nodes with highest id first to account for node removal

                removeNode(childrenIds, true);
              }
            });
        });
      };

      if (prevState.placing === -1) {
        // Replace node
        const nextContentId = prevState.content[prevState.deleting].nextContentId;
        newState.content[prevState.deleting] = this.getNewContentParams();
        newState.content[prevState.deleting].nextContentId = nextContentId;
      }
      else if (prevState.deleting !== null || prevState.inserting !== null) {
        // Delete node
        const id = (prevState.inserting !== null) ? prevState.inserting : prevState.deleting;
        removeNode(id);
      }

      return newState;
    }, () => {
      this.props.onContentChanged(this.state.content);
    });
  }

  handleCancel = () => {
    this.setState({
      placing: null,
      deleting: null,
      editing: null,
      inserting: null
    });
  }

  componentDidUpdate() {
    // Center the tree
    if (this.treeWidth !== this.lastTreeWidth) {
      this.lastTreeWidth = this.treeWidth;
      this.refs.tree.style.marginLeft = '';
      const raw = this.refs.tree.getBoundingClientRect();
      this.refs.tree.style.marginLeft = ((raw.width - this.treeWidth) / 2) + 'px';
    }
  }

  /**
   * Add an element.
   *
   * @param {object} element - Element to add.
   */
  handlePushElement = (element) => {
    this.dropzones.push(element);
  }

  /**
   * Handle insertion of new data.
   *
   * @param {number} id - ID.
   */
  handleInserted = (id) => {
    this.setState({
      editing: id
    });
  }

  /**
   * Set reference to Editor Overlay DOM.
   *
   * @param {object} ref - Reference.
   */
  handleRef = ref => {
    this.setState({
      editorOverlay: ref
    });
  }

  handleContentChanged = (id, content) => {
    delete content.$form;
    this.setState(prevState => {
      prevState.content[id] = content;
    }, () => {this.props.onContentChanged(this.state.content);});
  }

  handleFormSaved = () => {
    this.setState({
      editing: null,
      inserting: null
    });
  }

  /**
   * Check form for validity.
   *
   * @return {boolean} True if valid form entries.
   */
  isValid () {
    var valid = true;
    var elementKids = this.props.main.children;
    for (var i = 0; i < elementKids.length; i++) {
      if (elementKids[i].validate() === false) {
        valid = false;
      }
    }
    return valid;
  }

  /**
   * Return data from the form to the callback function.
   *
   * @return {number} ContentId of saved interaction.
   */
  handleSaveData = (id, content) => {
    // Check if all required form fields can be validated
    if (!this.isValid()) {
      return;
    }

    this.handleContentChanged(id, content);
    this.handleFormSaved();

    return id;
  }

  /**
   * Convert camel case to kebab case.
   *
   * @param {string} camel - Camel case.
   * @return {string} Kebab case.
   */
  camelToKebab (camel) {
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

  // For debugging
  logNodes = caller => {
    console.log('NODES', caller);
    this.state.content.forEach((node, index) => {
      const target = (this.contentIsBranching(node)) ?
        node.type.params.alternatives.map(alt => alt.nextContentId).join(' | ') :
        node.nextContentId;
      console.log(`${index} --> ${target}`);
    });
    console.log('==========');
  }

  render() {
    this.dropzones = [];

    // Generate the tree
    const tree = this.renderTree(0);
    this.logNodes('render');
    this.treeWidth = tree.x;

    const interaction = this.state.content[this.state.editing];

    return (
      <div className="wrapper">

        { !! this.props.inserting &&
          <Draggable
            inserting={ this.props.inserting }
            ref={ element => this['draggable--1'] = element }
            width={ this.state.nodeSpecs.width }
            onMove={ () => this.handleMove(-1) }
            onDropped={ () => this.handleDropped(-1) }
            contentClass={ this.props.inserting.library.title.replace(/ +/g, '') }
            position={ this.props.inserting.position }
            onPlacing={ () => this.handlePlacing(-1) }
          >
            { this.props.inserting.library.title }
          </Draggable>
        }

        <div className="canvas">
          <div className="tree" ref={ 'tree' }>
            { tree.nodes }
          </div>
          { !tree.nodes.length &&
            <StartScreen
              handleClicked={ this.props.handleOpenTutorial }
            >
              { this.renderDropzone(-1, {
                x: 363.19, // TODO: Decide on spacing a better way?
                y: 130
              }) }
            </StartScreen>
          }
          { this.state.deleting !== null &&
            <ConfirmationDialog
              icon={ this.state.dialog.icon }
              confirmationHeader={ this.state.dialog.confirmationHeader }
              confirmationQuestion={ this.state.dialog.confirmationQuestion }
              confirmationDetails={ this.state.dialog.confirmationDetails }
              confirmationDetailsList={ this.state.dialog.confirmationDetailsList }
              textConfirm={ this.state.dialog.textConfirm }
              textCancel={ this.state.dialog.textCancel }
              handleConfirm={ this.state.dialog.handleConfirm }
              handleCancel={ this.state.dialog.handleCancel }
            />
          }
          { this.state.editing !== null &&
            <EditorOverlay
              id={ this.state.editing }
              content={ this.state.content }
              elementFields={ interaction !== 'undefined' ? this.props.getSemantics(interaction.type.library) : undefined }
              icon={ interaction !== 'undefined' ? `editor-overlay-icon-${this.camelToKebab(interaction.type.library.split('.')[1].split(' ')[0])}` : ''}
              onRef={ this.handleRef }
              onNextPathDrop={ this.handlePushElement }
              onFormSaved={ this.handleSaveData }
              onFormClosed={ this.handleDelete }
              main={ this.props.main }
              onContentChanged={ this.handleContentChanged }
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
  inserting: PropTypes.object
};
