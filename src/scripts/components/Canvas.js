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
    };
  
    this.dropzones = [
      { 
        key: 0, 
        entered: false, 
        draggable: {
 				  content: "Interactive Video",
				  contentClass: "InteractiveVideo",
        }
      },
      { 
        key: 1, 
        entered: false, 
        draggable: {
 				  content: "Text",
				  contentClass: "Text",
        }
      },
      { 
        key: 2, 
        entered: false, 
        draggable: {
 				  content: "Image",
				  contentClass: "Image",
        }
      } 
    ];

    this.dropzonesTemp = [];
    this.generateTempDropZones()
  }

  handleEntered = (index, entered) => {
    if (!entered) {
      return 
    }
    this.dropzonesTemp.forEach((dz, i) => {
      dz.entered = i== index ? true : false
    })
  }

  generateTempDropZones = (a) => {
    this.dropzonesTemp = JSON.parse(JSON.stringify(this.dropzones)); // Copy without reference 
    this.dropzonesTemp.forEach((dz, i) => {
      dz.originalKey = dz.key
    })

    let tempDropzone = {
      entered: false,
      temp: true
    }
    
    // Add temp dropzones before and after all dropzones
    this.dropzonesTemp = this.dropzonesTemp.reduce((acc, next) => {
      acc.push(next)
      acc.push(Object.assign({}, tempDropzone))
      return acc 
    }, [Object.assign({}, tempDropzone)])

    // TODO: Remove temp dropzones if a permanent dropzone doesn't have a draggable
    let indexToRemove

    this.dropzonesTemp.forEach((dz, i) => {
      if (!dz.draggable && !dz.temp) {
        indexToRemove = i
      }
    })

    if (a) {
     this.dropzonesTemp.splice(indexToRemove, 1) 
     this.dropzonesTemp.splice(indexToRemove, 1) 
    }

    for (var i = 0; i < this.dropzonesTemp.length; i++) {
      this.dropzonesTemp[i].key = i;
    }
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
      const enteredDropzone = this.dropzonesTemp[enteredIndex]

      if (this.isInDropzone()) {
        // The dropzone already has a draggable 
        if (enteredDropzone.draggable) {
          // Ask for confirmation before replacing existing draggable 
          this.setState({
            dragging: false, 
            showConfirmationDialog: true,
            overlap: enteredIndex
          });
        }

        // The dropzone is empty and therefore a temp dropzone
        else {
					// Make the temp dropzone permanent	
          const dropzoneToAdd = {
            hasDraggable: true,
            entered: false,
            draggable: this.state.activeDraggable
          }

          const indexToInsert = this.dropzonesTemp[enteredIndex].originalKey
          this.dropzones.splice(indexToInsert, 0, dropzoneToAdd)

          // Remove empty dropzones
          let indexToRemove;
          for (var i = 0; i < this.dropzones.length; i++) {
            if (!this.dropzones[i].draggable) {
              indexToRemove = i
            }
          }
          if (indexToRemove) {
            this.dropzones.splice(indexToRemove, 1)
          }
					
          // Reset the keys for the dropzones
          for (var i = 0; i < this.dropzones.length; i++) {
            this.dropzones[i].key = i
          }

          this.setState({
            dragging: false, 
            activeDraggable: undefined
          }); 
					
    			this.generateTempDropZones()
          this.setState();
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

  handleMouseDown = (e, dropzoneIndex, data) => {
    this.dropzones[dropzoneIndex].draggable = undefined;
    this.generateTempDropZones(true)
    this.props.onMouseDown(e, data);
    this.setState({})
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
    const dropzones = this.state.dragging ? this.dropzonesTemp : this.dropzones;
    return dropzones.map(dropzone => {
      if (!dropzone.draggable) {
        return ''
      }

      return (
        <Draggable
          dropped={ true }
          yPos={ (dropzone.key + 1) * 100 } 
          xPos={ 300 - (121/4) } // TODO: calculate offset better
          width={ 121 } 
          contentClass={ dropzone.draggable.contentClass }
          content={ dropzone.draggable.content } 
          handleMouseDown={ (e, data) => { this.handleMouseDown(e, dropzone.key, data)} } 
        />
      );
    })
  }

  renderDropzones() {
    const dropzones = this.state.dragging ? this.dropzonesTemp : this.dropzones; 
    return dropzones.map(dz => {
      return (
        <Dropzone 
          key={ dz.key } 
          posX={ 300 }
          posY={ (dz.key + 1) * 100 }
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
    //console.log(this.dropzones)
    //console.log(this.state)
    //console.log(this.state.droppedDraggables)
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
