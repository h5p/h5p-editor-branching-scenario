import React from 'react';
import PropTypes from 'prop-types';
import './Canvas.scss';
import StartScreen from './StartScreen.js';
import Draggable from './Draggable.js';
import Dropzone from './Dropzone.js';
import Content from './Content.js';
import ConfirmationDialog from './ConfirmationDialog.js';
import EditorOverlay from './EditorOverlay';
import QuickInfoMenu from './QuickInfoMenu';
import BlockInteractionOverlay from './BlockInteractionOverlay';

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
      },
      center: true,
      scale: 1.5
    };
  }

  componentDidMount() {
    // Trigger the initial default end scenarios count
    this.props.onContentChanged(null, this.countDefaultEndScenarios());
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
    if (Canvas.isBranching(this.state.content[id])) {
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
        deleting: id,
        dialog: this.buildDialog(id, this.l10n.dialogReplace)
      });
      this.props.onDropped();
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
  getParent = (id) => {
    return this.renderedNodes
      .slice(0, this.renderedNodes.indexOf(id)) // get all node IDs that were rendered on top
      .filter(candidate => candidate > -1) // except end scenarios
      .map(candidate => this.state.content[candidate]) // get nodes to IDs
      .filter(candidate => { // get all parents of the child
        if (Canvas.isBranching(candidate)) {
          return candidate.type.params.branchingQuestion.alternatives
            .some(alt => alt.nextContentId === id);
        }
        return candidate.nextContentId === id;
      })
      .slice(-1).pop(); // return the closest parent
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
        //dropzone.highlight(); TODO: Use state
      }
      else {
        //dropzone.dehighlight(); TODO: Use state
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
      this.props.onDropped();
      return;
    }

    // Dropzone with largest intersection
    const dropzone = intersections[0];

    // BranchingQuestion shall not be replacable by anything
    if (dropzone instanceof Content && dropzone.getContentClass() === 'BranchingQuestion') {
      this.setState({
        placing: null
      });
      return;
    }

    if (dropzone instanceof Content && !this.state.editing) {
      // Replace existing node
      this.handlePlacing(dropzone.props.id);
    }
    else if (!this.state.editing) {
      // Put new node or put existing node at new place
      const defaults = (draggable.props.inserting) ? draggable.props.inserting.defaults : undefined;

      // When moving nodes that leave empty alternatives, update those.
      if (id > -1) {
        const children = this.getChildrenIds(id);
        const parent = this.getParent(id);
        if (parent && Canvas.isBranching(parent) && children.length === 0) {
          parent.type.params.branchingQuestion.alternatives
            .filter(alt => alt.nextContentId === id)
            .forEach(alt => alt.nextContentId = -1);
        }
      }

      this.placeInTree(id, dropzone.props.nextContentId, dropzone.props.parent, dropzone.props.alternative, defaults);
    }
    else {
      // TODO: Check if this is still needed
      // Add next element in editor
      const parentId = this.state.editing;
      // Here we retrieve the content from EditorOverlay, because CKEditor changes are not caught
      this.handleFormSaved(this.state.editing, this.state.editorOverlay.state.content);
      if (parentId !== undefined) {
        this.placeInTree(id, dropzone.props.nextContentId, parentId, dropzone.props.alternative);
      }
    }
  }

  handleDropzoneClick = (nextContentId, parent, alternative, defaults) => {
    if (this.state.placing === null) {
      return;
    }
    this.placeInTree(this.state.placing, nextContentId, parent, alternative, defaults);
  }

  handleEditContent = (id) => {
    this.setState({
      editing: id
    });
  }

  /**
   * Copy content to clipboard.
   *
   * @param {number} id Content id.
   */
  handleCopyContent = (id) => {
    const clipboardItem = new H5P.ClipboardItem(this.state.content[id], 'type', 'H5PEditor.BranchingScenario');
    H5P.clipboardify(clipboardItem);
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
    return this.getChildrenIds(start, false)
      .sort((a, b) => a - b)
      .map(id => this.state.content[id].contentTitle || this.state.content[id].type.library);
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
    const node = this.state.content[start];
    let childrenIds = [];
    let nextIds = [];
    const nodeIsBranching = Canvas.isBranching(node);

    // Check for BQ inclusion and ignore very first start node
    if (sub && (!nodeIsBranching || nodeIsBranching && includeBranching)) {
      childrenIds.push(start);
    }

    // Get next nodes
    if (!nodeIsBranching) {
      nextIds = [node.nextContentId];
    }
    else {
      nextIds = node.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId);
    }

    nextIds
      .filter(id => id !== undefined && id > start) // id > start prevents loops
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
      contentTitle: this.state.library.name.split('.')[1], // TODO: There's probably a better default
      showContentTitle: false
    };
  }

  static isBranching(content) {
    return content.type.library.split(' ')[0] === 'H5P.BranchingQuestion';
  }

  /**
   * Removes any HTML from the given string.
   * @return {string}
   */
  static stripHTML(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  /**
   * Determines a useful tooltip for the content
   * @param {Object} content
   * @return {string}
   */
  static getTooltip(content) {
    switch (content.type.library.split(' ')[0]) {
      case 'H5P.AdvancedText':
        return Canvas.stripHTML(content.type.params.text);
      case 'H5P.BranchingQuestion':
        return (content.type.params.branchingQuestion
          && content.type.params.branchingQuestion.question)
          ? Canvas.stripHTML(content.type.params.branchingQuestion.question)
          : undefined;
      default:
        return content.type.metadata ? content.type.metadata.title : undefined;
    }
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
   *
   * @param {object} content Content node.
   * @param {number} id Id of child node.
   */
  attachChild = (content, nextContentId) => {
    if (nextContentId === undefined || nextContentId < 0) {
      nextContentId = -1;
    }
    if (Canvas.isBranching(content)) {
      if (content.type.params
        && content.type.params.branchingQuestion
        && content.type.params.branchingQuestion.alternatives
        && !content.type.params.branchingQuestion.alternatives.some(alt => alt.nextContentId === -1)
      ) {
        content.type.params.branchingQuestion.alternatives = (content.type.params.branchingQuestion.alternatives || []);
        content.type.params.branchingQuestion.alternatives.push({
          nextContentId: nextContentId
        });
      }
    }
    else {
      content.nextContentId = nextContentId;
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
  placeInTree(id, nextContentId, parent, alternative, defaults = {}) {
    this.setState(prevState => {
      let newState = {
        placing: null,
        editing: null,
        inserting: null,
        content: [...prevState.content],
      };

      defaults.specific = defaults.specific || {};

      // Handle inserting of new node
      if (id === -1) {
        newState.freshContent = true;
        const defaultParams = this.getNewContentParams();
        defaultParams.type.params = defaults.params || defaultParams.type.params;
        defaultParams.contentTitle = defaults.specific.contentTitle || defaultParams.contentTitle;
        newState.content.push(defaultParams);
        id = newState.content.length - 1;
        newState.editing = id;
        if (id === 0) {
          if (!Canvas.isBranching(newState.content[0])) {
            newState.content[0].nextContentId = -1; // Use default end scenario as default end scenario
          }
          // This is the first node added, nothing more needs to be done.
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

      const parentIsBranching = (parent && Canvas.isBranching(parent));

      const nextId = newState.content[id].nextContentId;

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

        if (Canvas.isBranching(content)) {
          var hasAlternatives = content.type.params
            && content.type.params.branchingQuestion
            && content.type.params.branchingQuestion.alternatives;
          if (hasAlternatives) {
            content.type.params.branchingQuestion.alternatives.forEach(alternative =>
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
          parent.type.params.branchingQuestion.alternatives[alternative].nextContentId = (id === 0 ? 1 : id);
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

      this.props.onDropped();
      return newState;
    });
  }

  renderDropzone(id, position, parent, num, parentIsBranching) {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }

    const defaults = (this.props.inserting) ? this.props.inserting.defaults : {};
    return ( !this.state.editing &&
      <Dropzone
        key={ ((id < 0) ? 'f-' + '-' + id + '/' + parent : id) + '-dz-' + num }
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
        onClick={ () => this.handleDropzoneClick(nextContentId, parent, num, defaults) }
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
        !content.type.params.branchingQuestion ||
        !content.type.params.branchingQuestion.alternatives ||
        !content.type.params.branchingQuestion.alternatives.length) {
      return; // No alternatives today
    }

    let children = [];
    content.type.params.branchingQuestion.alternatives.forEach(alternative => {
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

    const parentIsBranching = (parent !== undefined && Canvas.isBranching(this.state.content[parent]));

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
      const contentIsBranching = (content && Canvas.isBranching(content));

      // Determine if we have any children
      const children = (hasBeenDrawn ? null : (contentIsBranching ? this.getBranchingChildren(content) : (content ? [content.nextContentId] : null)));

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
        const libraryTitle = this.getLibraryTitle(content.type.library);
        if ((content.nextContentId !== undefined && content.nextContentId < 0 && content.nextContentId === this.props.highlight) || this.props.highlight === id) {
          highlightCurrentNode = true;
        }

        // Draw node
        nodes.push(
          <Content
            key={ id }
            id={ id }
            fade={ this.props.highlight !== null && !highlightCurrentNode }
            ref={ element => { this['draggable-' + id] = element; if (this.state.placing !== null && this.state.placing !== id) this.dropzones.push(element); } }
            position={ position }
            width={ this.state.nodeSpecs.width }
            onPlacing={ () => this.handlePlacing(id) }
            onMove={ () => this.handleMove(id) }
            onDropped={ () => this.handleDropped(id) }
            contentClass={ libraryTitle }
            onEditContent={ this.handleEditContent }
            onCopyContent={ this.handleCopyContent }
            onDeleteContent={ this.handleDeleteContent }
            disabled={ contentIsBranching }
            tooltip={ Canvas.getTooltip(content) }
            scale={ this.state.scale }
          >
            { libraryTitle }
          </Content>
        );
        drawAboveLine = true;
      }

      const nodeWidth = (content ? (this.state.nodeSpecs.width / 2) : 21); // Half width actually...
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
        content.type.params.branchingQuestion &&
        content.type.params.branchingQuestion.alternatives &&
        content.type.params.branchingQuestion.alternatives.length > 1) {
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
            left: (x + (children[0] < 0 ? this.state.dzSpecs.width / 2 : this.state.nodeSpecs.width / 2)) + 'px',
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

        let alternativeBallClasses = 'alternative-ball';
        if (!drawAboveLine) {
          if (id > -1) {
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
        if (this.props.highlight !== null && (this.props.highlight !== id || highlightCurrentNode)) {
          if (this.props.onlyThisBall === null || this.props.onlyThisBall !== key) {
            alternativeBallClasses += ' fade';
          }
        }

        nodes.push(
          <div key={ key }
            className={ alternativeBallClasses }
            aria-label={ 'Alternative ' + (num + 1) }
            onClick={ () => this.handleBallTouch(hasBeenDrawn ? id : -1, key) }
            style={ {
              left: (nodeCenter - (this.state.nodeSpecs.spacing.y * 0.75) - 1) + 'px',
              top: (position.y - aboveLineHeight - (this.state.nodeSpecs.spacing.y * 1.5)) + 'px'
            } }>A{ num + 1 }
            <div className="dark-tooltip">
              <div className="dark-text-wrap">{ this.state.content[parent].type.params.branchingQuestion.alternatives[num].text }</div>
            </div>
          </div>
        );

        // Add dropzone under empty BQ alternative
        if (this.state.placing !== null && !content) {
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
        if (this.state.placing !== parent) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y - this.state.dzSpecs.height - dzDistance // for fixed tree
            // y: position.y - 42 - dzDistance - ((id === 0) ? (42 / 2) : 0) // for expandable tree
          }, parentIsBranching ? parent : undefined, parentIsBranching ? num : 0, parentIsBranching));
        }

        // Add dropzone below if there's no subtree
        if (content && (!subtree || !subtree.nodes.length)) {
          nodes.push(this.renderDropzone(id, {
            x: nodeCenter - (this.state.dzSpecs.width / 2),
            y: position.y + (this.state.nodeSpecs.spacing.y * 2) + dzDistance + ((this.state.placing === parent) ? (this.state.dzSpecs.height / 2) : 0)
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
          removeChildren = removeChildren || Canvas.isBranching(node);

          // If node: delete this node. If BQ: delete this node and its children
          let deleteIds;
          if (Canvas.isBranching(node)) {
            deleteIds = node.type.params.branchingQuestion.alternatives
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
                const affectedNodes = (Canvas.isBranching(node)) ?
                  node.type.params.branchingQuestion.alternatives :
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
                if (Canvas.isBranching(deleteNode)) {
                  childrenIds = deleteNode.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId);
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
        newState.editing = prevState.deleting;
      }
      else if (prevState.editing !== null && prevState.freshContent === true || prevState.deleting !== null) {
        // Delete node
        removeNode(prevState.editing !== null ? prevState.editing : prevState.deleting);
      }

      return newState;
    }, this.contentChanged);
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
    if (this.state.center && this.refs.tree && this['draggable-1']) {
      const center = (this.refs.treewrap.getBoundingClientRect().width / 2) - ((this.state.nodeSpecs.width * this.state.scale) / 2);
      this.setState({
        center: false,
        panning: {
          x: (center - (this['draggable-0'].props.position.x * this.state.scale)),
          y: 0
        }
      });
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
    }, this.contentChanged);
  }

  handleFormSaved = () => {
    this.setState({
      editing: null,
      inserting: null
    });
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
      if (Canvas.isBranching(content)) {
        content.type.params.branchingQuestion.alternatives.forEach(alternative => {
          if (alternative.nextContentId === -1) {
            numMissingEndScenarios++;
          }
        });
      }
      else if (content.nextContentId === -1) {
        numMissingEndScenarios++;
      }
    });
    return numMissingEndScenarios;
  }

  /**
   * Trigger callbacks after the content state has changed
   */
  contentChanged = () => {
    this.props.onContentChanged(this.state.content, this.countDefaultEndScenarios());
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

  panningLimits = (position) => {
    // Limits, you have to have them
    const treewrapRect = this.refs.treewrap.getBoundingClientRect();
    const treeRect = this.refs.tree.getBoundingClientRect();

    const wideLoad = (treeRect.width > treewrapRect.width);
    const highLoad = (treeRect.height > treewrapRect.height);

    const padding = (this.state.scale * 64); // Allow exceeding by this much

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

      // Stop click-to-place placing
      if (this.state.placing !== null && this.state.deleting === null) {
        this.setState({
          placing: null
        });
      }
    }

    this.props.onDropped();
  }

  // For debugging
  logNodes = caller => {
    console.log('NODES', caller);
    this.state.content.forEach((node, index) => {
      const target = (Canvas.isBranching(node)) ?
        (node.type.params.branchingQuestion && node.type.params.branchingQuestion.alternatives ?
          node.type.params.branchingQuestion.alternatives.map(alt => alt.nextContentId).join(' | ') :
          -1) : node.nextContentId;
      console.log(`${index} --> ${target}`);
    });
    console.log('==========');
    console.log('d:', this.state.deleting, 'e:',this.state.editing, 'i:', this.state.inserting, 'p:', this.state.placing);
    console.warn(this.state.content);
  }

  render() {
    this.dropzones = [];

    // Generate the tree
    const tree = this.renderTree(0);

    // Usful for debugging tree rendering
    // this.logNodes('render');

    const interaction = this.state.content[this.state.editing];

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
            onMove={ () => this.handleMove(-1) }
            onDropped={ () => this.handleDropped(-1) }
            contentClass={ this.props.inserting.library.title.replace(/ +/g, '') }
            position={ this.props.inserting.position }
            onPlacing={ () => this.handlePlacing(-1) }
            scale={ this.state.scale }
          >
            { this.props.inserting.library.title }
          </Content>
        }
        <div className="canvas">
          <Draggable
            ref={ 'treewrap' }
            className={ 'treewrap' + (this.props.highlight !== null ? ' dark' : '') }
            position={ this.state.panning }
            limits={ this.panningLimits }
            onMoved={ this.handleMoved }
            onStopped={ this.handleStopped }
          >
            <div
              className="nodetree"
              ref={ 'tree' }
              style={ {
                width: tree.x + 'px',
                height: tree.y + 'px',
                transform: 'translate(' + this.state.panning.x + 'px,' + this.state.panning.y + 'px) scale(' + this.state.scale + ',' + this.state.scale + ')'
              } }
            >
              { tree.nodes }
            </div>
          </Draggable>
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
              icon={ this.state.dialog.icon } // TODO: Just send the whole dialog object? Should probably be improved when the l10n is being fixed.
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
  inserting: PropTypes.object,
  highlight: PropTypes.number,
  onlyThisBall: PropTypes.string
};
