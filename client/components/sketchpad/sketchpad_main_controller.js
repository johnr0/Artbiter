import React, {Component} from 'react'
import SketchpadBrushController from './sketchpad_brush_controller'
import SketchpadEraserController from './sketchpad_eraser_controller'

class SketchpadMainController extends Component{
    changeControlState(control_state){
        if(this.props.mother_state.current_layer!=-1){
            console.log(control_state)
            if(control_state=='move-layer'){
                this.props.mother_this.initializeMoveLayer();
            }
            if(control_state=='content-stamp'){

                this.props.mother_this.props.board_this.refs.moodboard.setState({control_state:'content-stamp'})
                var moodboard_state = this.props.mother_this.props.board_this.refs.moodboard.state
                if(moodboard_state.current_image.length>1 || moodboard_state.current_text.length>0){
                    this.props.mother_this.props.board_this.refs.moodboard.deSelect();
                }
            }
            if(this.props.mother_state.control_state=='content-stamp'){
                this.props.mother_this.props.board_this.refs.moodboard.setState({control_state:'control_object'})
            }
            this.props.mother_this.setState({control_state: control_state})
        } 
    }

    render(){
        return (<div className="controller sketchpad_main_controller">
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='move')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'move')}>
                <i className='controller_button_icon fa fa-hand-paper'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='move-layer')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'move-layer')}>
                <i className='controller_button_icon fa fa-arrows'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='brush')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'brush')}>
                <i className='controller_button_icon fa fa-paint-brush'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='erase')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'erase')}>
                <i className='controller_button_icon fa fa-eraser'></i>
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='area')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'area')}>
                <span className="iconify" data-icon="mdi-lasso" data-inline="false"></span>
                {/* < style={{width: '38px', height: '38px', border: (this.props.mother_state.control_state=='area')?'dashed 4px white':'dashed 4px #888888'}}></div> */}
   
            </div>
            <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='content-stamp')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'content-stamp')}>
                <i style={{fontSize:'25px', verticalAlign:'bottom'}} className='controller_button_icon fa fa-stamp'></i>
                <span style={{fontSize:'20px'}}>C</span>
            </div>
            {/* <div  className='controller_button' style={{color: (this.props.mother_state.control_state=='copy_content')?'white':'#888888'}}>
                <i className='controller_button_icon fa fa-stamp'></i>
   
            </div> */}
            {this.props.mother_state.control_state=='brush'&&
                <SketchpadBrushController mother_this={this.props.mother_this} mother_state={this.props.mother_state}></SketchpadBrushController>
            }
            {this.props.mother_state.control_state=='erase'&&
                <SketchpadEraserController mother_this={this.props.mother_this} mother_state={this.props.mother_state}></SketchpadEraserController>
            }
            
        </div>)
    }
}

export default SketchpadMainController;