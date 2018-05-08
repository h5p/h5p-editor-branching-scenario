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
          icon: "\ue91b", // TODO: Replace with actual icon
          title: "Title of the Content", // TODO: Replace with actual title
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
    const points = this.refs['draggable-' + index].getPoints();
    this.dropzones.some(dropzone => {
      if (dropzone.overlap(points)) {
        // TODO: Highlight
        return true;
      }
    });
  }

  handleDropped = (index) => {
    let newState = {
      placing: null
    };

    // Check if the node overlaps with one of the drop zones
    const points = this.refs['draggable-' + index].getPoints();
    if (!this.dropzones.some(dropzone => {
        if (dropzone.overlap(points)) {
          this.setNewParent(index, dropzone.props.parent);
          return true;
        }
      })) {
      this.setState({
        placing: null
      });
    }
    this.props.onInserted();
  }

  handleDropzoneClick = (newParent) => {
    this.setNewParent(this.state.placing, newParent);
    this.props.onInserted();
  }

  setNewParent(index, newParent) {
    // Set new parent for node
    this.setState(prevState => {
      let newState = {
        placing: null,
        content: [...prevState.content]
      };

      if (index === -1) {
        // Insert new node
        newState.content.push({
          type: {
            library: 'H5P.NewNode 1.0',
            params: {}
          }
        });
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
      y = 0; // Y level start
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
          ref={ 'draggable-' + index }
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

      if (this.state.placing !== null) {
        // Draw dropzone below node
        const dzPosition = {
          x: position.x + spacing,
          y: position.y + spacing 
        };
        nodes.push(
          <Dropzone
            key={ index + '-dz-1' }
            ref={ element => this.dropzones.push(element) }
            parent={ index }
            position={ dzPosition }
            onClick={ () => this.handleDropzoneClick(index) }
          />
        );
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
