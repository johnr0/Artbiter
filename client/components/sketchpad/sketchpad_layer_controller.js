import React, {Component} from 'react'

class SketchpadLayerController extends Component{
    state={
        layer_mouse_down: false,
        mouse_y_pos: undefined,
        y_init_pos: undefined, 
    }

    controllerWheel(e){
        e.stopPropagation()
    }

    selectLayer(idx,e){
        var ypos = e.pageY
        var _this = this
        var prev_current_layer_idx = this.props.mother_state.current_layer
        var layers = this.props.mother_state.layers
        var prev_current_layer = layers[prev_current_layer_idx]
        var layer_dict = this.props.mother_state.layer_dict
        var layer = layer_dict[layers[idx]]
        var layerChanged = false
        if(layer.choosen_by!='' && layer.choosen_by != this.props.mother_this.props.board_this.state.user_id){
            console.log('reeturn')
            return
        }
        if(layer.choosen_by != this.props.mother_this.props.board_this.state.user_id){
            layer.choosen_by = this.props.mother_this.props.board_this.state.user_id
            layerChanged = true
        }
        console.log("??", layerChanged)
        


        this.props.mother_this.setState({current_layer: idx, layers: layers, layer_dict:layer_dict}, function(){
            var y_init_pos = ypos
            //10-document.getElementById('sketchpad_layer_controller').getBoundingClientRect().top+document.getElementById('sketchpad_layer_'+_this.props.mother_state.current_layer).getBoundingClientRect().top
            console.log(ypos)
            var promises = []
            if(layerChanged){
                if(prev_current_layer!=undefined){
                    promises.push(_this.props.mother_this.props.board_this.ChooseLayers([layers[idx]],[prev_current_layer]))
                }else{
                    promises.push(_this.props.mother_this.props.board_this.ChooseLayers([layers[idx]],[]))
                }
            }
            promises.push(_this.setState({layer_mouse_down: true, mouse_y_pos: ypos, y_init_pos: y_init_pos, prev_current_layer: prev_current_layer_idx}))
            Promise.all(promises)

            
            if(_this.props.mother_state.control_state=='move-layer'){
                _this.props.mother_this.initializeMoveLayer()
            }
            if(_this.props.mother_state.control_state=='style-stamp'){
                _this.props.mother_this.sketchPadStyleContentFinalize()
            }
        })
        
        
    }

  
    deletelayer(){

        var layers = this.props.mother_state.layers
        var origin_layers = this.props.mother_state.layers.slice()
        console.log(origin_layers)
        if(layers.length>1 && this.props.mother_state.current_layer!=-1){
            var remove_idx = this.props.mother_state.current_layer
            var removed_layer_id = layers[remove_idx]
            console.log(this.props.mother_state.layer_dict[removed_layer_id])
            var removed_layer = JSON.parse(JSON.stringify(this.props.mother_state.layer_dict[removed_layer_id]))
            delete this.props.mother_state.layer_dict[removed_layer_id]
            layers.splice(remove_idx,1)
            var current_layer = -1//this.props.mother_state.current_layer-1
            // if(current_layer<0){
            //     current_layer =0
            // }
            Promise.all([
                this.props.mother_this.props.board_this.RemoveALayer(remove_idx, removed_layer, origin_layers),
                this.props.mother_this.setState({layers:layers, current_layer: current_layer})
            ])

            if(this.props.mother_state.control_state=='move-layer'){
                this.props.mother_this.setState({control_state:'move'})
            }
            
        }
        
    }

    renderLayerIcon(){
        return this.props.mother_state.layers.map((item, idx) => {
            var border = 'solid 4px transparent'
            var opacity = '50%'
            // console.log(idx)
            if(this.props.mother_state.layer_dict[item]==undefined){
                return
            }
            var layer_obj = this.props.mother_state.layer_dict[item]
            if(idx==this.props.mother_state.current_layer){
                border = 'solid 4px transparent'
                opacity='100%'
            }else if(layer_obj.choosen_by!=''){
                // if(this.props.mother_this.props.borad_this!=undefined){
                    if(this.props.mother_this.props.board_this.state.collaborator_dict[layer_obj.choosen_by]!=undefined){
                        border = 'solid 4px '+this.props.mother_this.props.board_this.state.collaborator_dict[layer_obj.choosen_by].color
                        opacity='80%'
                    } 
                // }    
            }
            var top = idx*43
            if(this.state.layer_mouse_down && this.props.mother_state.current_layer==idx){
                // console.log(this.state.ypos)
                top = idx*43+this.state.mouse_y_pos-this.state.y_init_pos
                // console.log(top)
            }else if(this.state.layer_mouse_down){
                if(idx>this.props.mother_state.current_layer && this.props.mother_state.current_layer*43+this.state.mouse_y_pos-this.state.y_init_pos>top){
                    top = (idx-1)*43
                }else if(idx<this.props.mother_state.current_layer && this.props.mother_state.current_layer*43+this.state.mouse_y_pos-this.state.y_init_pos<top){
                    top = (idx+1)*43
                }
            }
            // console.log(item)
            return (<div id={'sketchpad_layer_'+idx} style={{opacity: opacity, border: border, position: 'absolute', left: 1, top: top, width: '38px', height: '38px', marginBottom:'5px', backgroundColor: 'white'}} 
                    onPointerDown={this.selectLayer.bind(this, idx)} onPointerUp={this.layerDone.bind(this)} 
                    onDragOver={this.layerMove.bind(this)}
                    onDragEnd={this.layerDone.bind(this)}>
                <img src={this.props.mother_state.layer_dict[item].image} style={{width: '100%', height: '100%'}}></img>
            </div>)
        })
    }
    drags(e){
        console.log('draggy')
        // e.stopPropagation()
    }

    addNewLayer(e){
        e.stopPropagation()
       
        var layers = this.props.mother_state.layers
        var layer_id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        var layer = ({
            _id: layer_id, 
            board_id: this.props.mother_this.props.board_this.state.board_id,
            image: 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==',
            opacity: 1,
            choosen_by: '',
        })
        var layer_dict = this.props.mother_this.state.layer_dict
        layer_dict[layer_id] = layer
        Promise.all([
            this.props.mother_this.props.board_this.AddALayer(layers.length, layer_id, layer),
            this.props.mother_this.setState({layers:layers, layer_dict: layer_dict})
        ])
    }

    layerMove(e){
        e.stopPropagation()
        // console.log('move?')
        if(this.state.layer_mouse_down && this.state.mouse_y_pos!=e.pageY){
            console.log('move')
            var ypos= e.pageY//-document.getElementById('sketchpad_layer_controller').getBoundingClientRect().top
            this.setState({mouse_y_pos: ypos})
        }

    }

    layerDone(e){
        console.log(this.state.mouse_y_pos, this.state.y_init_pos, idx, this.props.mother_state.current_layer)
        e.stopPropagation()
        if(this.state.mouse_y_pos!=this.state.y_init_pos && this.props.mother_state.layers.length>1){
            var prev_layer = this.props.mother_state.layers.slice()
            var new_layer = []
            var pos=true
            var new_index = 0
            for(var idx in this.props.mother_state.layers){
                if(idx==this.props.mother_state.current_layer){
                    continue
                }
                var top = idx*43
                if(idx>this.props.mother_state.current_layer && this.props.mother_state.current_layer*43+this.state.mouse_y_pos-this.state.y_init_pos>top){
                    top = (idx-1)*43
                    
                }else if(idx<this.props.mother_state.current_layer && this.props.mother_state.current_layer*43+this.state.mouse_y_pos-this.state.y_init_pos<top){
                    top = (idx+1)*43
                    
                }

                if(top<this.props.mother_state.current_layer*43+this.state.mouse_y_pos-this.state.y_init_pos){
                    new_layer.push(this.props.mother_state.layers[idx])
                    new_index+=1
                }else{
                    if(pos){
                        pos=false
                        new_layer.push(this.props.mother_state.layers[this.props.mother_state.current_layer])
                        // new_index+=1
                    }
                    new_layer.push(this.props.mother_state.layers[idx])
                }

            }
            if(pos==true){
                new_layer.push(this.props.mother_state.layers[this.props.mother_state.current_layer])
            }
            console.log(new_layer, this.props.mother_state.layers)
            const promises = []
            for(var idx in new_layer){
                promises.push(function(){
                    var cur_new_layer = new_layer[idx]
                    var el = document.getElementById('sketchpad_canvas_'+idx)
                    var ctx = el.getContext('2d');
                    ctx.clearRect(0,0,ctx.width, ctx.height)
                    var img = new Image();
                    img.onload = function() {
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src =cur_new_layer['image']
                })
                
            }
            Promise.all(promises)
            var _this = this
            console.log(new_index)
            Promise.all([
                this.props.mother_this.props.board_this.ReorderLayers(new_layer, prev_layer),
                this.props.mother_this.setState({layers:new_layer, current_layer: new_index}, function(){
                    _this.setState({layer_mouse_down: false, mouse_y_pos:undefined, y_init_pos:undefined})
                })
            ])
            
        }
        else if(this.state.mouse_y_pos==this.state.y_init_pos && this.state.prev_current_layer!=-1 && this.state.prev_current_layer==this.props.mother_state.current_layer){
            var cl = this.props.mother_state.current_layer
            var layers = this.props.mother_state.layers.slice()
            var _this = this
            console.log('uppy')
            Promise.all([this.props.mother_this.props.board_this.ChooseLayers([],[layers[cl]]),
                this.setState({layer_mouse_down: false, mouse_y_pos:undefined, y_init_pos:undefined}, function(){
                    _this.props.mother_this.setState({current_layer:-1, control_state: 'move'})
                })

        
            ])
            
        }
        else{
            this.setState({layer_mouse_down: false, mouse_y_pos:undefined, y_init_pos:undefined})
        }
        
        
    }

    render(){
        return (<div  onWheel={this.controllerWheel.bind(this)} className='controller sketchpad_layer_controller'>
            <div id='sketchpad_layer_controller' className='layer_box' style={{position:'relative', overflowY:'auto', height: '250px'}} onPointerMove={this.layerMove.bind(this)} onPointerUp={this.layerDone.bind(this)}
            onDragOver={this.layerMove.bind(this)}

            onDrop={this.layerDone.bind(this)}>
                {this.renderLayerIcon()}
            </div>
            <div onPointerDown={this.addNewLayer.bind(this)} style={{textAlign: 'center', fontSize: 30}}>
                +
            </div>
            <div onPointerDown={this.deletelayer.bind(this)} style={{textAlign: 'center', fontSize: 30, color:(this.props.mother_state.layers.length>1 && this.props.mother_state.current_layer!=-1)?'white':'#888888'}}>
                <i className="fa fa-trash"></i>
            </div>
        </div>)
    }
}

export default  SketchpadLayerController;