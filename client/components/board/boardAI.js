import React from 'react'
import Board from './board'
import Api from '../../middleware/api'
import MoodBoardAI from '../moodboard/moodboardAI'
import SketchPadAI from '../sketchpad/sketchpadAI'

class BoardAI extends Board{

    componentDidMount(){
        this.runAuth()
        this.prepareUpdates()
        // when groups are created
        Api.app.service('groups').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var groups = this.refs.moodboard.state.groups
                groups[data._id] = data
                this.refs.moodboard.setState({groups})
            }
        })

        Api.app.service('groups').on('removed', (data)=>{
            var groups = this.refs.moodboard.state.groups
            delete groups[data._id]
            this.refs.moodboard.setState({groups})
        
        })

        Api.app.service('groups').on('patched', (data)=>{
            if(data.board_id==this.state.board_id){
                if(data.updated == 'groups_position'){
                    var groups = this.refs.moodboard.state.groups
                    groups[data._id].pos = data.pos
                    this.refs.moodboard.setState({groups})
                }else if(data.updated == 'groups_add' || data.updated=='groups_remove'){
                    var groups = this.refs.moodboard.state.groups
                    groups[data._id].pos = data.pos
                    groups[data._id].art_ids = data.art_ids
                    groups[data._id].user_info = data.user_info
                    this.refs.moodboard.setState({groups})
                }else if(data.updated.indexOf('groups_relate')!=-1){
                    var groups = this.refs.moodboard.state.groups
                    groups[data._id].higher_group = data.higher_group
                    this.refs.moodboard.setState({groups})
                }else if(data.updated == 'groups_toggle_inclusion'){
                    var groups = this.refs.moodboard.state.groups
                    groups[data._id].user_info = data.user_info
                    this.refs.moodboard.setState({groups})
                }
                
            }
        })

        Api.app.service('searched_arts').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var searched_arts = this.refs.moodboard.state.searched_arts
                searched_arts[data._id] = data
                this.refs.moodboard.setState({searched_arts})
            }
        })

        Api.app.service('searched_arts').on('removed', (data)=>{
            var searched_arts = this.refs.moodboard.state.searched_arts
            delete searched_arts[data._id]
            this.refs.moodboard.setState({searched_arts})
        
        })

        Api.app.service('disagreed_arts').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var disagreed_arts = this.refs.moodboard.state.disagreed_arts
                disagreed_arts[data._id] = data
                this.refs.moodboard.setState({disagreed_arts})
            }
        })

        Api.app.service('disagreed_arts').on('removed', (data)=>{
            var disagreed_arts = this.refs.moodboard.state.disagreed_arts
            delete disagreed_arts[data._id]
            this.refs.moodboard.setState({disagreed_arts})
        
        })
        


    }

    runAuth(){
        var board_id = this.gup('_id')
        var _this = this
        Api.app.reAuthenticate().then((res)=>{
            var user_id = res.user['_id']
            var user_email = res.user['email']
            if(res.user['board_id']!=board_id){
                Api.app.service('users').update(user_id, {$set:{board_id: board_id}})
                location.reload();
            }
            
            
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
                    
                    _this.refs.sketchpad.setState({layers: layers, sketchundo: sketchundo}, function(){
                        for(var layer_idx in layers){
                            var layer_id = layers[layer_idx]
                            console.log(layer_id)
                            Api.app.service('layers').find({query: {_id: layer_id}})
                            .then((res)=>{
                                console.log(res)
                                var layer_dict = _this.refs.sketchpad.state.layer_dict
                                layer_dict[res[0]._id] = res[0]
                                _this.refs.sketchpad.setState({layer_dict})
                                _this.loadALayer(res[0])
                            })
                        }
                    })
                    // find and retrieve layers
                    var arts = _this.refs.moodboard.state.arts
                    var searchPane=false
                    var searchMode = 'search'
                    var search_image_selected = undefined
                    var search_slider_values = {}
                    var search_slider_distances = {}
                    var generate_slider_values = {}

                    var agreementPane=false
                    var agreement_userSelection = {}
                    
                    if(res[0].searchMode!=undefined){
                        searchMode = res[0].searchMode
                    }
                    if(res[0].searchPane!=undefined){
                        searchPane = res[0].searchPane
                    }
                    if(res[0].search_image_selected!=undefined){
                        search_image_selected = res[0].search_image_selected
                    }
                    if(res[0].search_slider_values!=undefined){
                        search_slider_values = res[0].search_slider_values
                    }
                    if(res[0].search_slider_distances!=undefined){
                        search_slider_distances = res[0].search_slider_distances
                    }
                    if(res[0].generate_slider_values!=undefined){
                        generate_slider_values = res[0].generate_slider_values
                    }

                    if(res[0].agreementPane!=undefined){
                        agreementPane = res[0].agreementPane
                    }
                    if(res[0].agreement_userSelection!=undefined){
                        agreement_userSelection = res[0]['agreement_userSelection']
                    }
                    
                    Api.app.service('arts').find({query: {board_id: board_id, 
                        $select: ['position', 'ratio', 'choosen_by', 'updated', 'board_id', '_id', 'file', 'color', 'width', 'height', 'enabled']
                    }})
                    .then((res)=>{
                        for(var i in res){
                            var art = res[i]
                            arts[art._id] = art
                            
                        }
                        
                        _this.refs.moodboard.setState({arts: arts, searchPane: searchPane, search_image_selected: search_image_selected, 
                            search_slider_values:search_slider_values, search_slider_distances: search_slider_distances, searchMode: searchMode,
                            generate_slider_values: generate_slider_values, 
                            agreementPane: agreementPane, agreement_userSelection: agreement_userSelection})
                    })

                    var groups = _this.refs.moodboard.state.groups

                    Api.app.service('groups').find({query: {board_id: board_id,
                        $select: ['_id', 'art_ids', 'group_name', 'higher_group', 'board_id', 'pos', 'user_info', 'updated'],
                    }})
                    .then((res)=>{
                        for(var i in res){
                            var group = res[i]
                            groups[group._id] = group
                        }
                        _this.refs.moodboard.setState({groups:groups})
                    })
                    
                    var searched_arts = _this.refs.moodboard.state.searched_arts
                    Api.app.service('searched_arts').find({query: {board_id: board_id}})
                    .then((res)=>{
                        for(var i in res){
                            searched_arts[res[i]._id] = res[i]
                        }
                        console.log('searched arts', searched_arts)
                        _this.refs.moodboard.setState({searched_arts:searched_arts})
                    })

                    var disagreed_arts = _this.refs.moodboard.state.disagreed_arts
                    Api.app.service('disagreed_arts').find({query: {board_id: board_id}})
                    .then((res)=>{
                        for(var i in res){
                            disagreed_arts[res[i]._id] = res[i]
                        }
                        console.log('disagreed arts', disagreed_arts)
                        _this.refs.moodboard.setState({disagreed_arts:disagreed_arts})
                    })


                    // var arts = res[0]['arts']
                    var texts = res[0]['texts']
                    var sketchundo = res[0]['sketchundo']
                    var moodboardundo = res[0]['moodboardundo']
                    var current_collaborators = res[0]['current_collaborators']

                    var noone=true
                    console.log(current_collaborators)
                    for(var _id in current_collaborators){
                        if(current_collaborators[_id].active && user_id!=_id){
                            noone=false
                        }
                    }
                    console.log(noone)
                    // if(noone){
                    //     console.log('harabangtang', Object.keys(this.refs.moodboard.state.arts))
                    //     this.ChooseArtsTexts([],[],Object.keys(this.refs.moodboard.state.arts), Object.keys(this.refs.moodboard.state.texts))
                    //     this.ChooseLayers([],this.refs.sketchpad.layers)
                    // }
                    
                    current_collaborators[user_id] = {
                        sketch_pos:[-1,-1],
                        moodboard_pos: [-1, -1],
                        active: true
                    }
                    var set = {}
                    set['current_collaborators.'+user_id] = current_collaborators[user_id]
                    set['updated']='current_collaborators.'+user_id
                    console.log(set)
                    console.log(layers, arts, texts, sketchundo)
                    Api.app.service('boards').update(board_id, {$set: set})
                    .then((res)=>{
                        _this.setState({current_collaborators: current_collaborators, board_id: board_id, user_id: user_id, user_email:user_email}, function(){
                            _this.refs.sketchpad.setState({sketchundo: sketchundo})
                                // , function(){
                            //     var promises = []
                            //     for(var i in layers){
                            //         promises.push(_this.loadALayer(layers[i]))
                            //     }
                            //     Promise.all(promises)
                            // })
                            _this.refs.moodboard.setState({texts:texts})
                        })
                    })

                    
                    
                    console.log('done')

                }
            })
        }).catch((err)=>{
            window.location.href='/'
        })
    }

    render(){
        return (
            <div id='board_whole' style={{flex: 'auto', width: '100%', position:'relative'}} className='row'>
    
                <SketchPadAI board_this={this} board_state={this.state} ref='sketchpad'></SketchPadAI>
                <MoodBoardAI board_this={this} board_state={this.state} ref='moodboard'></MoodBoardAI>
                <div style={{position:'absolute', right: '10px', top: '10px'}}>
                    {this.renderCollaboartorStatus()}
                </div>
                <div style={{position:'absolute', left: 'calc(50% - 30px)', top: 'calc(50% + 38px)', 
                width:'60px', height:'60px', borderRadius: '50%', backgroundColor: '#333333',
                color: 'white', textAlign:'center', fontSize: '40px', cursor:'default'}} onPointerDown={this.addSketchIntoMoodboard.bind(this)}>
                    →
                </div>
            </div>)
    }
}

export default BoardAI