import { setManager } from '@feathersjs/hooks/lib'
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
            var user_email = res.user['email']
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
                        active: true
                    }
                    var set = {}
                    set['current_collaborators.'+user_id] = current_collaborators[user_id]
                    set['updated']='current_collaborators.'+user_id
                    console.log(set)
                    console.log(layers, arts, texts)
                    Api.app.service('boards').update(board_id, {$set: set})
                    .then((res)=>{
                        _this.setState({current_collaborators: current_collaborators, board_id: board_id, user_id: user_id, user_email:user_email}, function(){
                            _this.refs.sketchpad.setState({layers: layers}, function(){
                                var promises = []
                                for(var i in layers){
                                    promises.push(_this.loadALayer(layers[i]))
                                }
                                Promise.all(promises)
                            })
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
            console.log(data)
            var updated = data.updated
            if(updated.indexOf('current_collaborators.')!=-1){
                var current_collaborators = _this.state.current_collaborators
                current_collaborators[updated.split('.')[1]] = data.current_collaborators[updated.split('.')[1]]
                this.setState({current_collaborators})
            }else if(updated.indexOf('current_collaborators_pos')!=-1){
                var current_collaborators = _this.state.current_collaborators
                current_collaborators[updated.split('.')[1]].pos = data.pos//.current_collaborators[updated.split('.')[1]]
                this.setState({current_collaborators})
            }
        })

        Api.app.service('boards').on('patched', data=>{
            var updated = data.updated
            console.log(data, updated)
            if(updated.indexOf('sketchpad_update_a_layer')!=-1){
                var updated_layer_id = updated.split('.')[1]
                var layers = _this.refs.sketchpad.state.layers
                console.log(updated_layer_id, layers, data.layers)
                for (var i in layers){
                    if(layers[i].layer_id==updated_layer_id){
                        console.log('1')
                        for(var j in data.layers){
                            if(data.layers[j].layer_id==updated_layer_id){
                                console.log('2')
                                layers[i] = data.layers[j]
                                var el = document.getElementById('sketchpad_canvas_'+updated_layer_id)
                                var ctx = el.getContext('2d')
                                var temp_el = document.getElementById('temp_canvas')
                                var temp_ctx = temp_el.getContext('2d')
                                // 
                                var im = new Image()
                                im.src = data.layers[j].image
                                im.onload=function(){
                                    temp_ctx.drawImage(im, 0,0,1000,1000)
                                    ctx.clearRect(0,0,1000,1000)
                                    ctx.drawImage(im, 0,0,1000,1000)
                                    temp_ctx.clearRect(0,0,1000,1000)
                                }   
                                // ctx.drawImage(data.layers[j].image, 0, 0, 1000, 1000)
                                _this.refs.sketchpad.setState({layers: layers})
                                break;
                            }
                        }
                        break;
                    }
                }   
            }else if(updated.indexOf('sketchpad_add_a_layer')!=-1 || updated.indexOf('sketchpad_remove_a_layer')!=-1){
                var layers = data.layers
                _this.refs.sketchpad.setState({layers})
            }else if(updated.indexOf('sketchpad_reorder_layers')!=-1){
                var layers = data.layers
                var current_layer_id=undefined
                if(_this.refs.sketchpad.state.current_layer!=-1){
                    current_layer_id = _this.refs.sketchpad.state.layers[_this.refs.sketchpad.state.current_layer].layer_id
                }
                var current_layer = 0
                for(var i in layers){
                    if(layers[i].layer_id==current_layer_id){
                        current_layer = i
                    }
                }
                if(current_layer_id==undefined){
                    current_layer = -1
                }
                console.log(current_layer, layers)
                _this.refs.sketchpad.setState({layers, current_layer})
            }else if(updated.indexOf('sketchpad_layers_choosen')!=-1){
                var list = updated.split('.')
                var layers = _this.refs.sketchpad.state.layers
                for(var i in list){
                    if(i==0){continue}
                    var layer_id = list[i]
                    for(var j in layers){
                        if(layers[j].layer_id==layer_id){
                            layers[j].choosen_by = data.layers[j].choosen_by
                        }
                    }
                }
                _this.refs.sketchpad.setState({layers})

            }else if(updated.indexOf('moodboard_add_arts')!=-1){
                var arts = data.arts
                var art_ids = updated.split('.')
                var md_arts = _this.refs.moodboard.state.arts
                // var art = arts[art_id]
                for(var i in art_ids){
                    if(i==0){
                        continue
                    }
                    var art = arts[art_ids[i]]
                    md_arts[art_ids[i]]=art
                }
                _this.refs.moodboard.setState({arts:md_arts})
            }else if(updated.indexOf('moodboard_add_texts')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.refs.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_update_arts_texts')!=-1){
                var arts = data.arts
                var texts = data.texts
                var ids = updated.split('.')

                var md_arts = _this.refs.moodboard.state.arts
                var md_texts = _this.refs.moodboard.state.texts
                // var art = arts[art_id]
                for(var i in ids){
                    if(i==0){
                        continue
                    }
                    if(ids[i].indexOf('art')!=-1){
                        var art_id = ids[i].split('_')[1]
                        var art = arts[art_id]
                        md_arts[art_id].position=art['position']
                        md_arts[art_id].choosen_by=art['choosen_by']
                    }if(ids[i].indexOf('text')!=-1){
                        var text_id = ids[i].split('_')[1]
                        var text = texts[text_id]
                        md_texts[text_id].position=text['position']
                        md_texts[text_id].choosen_by=text['choosen_by']
                        md_texts[text_id].fontsize=text['fontsize']
                        md_texts[text_id].text=text['text']
                    }
                    
                }
                _this.refs.moodboard.setState({arts:md_arts, texts:md_texts})
            }else if(updated.indexOf('moodboard_remove_arts_texts')!=-1){
                var arts = data.arts
                var texts = data.texts
                var md_arts = _this.refs.moodboard.state.arts
                var md_texts = _this.refs.moodboard.state.texts
                for(var key in md_arts){
                    if(arts[key]==undefined){
                        delete md_arts[key]
                    }
                }
                for(var key in md_texts){
                    if(texts[key]==undefined){
                        delete md_texts[key]
                    }
                }
                _this.refs.moodboard.setState({arts:md_arts, texts:md_texts})

            }else if(updated.indexOf('moodboard_edit_text')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.refs.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_arts_texts_choosen')!=-1){
                var arts = data.arts
                var texts = data.texts
                var md_arts = _this.refs.moodboard.state.arts
                var md_texts = _this.refs.moodboard.state.texts
                var list =updated.split('.')
                for(var i in list){
                    if(i==0){continue}
                    var item = list[i]
                    if(item.indexOf('art_')!=-1){
                        item = item.split('_')[1]
                        md_arts[item].choosen_by = arts[item].choosen_by
                    }else if(item.indexOf('text_')!=-1){
                        item = item.split('_')[1]
                        md_texts[item].choosen_by = texts[item].choosen_by
                    }
                }
                _this.refs.moodboard.setState({texts:md_texts, arts:md_arts})
            }
        })

        window.addEventListener("beforeunload", function (e) {
            _this.updateCollaboratorStatus(false);
          
            (e || window.event).returnValue = null;
            return null;
          });

    }

    loadALayer(layer){
        var el = document.getElementById('sketchpad_canvas_'+layer.layer_id)
        var ctx = el.getContext('2d')
        var im = new Image()
        im.src = layer.image
        im.onload=function(){
            ctx.drawImage(im, 0,0,1000,1000)
        }  

    }

    updateALayerImage(layer_idx, layer_id, image){
        var set = {}
        set['layers.'+layer_idx+'.image'] = image
        set['updated'] = 'sketchpad_update_a_layer.'+layer_id
        Api.app.service('boards').patch(this.state.board_id, set)
    }

    AddALayer(layer_idx, layer){
        var set = {}
        set['layers.'+layer_idx] = layer
        set['updated'] = 'sketchpad_add_a_layer'
        Api.app.service('boards').patch(this.state.board_id, set)
    }

    RemoveALayer(layer_idx){
        var _this = this
        var set={}
        var layers = this.refs.sketchpad.state.layers.slice()
        console.log(layers)
        set['updated'] = 'sketchpad_remove_a_layer'
        
        set['layers'] = layers
        Api.app.service('boards').patch(this.state.board_id, {$set: set})
        // .then(()=>{
        //     Api.app.service('boards').update(this.state.board_id, {$pull: {layers: null}})
        //     .then(()=>{
        //         Api.app.service('boards').patch(_this.state.board_id, {updated: 'sketchpad_remove_a_layer'})
        //     })
            
        // })
    }

    ReorderLayers(new_layer){
        var _this = this
        var patch={}
        patch['layers']=new_layer
        patch['updated']='sketchpad_reorder_layers'
        Api.app.service('boards').patch(this.state.board_id, patch)
    }

    AddArts(arts, art_ids){
        var patch = {}
        patch['updated'] = 'moodboard_add_arts'
        for(var i in art_ids){
            patch['arts.'+art_ids[i]] = arts[i]
            patch['updated'] = patch['updated']+'.'+art_ids[i]
        }
        
        Api.app.service('boards').patch(this.state.board_id, {$set:patch})

    }

    UpdateArtsTexts(arts, art_ids, texts, text_ids){
        var patch = {}
        patch['updated'] = 'moodboard_update_arts_texts'
        
        for(var i in art_ids){
            patch['arts.'+art_ids[i]+'.position'] = arts[i].position
            patch['updated'] = patch['updated']+'.art_'+art_ids[i]
        }
        for(var i in text_ids){
            patch['texts.'+text_ids[i]+'.position'] = texts[i].position
            patch['texts.'+text_ids[i]+'.fontsize'] = texts[i].fontsize
            patch['texts.'+text_ids[i]+'.text'] = texts[i].text
            patch['updated'] = patch['updated']+'.text_'+text_ids[i]
        }
        console.log(patch)
        if(Object.keys(patch).length>1){
            Api.app.service('boards').patch(this.state.board_id, {$set:patch})
        }
        
        

    }


    RemoveArtsTexts(arts, texts){
        console.log(arts, texts)
        var unset = {}
        for(var i in arts){
            unset['arts.'+arts[i]]=1
        }
        for(var i in texts){
            unset['texts.'+texts[i]]=1
        }
        var set={}
        set['updated'] = 'moodboard_remove_arts_texts'
        Api.app.service('boards').patch(this.state.board_id, {$unset: unset, $set: set})
        

    }

    AddAText(text_id, text){
        var patch = {}
        patch['updated'] = 'moodboard_add_texts.'+text_id
        patch['texts.'+text_id] = text
        
        Api.app.service('boards').patch(this.state.board_id, {$set:patch})
    }

    UpdateAText(text_id, new_text){
        var patch= {}
        patch['updated'] ='moodboard_edit_text.'+text_id
        patch['texts.'+text_id] = new_text
        Api.app.service('boards').patch(this.state.board_id, {$set:patch})
    }

    ChooseArtsTexts(art_ids, text_ids, d_art_ids, d_text_ids){
        console.log('chooseartstexts')
        var patch={}

        patch['updated'] = 'moodboard_arts_texts_choosen'
        var unset={}
        for(var i in art_ids){
            var art_id = art_ids[i]
            patch['updated'] = patch['updated']+'.art_'+art_id
            patch['arts.'+art_id+'.choosen_by'] = this.state.user_id   
        }
        for (var i in text_ids){
            var text_id = text_ids[i]
            patch['updated'] = patch['updated']+'.text_'+text_id
            patch['texts.'+text_id+'.choosen_by'] = this.state.user_id
        }
        for(var i in d_art_ids){
            var art_id = d_art_ids[i]
            patch['updated'] = patch['updated']+'.art_'+art_id
            patch['arts.'+art_id+'.choosen_by'] = ''  
        }
        for (var i in d_text_ids){
            var text_id = d_text_ids[i]
            patch['updated'] = patch['updated']+'.text_'+text_id
            patch['texts.'+text_id+'.choosen_by'] = ''
        }
        console.log(patch)
        if(Object.keys(patch).length>1){
            Api.app.service('boards').patch(this.state.board_id, {$set:patch})
        }   
    }

    ChooseLayers(layer_idxs, d_layer_idxs){
        var patch={}
        patch['updated'] = 'sketchpad_layers_choosen'
        var layers = this.refs.sketchpad.state.layers.slice()
        for(var i in layer_idxs){
            var layer_idx = layer_idxs[i]
            patch['updated'] = patch['updated']+'.'+layers[layer_idx].layer_id
            patch['layers.'+layer_idx+'.choosen_by']=this.state.user_id
        }
        for(var i in d_layer_idxs){
            var layer_idx = d_layer_idxs[i]
            patch['updated'] = patch['updated']+'.'+layers[layer_idx].layer_id
            patch['layers.'+layer_idx+'.choosen_by']=''
        }
        if(Object.keys(patch).length>1){
            Api.app.service('boards').patch(this.state.board_id, {$set:patch})
        }   
    }



    updateCollaboratorStatus(tf){
        // var pull = {}
        // pull['current_collaborators.'+user_id] = current_collaborators[user_id]
        // unset everyithing that are selected
        this.ChooseArtsTexts([],[], this.refs.moodboard.state.current_image.slice(0), this.refs.moodboard.state.current_text.slice(0))
        if(this.refs.sketchpad.state.current_layer!=-1){
            this.ChooseLayers([],[this.refs.sketchpad.state.current_layer])
        }
        
        var set = {}
        set['current_collaborators.'+this.state.user_id+'.active'] = tf
        set['updated'] = 'current_collaborators.'+this.state.user_id
        // console.log('leaaave', this.state.board_id, pull)
        Api.app.service('boards').update(this.state.board_id, {$set: set})
        
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
            var now = new Date()
            current_collaborators[this.state.user_id]['moodboard_pos'] = [x, y, now]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.moodboard_pos'] = [x, y, now]
            set['updated']='current_collaborators_moodboard_pos.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboratorsOnMoodBoard(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id && this.state.current_collaborators[current_collaborator]!=undefined){
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
            // var now = new Date()
            // current_collaborators[this.state.user_id]['sketch_pos'] = [x, y]
            var set = {}
            var _this = this
            set['current_collaborators.'+this.state.user_id+'.sketch_pos'] = [x, y]
            set['updated']='current_collaborators_sketch_pos.'+this.state.user_id
            // console.log('running?')
            Api.app.service('boards').update(this.state.board_id, {$set: set, })
            .then(()=>{
                _this.setState({current_collaborators})
            })
        // }
        
    }

    renderCollaboartorStatus(){
        return Object.keys(this.state.current_collaborators).map((col, idx)=>{
            if(this.state.collaborator_dict[col]!=undefined||col==this.state.user_id){
                if(this.state.current_collaborators[col].active){
                    var name, color
                    if(col==this.state.user_id){
                        return
                    }
                    if(col!=this.state.user_id){
                        name = this.state.collaborator_dict[col]['email'].split('@')[0]
                        name = name.substring(0,3)
                        color = this.state.collaborator_dict[col].color
                    }else{
                        name = this.state.user_email.split('@')[0].substring(0,3)
                        color = 'black'
                    }
                    
                    var placement_idx = idx
                    if(idx>Object.keys(this.state.current_collaborators).indexOf(this.state.user_id)){
                        placement_idx = placement_idx-1
                    }else if(col==this.state.user_id){
                        placement_idx = 0
                    }

                    var zIndex = 0
                    if(col==this.state.user_id){
                        zIndex= 1
                    }
                    
                    return (<div key={'collaborator_indicator_'+col} style={{position:'absolute', right: placement_idx*40, border: 'solid 4px '+color, backgroundColor:'white',
                    width: 50, height: 50, borderRadius:'50%', textAlign: 'center', lineHeight:'40px', zIndex: zIndex}}>{name}</div>)
                }
            }
        })
    }

    renderCollaboratorsOnSketchpad(){
        return Object.keys(this.state.current_collaborators).map((current_collaborator, idx)=>{
            if(current_collaborator!=this.state.user_id && this.state.current_collaborators[current_collaborator]!=undefined){
                var sketch_pos = this.state.current_collaborators[current_collaborator].sketch_pos
                // console.log(moodboard_pos)
                if(sketch_pos[0]>=0 && sketch_pos[1]>=0){
                    var name = this.state.collaborator_dict[current_collaborator]['email'].split('@')[0]
                    name = name.substring(0,3)
                    return (<div key={'sketchpad_collaborator_'+current_collaborator} className='collaboratorCursor' style={{left: sketch_pos[0]/1000*this.refs.sketchpad.state.boardzoom*this.refs.sketchpad.state.boardlength, 
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
        return (
        <div id='board_whole' style={{flex: 'auto', width: '100%'}} className='row'>

            <SketchPad board_this={this} board_state={this.state} ref='sketchpad'></SketchPad>
            <MoodBoard board_this={this} board_state={this.state} ref='moodboard'></MoodBoard>
            <div style={{position:'absolute', right: '10px', top: '10px'}}>
                {this.renderCollaboartorStatus()}
            </div>
        </div>)
    }
}

export default Board