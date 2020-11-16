import React, {Component} from 'react'

class MoodboardImage extends Component{

    test(e){
        e.stopPropagation();
    }

    select_new_image(e){
        var arts = this.props.mother_state.arts
        var pos = arts[this.props.art_key].position.slice()
        var ratio = arts[this.props.art_key].ratio
        console.log(ratio)
        var _this = this
        this.props.mother_this.setState({current_image:[this.props.art_key], current_text:[], current_selected_pos: pos, current_selected_ratio: ratio}, function(){
            _this.props.mother_this.object_moving_init(e)
        })
    }

    add_an_image(e){
        var arts = this.props.mother_state.arts
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
        
        // var ratio = arts[this.props.art_key].ratio
        this.props.mother_this.setState({current_image:current_image, current_selected_pos: pos, current_selected_ratio: ratio}, function(){
            _this.props.mother_this.object_moving_init(e)
        })

    }

    choose_image(e){
        e.stopPropagation()
        var ecopied = {pageX: e.pageX, pageY: e.pageY}
        if(this.props.mother_state.control_state=='control_object'){
            if(this.props.mother_state.current_image.length==0 && this.props.mother_state.current_text.length==0){
                this.select_new_image(ecopied)
            }else if(this.props.mother_state.shift_down==false){
                this.select_new_image(ecopied)
            }else{
                this.add_an_image(ecopied)
            }
            
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
        // console.log(this.props.art_key)
        return (<g onPointerDown={this.test.bind(this)}>
            <image href={this.props.art.file} x={x} y={y} width={width} height={height} onPointerDown={this.choose_image.bind(this)}></image>
            {this.props.current_image.indexOf(this.props.art_key)!=-1 && <g>
            <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#aaaaff' fill='transparent' strokeWidth='2'></rect>
            {/* <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#333333' fill='transparent' strokeWidth='2'></rect>
            <circle cx={x} cy={y} r='6' stroke='#333333' fill='white'></circle>
            <circle cx={x+width} cy={y} r='6' stroke='#333333' fill='white'></circle>
            <circle cx={x} cy={y+height} r='6' stroke='#333333' fill='white'></circle>
            <circle cx={x+width} cy={y+height} r='6' stroke='#333333' fill='white'></circle> */}
            </g>}
            
        </g>)
    }
}

export default MoodboardImage;