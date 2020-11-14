import React, {Component} from 'react'
import Api from '../../middleware/api'
import MoodBoard from '../moodboard/moodboard'
import SketchPad from '../sketchpad/sketchpad'

class Board extends Component{
    state={
        user_email: undefined,
        user_id: undefined,
        current_collaborators: {},
        board_id: undefined, 

        collaborator_dict: {},
        // lastmouseupdate: new Date(),
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }

    addCollaboratorEmail(user_id){
        var _this = this
        Api.app.service('users').find({query: {_id:user_id}})
        .then((res)=>{
            var collaborator_dict=this.state.collaborator_dict
            collaborator_dict[user_id] = {email: res[0].email, color: this.getRandomColor()}

            _this.setState({collaborator_dict}, function(){
                console.log(this.state)
            })
        })
    }

    
    componentDidMount(){
        var board_id = this.gup('_id')
        var _this = this
        Api.app.reAuthenticate().then((res)=>{
            var user_id = res.user['_id']
            Api.app.service('boards').find({query: {_id: board_id}})
            .then((res)=>{
                if(res.length==0){
                    window.location.href='/boardlist'
                }else{
                    console.log(res[0])
                    for(var j in res[0].collaborators){
                        if(res[0].collaborators[j]!=user_id){
                            this.addCollaboratorEmail(res[0].collaborators[j])
                        }
                        
                    }
                    if(res[0].owner!=user_id){
                        this.addCollaboratorEmail(res[0].owner)
                    }

                    // propage board contents to sketchpad and moodboard
                    var layers = res[0]['layers']
                    var arts = res[0]['arts']
                    var texts = res[0]['texts']
                    var current_collaborators = res[0]['current_collaborators']
                    current_collaborators[user_id] = {
                        sketch_pos:[-1,-1],
                        moodboard_pos: [-1, -1],
                    }
                    var set = {}
                    set['current_collaborators.'+user_id] = current_collaborators[user_id]
                    set['updated']='current_collaborators.'+user_id
                    console.log(set)
                    console.log(layers, arts, texts)
                    Api.app.service('boards').update(board_id, {$set: set})
                    .then((res)=>{
                        _this.setState({current_collaborators: current_collaborators, board_id: board_id, user_id: user_id}, function(){
                            _this.refs.sketchpad.setState({layers: layers})
                            _this.refs.moodboard.setState({arts: arts, texts:texts})
                        })
                    })

                    
                    
                    console.log('done')

                }
            })
        }).catch((err)=>{
            window.location.href='/'
        })

        Api.app.service('boards').on('updated',data=>{
            // console.log(data)
            
            var updated = data.updated
            if(updated.indexOf('current_collaborators')!=-1){
                var current_collaborators = this.state.current_collaborators
                current_collaborators[updated.split('.')[1]] = data.current_collaborators[updated.split('.')[1]]
                // var moodboard_pos = data.current_collaborators[updated.split('.')[1]].moodboard_pos
                // var sketch_pos = data.current_collaborators[updated.split('.')[1]].sketch_pos
                this.setState({current_collaborators})
            }
            // var current_collaborators = res[0]['current_collaborators']
        })
    }



    gup( name, url ) {
        if (!url) url = location.href;
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&]"+name+"=([^&#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( url );
        return results == null ? null : results[1];
    }

    setMoodboardPosition(x, y){
        // if(new Date()-this.state.lastmouseupdate>500){
            var current_collaborators = this.state.current_collaborators
            // console.log(this.state.user_id)
            current_collaborators[this.state.user_id]['moodboard_pos'] = [x, y]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.moodboard_pos'] = [x, y]
            set['updated']='current_collaborators.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboratorsOnMoodBoard(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id){
                var moodboard_pos = this.state.current_collaborators[current_collaborator].moodboard_pos
                // console.log(moodboard_pos)
                if(moodboard_pos[0]>=0 && moodboard_pos[1]>=0){
                    var name = this.state.collaborator_dict[current_collaborator]['email'].split('@')[0]
                    name = name.substring(0,3)
                    return (<div className='collaboratorCursor' style={{left: moodboard_pos[0]*this.refs.moodboard.state.boardzoom*this.refs.moodboard.state.boardlength, 
                        top: moodboard_pos[1]*this.refs.moodboard.state.boardzoom*this.refs.moodboard.state.boardlength, 
                        color:this.state.collaborator_dict[current_collaborator]['color']}}>
                            <span style={{fontSize:20}}><i className={"fas fa-mouse-pointer"}></i></span>
                            <span style={{border: 'solid 2px '+this.state.collaborator_dict[current_collaborator]['color'],color:'black', backgroundColor:'white', borderRadius: '3px'}}>{name}</span>
                        </div>)
                }
                
            }
            
        })
    }

    setSketchpadPosition(x, y){
        // if(new Date()-this.state.lastmouseupdate>500){
            var current_collaborators = this.state.current_collaborators
            // console.log(this.state.user_id)
            current_collaborators[this.state.user_id]['sketch_pos'] = [x, y]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.sketch_pos'] = [x, y]
            set['updated']='current_collaborators.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboratorsOnSketchpad(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id){
                var sketch_pos = this.state.current_collaborators[current_collaborator].sketch_pos
                // console.log(moodboard_pos)
                if(sketch_pos[0]>=0 && sketch_pos[1]>=0){
                    var name = this.state.collaborator_dict[current_collaborator]['email'].split('@')[0]
                    name = name.substring(0,3)
                    return (<div className='collaboratorCursor' style={{left: sketch_pos[0]/1000*this.refs.sketchpad.state.boardzoom*this.refs.sketchpad.state.boardlength, 
                        top: sketch_pos[1]/1000*this.refs.sketchpad.state.boardzoom*this.refs.sketchpad.state.boardlength, 
                        color:this.state.collaborator_dict[current_collaborator]['color']}}>
                            <span style={{fontSize:20}}><i className={"fas fa-mouse-pointer"}></i></span>
                            <span style={{border: 'solid 2px '+this.state.collaborator_dict[current_collaborator]['color'],color:'black', backgroundColor:'white', borderRadius: '3px'}}>{name}</span>
                        </div>)
                }
                
            }
            
        })
    }

    render(){
        return (<div style={{flex: 'auto', width: '100%'}} className='row'>
            <SketchPad board_this={this} board_state={this.state} ref='sketchpad'></SketchPad>
            <MoodBoard board_this={this} board_state={this.state} ref='moodboard'></MoodBoard>
        </div>)
    }
}

export default Board