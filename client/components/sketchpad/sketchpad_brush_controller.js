import React, {Component} from 'react'

class SketchpadBrushController extends Component{
    componentDidMount(){
        console.log(this.props.mother_state.brush_img)
        var canvas= document.getElementById('brush_size_canvas')
        var ctx = canvas.getContext('2d')
        ctx.drawImage(this.props.mother_state.brush_img, 0, 0)
    }

    setColor(e){
        this.props.mother_this.setState({brush_color: e.target.value})
    }

    toggleSize(e){
        e.stopPropagation();
        if(this.props.mother_state.action=='idle'){
            this.props.mother_this.setState({action:'size'})
        }else{
            this.props.mother_this.setState({action:'idle'})
        }
        
    }

    change_brush_size(e){
        this.props.mother_this.setState({brush_size: e.target.value})
    }

    render(){

        return (<div className="controller sketchpad_brush_controller">
            <div className='controller_button'>
                <input type='color' value={this.props.mother_state.brush_color} onChange={this.setColor.bind(this)}
                style={{width: '38px', height: '38px'}}>

                </input>
            </div>
            <div className='controller_button'>
                <div style={{fontSize: 12, border: 'solid 4px white', width: 34, height: 34, margin: 'auto', paddingTop:'3px'}} onPointerDown={this.toggleSize.bind(this)}>
                    Size
                </div>
            </div>

            <div className='controller sketchpad_brush_size_controller' style={{border: 'solid 3px #333333', backgroundColor: '#eeeeee',
                display: (this.props.mother_state.control_state=='brush' && this.props.mother_state.action=='size')?'inline-block':'none' }}>
            <div style={{width:'10%', height: '100%', display: 'inline-block', verticalAlign:'bottom'}}>
                <input value={this.props.mother_state.brush_size} type='range' min='1' max='200' orient='vertical' onChange={this.change_brush_size.bind(this)}></input>
            </div>
            <div style={{width:'90%', height: '100%', display: 'inline-block', overflow:'hidden', position:'relative'}}>
                <canvas id='brush_size_canvas' width={this.props.mother_state.brush_img.width} height={this.props.mother_state.brush_img.height} 
                style={{width: this.props.mother_state.brush_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom, 
                height: this.props.mother_state.brush_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom,
                position:'absolute', left: 165.6/2-this.props.mother_state.brush_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom/2,
                top: 184/2-this.props.mother_state.brush_size/1000*this.props.mother_state.boardlength*this.props.mother_state.boardzoom/2,
                }}
                ></canvas>
            </div>    
            </div>

        </div>)
    }
}

export default SketchpadBrushController