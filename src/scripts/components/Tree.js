import React from 'react';
import PropTypes from 'prop-types';

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
    return this.createBranch(0, -1);
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
   * @return {Object} Complete branch layout
   */
  createBranch = (id, y) => {
    if (id < 0) {
      // Reserve space for empty alterantive
      return this.createNode(null, y);
    }

    if (this.isAlreadyProcessed(id)) {
      return; // Skip
    }
    this.processed.push(id); // Mark as processed

    const content = this.props.content[id];
    const contentIsBranching = isBranching(content);
    const children = this.getChildren(content, contentIsBranching);
    const branch = this.createNode(id, y);

    // Loop through children
    for (let i = 0; i < children.length; i++) {
      if (children[i] < 0 && !contentIsBranching) {
        continue; // Do not reserve for leaf nodes, only alternatives
      }

      // and create sub-branches
      const subBranch = this.createBranch(children[i], y + (contentIsBranching ? 2 : 1)); // TODO: Make pretty
      if (subBranch) {
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

    //console.log(content.params.type.params, branch);

    return branch;
  }

  /**
   * Grab the children for the given content id.
   * @return {Array}
   */
  getChildren = (content, contentIsBranching) => {
    return contentIsBranching ? getBranchingChildren(content) : [content.params.nextContentId];
  }

  /**
   * Create an object to keep track of each tree node and its properties.
   * Will automatically assign the next available position in the tree layout.
   *
   * @return {Object}
   */
  createNode = (id, y) => {
    y = y + 1;
    if (this.xs[y] === undefined) {
      this.xs[y] = 0; // The start of a new row
    }

    const node = {
      id: id,
      x: this.xs[y],
      y: y,
      children: [],
      beautyModifier: 0,
      parent: null,
      num: 0 // Sibling number
    };

    // Increase row width
    this.xs[y] += (id === null ? 0.25 : 1);

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
      let offset = (lastChild.x - firstChild.x + 1);
      if (offset) {
        offset = (offset / 2) - 0.5;
      }
      offset += firstChild.x;
      if (firstChild.beautyModifier < 0) {
        // Compensate for centering
        //console.log(branch, offset, firstChild.beautyModifier);
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

    // Use global context to keep track of all dropzone elements in the tree
    this.dropzones = [];

    const tree = this.renderBranch(layout, 0);
    tree.nodes = this.nodes;

    return tree;
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {Object} branch
   * @param {numnber} extraBeauty Comes from our parent and is use to move the whole sub-tree
   * @return {Object} size
   */
  renderBranch = (branch, extraBeauty) => {
    this.applyBeautyModifiers(branch, extraBeauty);

    if (branch.id === null) {
      // Skip empty alternatives
      return {x: 0, y: 0};
    }

    // Keep track of indentation space per depth level
    this.updateIndentation(branch);

    const size = this.createSize(branch);
    for (let i = 0; i < branch.children.length; i++) {
      const subBeauty = (branch.beautyModifier > 0 ? branch.beautyModifier : 0);
      const subSize = this.renderBranch(branch.children[i], subBeauty + extraBeauty);

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
   * Avoid overlapping between sub-trees.
   *
   * @param {Object} branch
   */
  updateIndentation = (branch) => {
    if (this.xs[branch.y] !== undefined && branch.x < this.xs[branch.y] + 1) {
      branch.x = this.xs[branch.y] + 1;
    }
    this.xs[branch.y] = branch.x;
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
      let offset = (lastChild.x - firstChild.x + 1);
      if (offset) {
        offset = (offset / 2) - 0.5;
      }
      offset += firstChild.x;
      branch.x = offset;
    }
  }

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {Object} branch
   * @return {Object} x,y
   */
  renderNode = (branch) => {

    // TODO
    const content = this.props.content[branch.id];
    const contentIsBranching = isBranching(content);

    let highlightCurrentNode = false;

    // Determine position of node
    const verticalNodeSpacing = (this.props.nodeSize.spacing.y + this.dzSpecs.height);
    const position = {
      x: branch.x * (this.props.nodeSize.width + this.props.nodeSize.spacing.x),
      y: branch.y * (this.props.nodeSize.height + verticalNodeSpacing)
    };

    const label = Content.getTooltip(this.props.content[branch.id]);

    this.nodes.push(
      <Content
        key={ branch.id }
        id={ branch.id }
        fade={ this.props.highlight !== null && !highlightCurrentNode }
        ref={ element => {
          this['draggable-' + branch.id] = element;
          if (!this.isDropzoneDisabled(branch.id)) {
            // This node is also a drop zones for replacing it
            this.dropzones.push(element);
          }
        } }
        position={ position }
        width={ this.props.nodeSize.width }
        selected={ this.props.placing === branch.id }
        onPlacing={ () => this.props.onPlacing(branch.id) }
        onMove={ () => this.handleMove(branch.id) }
        onDropped={ () => this.handleDropped(branch.id) }
        contentClass={ this.getClassName(branch.id) }
        onEdit={ () => this.props.onEdit(branch.id) }
        onCopy={ () => this.props.onCopy(branch.id) }
        onDelete={ () => this.props.onDelete(branch.id) }
        disabled={ this.isDisabled(branch.id) }
        tooltip={ label }
        scale={ this.props.scale }
        hasCustomEndScreen={ false /* TODO this.hasCustomEndScreen(content) */ }
        hasLoopBack={ false /* TODO contentHasLoopBack */ }
        highlightLinkedContent={ () => {
          /*this.highlightLinkedContent( TODO
            content.params.nextContentId,
            id
          );*/
        } }
      >
        { label }
      </Content>
    );

    // Use for drawing lines and dropzones relative to the node's center
    const nodeCenter = position.x + (this.props.nodeSize.width / 2);

    // Used for ??
    const parent = (branch.parent ? this.props.content[branch.parent] : null);
    const parentIsBranching = (parent && isBranching(parent)); // TODO: This is only used for drawing alternatives ?

    if (branch.id !== 0) {
      this.renderLine('vertical', branch.id + '-vabove', verticalNodeSpacing - 3, nodeCenter - 1, position.y - verticalNodeSpacing);
    }

    if (contentIsBranching) {
      this.renderLine('vertical', branch.id + '-vbelow', verticalNodeSpacing, nodeCenter - 1, position.y + this.props.nodeSize.height - 1);
      const size = this.renderAlternativeBalls(branch);
      this.renderLine('horizontal', branch.id + '-hbelow', size.lastX - size.firstX + 2, size.firstX + 13, position.y + this.props.nodeSize.height + verticalNodeSpacing - 1);
    }

    // Add dropzones when placing, except for below the one being moved and for end scenarios
    if (this.isPlacing() && !this.isPlacing(branch.id)) {
      // TODO: Let's use a separate function for this

      // Add dropzone above
      // TODO: Add and explain logic...
      if (!this.isPlacing(branch.parent)) { // && (!this.isDropzoneDisabled(branch.id) || this.isOuterNode(this.state.placing, id))) {
        this.renderDropzone(branch.id,
          nodeCenter - (this.dzSpecs.width / 2), // TODO: Parts of this should be moved to renderDropzone
          //position.y - this.dzSpecs.height - this.props.nodeSize.spacing.y - 3,
          position.y - verticalNodeSpacing + (this.props.nodeSize.spacing.y / 2) - 2,
          parentIsBranching ? parent : undefined, branch.num, parentIsBranching);
      }

      // Add dropzone below if there's no subtree (or BQ implicitly with no alternatives)
      if (!contentIsBranching && !branch.children.length && !this.isDropzoneDisabled(branch.id)) {
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
   * @param {string} key
   * @param {number} height
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
   *
   *
   * @param {Object} branch
   * @return {Object} x,y
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
        ref={ element => { if (isInitial) { this.initialDropzone = element; } this.dropzones.push(element); } }
        nextContentId={ nextContentId }
        parent={ parent }
        alternative={ num }
        position={ {x: x, y: y} }
        elementClass={ 'dropzone' + (isInitial && !this.props.inserting ? ' disabled' : '') }
        style={ {
          left: x + 'px',
          top: y + 'px'
        } }
        onClick={ () => this.handleDropzoneClick(nextContentId, parent, num) }
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
      const key = branch.id + '-abox-' + i;
      const text = alternatives[i].text;
      const isEmpty = (branch.children[i].id === null);

      const verticalNodeSpacing = (this.props.nodeSize.spacing.y + this.dzSpecs.height);
      let alternativeBallClasses = 'alternative-ball';

      // Determine position later used for size
      const posX = (branch.children[i].x * (this.props.nodeSize.width + this.props.nodeSize.spacing.x));
      const posY = ((branch.children[i].y - 1) * (this.props.nodeSize.height + verticalNodeSpacing));

      lastX = (posX + ((isEmpty ? this.dzSpecs.width : this.props.nodeSize.width) / 2) - 14);
      if (!firstX) {
        firstX = lastX;
      }

      // Add line above
      const height = this.props.nodeSize.spacing.y * 0.375;
      this.renderLine('vertical', branch.id + '-vabovebs-' + i, height, lastX + 13, posY + 1);

      // Add the ball
      this.nodes.push(
        <div key={ key }
          className={ alternativeBallClasses }
          aria-label={ /* TODO: l10n */ 'Alternative ' + (i + 1) }
          onDoubleClick={() => {
            this.props.onContentEdit(branch.id);
          }}
          style={ {
            left: lastX + 'px',
            top: (posY + 7) + 'px'
          } }>A{ i + 1 }
          {
            false && // hasLoopBack &&
            <div
              className='loop-back'
              onClick={() => this.handleBallTouch(hasBeenDrawn ? id : -1, key)} // TODO
            />
          }
          <div className="dark-tooltip">
            <div className="dark-text-wrap">{ !text ? /* TODO: l10n */ 'Alternative ' + (i + 1) : Content.stripHTML(text) }</div>
          </div>
        </div>
      );

      if (isEmpty && this.isPlacing()) { // TODO: And not loop etc
        this.renderDropzone(-1, posX, posY + this.props.nodeSize.height + (this.props.nodeSize.spacing.y / 2) - 2, branch.id, i);
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
      x: branch.x + 1,
      y: branch.y + 1
    };
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

  /**
   * Handle draggable stopped moving.
   *
   * @param {number} id Content id
   */
  handleDropped = (id) => {
    // Check if the node overlaps with one of the drop zones
    const draggable = this['draggable-' + id];
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

  /**
   * Grouping size attributes together prevents loneliness
   *
   * @param {number} id
   * @return {string}
   */
  isDisabled = (id) => {
    // TODO
    return false;
    //isBranching(content)
    /*const isPlacingBranchingQuestion = this.state.placing === -1 &&
      this.state.library && this.state.library.title === 'Branching Question';

    disabled={ (contentIsBranching && (this.props.placing === null || isPlacingBranchingQuestion)) /*|| this.isDropzoneDisabled(branch.id)*/ //}

  }

  /**
   * Determine if dropzones has been disabled for the given content
   *
   * @param {number} id Content id
   * @return {boolean}
   */
  isDropzoneDisabled = (id) => {
    if (!this.disabledDropzones || id === undefined || id === null || id < 0) {
      return false;
    }

    return this.disabledDropzones.indexOf(id) !== -1;
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
    console.log('RENDERING');
    console.log('---------');
    // Create inital tree layout (very dense)
    const layout = this.createTreeLayout();
    console.log(JSON.parse(JSON.stringify(layout)));

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
