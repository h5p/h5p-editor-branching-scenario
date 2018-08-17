import React from 'react';
import PropTypes from 'prop-types';
import './Canvas.scss';
import StartScreen from './StartScreen.js';
import Draggable from './Draggable.js';
import Dropzone from './Dropzone.js';
import ConfirmationDialog from './ConfirmationDialog.js';
import EditorOverlay from './EditorOverlay';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);

    // TODO: Should be passed by app
    this.l10n = {};
    this.l10n.dialogDelete = {
      icon: 'icon-delete',
      confirmationHeader: 'Delete Question',
      confirmationQuestion: 'Are you sure you want to delete this content?',
      confirmationDetailsNO: 'You will lose the question, but all its children will be attached to the previous content/alternative.',
      confirmationDetailsBQ: 'If you proceed, you will lose all the content attached to this contents alternatives:',
      textConfirm: 'Delete',
      textCancel: 'Cancel'
    }

    this.state = {
      clickHandeled: false,
      placing: null,
      deleting: null,
      inserting: null,
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
      dialogDeleteDetails: this.l10n.dialogDelete.confirmationDetailsNO
    };
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

  handleDocumentClick = () => {
    if (this.state.clickHandeled) {
      this.setState({
        clickHandeled: false
      });
    }
    else if (this.state.placing !== null) {
      this.setState({
        placing: null
      });
    }
  }

  handlePlacing = (id) => {
    if (this.state.placing !== null && this.state.placing !== id) {
      // Try to replace
      this.setState({
        clickHandeled: true,
        deleting: id  // TODO: Not if DZ is a BQ
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

  handleMove = (id) => {
    const draggable = this['draggable-' + id];
    const points = draggable.getPoints();
    this.dropzones.forEach(dropzone => {
      if (!dropzone || dropzone === draggable) {
        return; // Skip
      }

      if (dropzone.overlap(points)) {
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
    const points = draggable.getPoints();
    if (!this.dropzones.some(dropzone => {
      if (!dropzone || dropzone === draggable) {
        return; // Skip
      }

      if (dropzone.overlap(points)) {
        // Replace existing node
        if (dropzone instanceof Draggable && !this.state.editorOverlayVisible) {
          this.setState({
            deleting: dropzone.props.id // TODO: Not if DZ is a BQ
          });
        }
        else if (!this.state.editorOverlayVisible) {
          // New node position
          this.placeInTree(id, dropzone.props.nextContentId, dropzone.props.parent, dropzone.props.alternative);
        }
        else {
          // Add next element in editor
          const parentId = this.state.editorOverlay.handleSaveData(); // TODO: This should probably be done here
          if (parentId !== undefined) {
            this.placeInTree(id, dropzone.props.nextContentId, parentId, dropzone.props.alternative);
          }
        }
        return true;
      }
    })) {
      this.setState({
        placing: null
      });
    }
  }

  handleDropzoneClick = (nextContentId, parent, alternative) => {
    if (this.state.placing === null) {
      return;
    }

    this.placeInTree(this.state.placing, nextContentId, parent, alternative);
  }

  handleEditContent = (id) => {
    this.openEditor(id, this.state.content[id]);
  }

  handleDeleteContent = (id) => {
    let deleteDetails;
    let deleteDetailsList;
    if (this.contentIsBranching(this.state.content[id])) {
      const nodeTitles = this.getChildrenTitles(id)
        .map((title, index) => <li key={index}>{title}</li>);

      deleteDetails = this.l10n.dialogDelete.confirmationDetailsBQ;
      deleteDetailsList = nodeTitles;
    }
    else {
      deleteDetails = this.l10n.dialogDelete.confirmationDetailsNO;
    }

    this.setState({
      deleting: id,
      dialogDeleteDetails: deleteDetails,
      dialogDeleteDetailsList: deleteDetailsList
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
   * @param {number} nextContentId
   * @param {number} parent
   * @param {number} alternative
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
      // TODO: Make as solution for Branching Question?

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
        newState.content[id].nextContentId = (nextContentId < 0 ? undefined : nextContentId);
      }

      return newState;
    }, () => {
      if (this.state.inserting === null || this.state.deleting !== null) {
        return;
      }
      this.handleInserted(this.state.content[this.state.inserting]);
    });
  }

  /**
   * Get Id of element. It's set implicitly by the position in the array.
   *
   * @param {object} contentItem - item to check for.
   * @return {number} position or -1.
   */
  handleNeedNodeId = (contentItem) => {
    return this.state.content.indexOf(contentItem);
  }

  renderDropzone(id, position, parent, num, parentIsBranching) {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }
    return ( !this.state.editorOverlayVisible &&
      <Dropzone
        key={ (id === -1 ? 'f' : (id === -2 ? 'a' + parent : id)) + '-dz-' + num} // TODO: Fix unique id
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

  getBranchingChildren(content) {
    if (!content.type || !content.type.params ||
        !content.type.params.alternatives ||
        !content.type.params.alternatives.length) {
      return; // No alternatives today
    }

    let children = [];
    content.type.params.alternatives.forEach(alternative => {
      if (alternative.nextContentId === -1) {
        children.push(-1); // End screen
      }
      else if (alternative.nextContentId === undefined || this.state.content[alternative.nextContentId] === undefined) {
        children.push(-2); // Empty alternative
      }
      else {
        children.push(alternative.nextContentId); // Other question
      }
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
      if (renderedNodes.indexOf(id) !== -1) {
        console.warn(`Node ${id} was already rendered. Skipping it.`)
        return; // Already rendered (cycle)
      }
      const emptyAlternative = (parentIsBranching && id === -2); // -1 = end screen, -2 = empty
      const content = this.state.content[id];
      if (!content && !emptyAlternative) {
        return; // Does not exist, simply skip.
      }

      // Add vertical spacing for each level
      const branchY = y + ((parentIsBranching ? 8 : 5.5) * this.state.nodeSpecs.spacing.y); // *2 for the element itself

      // Determine if we are or parent is a branching question
      const contentIsBranching = (content && content.type.library.split(' ')[0] === 'H5P.BranchingQuestion');

      // Determine if we have any children
      const children = (contentIsBranching ? this.getBranchingChildren(content) : (content ? content.nextContentId : null));

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

      if (content) {
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
      }

      // Add vertical line above (except for top node)
      const aboveLineHeight = this.state.nodeSpecs.spacing.y * 3.5; // *3.5 = enough room for DZ
      const nodeWidth = (content ? (this.state.nodeSpecs.width / 2) : 21); // Half width actually...
      const nodeCenter = position.x + nodeWidth;
      if (content && id !== 0) {
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
        nodes.push(
          <div key={ parent + '-abox-' + num } className="alternative-ball" style={ {
            left: (nodeCenter - (this.state.nodeSpecs.spacing.y * 0.75) + 1) + 'px',
            top: (position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * 1.5)) + 'px'
          } }>A{ num + 1 }</div>
        );
      }

      // Add dropzones when placing, except for below the one being moved
      if (this.state.placing !== null && this.state.placing !== id) {
        const dzDistance = ((aboveLineHeight - 42) / 2);

        // TODO: Only render leafs when placing BQ, or add existing structure to BQ alternative?

        // Add dropzone above
        if (this.state.placing !== parent) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (42 / 2), // 42 = size of DZ  TODO: Get from somewhere?
            y: position.y - 42 - dzDistance
          }, parentIsBranching ? parent : undefined, parentIsBranching ? num : 0, parentIsBranching));
        }

        // Add dropzone below if there's no subtree
        if (content && (!subtree || !subtree.nodes.length)) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (42 / 2), // 42 = size of DZ  TODO: Get from somewhere?
            y: position.y + (this.state.nodeSpecs.spacing.y * 2) + dzDistance
          }, id, 1));
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

  /**
   * Toggle the editor overlay.
   *
   * @param {boolean} visibility - Override visibility toggling.
   */
  toggleEditorOverlay = (visibility) => {
    this.setState((prevState) => {
      return {
        editorOverlayVisible: visibility || !prevState.editorOverlayVisible
      };
    });
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
            deleteIds = node.type.params.alternatives.map(alt => alt.nextContentId).concat(id);
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

              // If node to be removed loops backwards or to itself, don't save the link
              const successorId = (deleteNode.nextContentId > deleteId) ? deleteNode.nextContentId : undefined;

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
      }

      const id = (this.state.placing !== null) ? this.state.placing :
        ((this.state.inserting !== null) ? this.state.inserting : this.state.deleting);

      removeNode(id);

      return newState;
    });
  }

  handleCancel = () => {
    this.setState({
      placing: null,
      deleting: null
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
   * @param {object} data - New data.
   */
  handleInserted = (data) => {
    this.openEditor(this.state.inserting, data, {state: 'new'});
  }

  /**
   * Open editor.
   *
   * @param {number} contentId - ContentId.
   * @param {object} data - Data.
   * @param {object} params - Params.
   */
  openEditor = (contentId, data, params) => {
    if (data) {
      data.$form = H5P.jQuery('<div/>');
      // TODO: Check why process SemanticsChunk crashes here with CoursePresentation
      // TODO: Instead of updating an existing form, create a new one and destroy it after it was used
      this.state.editorOverlay.updateForm(contentId, data, this.props.getSemantics(data.type.library), params);
      this.toggleEditorOverlay(true);
    }

    this.props.onOpenEditor(null);
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

  handleContentChanged = (contentId, nextContentId) => {
    this.setState(prevState => {
      prevState.content[contentId].nextContentId = nextContentId;
    }, () => {this.props.onContentChanged(this.state.content);});
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
    console.log(`Trace: ${this.traceBranch(0)
      .map(id => (typeof id === 'number') ? `${id} (${this.state.content[id].contentTitle})` : id)
      .join(' --> ')}`);
    console.log('==========');
  }

  // For debugging
  traceBranch = (start=0, done=[]) => {
    if (this.state.content.length === 0) {
      return done;
    }
    done.push(start);

    const node = this.state.content[start];

    const nextIds = (this.contentIsBranching(node)) ? node.type.params.alternatives.map(alt => alt.nextContentId) : [node.nextContentId];

    nextIds.forEach(nextId => {
      if (nextId !== undefined && nextId > -1) {
        if (done.indexOf(nextId) === -1) {
          return this.traceBranch(nextId, done);
        }
        done.push(`(${nextId})`)
      }
      return done;
    });

    return done;
  }

  render() {
    this.dropzones = [];

    // Generate the tree
    const tree = this.renderTree(0);
    this.logNodes('render');
    this.treeWidth = tree.x;

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
              handleClicked={ this.props.navigateToTutorial }
            >
              { this.renderDropzone(-1, {
                x: 363.19, // TODO: Decide on spacing a better way?
                y: 130
              }) }
            </StartScreen>
          }
          { this.state.deleting !== null &&
            <ConfirmationDialog
              icon={ this.l10n.dialogDelete.icon }
              confirmationHeader={ this.l10n.dialogDelete.confirmationHeader }
              confirmationQuestion={ this.l10n.dialogDelete.confirmationQuestion }
              confirmationDetails={ this.state.dialogDeleteDetails }
              confirmationDetailsList={ this.state.dialogDeleteDetailsList }
              textConfirm= { this.l10n.dialogDelete.textConfirm }
              textCancel={ this.l10n.dialogDelete.textCancel }
              handleConfirm={ this.handleDelete }
              handleCancel={ this.handleCancel }
            />
          }
          <EditorOverlay // TODO: It's quite difficult to see which content the overlay is being displayed for
            onRef={ this.handleRef }
            visibility={ this.state.editorOverlayVisible }
            editorContents={ this.state.editorContents }
            form={{}}
            onNextPathDrop={ this.handlePushElement }
            handleNeedNodeId={ this.handleNeedNodeId }
            closeForm={ this.toggleEditorOverlay }
            onRemoveData={ this.handleDelete }
            main={ this.props.main }
            content={ this.state.content }
            onContentChanged={ this.handleContentChanged }
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
