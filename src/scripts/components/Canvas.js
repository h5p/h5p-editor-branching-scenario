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
      showConfirmationDialog: false,
      droppedDraggables: [],
    };
  
    this.dropzones = [
      { 
        key: 0, 
        entered: false, 
        hasDroppable: false,
        posX: 375,
        posY: 200
      }
    ],

    this.dropzonesTemp = [
      { 
        key: 0, 
        entered: false, 
        hasDroppable: false,
        posX: 375,
        posY: 200
      }, 
      { 
        key: 1, 
        entered: false, 
        hasDroppable: false,
        temp: true, 
        posX: 375,
        posY: 300
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
    newDropzone.hasDroppable = false;
    this.dropzonesTemp = this.dropzones.map(x => x); // Copy without reference
    this.dropzonesTemp.push(newDropzone);
    this.setState();
  }


  ComponentWillReceiveProps(nextProps) {
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
      let isInDropZone = false;
      for (var i = 0; i < this.dropzonesTemp.length; i ++) {
        if (this.dropzonesTemp[i].entered == true) {
          isInDropZone = true;
        }
      }
      const enteredIndex = this.dropzonesTemp.findIndex(dz => dz.entered == true);

      if (isInDropZone) {
        if (this.dropzonesTemp[enteredIndex].hasDroppable == true) {
          this.setState({
            dragging: false, 
            showConfirmationDialog: true
          });
        }
        else {
          const droppableToAdd = this.state.activeDraggable;
          droppableToAdd.dropzone = enteredIndex;

          this.setState({
            droppedDraggables: [...this.state.droppedDraggables, droppableToAdd],
            dragging: false, 
            activeDraggable: undefined
          }); 

          this.dropzonesTemp[enteredIndex].hasDroppable = true;
          this.dropzonesTemp[enteredIndex].entered = false;
          this.dropzones.push(this.dropzonesTemp[enteredIndex]);
          this.setState();
          this.generateTempDropZones(); 
        }
      }
      else {
        this.setState({
          dragging: false, 
          activeDraggable: undefined
        });
      }
    } 
  }


  renderActiveDraggable() {
    const d = this.state.activeDraggable;
    if (!this.props.dragging || d == undefined) {
      return '';
    }

    return (
      <Draggable
        key={ Math.random() }
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

    return this.state.droppedDraggables.map(d => {
      return (
        <Draggable
          key={ Math.random() }
          dropped={ true }
          yPos={ d.yPos } 
          xPos={ d.xPos - 189 } // TODO: calculate offset better
          width={ d.width } 
          contentClass={ d.contentClass }
          content={ d.content } 
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
      draggable.dropzone == 0;
    });

    this.state.droppedDraggables.splice(index);
    this.state.droppedDraggables.push(this.state.activeDraggable);
    
    this.setState({
      showConfirmationDialog: false,
      activeDraggable: undefined
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
      <div className="wrapper" onMouseDown= { this.props.onMouseDown }>

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
