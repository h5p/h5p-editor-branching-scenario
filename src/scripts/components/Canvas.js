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
      showConfirmationDialog: false,
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
          params: {}
        }
      },
      {
        parent: 0,
        type: {
          library: 'H5P.InteractiveVideo 1.0',
          params: {}
        }
      },
      {
        parent: 0,
        type: {
          library: 'H5P.Text 1.0',
          params: {}
        }
      },
      {
        parent: -1,
        type: {
          library: 'H5P.Video 1.0',
          params: {}
        }
      },
      {
        parent: 2,
        type: {
          library: 'H5P.Image 1.0',
          params: {}
        }
      },
      {
        parent: 2,
        type: {
          library: 'H5P.Image 1.0',
          params: {}
        }
      }
    ];
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
            // TODO: Replace
            console.log('REPLACE', this.state.placing + ' => ' + dropzone.props.index);
            this.setState({
              deleting: dropzone.props.index
            });
          }
          else {
            //this.setNewParent(index, dropzone.props.parent);
            data = this.setNewParent(index, dropzone.props.parent, this.refs['draggable-' + index].libraryName);
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
    this.setNewParent(this.state.placing, newParent);
    this.props.onInserted();
  }

  setNewParent(index, newParent, library = 'H5P.NewNode 1.0') {
    let newNode;
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        placing: null,
        content: [...prevState.content]
      };

      if (index === -1) {
        // Insert new node
        newNode = {
          type: {
            library: library,
            params: {}
          }
        };
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
    const spacing = 29; // TODO: Constant or css value?

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

      // Add dropzones when placing, except for below the one being moved
      if (this.state.placing !== null && this.state.placing !== index) {

        // Draw dropzone below node, but not above the one being moved
        if (this.state.content[this.state.placing].parent !== index) {
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
    });

    return {
      nodes: nodes,
      x: x
    };

  }

  /**
   * Render the editor overlay.
   *
   * @param {string} [state] - Display state [active|inactive].
   * @return {object} React render object.
   */
  renderEditorOverlay({state = 'inactive', form = {}} = {}) {
    return (
      <EditorOverlay
        onRef={ref => (this.child = ref)}
        state={state}
        editorContents={this.state.editorContents}
        form={form}
        closeForm={this.toggleEditorOverlay.bind(this)}
        saveData={this.props.saveData}
        removeData={this.props.removeData}
        main={this.props.main}
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
    // Get dropped draggable to remove
    const index = this.state.droppedDraggables.indexOf(draggable => {
      draggable.dropzone == this.state.overlap;
    });

    this.state.droppedDraggables.splice(index);
    this.state.droppedDraggables.push(this.state.activeDraggable);

    this.setState({
      showConfirmationDialog: false,
      activeDraggable: undefined,
      overlap: undefined
    });
  }

  handleCancel = () => {
    this.setState({
      showConfirmationDialog: false,
      activeDraggable: undefined
    });
  }

  render() {
    this.dropzones = [];

    return (
      <div className="wrapper">

        { !! this.props.inserting &&
          <Draggable
            inserting={ this.props.inserting }
            ref={ 'draggable--1' }
            onMove={ () => this.handleMove(-1) }
            onDropped={ () => this.handleDropped(-1) }
            contentClass='new-node'
            position={ this.props.inserting.position }
          >
            New Node
          </Draggable>
        }

        <div className="canvas">
          { this.state.showConfirmationDialog ?
            <ConfirmationDialog
              handleDelete={ this.handleDelete }
              handleCancel={ this.handleCancel }
            /> : ''
          }
          { this.renderTree().nodes }
          { this.renderEditorOverlay({state: this.state.editorOverlay}) }
          {/*
          <StartScreen
            handleClicked={ this.props.navigateToTutorial }
          />
          */}
        </div>
      </div>
    );
  }
}

Canvas.propTypes = {
  width: PropTypes.number,
  inserting: PropTypes.object
};
