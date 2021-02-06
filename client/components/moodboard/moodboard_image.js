import React, {Component} from 'react'

class MoodboardImage extends Component{

    test(e){
        e.stopPropagation();
    }

    select_new_image(obj_moving, e){
        var arts = this.props.mother_state.arts
        if(arts[this.props.art_key].choosen_by==''){
            var pos = arts[this.props.art_key].position.slice()
            var ratio = arts[this.props.art_key].ratio
            console.log(ratio)
            var _this = this

            if(arts[this.props.art_key].color!=undefined){
                this.props.mother_this.setState({color: arts[this.props.art_key].color})
            }

            Promise.all([
                this.props.mother_this.props.board_this.ChooseArtsTexts([this.props.art_key],[],this.props.mother_state.current_image.slice(0),this.props.mother_state.current_text.slice(0)),
                this.props.mother_this.setState({current_image:[this.props.art_key], current_text:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    if(obj_moving){
                        _this.props.mother_this.object_moving_init(e)
                    }
                    _this.props.mother_this.props.board_this.sketchpad.setState({})
                })
            ])
            
        }
        
    }

    add_an_image(obj_moving, e){
        var arts = this.props.mother_state.arts
        if(arts[this.props.art_key].choosen_by==''){
            var texts = this.props.mother_state.texts
            var pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
            var current_image = this.props.mother_state.current_image
            var current_text = this.props.mother_state.current_text
            current_image.push(this.props.art_key)
            var _this = this
            for (var i in current_image){
                var key = current_image[i]
                var cur_pos = arts[key].position.slice()
                if(cur_pos[0]<pos[0]){
                    pos[0] = cur_pos[0]    
                }
                if(cur_pos[1]<pos[1]){
                    pos[1] = cur_pos[1]    
                }
                if(cur_pos[2]>pos[2]){
                    pos[2] = cur_pos[2]    
                }
                if(cur_pos[3]>pos[3]){
                    pos[3] = cur_pos[3]    
                }
            }
            for (var i in current_text){
                var key = current_text[i]
                var cur_pos = texts[key].position.slice()
                if(cur_pos[0]<pos[0]){
                    pos[0] = cur_pos[0]    
                }
                if(cur_pos[1]<pos[1]){
                    pos[1] = cur_pos[1]    
                }
                if(cur_pos[2]>pos[2]){
                    pos[2] = cur_pos[2]    
                }
                if(cur_pos[3]>pos[3]){
                    pos[3] = cur_pos[3]    
                }
            }
            var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])
            
            Promise.all([
                this.props.mother_this.props.board_this.ChooseArtsTexts([this.props.art_key],[], [],[]),
                this.props.mother_this.setState({current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                    if(obj_moving){
                        _this.props.mother_this.object_moving_init(e)
                    }
                    _this.props.mother_this.props.board_this.sketchpad.setState({})
                })
            ])
            
        }
        

    }

    deselect_image(e){
        // e.stopPropagation()
        var arts = this.props.mother_state.arts
        console.log(arts[this.props.art_key].choosen_by, this.props.mother_this.props.board_this.state.user_id)
        if(arts[this.props.art_key].choosen_by==this.props.mother_this.props.board_this.state.user_id){
            var pos = arts[this.props.art_key].position.slice()
            var ratio = arts[this.props.art_key].ratio
            console.log(ratio)
            var _this = this

            if(arts[this.props.art_key].color!=undefined){
                this.props.mother_this.setState({color: arts[this.props.art_key].color})
            }

            var texts = this.props.mother_state.texts
            var current_image = this.props.mother_state.current_image
            var current_text = this.props.mother_state.current_text
            current_image.splice(current_image.indexOf(this.props.art_key), 1)

            
            if(current_image.length>0){
                pos = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MIN_VALUE, Number.MIN_VALUE]
                for (var i in current_image){
                    var key = current_image[i]
                    var cur_pos = arts[key].position.slice()
                    if(cur_pos[0]<pos[0]){
                        pos[0] = cur_pos[0]    
                    }
                    if(cur_pos[1]<pos[1]){
                        pos[1] = cur_pos[1]    
                    }
                    if(cur_pos[2]>pos[2]){
                        pos[2] = cur_pos[2]    
                    }
                    if(cur_pos[3]>pos[3]){
                        pos[3] = cur_pos[3]    
                    }
                }
                for (var i in current_text){
                    var key = current_text[i]
                    var cur_pos = texts[key].position.slice()
                    if(cur_pos[0]<pos[0]){
                        pos[0] = cur_pos[0]    
                    }
                    if(cur_pos[1]<pos[1]){
                        pos[1] = cur_pos[1]    
                    }
                    if(cur_pos[2]>pos[2]){
                        pos[2] = cur_pos[2]    
                    }
                    if(cur_pos[3]>pos[3]){
                        pos[3] = cur_pos[3]    
                    }
                }
                var ratio = (pos[2]-pos[0])/(pos[3]-pos[1])
            }

            if(current_image.length==0){
                Promise.all([
                    this.props.mother_this.props.board_this.ChooseArtsTexts([],[],[this.props.art_key],[]),
                    this.props.mother_this.setState({current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                        _this.props.mother_this.props.board_this.sketchpad.setState({})
                    })
                ])
            }else{
                Promise.all([
                    this.props.mother_this.props.board_this.ChooseArtsTexts([],[],[this.props.art_key],[]),
                    this.props.mother_this.setState({current_image:current_image, current_selected_pos:pos, current_selected_ratio: ratio, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
                        _this.props.mother_this.props.board_this.sketchpad.setState({})
                    })
                ])
            }
            
            
        }
    }

    choose_image(e){
        e.stopPropagation()
        console.log('look',this.props.mother_state.control_state, this.props.mother_state.action)
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        if(this.props.mother_state.action!='object_moving'){
            console.log(this.props.mother_state.current_image.indexOf(this.props.art._id))
            if(this.props.mother_state.control_state=='control_object'){
                if(this.props.mother_state.current_image.length==0 && this.props.mother_state.current_text.length==0){
                    this.select_new_image(true, ecopied)
                }else if(this.props.mother_state.current_image.indexOf(this.props.art._id)!=-1){
                    console.log('deselect')
                    this.deselect_image(ecopied)
                }else if(this.props.mother_state.shift_down==false){
                    this.select_new_image(true, ecopied)
                }else{
                    this.add_an_image(true, ecopied)
                }
                
            }else if(this.props.mother_state.control_state=='content-stamp'){
                console.log('yeah')
                this.select_new_image(false, ecopied)
            }
        }else{
            
            if(this.props.mother_state.current_image.indexOf(this.props.art._id)!=-1&&this.state.remove){
                console.log('deselect')
                var cur_mouse_pos = this.props.mother_this.getCurrentMouseOnBoard(e)
                if(this.props.mother_state.init_mouse_pos[0]==cur_mouse_pos[0]&&this.props.mother_state.init_mouse_pos[1]==cur_mouse_pos[1]){
                    if(this.props.mother_state.current_image.length==1){
                        this.deselect_image(ecopied)
                    }else if(this.props.mother_state.shift_down){
                        this.deselect_image(ecopied)
                    }
                    
                }
                
            }
            this.props.mother_this.object_moving_end(e)
        }
        this.setState({remove:false})
        
    }

    object_moving_init(e){
        if(this.props.mother_state.action!='object_moving'){
            this.setState({remove:true})
            this.props.mother_this.object_moving_init(e)
        }
        
    }

    object_moving_end(e){
        
        if(this.props.mother_state.action=='object_moving'){
            if(e!=undefined){
                e.stopPropagation()
            }
            this.props.mother_this.object_moving_end(e)
        }
    }

    render(){
        var smallx = (this.props.art.position[0]<this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var bigx = (this.props.art.position[0]>this.props.art.position[2])?this.props.art.position[0]:this.props.art.position[2]
        var smally = (this.props.art.position[1]<this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var bigy = (this.props.art.position[1]>this.props.art.position[3])?this.props.art.position[1]:this.props.art.position[3]
        var x = smallx* this.props.boardlength
        var y = smally* this.props.boardlength

        var width = (bigx-smallx)* this.props.boardlength
        var height = (bigy-smally)* this.props.boardlength

        var color = ''
        if(this.props.art.choosen_by==this.props.mother_this.props.board_this.state.user_id){
            color = '#aaaaff'
        }else if(this.props.art.choosen_by!=''){
            if(this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by]!=undefined){
                color = this.props.mother_this.props.board_this.state.collaborator_dict[this.props.art.choosen_by].color
            }
            
        }
        // console.log(this.props.art)
        return (<g onPointerDown={this.test.bind(this)}>
            <image href={this.props.art.file} x={x} y={y} width={width} height={height} onPointerDown={this.choose_image.bind(this)} onPointerUp={this.object_moving_end.bind(this)} opacity={(this.props.art.enabled)?'1':'0.3'}></image>
            {color!='' && <g>
            <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke={color} fill='transparent' strokeWidth='2' onPointerDown={this.object_moving_init.bind(this)} onPointerUp={this.choose_image.bind(this)}></rect>
            </g>}
            
        </g>)
    }
}

export default MoodboardImage;