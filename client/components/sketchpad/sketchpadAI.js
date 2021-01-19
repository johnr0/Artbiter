import React from 'react'
import SketchPad from './sketchpad'
import SketchpadMainControllerAI from './sketchpad_main_controllerAI'
import SketchpadLayerController from './sketchpad_layer_controller'
import SketchpadUndo from './sketchpad_undo'
import SketchpadStyleStampControllerAI2 from './sketchpad_style_stamp_controllerAI2'

class SketchPadAI extends SketchPad{
    state = {
        ...this.state,
        style_stamp_mode: 'add',
        style_brush_cur: undefined,
        style_content_image: undefined,
    }

    componentDidMount(){
        super.componentDidMount()
        var el = document.getElementById('style-stamp-canvas')
                var canvas = el.getContext('2d')
                canvas.fill='black'
                canvas.fillRect(0,0,1000,1000)
    }

    sketchPadMouseMoveInit(e){
        super.sketchPadMouseMoveInit(e)
        if(this.state.control_state=='style-stamp' && this.state.action=='idle'){
            var el = document.getElementById('style-stamp-canvas')
            var ctx = el.getContext('2d');
            ctx.lineWidth = this.state.stamp_size
            ctx.beginPath();
            if(this.state.style_stamp_mode=='add'){
                ctx.strokeStyle = '#ffffff'
            }else if(this.state.style_stamp_mode=='subtract'){
                ctx.strokeStyle = '#000000'
            }
            var brush_cur = this.getCurrentMouseOnBoard(e).slice()
            ctx.moveTo(brush_cur[0], brush_cur[1])
            this.setState({action:'style-brush', style_brush_cur: brush_cur})
        }   
    }  

    sketchPadMouseMove(e){
        super.sketchPadMouseMove(e)
        if(this.state.control_state=='style-stamp' && this.state.action=='style-brush'){
            var el = document.getElementById('style-stamp-canvas')
            var ctx = el.getContext('2d');
            var brush_cur = this.getCurrentMouseOnBoard(e).slice()
            ctx.lineJoin = ctx.lineCap='round';
            ctx.lineTo(brush_cur[0], brush_cur[1])
            ctx.stroke()
            this.setState({style_brush_cur: brush_cur})
            
        }
    }

    getCanvasBoundingBoxBW(ctx, left=0, top=0, width=1000, height=1000){
        var ret = {};
    
        // Get the pixel data from the canvas
        var data = ctx.getImageData(left, top, width, height).data;
        // console.log(data);
        var first = false; 
        var last = false;
        var right = false;
        var left = false;
        var r = height;
        var w = 0;
        var c = 0;
        var d = 0;

        // 1. get bottom
        while(!last && r) {
            r--;
            for(c = 0; c < width; c++) {
                // console.log(data[r * width * 4 + c * 4 ], data[r * width * 4 + c * 4 +1], data[r * width * 4 + c * 4 +2])
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('last', r);
                    last = r+1;
                    ret.bottom = r+1;
                    break;
                }
            }
        }

        // 2. get top
        r = 0;
        var checks = [];
        while(!first && r < last) {
            
            for(c = 0; c < width; c++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('first', r);
                    first = r-1;
                    ret.top = r-1;
                    ret.height = last - first;
                    break;
                }
            }
            r++;
        }

        // 3. get right
        c = width;
        while(!right && c) {
            c--;
            for(r = 0; r < height; r++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('last', r);
                    right = c+1;
                    ret.right = c+1;
                    break;
                }
            }
        }

        // 4. get left
        c = 0;
        while(!left && c < right) {

            for(r = 0; r < height; r++) {
                if(data[r * width * 4 + c * 4 ]!=0 || data[r * width * 4 + c * 4 +1]!=0 || data[r * width * 4 + c * 4 +2]!=0) {
                    // console.log('left', c-1);
                    left = c;
                    ret.left = c;
                    ret.width = right - left;
                    break;
                }
            }
            c++;
            
            // If we've got it then return the height
            if(left) {
                return ret;    
            }
        }

        // We screwed something up...  What do you expect from free code?
        return false;
    }

    sketchPadMouseMoveEnd(e){
        super.sketchPadMouseMoveEnd(e)
        if(this.state.control_state=='style-stamp' && this.state.action=='style-brush'){
            var el = document.getElementById('style-stamp-canvas')
            var canvas = el.getContext('2d')
            // get content image
            var content_bbox = this.getCanvasBoundingBoxBW(canvas)
            console.log(content_bbox)
            if(content_bbox==false){
                this.setState({action:'idle', style_brush_cur: undefined, style_content_image: undefined})
            }else{
                var content_el = document.createElement('canvas')
                var content_canvas = content_el.getContext('2d')
                content_el.width = content_bbox['width']
                content_el.height = content_bbox['height']

                var target_layer = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer])
                content_canvas.drawImage(target_layer, content_bbox.left, content_bbox.top, content_bbox.width, content_bbox.height, 0, 0, content_bbox.width, content_bbox.height)

                var content_image = content_el.toDataURL();
                this.setState({action:'idle', style_brush_cur: undefined, style_content_image: content_image})
            }
        }
    }

    render(){
        return (<div className='col s6 oneboard'>
        <h2>SketchPad</h2>
        <div id='sketchpad' className='sketchpad select_disabled' onWheel={this.zoom_board_wheel.bind(this)} 
            onPointerOut={this.moveBoardEnd.bind(this)}
            onPointerMove={this.sketchPadMouseMove.bind(this)}> 
            <div className={'boardrender'} onPointerDown={this.sketchPadMouseMoveInit.bind(this)} onPointerUp={this.sketchPadMouseMoveEnd.bind(this)} 
                // onPointerOut={this.props.board_this.setSketchpadPosition.bind(this.props.board_this, -1, -1)}

            
            style={{
                width:this.state.boardzoom*this.state.boardlength, 
                height: this.state.boardzoom*this.state.boardlength,
                top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                left: this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],
            }}>
                
                {this.renderCanvas()}
                <svg id='sketch_pad_svg' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
                    {/* {this.renderAdjuster()} */}
                    {(this.state.control_state!='content-stamp' && this.state.control_state!='style-stamp') && this.renderLasso()}
                </svg>
                <canvas id='temp_canvas' width={1000} height={1000} style={{width: '100%', position:'absolute', top:'0', left: '0'}}></canvas>
                <canvas id='style-stamp-canvas' width={1000} height={1000} style={{width: '100%', position:'absolute', top:'0', left: '0', opacity: '0.5', display:(this.state.control_state=='style-stamp')?'':'none'}}></canvas>
                <svg id='sketch_pad_svg2' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
                    {this.renderAdjuster()}
                    {/* {this.renderLasso()} */}
                </svg>
                {this.props.board_this.renderCollaboratorsOnSketchpad()}
            </div>
            <SketchpadMainControllerAI mother_state={this.state} mother_this={this}></SketchpadMainControllerAI>
            <SketchpadLayerController mother_state={this.state} mother_this={this}></SketchpadLayerController>
            <SketchpadUndo mother_state={this.state} mother_this={this}></SketchpadUndo>
            <SketchpadStyleStampControllerAI2 mother_state={this.state} mother_this={this}></SketchpadStyleStampControllerAI2>
            
        </div>
    </div>)
    }
}

export default SketchPadAI