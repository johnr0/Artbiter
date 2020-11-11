import React, {Component} from 'react'

class SketchpadCanvas extends Component{
    render(){
        var length = this.props.mother_state.boardzoom*this.props.mother_state.boardlength
        return (<canvas id={'sketchpad_canvas_'+this.props.canvas_id} width={1000} height={1000} style={{width: '100%', position:'absolute', top:'0', left: '0'}}>

        </canvas>)
    }
}

export default SketchpadCanvas