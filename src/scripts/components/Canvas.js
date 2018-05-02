import React from 'react';
import PropTypes from 'prop-types';
import './Canvas.scss';
import Draggable from './Draggable.js';
import Dropzone from './Dropzone.js';
import ConfirmationDialog from './ConfirmationDialog.js';

export default class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false,
      activeDraggable: undefined,
      overlap: undefined,
      showConfirmationDialog: false,
      droppedDraggables: [],
    };
  
    this.dropzones = [
    ],

    this.dropzonesTemp = [
      { 
        key: 0, 
        entered: false, 
        hasDraggable: false,
        posX: 375,
        posY: 100
      } 
    ];
  }

  handleEntered = (index, entered) => {
    this.dropzonesTemp[index].entered = entered;
  }

  generateTempDropZones = () => {
    const lastDropzone = this.dropzones[this.dropzones.length-1];
    const newDropzone = {...lastDropzone};
    newDropzone.key = lastDropzone.key + 1;
    newDropzone.posY = lastDropzone.posY + 100;
    newDropzone.hasDraggable = false;
    this.dropzonesTemp = this.dropzones.map(x => x); // Copy without reference
    this.dropzonesTemp.push(newDropzone);
    this.setState();
  }

  componentWillReceiveProps(nextProps) {

    // Handle dragging
    if (nextProps.dragging) {
      this.setState({
        dragging: true, 
        activeDraggable: {
          yPos: nextProps.posY,
          xPos: nextProps.posX,
          width: nextProps.draggable.width,
          contentClass: nextProps.draggable.contentClass,
          content: nextProps.draggable.content
        }
      });
    }

    // Handle dropping
    if (this.props.dragging && !nextProps.dragging) {
      const enteredIndex = this.dropzonesTemp.findIndex(dz => dz.entered == true);

      if (this.isInDropzone()) {

        // The dropzone already has a draggable 
        if (this.dropzonesTemp[enteredIndex].hasDraggable == true) {
          // Ask for confirmation before replacing existing draggable 
          this.setState({
            dragging: false, 
            showConfirmationDialog: true,
            overlap: enteredIndex
          });
        }

        // The dropzone is empty 
        else {
          const draggableToAdd = this.state.activeDraggable;
          draggableToAdd.dropzone = enteredIndex;

          this.setState({
            droppedDraggables: [...this.state.droppedDraggables, draggableToAdd],
            dragging: false, 
            activeDraggable: undefined
          }); 

          this.dropzonesTemp[enteredIndex].hasDraggable = true;
          this.dropzonesTemp[enteredIndex].entered = false;
          this.dropzones.push(this.dropzonesTemp[enteredIndex]);
          this.setState();
          this.generateTempDropZones(); 
        }
      }

      // Dropped outside a dropzone 
      else {
        this.setState({
          dragging: false, 
          activeDraggable: undefined
        });
      }
    } 
  }

  isInDropzone = () => {
    let result = false;
    for (var i = 0; i < this.dropzonesTemp.length; i ++) {
      if (this.dropzonesTemp[i].entered == true) {
        result = true;
      }
    }
    return result;
  }

  handleMouseDown = (e, data) => {
    const index = data.id;
    //const dropzoneToUpdate = this.state.droppedDraggables[index].dropzone;
    this.state.droppedDraggables.splice(index, 1);

    this.setState({
      droppedDraggables: this.state.droppedDraggables 
    });

    this.props.onMouseDown(e, data); 
  }

  renderActiveDraggable() {
    const d = this.state.activeDraggable;
    if (!this.props.dragging && d == undefined) {
      return '';
    }

    return (
      <Draggable
        dropped={ false }
        yPos={ d.yPos } 
        xPos={ d.xPos }
        width={ d.width } 
        contentClass={ d.contentClass }
        content={ d.content } 
      />
    );
  }

  renderDroppedDraggables() {
    if (this.state.droppedDraggables.length == 0) {
      return '';
    }

    return this.state.droppedDraggables.map((d, i) => {
      return (
        <Draggable
          key={ i }
          id={ i } 
          dropped={ true }
          yPos={ d.yPos } 
          xPos={ d.xPos - 189 } // TODO: calculate offset better
          width={ d.width } 
          contentClass={ d.contentClass }
          content={ d.content } 
          handleMouseDown={ (e, data) => this.handleMouseDown(e, data) } 
        />
      );
    });
  }

  renderDropzones() {
    const dropzones = this.state.dragging ? this.dropzonesTemp : this.dropzones; 
    return dropzones.map(dz => {
      return (
        <Dropzone 
          key={ dz.key } 
          posX={ dz.posX }
          posY={ dz.posY }
          mouseX={ this.props.mouseX } 
          mouseY={ this.props.mouseY } 
          handleEntered={ entered => this.handleEntered(dz.key, entered) }
        /> 
      );
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
    return (
      <div className="wrapper">

        { this.renderActiveDraggable() } 

        <div className="canvas">
          { this.state.showConfirmationDialog ? 
            <ConfirmationDialog
              handleDelete={ this.handleDelete }
              handleCancel={ this.handleCancel } 
            /> : ''
          } 
          { this.renderDroppedDraggables() } 
          { this.renderDropzones() }        
        </div>
     
      </div>
    );
  }
}

Canvas.propTypes = {
  clicked: PropTypes.bool,
  draggable: PropTypes.object,
  dragging: PropTypes.bool,
  mouseX: PropTypes.number,
  mouseY: PropTypes.number,
  posX: PropTypes.number,
  poxY: PropTypes.number,
  width: PropTypes.number
};
