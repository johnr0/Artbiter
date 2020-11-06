import React, {Component} from 'react'
import ProtoBoard from '../proto/protoboard'

class SketchPad extends ProtoBoard {
    state = {
        ...this.state,
        boardname:'sketchpad'
    }

    render(){
        return (<div className='col s6 oneboard'>
        <h2>SketchPad</h2>
        <div id='sketchpad' className='sketchpad' onWheel={this.zoom_board_wheel.bind(this)} 
            onMouseOut={this.moveBoardEnd.bind(this)}
            onMouseMove={this.moveMouse.bind(this)}> 
            <div className='boardrender' onMouseDown={this.moveBoardInit.bind(this)} onMouseUp={this.moveBoardEnd.bind(this)} 
            
            style={{
                width:this.state.boardzoom*this.state.boardlength, 
                height: this.state.boardzoom*this.state.boardlength,
                top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                left: this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],
            }}>

            </div>
        </div>
    </div>)
    }
}

export default SketchPad