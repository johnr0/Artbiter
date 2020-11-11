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

        brush_pre_canvas: undefined, 

        erase_size: 20,

        layers: [
            {
                layer_id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
                image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
                opacity: 1,
            }
        ],
        current_layer: 0,

        lasso: [],
        lasso_img: undefined, 
        nonlasso_ret: undefined, 

        // below used for move-layer
        lassoed_canvas: undefined,
        unlassoed_canvas: undefined,

        move_layer_init_pos: undefined,
        adjust_pre_canvas: undefined, 
        init_lasso: undefined, 

        init_nonlasso_ret: undefined,

        


    }

    // TODO lasso tool - lasso-based/nonlasso-based resize / rotation

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
        }else if(this.state.control_state=='area' && this.state.action=='idle'){
            this.lassoInit(e)
        }
    }

    sketchPadMouseMove(e){
        if(this.state.control_state=='move' && this.state.action=='move_board'){
            this.moveMouse(e)
        }else if(this.state.control_state=='brush' && this.state.action=='brush'){
            this.brushMove(e)
        }else if(this.state.control_state=='erase' && this.state.action=='erase'){
            this.eraseMove(e)
        }else if(this.state.control_state=='area' && this.state.action=='lasso'){
            this.lassoMove(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            this.moveLayerMove(e)
        }

    }

    sketchPadMouseMoveEnd(e){
        if(this.state.control_state=='move' && this.state.action=='move_board'){
            this.moveBoardEnd(e)
        }else if (this.state.control_state=='brush'&&this.state.action=='brush'){
            this.brushEnd(e)
        }else if (this.state.control_state=='erase'&&this.state.action=='erase'){
            this.eraseEnd(e)
        }else if(this.state.control_state=='area' && this.state.action=='lasso'){
            this.lassoEnd(e)
        }else if(this.state.control_state=='move-layer' && this.state.action=='move-layer'){
            this.moveLayerEnd(e)
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

        var brush_pre_canvas = document.createElement('canvas')
        brush_pre_canvas.width = 1000
        brush_pre_canvas.height = 1000
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
        brush_pre_canvas_ctx.lineJoin = brush_pre_canvas_ctx.lineCap = 'round'
        
        // console.log(brush_canvas.toDataURL())
        cur_colored_brush_img.src = brush_canvas.toDataURL();

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        ctx.lineJoin = ctx.lineCap = 'round'
        
        console.log(this.state.brush_img)
        this.setState({action:'brush', brush_cur:this.getCurrentMouseOnBoard(e), cur_colored_brush_img: cur_colored_brush_img, brush_pre_canvas:brush_pre_canvas})
       
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
        var brush_pre_canvas = this.state.brush_pre_canvas
        var brush_pre_ctx = brush_pre_canvas.getContext('2d');
        brush_pre_ctx.clearRect(0,0,1000,1000);

        var brush_cur = this.getCurrentMouseOnBoard(e)
        console.log(brush_cur, this.state.brush_cur)
        var dist = this.distanceBetween(brush_cur, this.state.brush_cur)
        var angle = this.angleBetween(brush_cur, this.state.brush_cur)
        console.log(dist, angle)

        for (var i=0; i<dist; i++){
            var x = brush_cur[0]+(Math.sin(angle)*i)-25;
            var y = brush_cur[1]+(Math.cos(angle)*i)-25;
            // console.log(x, y)
            brush_pre_ctx.drawImage(this.state.cur_colored_brush_img, x, y);
            // ctx.drawImage(this.state.cur_colored_brush_img, x, y);
        }
        
        // apply lasso
        if(this.state.lasso_img!=undefined){
            brush_pre_ctx.globalCompositeOperation = 'destination-in'
            brush_pre_ctx.drawImage(this.state.lasso_img, 0, 0, 1000, 1000)
            brush_pre_ctx.globalCompositeOperation = 'source-over'
        }
        // move lasso image to context
        ctx.drawImage(brush_pre_canvas, 0, 0)

        this.setState({brush_cur:brush_cur})


    }

    brushEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        layers[this.state.current_layer]['image'] = cur_image
        this.setState({action:'idle', brush_cur:undefined, cur_colored_brush_img: undefined, brush_pre_canvas: undefined})
    }

    eraseInit(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        ctx.globalCompositeOperation ='destination-out'
        ctx.lineWidth = this.state.erase_size
        ctx.beginPath();
        var brush_cur = this.getCurrentMouseOnBoard(e).slice()
        ctx.moveTo(brush_cur[0], brush_cur[1])

        var brush_pre_canvas = document.createElement('canvas')
        brush_pre_canvas.width = 1000
        brush_pre_canvas.height = 1000
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')
        brush_pre_canvas_ctx.lineWidth = this.state.erase_size


        this.setState({action:'erase', brush_cur: brush_cur, brush_pre_canvas: brush_pre_canvas})
        
    }

    eraseMove(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');

        var brush_pre_canvas = this.state.brush_pre_canvas
        var brush_pre_canvas_ctx = brush_pre_canvas.getContext('2d')

        brush_pre_canvas_ctx.clearRect(0,0,1000,1000);

        var brush_cur = this.getCurrentMouseOnBoard(e).slice()

        console.log('?')
        brush_pre_canvas_ctx.lineTo(brush_cur[0], brush_cur[1])
        brush_pre_canvas_ctx.lineJoin = ctx.lineCap = 'round';

        brush_pre_canvas_ctx.stroke()
        if(this.state.lasso_img!=undefined){
            brush_pre_canvas_ctx.globalCompositeOperation='destination-in'
            brush_pre_canvas_ctx.drawImage(this.state.lasso_img, 0, 0, 1000, 1000)
            brush_pre_canvas_ctx.globalCompositeOperation='source-over'
        }

        ctx.drawImage(brush_pre_canvas, 0, 0)
        

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
        this.setState({action:'idle', brush_cur: undefined, brush_pre_canvas:undefined})
    }


    lassoInit(e){
        var pos = this.getCurrentMouseOnBoard(e)
        console.log(pos)
        this.setState({action:'lasso', lasso:[[pos[0], pos[1]]]})
    }

    lassoMove(e){
        var pos = this.getCurrentMouseOnBoard(e)
        var lasso = this.state.lasso
        // console.log(pos)
        lasso.push([pos[0], pos[1]])
        this.setState({lasso:lasso})
    }

    lassoEnd(e){
        if(this.state.lasso.length>1){
            var canvas = document.createElement('canvas')
            var ctx = canvas.getContext('2d')
            canvas.width = 1000
            canvas.height = 1000
            ctx.beginPath();
            ctx.fillStyle='black';
            for(var i in this.state.lasso){
                var point = this.state.lasso[i]
                console.log(point)
                if(i==0){
                    ctx.moveTo(point[0], point[1])
                }else{
                    ctx.lineTo(point[0], point[1])
                }
            }
            ctx.closePath()
            ctx.stroke()
            ctx.fill();
          
            this.setState({action:'idle', lasso_img:canvas})
        }else{
            this.setState({action:'idle', lasso_img:undefined, lasso:[]})
        }
        
    }

    moveLayerInit(e){
        var pos = this.getCurrentMouseOnBoard(e)
        var adjust_pre_canvas = document.createElement('canvas')
        adjust_pre_canvas.width = 1000
        adjust_pre_canvas.height = 1000

        // adjust_pre_canvas.getContext('2d') = 
        if(this.state.lasso.length>0){
            this.setState({action:'move-layer', move_layer_init_pos: pos, adjust_pre_canvas: adjust_pre_canvas, init_lasso:this.state.lasso.slice(0)})
        }else{
            console.log(JSON.parse(JSON.stringify(this.state.nonlasso_ret)))
            this.setState({action:'move-layer', move_layer_init_pos: pos, adjust_pre_canvas: adjust_pre_canvas, init_nonlasso_ret:JSON.parse(JSON.stringify(this.state.nonlasso_ret))})
        }
        
        
    }

    moveLayerMove(e){  
        var adjust_pre_canvas = this.state.adjust_pre_canvas
        var adjust_pre_ctx = adjust_pre_canvas.getContext('2d')
        adjust_pre_ctx.clearRect(0,0,1000,1000)

        var pos = this.getCurrentMouseOnBoard(e)

        adjust_pre_ctx.drawImage(this.state.unlassoed_canvas, 0, 0)

        adjust_pre_ctx.translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
        adjust_pre_ctx.drawImage(this.state.lassoed_canvas, 0, 0)
        adjust_pre_ctx.translate(-pos[0]+this.state.move_layer_init_pos[0], -pos[1]+this.state.move_layer_init_pos[1])

        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        ctx.clearRect(0,0,1000,1000)

        ctx.drawImage(adjust_pre_canvas, 0, 0)

        if(this.state.lasso.length>0){
            var init_lasso = this.state.init_lasso    
            var lasso = []
            for (var i in init_lasso){
                var po = init_lasso[i]
                lasso.push([po[0]+pos[0]-this.state.move_layer_init_pos[0], po[1]+pos[1]-this.state.move_layer_init_pos[1]])
            }
            this.setState({lasso})
        }else{
            var nonlasso_ret = {}
            nonlasso_ret.left = this.state.init_nonlasso_ret.left+pos[0]-this.state.move_layer_init_pos[0]
            nonlasso_ret.top = this.state.init_nonlasso_ret.top+pos[1]-this.state.move_layer_init_pos[1]
            nonlasso_ret.width = this.state.init_nonlasso_ret.width
            nonlasso_ret.height = this.state.init_nonlasso_ret.height
            console.log(nonlasso_ret)
            this.setState({nonlasso_ret})
        }
        
        

    }

    moveLayerEnd(e){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var cur_image = el.toDataURL()
        var layers = this.state.layers
        layers[this.state.current_layer]['image'] = cur_image

        var pos = this.getCurrentMouseOnBoard(e)
        var lassoed_canvas = this.state.lassoed_canvas
        

        var new_l_canvas = document.createElement('canvas')
        new_l_canvas.width = 1000
        new_l_canvas.height = 1000
        new_l_canvas.getContext('2d').translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
        new_l_canvas.getContext('2d').drawImage(lassoed_canvas, 0, 0)

        if(this.state.lasso.length>0){
            var new_lasso = document.createElement('canvas')
            new_lasso.width = 1000
            new_lasso.height = 1000
            new_lasso.getContext('2d').translate(pos[0]-this.state.move_layer_init_pos[0], pos[1]-this.state.move_layer_init_pos[1])
            new_lasso.getContext('2d').drawImage(this.state.lasso_img, 0, 0)
            this.setState({action:'idle', move_layer_init_pos: undefined, adjust_pre_canvas: undefined, layers: layers, lassoed_canvas:new_l_canvas, lasso_img: new_lasso})
        }else{
            this.setState({action:'idle', move_layer_init_pos: undefined, adjust_pre_canvas: undefined, layers: layers, lassoed_canvas:new_l_canvas})
        }
        
        
        
        
    }

    renderCanvas(){
        return this.state.layers.map((layer, idx)=>{
            return <SketchpadCanvas key={'sketchpad_canvas'+layer['layer_id']} canvas_id={layer['layer_id']} mother_state={this.state}></SketchpadCanvas>
        }).reverse()
    }

    renderAdjuster(){
        if(this.state.control_state=='move-layer'){
            if(this.state.lasso.length>0){
                var xmax=Number.MIN_VALUE
                var ymax = Number.MIN_VALUE
                var xmin = Number.MAX_VALUE
                var ymin = Number.MAX_VALUE

                for(var i in this.state.lasso){
                    var cur_p = this.state.lasso[i]
                    if(cur_p[0]>xmax){
                        xmax = cur_p[0]
                    }else if(cur_p[0]<xmin){
                        xmin = cur_p[0]
                    }

                    if(cur_p[1]>ymax){
                        ymax = cur_p[1]
                    }else if(cur_p[1]<ymin){
                        ymin = cur_p[1]
                    }
                }
                console.log(xmin, ymin)
                return (<g>
                    <rect x={xmin/1000*this.state.boardlength*this.state.boardzoom} y={ymin/1000*this.state.boardlength*this.state.boardzoom} width={(xmax-xmin)/1000*this.state.boardlength*this.state.boardzoom} height={(ymax-ymin)/1000*this.state.boardlength*this.state.boardzoom}
                     style={{fill:'transparent', stroke:'#333333', strokeDasharray:"5,5"}}
                     onMouseDown={this.moveLayerInit.bind(this)}>

                    </rect>
                </g>)
            }else if(this.state.nonlasso_ret!=undefined){
                var ret = this.state.nonlasso_ret
                return (<g>
                    <rect x={ret.left/1000*this.state.boardlength*this.state.boardzoom} y={ret.top/1000*this.state.boardlength*this.state.boardzoom} width={ret.width/1000*this.state.boardlength*this.state.boardzoom} height={ret.height/1000*this.state.boardlength*this.state.boardzoom}
                     style={{fill:'transparent', stroke:'#333333', strokeDasharray:"5,5"}}
                     onMouseDown={this.moveLayerInit.bind(this)}>
    
                    </rect>
                </g>)
            }
    
        }
    }

    renderLasso(){
        if(this.state.lasso.length!=0){
            var path = "M"
            for(var i in this.state.lasso){
                var cur_point = this.state.lasso[i]
                path = path+(cur_point[0]/1000*this.state.boardlength*this.state.boardzoom).toString()+' '+(cur_point[1]/1000*this.state.boardlength*this.state.boardzoom).toString()
                if(i!=this.state.lasso.length-1){
                    path = path+' L'
                }else{
                    path = path+' Z'
                }
            }
            return (<path d={path} fill='transparent' stroke='#333333' strokeDasharray='5, 5'></path>)
        }
    }

    initializeMoveLayer(){
        var el = document.getElementById('sketchpad_canvas_'+this.state.layers[this.state.current_layer]['layer_id'])
        var ctx = el.getContext('2d');
        if(this.state.lasso_img!=undefined){
            

            var lassoed_canvas = document.createElement('canvas')
            lassoed_canvas.width =1000
            lassoed_canvas.height=1000 
            var lassoed_ctx = lassoed_canvas.getContext('2d')

            var unlassoed_canvas = document.createElement('canvas')
            unlassoed_canvas.width =1000
            unlassoed_canvas.height=1000 
            var unlassoed_ctx = unlassoed_canvas.getContext('2d')

            lassoed_ctx.drawImage(el,0,0)
            unlassoed_ctx.drawImage(el,0,0)

            lassoed_ctx.globalCompositeOperation='destination-in'
            unlassoed_ctx.globalCompositeOperation = 'destination-out'

            lassoed_ctx.drawImage(this.state.lasso_img,0,0)
            unlassoed_ctx.drawImage(this.state.lasso_img,0,0)
            this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas});
        }else{
            var lassoed_canvas = document.createElement('canvas')
            lassoed_canvas.width =1000
            lassoed_canvas.height=1000 
            var lassoed_ctx = lassoed_canvas.getContext('2d')
            lassoed_ctx.drawImage(el,0,0)

            var unlassoed_canvas = document.createElement('canvas')
            unlassoed_canvas.width =1000
            unlassoed_canvas.height=1000 

            var ret = this.getCanvasBoundingBox(ctx)
            console.log(ret)
            if(ret==false){
                this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas, nonlasso_ret: undefined});
            }else{
                this.setState({lassoed_canvas: lassoed_canvas, unlassoed_canvas: unlassoed_canvas, nonlasso_ret: ret});
            }
            
        }


    }

    getCanvasBoundingBox(ctx, left=0, top=0, width=1000, height=1000){
        var ret = {};
    
        // Get the pixel data from the canvas
        var data = ctx.getImageData(left, top, width, height).data;
        console.log(data);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('last', r);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('first', r);
                    first = r-1;
                    ret.top = r-1;
                    ret.height = last - first - 1;
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('last', r);
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
                if(data[r * width * 4 + c * 4 + 3]) {
                    console.log('left', c-1);
                    left = c;
                    ret.left = c;
                    ret.width = right - left - 1;
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
                <svg id='sketch_pad_svg' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
                    {/* {this.renderAdjuster()} */}
                    {this.renderLasso()}
                </svg>
                {this.renderCanvas()}
                <svg id='sketch_pad_svg2' width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength} style={{position: 'absolute', top: '0', left: '0'}}>
                    {this.renderAdjuster()}
                    {/* {this.renderLasso()} */}
                </svg>

            </div>
            <SketchpadMainController mother_state={this.state} mother_this={this}></SketchpadMainController>
            <SketchpadLayerController mother_state={this.state} mother_this={this}></SketchpadLayerController>
        </div>
    </div>)
    }
}

export default SketchPad