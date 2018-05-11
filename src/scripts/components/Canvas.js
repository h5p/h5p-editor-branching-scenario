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

    this.state = {
      placing: null,
      deleting: null,
      editorOverlay: 'inactive',
      editorContents: {
        top: {
          icon: '',
          title: '',
          saveButton: "Save changes",
          closeButton: "close"
        },
        content: {
        }
      }
    };

    // Hard-coded for now, but will come in through props.
    this.state.content = [
      {
        parent: 3,
        type: {
          library: 'H5P.BranchingQuestion 1.0',
          params: {
            question: "<p>hello, who are you?</p>",
            alternatives: [
              {
                text: 'A1',
                nextContentId: 123,
                addFeedback: false
              },
              {
                text: 'A2',
                nextContentId: 123,
                addFeedback: false
              },
              {
                text: 'A3',
                nextContentId: 123,
                addFeedback: false
              }
            ]
          }
        },
        contentId: -1, // -1 might lead to confusion, negative values are end scenatios
        contentTitle: 'the void'
      },
      {
        parent: 0,
        type: {
          library: 'H5P.InteractiveVideo 1.0',
          params: {}
        },
        contentId: 1,
        contentTitle: 'Some nice IV action'
      },
      {
        parent: 0,
        type: {
          library: 'H5P.BranchingQuestion 1.0',
          params: {
            question: "<p>hello, who are you?</p>",
            alternatives: [
              {
                text: 'A1',
                nextContentId: 123,
                addFeedback: false
              },
              {
                text: 'A2',
                nextContentId: 123,
                addFeedback: false
              }
            ]
          }
        },
        contentId: 2,
        contentTitle: 'Just some text ...'
      },
      {
        parent: -1,
        type: {
          library: 'H5P.Video 1.0',
          params: {}
        },
        contentId: 0,
        contentTitle: 'A video intro!'
      },
      {
        parent: 2,
        type: {
          library: 'H5P.Image 1.0',
          params: {}
        },
        contentId: 3,
        contentTitle: 'What image?'
      },
      {
        parent: 2,
        type: {
          library: 'H5P.Image 1.0',
          params: {}
        },
        contentId: 4,
        contentTitle: 'That image!'
      }
    ];
    this.state.content = [];
  }

  componentDidMount() {
    this.props.onRef(this);
  }

  componentWillUnmount() {
    this.props.onRef(undefined);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.inserting) {
      this.setState({
        placing: -1
      });
    }
  }

  handlePlacing = (index) => {
    this.setState({
      placing: index
    });
  }

  handleMove = (index) => {
    const draggable = this['draggable-' + index];
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

  handleDropped = (index) => {
    let newState = {
      placing: null
    };

    // Check if the node overlaps with one of the drop zones
    const draggable = this['draggable-' + index];
    const points = draggable.getPoints();
    let data;
    if (!this.dropzones.some(dropzone => {
        if (!dropzone || dropzone === draggable) {
          return; // Skip
        }

        if (dropzone.overlap(points)) {
          if (dropzone instanceof Draggable) {
            this.setState({
              deleting: dropzone.props.index
            });
          }
          else {
            data = this.setNewParent(index, dropzone.props.parent, draggable.libraryName);
          }
          return true;
        }
      })) {
      this.setState({
        placing: null
      });
    }
    this.props.onInserted(data);
  }

  handleDropzoneClick = (newParent) => {
    if (!this.state.placing) {
      return;
    }

    this.setNewParent(this.state.placing, newParent);
    this.props.onInserted();
  }

  getNewContentParams(library) {
    return {
      type: {
        library: library,
        params: {}
      }
    };
  }

  setNewParent(index, newParent, library) {
    let newNode;
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        placing: null,
        content: [...prevState.content]
      };

      if (index === -1) {
        // Insert new node
        newNode = this.getNewContentParams(library);
        newState.content.push(newNode);
        index = newState.content.length - 1;
      }

      newState.content.forEach(content => {
        // We do not want to bring our current children with us, so we
        // update our old children to use our old parent directly
        if (content.parent === index) {
          content.parent = newState.content[index].parent;
        }

        // We want the children of our new parent to become our children
        if (content.parent === newParent) {
          content.parent = index;
        }
      });

      // Set new parent to the one dictated by the dropzone
      newState.content[index].parent = newParent
      return newState;
    });
    return newNode;
  }

  renderDropzone(index, position, parent, num) {
    parent = parent || index;
    num = num || 0;
    return (
      <Dropzone
        key={ index + '-dz-' + num }
        ref={ element => this.dropzones.push(element) }
        parent={ parent }
        position={ position }
        onClick={ () => this.handleDropzoneClick(parent) }
      />
    );
  }

  renderTree = (parent, x, y) => {
    let nodes = [];

    // Set defaults
    if (parent === undefined) {
      parent = -1; // Starting parent
    }
    if (x === undefined) {
      x = 0; // X level start
    }
    if (y === undefined) {
      y = 1; // Y level start
    }
    const width = 121; // TODO: Constant or css value?
    const height = 32;
    const spacing = 29; // TODO: Constant or css value?

    let firstX, lastX;
    this.state.content.forEach((content, index) => {
      if (content.parent !== parent) {
        return;
      }

      // Draw subtree
      const subtree = this.renderTree(index, x, y + 1);
      const subtreeWidth = subtree.x - x;

      if (x !== 0) {
        x += spacing; // Add spacing between nodes
      }

      // Determine position of node
      let position = {
        x: x,
        y: y * 100
      }

      if (subtreeWidth >= width) {
        // Center parent above subtree
        position.x += ((subtree.x - x) / 2) - (width / 2);
      }

      // Draw node
      nodes.push(
        <Draggable
          key={ index }
          index={ index }
          ref={ element => { this['draggable-' + index] = element; if (this.state.placing !== null && this.state.placing !== index) this.dropzones.push(element) } }
          position={ position }
          width={ width }
          onPlacing={ () => this.handlePlacing(index) }
          onMove={ () => this.handleMove(index) }
          onDropped={ () => this.handleDropped(index) }
          contentClass='test'
        >
          { content.type.library }
        </Draggable>
      );

      // Add vertical line above
      const nodeCenter = position.x + (width / 2);
      if (parent !== -1) {
        nodes.push(
          <div key={ index + '-vabove' } className="vertical-line" style={ {
            left: nodeCenter + 'px',
            top: (position.y - spacing) + 'px',
            height: spacing + 'px'
          } }/>
        );
      }

      // Special treatment for BQ
      if (content.type.library.split(' ')[0] === 'H5P.BranchingQuestion') {
        // Add vertical line below
        nodes.push(
          <div key={ index + '-vbelow' } className="vertical-line" style={ {
            left: nodeCenter + 'px',
            top: (position.y + height) + 'px',
            height: spacing + 'px'
          } }/>
        );

        if (content.type.params.alternatives.length > 1) {
          // Add horizontal line below
          nodes.push(
            <div key={ index + '-hbelow' } className="horizontal-line" style={ {
              left: (x + (width / 2)) + 'px',
              top: (position.y + height + spacing) + 'px',
              width: subtree.dX + 'px'
            } }/>
          );
        }
      }

      // Add dropzones when placing, except for below the one being moved
      if (this.state.placing !== null && this.state.placing !== index) {

        // Draw dropzone below node, but not above the one being moved
        if (this.state.placing === -1 || this.state.content[this.state.placing].parent !== index) {
          nodes.push(this.renderDropzone(index, {
            x: position.x + 40, // TODO: Decide on spacing a better way?
            y: position.y + 42
          }));
        }

        // Add extra drop zone above the first node
        if (parent === -1) {
          nodes.push(this.renderDropzone(index, {
            x: position.x + 40,
            y: position.y - 52
          }, -1, 2));
        }
      }

      // Increase same level offset + offset required by subtree
      x += (subtreeWidth >= width ? subtreeWidth : width);

      // Merge our trees
      nodes = nodes.concat(subtree.nodes);

      if (firstX === undefined) {
        firstX = position.x;
      }
      lastX = position.x;
    });

    return {
      nodes: nodes,
      x: x,
      dX: lastX - firstX // Width of this subtree level only (used for pretty trees)
    };
  }

  /**
   * Render the editor overlay.
   *
   * @param {string} [state] - Display state [active|inactive].
   * @return {object} React render object.
   */
  renderEditorOverlay({state = 'inactive', form = {}, content={}} = {}) {
    return (
      <EditorOverlay
        onRef={ ref => (this.child = ref) }
        state={ state }
        editorContents={ this.state.editorContents }
        form={form}
        closeForm={ this.toggleEditorOverlay.bind(this) }
        saveData={ this.props.saveData }
        removeData={ this.props.removeData }
        main={ this.props.main }
        content={ content }
      />
    );
  }

  /**
   * Toggle the editor overlay.
   *
   * @param {boolean} visibility - Override visibility toggling.
   */
  toggleEditorOverlay(visibility) {
    if (visibility === true) {
      visibility = 'active';
    }
    else if (visibility === false) {
      visibility = 'inactive';
    }
    else {
      visibility = undefined;
    }
    this.setState({
      editorOverlay: visibility || ((this.state.editorOverlay === 'active') ? 'inactive' : 'active')
    });
  }

  handleDelete = () => {
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        placing: null,
        deleting: null,
        content: [...prevState.content]
      };

      let index = this.state.placing;
      if (index === -1) {
        // Insert new node
        newState.content.push(this.getNewContentParams());
        index = newState.content.length - 1;
      }

      const grandParent = newState.content[index].parent;

      // Change parent for the moving node
      newState.content[index].parent = newState.content[this.state.deleting].parent;

      // Replace the node (preserves tree drawing order)
      newState.content[this.state.deleting] = newState.content[index];
      newState.content.splice(index, 1);

      // Update all parents before splicing the array
      newState.content.forEach(content => {
        // Move current children of the moved node to grand parent
        if (content.parent === index) {
          content.parent = grandParent;
        }

        // Decrease all parent values larger than the deleted node index
        if (content.parent > index) {
          content.parent--;
        }
      });

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

  render() {
    this.dropzones = [];

    // Generate the tree
    const tree = this.renderTree();
    this.treeWidth = tree.x;

    return (
      <div className="wrapper">

        { !! this.props.inserting &&
          <Draggable
            inserting={ this.props.inserting }
            ref={ element => this['draggable--1'] = element }
            onMove={ () => this.handleMove(-1) }
            onDropped={ () => this.handleDropped(-1) }
            contentClass='new-node'
            position={ this.props.inserting.position }
          >
            New Node
          </Draggable>
        }

        <div className="canvas">
          { this.state.deleting !== null &&
            <ConfirmationDialog
              handleDelete={ this.handleDelete }
              handleCancel={ this.handleCancel }
            />
          }
          <div className="tree" ref={ 'tree' }>
            { tree.nodes }
          </div>
          { !tree.nodes.length &&
            <StartScreen
              handleClicked={ this.props.navigateToTutorial }
            >
              { this.renderDropzone(-1, {
                  x: 363.19,
                  y: 130
                }) }
            </StartScreen>
          }
          { this.renderEditorOverlay({ state: this.state.editorOverlay, content: this.state.content }) }
        </div>
      </div>
    );
  }
}

Canvas.propTypes = {
  width: PropTypes.number,
  inserting: PropTypes.object
};
