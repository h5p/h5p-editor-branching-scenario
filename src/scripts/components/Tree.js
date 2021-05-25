import React from 'react';
import PropTypes from 'prop-types';
import {t} from '../helpers/translate';
import Content from './Content.js';
import Dropzone from './Dropzone.js';
import { isBranching, getBranchingChildren } from '../helpers/Library';

export default class Tree extends React.Component {
  constructor(props) {
    super(props);

    this.dzSpecs = {
      width: 42,
      height: 32
    };

    this.tips = {
      newContentTypeId: null,
      currentContentTypeId: null
    };
  }

  /**
   * Create the intial layout of the tree to make the rendering of a beautiful
   * tree possible.
   *
   * @param {number} id Node identifier (content array index)
   * @param {number} y Depth level
   * @return {Object} Complete tree layout
   */
  createTreeLayout = () => {
    // Reset trackers

    // Keeps track of the horizontal space used on each row
    this.xs = [];

    // Ensure each node is only rendered once (additionals are loops)
    this.processed = [];

    // Create root branch
    return this.createBranch(0, 0, 1);
  }

  /**
   * Determines if the given id has already been processed.
   *
   * @param {number} id if content
   * @return {boolean}
   */
  isAlreadyProcessed = (id) => {
    return (this.processed.indexOf(id) !== -1);
  }

  /**
   * Create the layout for one of the tree's branches.
   * Determines relative position and beauty modifiers.
   *
   * @param {number} id Node identifier (content array index)
   * @param {number} y Depth level
   * @param {number} height Of the current level (BQ uses 2x)
   * @return {Object} Complete branch layout
   */
  createBranch = (id, y, height) => {
    if (id === undefined || id < 0 || !this.props.content[id]) {
      // Reserve space for empty alterantive
      return this.createNode(null, y, height);
    }
    else if (this.isAlreadyProcessed(id)) {
      // Reserve space for loop alterantive
      return this.createNode(id, y, height, true);
    }
    this.processed.push(id); // Mark as processed

    const content = this.props.content[id];
    const contentIsBranching = isBranching(content);
    const children = this.getChildren(content, contentIsBranching);
    const branch = this.createNode(id, y, height);

    // Loop through children
    for (let i = 0; i < children.length; i++) {
      if ((children[i] === undefined || children[i] < 0) && !contentIsBranching) {
        continue; // Do not reserve for leaf nodes, only alternatives
      }

      // and create sub-branches
      const subBranch = this.createBranch(children[i], y + height, (contentIsBranching ? 2 : 1));

      // Skip empty and content sub-branches that are only loops to save processing
      const isLoopAfterContent = (!contentIsBranching && subBranch && subBranch.loop);
      if (!isLoopAfterContent && subBranch) {
        // stored in an hierarchy for easy rendering
        branch.children.push(subBranch);

        // Keep track of parent + sibling number (makes rendering easier)
        subBranch.parent = branch.id;
        subBranch.num = i;

        // Move previous siblings close to close gaps in the tree after centering
        this.movePreviousSiblingsLeft(branch, i, subBranch.beautyModifier);
      }
    }

    // Determine necessary offset to make the parent + subtree center on top of each other
    this.determineBeautyModifier(branch);

    return branch;
  }

  /**
   * Grab the children for the given content id.
   * @return {Array}
   */
  getChildren = (content, contentIsBranching) => {
    let children = contentIsBranching ? getBranchingChildren(content) : [content.params.nextContentId];
    if (!children) {
      children = [];
    }
    return children;
  }

  /**
   * Create an object to keep track of each tree node and its properties.
   * Will automatically assign the next available position in the tree layout.
   *
   * @param {number} id
   * @param {number} y
   * @param {number} height
   * @param {boolean} loop
   * @return {Object}
   */
  createNode = (id, y, height, loop) => {
    let x = 0;
    y = y + height;
    for (let i = 0; i < height; i++) {
      if (this.xs[y - i] === undefined) {
        this.xs[y - i] = 0; // The start of a new row
      }
      if (this.xs[y - i] > x) {
        x = this.xs[y - i]; // Use the largest row
      }
    }

    const node = {
      id: id,
      x: x,
      y: y,
      children: [],
      beautyModifier: 0,
      parent: null,
      num: 0, // Sibling number
      loop: !!loop,
      isBranching: (id !== null && isBranching(this.props.content[id]))
    };

    // Increase row width
    for (let i = 0; i < height; i++) {
      this.xs[y - i] = x + this.getNodeWidth(node);
    }

    return node;
  }

  /**
   * Close gaps in the tree caused by centering parents.
   * Works by reference
   *
   * @param {Object} branch Current branch
   * @param {number} index Current child index
   * @param {number} modifier The beauty modifier compensation
   */
  movePreviousSiblingsLeft = (branch, index, modifier) => {
    if (modifier < 0) {
      for (let i = 1; i <= index; i++) {
        const prev = branch.children[index - i];
        if (!prev || prev.beautyModifier) {
          break; // Stop if prev sibling already is beautiful.
        }
        else {
          prev.beautyModifier = modifier;
        }
      }
    }
  }

  /**
   * Determine necessary offset to make the parent and subtree center on top
   * of each other. Works by reference.
   *
   * Negative modifier value = move parent to the right by this amount
   * Positive modifier value = move entire subtree to the right by this amount
   *
   * @param {Object} branch Current branch
   */
  determineBeautyModifier = (branch) => {
    if (branch.children.length) {
      const firstChild = branch.children[0];
      const lastChild = branch.children[branch.children.length - 1];
      let offset = ((lastChild.x + this.getNodeWidth(lastChild)) - firstChild.x);
      if (offset) {
        offset = (offset / 2) - 0.5;
      }
      offset += firstChild.x;
      if (firstChild.beautyModifier < 0) {
        // Compensate for centering
        offset -= firstChild.beautyModifier;
      }
      branch.beautyModifier = (branch.x - offset);
    }
  }

  /**
   * Render DOM elements for the whole tree layout.
   *
   * @param {Object} layout
   * @return {Object} size
   */
  renderTree = (layout) => {
    // Use global context to keep track of x indentation
    this.xs = [];

    // Use global context to keep track of all the nodes for rendering
    this.nodes = [];

    // Render the root branch
    const tree = this.createPosition(this.renderBranch(layout, 0));
    tree.nodes = this.nodes;

    return tree;
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {Object} branch
   * @param {numnber} extraBeauty Comes from our parent and is use to move the whole sub-tree
   * @param {boolean} parentIsBranching
   * @return {Object} size
   */
  renderBranch = (branch, extraBeauty, parentIsBranching) => {
    this.applyBeautyModifiers(branch, extraBeauty);

    // Keep track of indentation space per depth level
    const beautyModifier = this.updateIndentation(branch, parentIsBranching);

    const size = this.createSize(branch);
    for (let i = 0; i < branch.children.length; i++) {
      const subBeauty = (branch.beautyModifier > 0 ? branch.beautyModifier : 0);
      const subSize = this.renderBranch(branch.children[i], subBeauty + extraBeauty + beautyModifier, branch.isBranching);

      // Keep track of the total size of the branch
      this.updateSize(size, subSize);
    }

    // Center parent in case the sub-tree was moved
    this.centerParent(branch);

    this.renderNode(branch);
    return size;
  }

  /**
   * Center parent or sub-tree to get a nice looking tree. Works by reference.
   *
   * @param {Object} branch
   * @param {number} extraBeauty
   */
  applyBeautyModifiers = (branch, extraBeauty) => {
    // Center the whole subtree under the parent
    branch.x += extraBeauty;

    if (branch.beautyModifier < 0) {
      // Center parent above subtree
      branch.x -= branch.beautyModifier;
    }
  }

  /**
   * Avoid overlapping between sub-trees. Works by reference.
   *
   * @param {Object} branch
   * @param {boolean} parentIsBranching
   * @return {number} Beauty change for children
   */
  updateIndentation = (branch, parentIsBranching) => {
    let change = 0;
    if (this.xs[branch.y] !== undefined && branch.x < this.xs[branch.y]) {
      change = this.xs[branch.y] - branch.x;
      branch.x = this.xs[branch.y];
    }

    // Must do previous level for branchings
    if (parentIsBranching && this.xs[branch.y - 1] !== undefined && branch.x < this.xs[branch.y - 1]) {
      change += this.xs[branch.y - 1] - branch.x;
      branch.x = this.xs[branch.y - 1];
    }

    this.xs[branch.y] = branch.x + this.getNodeWidth(branch);
    if (parentIsBranching) {
      this.xs[branch.y - 1] = this.xs[branch.y];
    }
    return change;
  }

  /**
   * Updates the branch size if the sub-tree is larger. Works by reference.
   *
   * @param {Object} size
   * @param {Object} subSize
   */
  updateSize = (size, subSize) => {
    if (subSize.x > size.x) {
      size.x = subSize.x;
    }
    if (subSize.y > size.y) {
      size.y = subSize.y;
    }
    size.beautyModifier += subSize.beautyModifier;
  }

  /**
   * Center parent above children (not sub-tree). Works by reference.
   *
   * @param {Object} branch
   */
  centerParent = (branch) => {
    if (branch.children.length) {
      const firstChild = branch.children[0];
      const lastChild = branch.children[branch.children.length - 1];
      let offset = ((lastChild.x + this.getNodeWidth(lastChild)) - firstChild.x);
      if (offset) {
        offset = (offset / 2) - 0.5;
      }
      offset += firstChild.x;
      branch.x = offset;
      this.xs[branch.y] = branch.x + 1;
    }
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {Object} branch
   * @return {Object} x,y
   */
  renderNode = (branch) => {
    if (branch.id === null || branch.loop) {
      return; // Prevent rendering nodes for empty alternatives and loops
    }

    const content = this.props.content[branch.id];
    const contentIsBranching = branch.isBranching;
    const isQuestionNode = content.params.type.library.split(' ')[0] === "H5P.BranchingQuestion";

    // When a node is moved and the previous parent is now the final node, Ensure it gets counted in end scenario counter
    if(content.params.nextContentId === undefined && !isQuestionNode) {
      content.params.nextContentId = -1;
    }

    // Determine position of node
    const position = this.createPosition(branch);

    const label = Content.getTooltip(this.props.content[branch.id]);
    const hasLoop = (!branch.children.length && content.params.nextContentId >= 0);

    const hasCustomFeedback = !contentIsBranching && this.hasCustomFeedback(content);
    const isDropzone = this.isPlacing() && !(contentIsBranching && this.isPlacingNewBranching());

    let fade = (this.props.highlight !== null);
    if (this.props.onlyThisBall !== null && (this.props.highlight === branch.id || this.props.onlyThisBall === branch.id)) {
      fade = false; // Highlighing this content
    }
    if (this.props.highlight === -1
      && content.params.nextContentId === -1
      && !hasCustomFeedback
      && !isQuestionNode) {
      fade = false; // Highlighing default endings
    }

    this.nodes.push(
      <Content
        key={ branch.id }
        id={ branch.id }
        fade={ fade }
        ref={ element => {
          this['draggable-' + branch.id] = element;
          if (isDropzone) {
            // This node is also a dropzone for replacing it
            this.props.dropzones.push(element);
          }
        } }
        position={ position }
        width={ this.props.nodeSize.width }
        selected={ this.props.placing === branch.id }
        onPlacing={ () => this.props.onPlacing(branch.id) }
        onMove={ () => this.handleMove(branch.id, this['draggable-' + branch.id]) }
        onDropped={ () => this.handleDropped(branch.id, this['draggable-' + branch.id]) }
        draggableMouseOver={ (id) => {
          this.props.draggableMouseOver(id);
          this.props.onMouseOver(branch.id);
        }}
        draggableMouseOut={ () => {
          this.props.draggableMouseOut();
          this.props.onMouseOut();
        }}
        draggableHovered={this.props.draggableHovered}
        contentClass={ this.getClassName(branch.id) }
        onEdit={ () => this.props.onEdit(branch.id) }
        onHighlight={ () => this.props.onHighlight(this.tips.newContentTypeId, this.tips.currentContentTypeId) }
        onPreview={ () => this.props.onPreview(branch.id) }
        onCopy={ () => this.props.onCopy(branch.id) }
        onDelete={ () => this.props.onDelete(branch.id) }
        disabled={ this.isPlacing() ? !isDropzone : contentIsBranching }
        tooltip={ label }
        scale={ this.props.scale }
        hasCustomEndScreen={ hasCustomFeedback && content.params.nextContentId === -1 }
        hasLoopBack={ hasLoop }
        highlightLinkedContent={ () => {
          if (content.params.nextContentId > -1) {
            this.props.onHighlightLoop(content.params.nextContentId, branch.id);
          }
        } }
      >
        { label }
      </Content>
    );

    // Use for drawing lines and dropzones relative to the node's center
    const nodeCenter = position.x + (this.props.nodeSize.width / 2);
    const verticalNodeSpacing = (this.props.nodeSize.spacing.y + this.dzSpecs.height);

    // Add vertical line above all except first node
    if (branch.id !== 0) {
      this.renderLine('vertical', branch.id + '-vabove', verticalNodeSpacing - 3, nodeCenter - 1, position.y - verticalNodeSpacing);
    }

    if (contentIsBranching) {
      // Add vertical line below Branching Questions
      this.renderLine('vertical', branch.id + '-vbelow', verticalNodeSpacing, nodeCenter - 1, position.y + this.props.nodeSize.height - 1);
      // Add alterantive balls
      const size = this.renderAlternativeBalls(branch);
      // Add horizontal line between first and line alternative
      this.renderLine('horizontal', branch.id + '-hbelow', size.lastX - size.firstX + 2, size.firstX + 13, position.y + this.props.nodeSize.height + verticalNodeSpacing - 1);
    }

    // Add dropzones when placing, except for below the one being moved and for end scenarios
    if (this.isPlacing() && !this.isPlacing(branch.id)) {

      // Add dropzone above
      if (!this.isPlacing(branch.parent)) {
        const parent = (branch.parent ? this.props.content[branch.parent] : null);
        const parentIsBranching = (parent && isBranching(parent));

        this.renderDropzone(branch.id,
          nodeCenter - (this.dzSpecs.width / 2),
          position.y - verticalNodeSpacing + (this.props.nodeSize.spacing.y / 2) - 2,
          parentIsBranching ? parent : undefined, branch.num, parentIsBranching);
      }

      // Add dropzone below if there's no subtree (or BQ implicitly with no alternatives)
      if (!contentIsBranching && !branch.children.length) {
        this.renderDropzone(branch.id,
          nodeCenter - (this.dzSpecs.width / 2),
          position.y + this.props.nodeSize.height + (this.props.nodeSize.spacing.y / 2) - 2,
          branch.id, branch.num + 1);
      }
    }
  }

  /**
   * Draw a vertical line.
   *
   * @param {string} type 'vertical' or 'horizontal'
   * @param {string} key
   * @param {number} size
   * @param {number} x
   * @param {number} y
   */
  renderLine = (type, key, size, x, y) => {
    const style = {
      left: x + 'px',
      top: y + 'px'
    };
    style[type === 'vertical' ? 'height' : 'width'] = size + 'px';
    this.nodes.push(
      <div key={ key } className={ type + '-line' + (this.props.highlight !== null ? ' fade' : '') } style={ style }/>
    );
  }

  /**
   * Help render a dropzone.
   *
   * @param {number} id
   * @param {number} x
   * @param {number} y
   * @param {Object} parent
   * @param {number} num Sibling number
   * @param {boolean} parentIsBranching
   */
  renderDropzone = (id, x, y, parent, num, parentIsBranching) => {
    const nextContentId = (parent === undefined || parentIsBranching) ? id : undefined;
    if (num === undefined) {
      num = 0;
    }

    const isInitial = (id === -9); // -9 is a special case for the first drop zone since it behaves a bit differently
    this.nodes.push(
      <Dropzone
        key={ ((id < 0) ? 'f-' + '-' + id + '/' + parent : id) + '-dz-' + num }
        ref={ element => { if (isInitial) { this.initialDropzone = element; } this.props.dropzones.push(element); } }
        nextContentId={ nextContentId }
        parent={ parent }
        alternative={ num }
        position={ {x: x, y: y} }
        elementClass={ 'dropzone' + (isInitial && !this.props.inserting ? ' disabled' : '') }
        style={ {
          left: x + 'px',
          top: y + 'px'
        } }
        onMouseOver={ () => this.props.onDropzoneHighlight(id) }
        onMouseOut={ () => this.props.onFocus() }
        onFocus={ () => this.props.onDropzoneHighlight(id) }
        onClick={ () => this.props.onDropzoneClick(nextContentId, parent, num) }
      />
    );
  }

  /**
   * Draw the blue balls for each branching alternative.
   *
   * @param {Object} branch
   * @return {number} width
   */
  renderAlternativeBalls = (branch) => {
    const alternatives = this.props.content[branch.id].params.type.params.branchingQuestion.alternatives;
    let firstX = 0;
    let lastX = 0;

    for (let i = 0; i < branch.children.length; i++) {
      // The child branch
      const node = branch.children[i];
      const isEmpty = (node.id === null);

      // React key
      const key = branch.id + '-abox-' + i;
      const text = alternatives[i].text;

      const hasCustomFeedback = this.hasCustomFeedback(alternatives[i]);

      let fade = (this.props.highlight !== null);
      let className = 'alternative-ball';
      if (node.loop) {
        className += ' loop';
      }
      else if (isEmpty) {
        if (hasCustomFeedback) {
          className += ' endscreenCustom';
        }
        else {
          className += ' endscreen';
          if (this.props.highlight === -1) {
            fade = false; // Highlighing default endings
          }
        }
      }
      if (this.props.onlyThisBall === key) {
        fade = false; // Highlighing a link
      }
      if (fade) {
        className += ' fade'; // Not highlighing this item
      }

      // Determine position later used for size
      const position = this.createPosition(branch.children[i], 0, -1);

      lastX = (position.x + ((isEmpty || node.loop ? this.dzSpecs.width : this.props.nodeSize.width) / 2) - 14);
      if (!firstX) {
        firstX = lastX;
      }

      // Add line above
      const height = this.props.nodeSize.spacing.y * 0.375;
      this.renderLine('vertical', branch.id + '-vabovebs-' + i, height, lastX + 13, position.y + 1);

      // Add the ball
      this.nodes.push(
        <div key={ key }
          className={ className }
          aria-label={t('alternative') + ' ' + (i + 1)}
          onDoubleClick={() => {
            this.props.onEdit(branch.id);
          }}
          style={ {
            left: lastX + 'px',
            top: (position.y + 7) + 'px'
          } }>A{ i + 1 }
          {
            node.loop &&
            <div
              className='loop-back'
              onClick={ () => this.props.onHighlightLoop(node.id, key) }
            />
          }
          <div className="dark-tooltip">
            <div className="dark-text-wrap">{ !text ? t('alternative') + ' ' + (i + 1) : Content.stripHTML(text) }</div>
          </div>
        </div>
      );

      if ((isEmpty || node.loop) && this.isPlacing()) {
        // Add dropzone below empty alternative
        this.renderDropzone(-1, position.x, position.y + this.props.nodeSize.height + (this.props.nodeSize.spacing.y / 2) - 2, branch.id, i);
      }
    }

    return {
      firstX: firstX,
      lastX: lastX
    };
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {Object} branch
   * @return {Object} x,y
   */
  createSize = (branch) => {
    return {
      x: branch.x + this.getNodeWidth(branch),
      y: branch.y + 1, // TODO: 2x for BQ?
    };
  }

  /**
   * Create position in px values
   *
   * @param {Object} branch
   * @param {number} [x=0] Comp
   * @param {number} [y=0] Comp
   * @return {Object} x,y
   */
  createPosition = (node, x, y) => {
    const verticalNodeSpacing = (this.props.nodeSize.spacing.y + this.dzSpecs.height);
    return {
      x: (node.x + (x || 0)) * (this.props.nodeSize.width + this.props.nodeSize.spacing.x),
      y: (node.y + (y || 0)) * (this.props.nodeSize.height + verticalNodeSpacing)
    };
  }

  /**
   * Get the size of the given branch node.
   *
   * @param {Object} branch
   * @return {number}
   */
  getNodeWidth = (branch) => {
    // For empty alternatives, relative DZ + relative spacing
    return (branch.id === null || branch.loop ? 0.3463414634146341 : 1);
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {number} id
   * @return {string}
   */
  getClassName = (id) => {
    const library = this.props.getLibrary(this.props.content[id].params.type.library);
    return library.className;
  }

  /**
   * Handle draggable moving
   *
   * @param {number} id Content id
   */
  handleMove = (id, draggable) => {
    const intersections = this.getIntersections(draggable);
    let focusFlag = 1;

    // Highlight dropzones with largest intersection with draggable
    this.props.dropzones.forEach(dropzone => {
      if (!dropzone || dropzone === draggable) {
        return; // Skip
      }

      if (intersections.length === 0 || dropzone !== intersections[0]) {
        dropzone.dehighlight();
      }
      else {
        focusFlag = 0;
        this.tips.newContentTypeId = id;
        this.tips.currentContentTypeId = intersections[0];
        dropzone.highlight();
      }
    });

    if (focusFlag) {
      this.props.onFocus();
    }
  }

  /**
   * Handle draggable stopped moving.
   *
   * @param {number} id Content id
   * @param {Object} draggable
   */
  handleDropped = (id, draggable) => {
    // Check if the node overlaps with one of the drop zones
    const intersections = this.getIntersections(draggable);

    // Dropzone with largest intersection
    this.props.onDropped(id, (intersections.length > 0 ? intersections[0] : null));
  }

  /**
   * Figure out if the draggable overlaps with any of the dropzones.
   *
   * @param {Content} draggable
   * @return {object[]} intersecting objects ordered by intersecting area in descending order
   */
  getIntersections = (draggable) => {
    const points = draggable.getPoints();

    // Get largest intersections
    return this.props.dropzones
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
   * Determine if the given node has custom feedback set.
   *
   * @param {Object} node Content or alternative.
   * @return {boolean}
   */
  hasCustomFeedback = (node) => {
    node = node.params || node;

    return node.feedback !== undefined && (
      (node.feedback.title && node.feedback.title.trim() !== '') ||
      node.feedback.subtitle ||
      node.feedback.image ||
      (node.feedback.endScreenScore !== undefined && this.props.scoringOption === 'static-end-score')
    );
  }

  /**
   * Check if we're inserting a new branching question
   *
   * @return {boolean}
   */
  isPlacingNewBranching = () => {
    return (
      this.props.placing === -1 &&
      this.props.library &&
      this.props.library.title === 'Branching Question'
    );
  }

  /**
   * Determine if an element is being placed in the tree.
   * Used for showing dropzones when dragging stuff.
   *
   * @param {number} id
   * @return {boolean}
   */
  isPlacing = (id) => {
    return (id === undefined ? (this.props.placing !== null) : (this.props.placing === id));
  }

  render() {
    // Create inital tree layout (very dense)
    const layout = this.createTreeLayout();

    // Render the beautiful tree
    const tree = this.renderTree(layout);

    return (
      <div
        className="nodetree"
        ref={ node => this.element = node }
        style={ {
          width: tree.x + 'px',
          height: tree.y + 'px',
          transform: 'translate(' + this.props.panning.x + 'px,' + this.props.panning.y + 'px) scale(' + this.props.scale + ',' + this.props.scale + ')'
        } }
      >
        { tree.nodes }
      </div>
    );
  }
}

Tree.propTypes = {
};
