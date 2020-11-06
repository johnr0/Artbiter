import React, {Component} from 'react'


class MoodBoardMainController extends Component{

    changeControlState(control_state){
        console.log(control_state)
        this.props.mother_this.setState({control_state: control_state})
    }

    
    render(){
        return (<div className='controller moodboard_main_controller'>
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_image')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_image')}>
                <i className="controller_button_icon material-icons">image</i>
            </div>
            {/* <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_comment')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_comment')}>
                <i className="controller_button_icon material-icons">comment</i>
            </div> */}
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='add_text')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'add_text')}>
                <i className="controller_button_icon material-icons">title</i>
            </div>
            {/* <div className='controller_button' style={{color: (this.props.mother_state.control_state=='move_board')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'move_board')}>
                <i className="controller_button_icon material-icons">pan_tool</i>
            </div> */}
            <div className='controller_button' style={{color: (this.props.mother_state.control_state=='control_object')?'white':'#888888'}}
                onClick={this.changeControlState.bind(this, 'control_object')}>
                <i className="controller_button_icon fa fa-mouse-pointer"></i>
            </div>
        </div>)
    }
}

export default MoodBoardMainController