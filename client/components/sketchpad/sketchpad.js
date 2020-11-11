import React, {Component} from 'react'
import ProtoBoard from '../proto/protoboard'
import SketchpadCanvas from './sketchpad_canvas'
import SketchpadLayerController from './sketchpad_layer_controller'
import SketchpadMainController from './sketchpad_main_controller'

class SketchPad extends ProtoBoard {
    state = {
        ...this.state,
        boardname:'sketchpad',
        control_state: 'move',
        //control_state --> area, move, brush, erase, comment, copy_content, copy_style
        // action --> move: idle, move_board
        //            brush: idle, brush

        brush_cur: undefined, 
        brush_size: 20,
        brush_img: undefined, 
        brush_color: '#000000',
        cur_colored_brush_img: undefined,

        erase_size: 20,

        layers: [
            {
                layer_id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
                opacity: 1,
            }
        ],
        current_layer: 0,
        


    }

    // TODO lasso tool?

    componentDidMount(){
        super.componentDidMount()
        var brush_img = new Image();
        // brush_img.crossOrigin="Anonymous"
        brush_img.src = '/static/brush.png'//'http://www.tricedesigns.com/wp-content/uploads/2012/01/brush2.png';
        console.log(brush_img)
        this.setState({brush_img})
    }

    getPositionOnBoard(xpix, ypix){
        var xpos = 1000*(this.state.boardcenter[0]-this.state.boardwidth/2/this.state.boardlength/this.state.boardzoom+xpix/this.state.boardzoom/this.state.boardlength)
        var ypos = 1000*(this.state.boardcenter[1]-this.state.boardheight/2/this.state.boardlength/this.state.boardzoom+ypix/this.state.boardzoom/this.state.boardlength)
        return [xpos, ypos]
    }

    getCurrentMouseOnBoard(e){
        var xpix = e.pageX - document.getElementById(this.state.boardname).offsetLeft
        var ypix = e.pageY - document.getElementById(this.state.boardname).offsetTop
        // console.log(xpix, ypix)
        
        // console.log(xpos, ypos)

        return this.getPositionOnBoard(xpix, ypix);
    }

    moveBoardEnd(){
        if(this.state.control_state=='brush' && this.state.action=='size'){
            return
        }
        if(this.state.control_state=='erase' && this.state.action=='size'){
            return
        }
        super.moveBoardEnd();
    }

    sketchPadMouseMoveInit(e){
        if(this.state.control_state=='move' && this.state.action=='idle'){
            this.moveBoardInit(e)
        }else if(this.state.control_state=='brush' && this.state.action=='idle'){
            this.brushInit(e)
        }else if(this.state.control_state=='erase' && this.state.action=='idle'){
            this.eraseInit(e)
        }else if(this.state.control_state=='brush' && this.state.action=='size'){
            this.setState({action:'idle'})
        }else if(this.state.control_state=='erase' && this.state.action=='size'){
            this.setState({action:'idle'})
        }
    }

    sketchPadMouseMove(e){
        if(this.state.control_state=='move' && this.state.action=='move_board'){
            this.moveMouse(e)
        }else if(this.state.control_state=='brush' && this.state.action=='brush'){
            this.brushMove(e)
        }else if(this.state.control_state=='erase' && this.state.action=='erase'){
            this.eraseMove(e)
        }

    }

    sketchPadMouseMoveEnd(e){
        if(this.state.control_state=='move' && this.state.action=='move_board'){
            this.moveBoardEnd(e)
        }else if (this.state.control_state=='brush'&&this.state.action=='brush'){
            this.brushEnd(e)
        }else if (this.state.control_state=='erase'&&this.state.action=='erase'){
            this.eraseEnd(e)
        }
    }

    brushInit(e){
        console.log(this.state.layers)
        var brush_canvas = document.createElement('canvas')
        brush_canvas.width = this.state.brush_size
        brush_canvas.height = this.state.brush_size
        var brush_canvas_ctx = brush_canvas.getContext('2d')
        brush_canvas_ctx.fillStyle=this.state.brush_color
        brush_canvas_ctx.fillRect(0, 0, brush_canvas.width, brush_canvas.height)
        brush_canvas_ctx.globalCompositeOperation = "destination-in";
        brush_canvas_ctx.drawImage(this.state.brush_img, 0, 0, this.state.brush_size, this.state.brush_size)
        console.log(brush_canvas_ctx)

        var cur_colored_brush_img = new Image();
        
        // console.log(brush_canvas.toDataURL())
        cur_colored_brush_img.src = brush_canvas.toDataURL();

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        ctx.lineJoin = ctx.lineCap = 'round'
        
        console.log(this.state.brush_img)
        this.setState({action:'brush', brush_cur:this.getCurrentMouseOnBoard(e), cur_colored_brush_img: cur_colored_brush_img})
       
    }

    distanceBetween(point1, point2){
        return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));
    }
    angleBetween(point1, point2){
        return Math.atan2( point2[0] - point1[0], point2[1] - point1[1] );
    }

    brushMove(e){
        // draw on the canvas
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');

        var brush_cur = this.getCurrentMouseOnBoard(e)
        console.log(brush_cur, this.state.brush_cur)
        var dist = this.distanceBetween(brush_cur, this.state.brush_cur)
        var angle = this.angleBetween(brush_cur, this.state.brush_cur)
        console.log(dist, angle)

        for (var i=0; i<dist; i++){
            var x = brush_cur[0]+(Math.sin(angle)*i)-25;
            var y = brush_cur[1]+(Math.cos(angle)*i)-25;
            console.log(x, y)
            ctx.drawImage(this.state.cur_colored_brush_img, x, y);
        }
        this.setState({brush_cur:brush_cur})


    }

    brushEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        layers[this.state.current_layer]['image'] = cur_image
        this.setState({action:'idle', brush_cur:undefined, cur_colored_brush_img: undefined})
    }

    eraseInit(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        ctx.globalCompositeOperation ='destination-out'
        ctx.lineWidth = this.state.erase_size
        ctx.beginPath();
        var brush_cur = this.getCurrentMouseOnBoard(e).slice()
        ctx.moveTo(brush_cur[0], brush_cur[1])
        this.setState({action:'erase', brush_cur: brush_cur})
        
    }

    eraseMove(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');

        var brush_cur = this.getCurrentMouseOnBoard(e).slice()

        console.log('?')
        ctx.lineTo(brush_cur[0], brush_cur[1])
        ctx.lineJoin = ctx.lineCap = 'round';

        ctx.stroke()

        this.setState({brush_cur: brush_cur})
    }

    eraseEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        // ctx.stroke()
        ctx.globalCompositeOperation ='source-over'
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        layers[this.state.current_layer]['image'] = cur_image
        this.setState({action:'idle', brush_cur: undefined})
    }

    renderCanvas(){
        return this.state.layers.map((layer, idx)=>{
            return <SketchpadCanvas key={'sketchpad_canvas'+layer['layer_id']} canvas_id={layer['layer_id']} mother_state={this.state}></SketchpadCanvas>
        }).reverse()
    }

    render(){
        return (<div className='col s6 oneboard'>
        <h2>SketchPad</h2>
        <div id='sketchpad' className='sketchpad' onWheel={this.zoom_board_wheel.bind(this)} 
            onMouseOut={this.moveBoardEnd.bind(this)}
            onMouseMove={this.sketchPadMouseMove.bind(this)}> 
            <div className={'boardrender'} onMouseDown={this.sketchPadMouseMoveInit.bind(this)} onMouseUp={this.sketchPadMouseMoveEnd.bind(this)} 
            
            style={{
                width:this.state.boardzoom*this.state.boardlength, 
                height: this.state.boardzoom*this.state.boardlength,
                top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                left: this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],
            }}>
                <svg id='sketch_pad_svg' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}></svg>
                {this.renderCanvas()}

            </div>
            <SketchpadMainController mother_state={this.state} mother_this={this}></SketchpadMainController>
            <SketchpadLayerController mother_state={this.state} mother_this={this}></SketchpadLayerController>
        </div>
    </div>)
    }
}

export default SketchPad