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
        board_owner: undefined, 
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
        this.runAuth()
        this.prepareUpdates()
  

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
                    var owner = res[0].owner
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
                    Api.app.service('arts').find({query: {board_id: board_id, 
                        $select: ['position', 'ratio', 'choosen_by', 'updated', 'board_id', '_id', 'file', 'color', 'width', 'height']
                    }})
                    .then((res)=>{
                        console.log('art', res)
                        for(var i in res){
                            var art = res[i]
                            arts[art._id] = art
                            _this.refs.moodboard.setState({arts: arts})
                        }
                    })
                    


                    // var arts = res[0]['arts']
                    var texts = res[0]['texts']
                    var sketchundo = res[0]['sketchundo']
                    var moodboardundo = res[0]['moodboardundo']
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
                    console.log(layers, arts, texts, sketchundo)
                    Api.app.service('boards').update(board_id, {$set: set})
                    .then((res)=>{
                        _this.setState({current_collaborators: current_collaborators, board_id: board_id, user_id: user_id, user_email:user_email, board_owner: owner}, function(){
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

    prepareUpdates(){
        var _this = this
        
        Api.app.service('arts').on('created', (data)=>{
            if(data.board_id==this.state.board_id){
                var arts = this.refs.moodboard.state.arts
                arts[data._id] = data
                this.refs.moodboard.setState({arts})
            }
        })

        Api.app.service('arts').on('removed', (data)=>{
                var arts = this.refs.moodboard.state.arts
                delete arts[data._id]
                this.refs.moodboard.setState({arts})
            
        })

        Api.app.service('arts').on('patched', (data)=>{
            console.log('patched!')
            var arts = this.refs.moodboard.state.arts
            if(data.updated!='moodboard_color_swatch_change'){
                if(data.position!=undefined){
                    arts[data._id].position = data.position
                }
                if(data.choosen_by!=undefined){
                    arts[data._id].choosen_by = data.choosen_by
                }
            }else{
                arts[data._id].file=data.file
                arts[data._id].color = data.color
            }
            
            

            this.refs.moodboard.setState({arts})
        })

        Api.app.service('layers').on('created', (data)=>{
            console.log('layer created', data)
            if(data.board_id==this.state.board_id){
                var layer_dict = this.refs.sketchpad.state.layer_dict
                // var layers = this.refs.sketchpad.state.layers
                // var current_layer_id = layers[this.refs.sketchpad.state.current_layer]

                layer_dict[data._id] = data


                
                this.refs.sketchpad.setState({layer_dict}, function(){

                    var checkExist = setInterval(function(){
                        var el = document.getElementById('sketchpad_canvas_'+data._id)
                        if(el!=null){
                            clearInterval(checkExist)
                            var ctx = el.getContext('2d')
                            var temp_el = document.getElementById('temp_canvas')
                            var temp_ctx = temp_el.getContext('2d')
                            var im = new Image()
                            im.src = data.image
                            im.onload=function(){
                                console.log('first')
                                temp_ctx.drawImage(im, 0,0,1000,1000)
                                ctx.clearRect(0,0,1000,1000)
                                ctx.drawImage(im, 0,0,1000,1000)
                                temp_ctx.clearRect(0,0,1000,1000)
                            }   
                        }
                    },200)  
                })
            }
        })

        Api.app.service('layers').on('patched', data=>{
            console.log(data.updated)
            var updated = data.updated
            var layer_dict = this.refs.sketchpad.state.layer_dict
            if(updated.indexOf('sketchpad_layers_choosen')!=-1){
                layer_dict[data._id].choosen_by = data.choosen_by
                this.refs.sketchpad.setState({layer_dict})
            }else if(updated.indexOf('sketchpad_update_a_layer')!=-1 || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                layer_dict[data._id].image = data.image
                this.refs.sketchpad.setState({layer_dict}, function(){
                    var el = document.getElementById('sketchpad_canvas_'+data._id)
                    var ctx = el.getContext('2d')
                    var temp_el = document.getElementById('temp_canvas')
                    var temp_ctx = temp_el.getContext('2d')
                    var im = new Image()
                    im.src = data.image
                    im.onload=function(){
                        console.log('first')
                        temp_ctx.drawImage(im, 0,0,1000,1000)
                        ctx.clearRect(0,0,1000,1000)
                        ctx.drawImage(im, 0,0,1000,1000)
                        temp_ctx.clearRect(0,0,1000,1000)
                    }   
                })
            }
        })

        

        Api.app.service('layers').on('removed', (data)=>{
            console.log('layer removed', data)
            if(data.board_id==this.state.board_id){
                var layer_dict = this.refs.sketchpad.state.layer_dict
                var layers = this.refs.sketchpad.state.layers
                var current_layer_id = layers[this.refs.sketchpad.state.current_layer]
                delete layer_dict[data._id]
                console.log(layers.length)
                if(layers.indexOf(data._id)!=-1){
                    layers.splice(layers.indexOf(data._id), 1)
                }
                
                console.log(layers.length)
                var current_layer = layers.indexOf(current_layer_id)
                console.log(current_layer)
                this.refs.sketchpad.setState({layer_dict, layers, current_layer})
            }
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
            if(updated.indexOf('sketchpad_update_a_layer')!=-1 || updated.indexOf('sketchpad_undo_update_a_layer')!=-1){
                var layers = _this.refs.sketchpad.state.layers
                var sketchundo = _this.refs.sketchpad.state.sketchundo
                console.log(sketchundo)
                if(updated.indexOf('undo')==-1){
                    sketchundo.shift();
                    sketchundo.push(data.sketchundo)
                    
                }else{
                    var undo_id = updated.split('.')[1] 
                    var undo_idx =undefined
                    var undo_obj
                    for(var i in sketchundo){
                        if(sketchundo[i]!=undefined){
                            if(sketchundo[i].undo_id==undo_id){
                                undo_obj = sketchundo.splice(i, 1)
                                console.log('splicaE1')
                                break
                            }
                        }
                    }
                    undo_obj = undo_obj[0]
                    if (undo_obj!=undefined){
                        console.log('here?', undo_obj, this.state.user_id)
                        if(undo_obj.user_id==this.state.user_id){
                            if(undo_obj.cond=='lasso'){
                                console.log('this??', _this.refs.sketchpad.state.lasso[0])
                                _this.refs.sketchpad.setState({lasso:undo_obj.selection, control_state:'area'}, function(){
                                    console.log(_this.refs.sketchpad.state.lasso[0])
                                    Promise.all([
                                        _this.refs.sketchpad.lassoEnd(),
                                        _this.refs.sketchpad.setState({}, function(){
                                            _this.refs.sketchpad.initializeMoveLayer()
                                        }),
                                        _this.refs.sketchpad.setState({control_state: 'move-layer'})
                                    ])
                                })
                                
                            }else if(undo_obj.cond=='nonlasso'){
                                _this.refs.sketchpad.setState({nonlasso_ret:undo_obj.selection}, function(){
                                    _this.refs.sketchpad.initializeMoveLayer();
                                })
                            }
                        }
                    }
                    sketchundo.unshift(null)

                    
                }

                console.log(sketchundo)
                _this.refs.sketchpad.setState({sketchundo:sketchundo}) 

            }else if(updated.indexOf('sketchpad_add_a_layer')!=-1 || updated.indexOf('sketchpad_remove_a_layer')!=-1 || 
            updated.indexOf('sketchpad_undo_remove_a_layer')!=-1 || updated.indexOf('sketchpad_undo_reorder_a_layer')!=-1){
                var layers = data.layers
                var sketchundo = _this.refs.sketchpad.state.sketchundo
                var current_layer = _this.refs.sketchpad.state.current_layer
                if(updated.indexOf('undo')==-1){
                    sketchundo.shift();
                    sketchundo.push(data.sketchundo)

                    var current_layer_id = _this.refs.sketchpad.state.layers[current_layer]
                    current_layer = layers.indexOf(current_layer_id)
                    
                }else{
                    var undo_id = updated.split('.')[2] 
                    for(var i in sketchundo){
                        if(sketchundo[i]!=undefined){
                            if(sketchundo[i].undo_id==undo_id){
                                sketchundo.splice(i, 1)
                                console.log('splicaE1')
                                break
                            }
                        }
                    }
                    sketchundo.unshift(null)
                    if(updated.indexOf('reorder')!=-1){
                        for(var i in layers){
                            if(_this.refs.sketchpad.state.layer_dict[layers[i]].choosen_by == this.state.user_id){
                                current_layer = i
                            }
                        }
                    }
                }
                console.log(sketchundo, layers)
                
                _this.refs.sketchpad.setState({layers, sketchundo, current_layer}, function(){

                    if(updated.indexOf('sketchpad_undo_remove_a_layer')!=-1){
                        var layer_id = data.updated.split('.')[1]
                        console.log(layer_id)
                        var el = document.getElementById('sketchpad_canvas_'+layer_id)
                        var ctx = el.getContext('2d')
                        var temp_el = document.getElementById('temp_canvas')
                        var temp_ctx = temp_el.getContext('2d')
                        var im = new Image()
                        im.src = _this.refs.sketchpad.state.layer_dict[layer_id].image
                        im.onload=function(){
                            temp_ctx.drawImage(im, 0,0,1000,1000)
                            ctx.clearRect(0,0,1000,1000)
                            ctx.drawImage(im, 0,0,1000,1000)
                            temp_ctx.clearRect(0,0,1000,1000)
                        } 
                    }

                      
                })
            }else if(updated.indexOf('sketchpad_reorder_layers')!=-1){
                var layers = data.layers
                var current_layer_id=undefined
                if(_this.refs.sketchpad.state.current_layer!=-1){
                    current_layer_id = _this.refs.sketchpad.state.layers[_this.refs.sketchpad.state.current_layer]
                }
                var current_layer = 0
                for(var i in layers){
                    if(layers[i]==current_layer_id){
                        current_layer = i
                    }
                }
                if(current_layer_id==undefined){
                    current_layer = -1
                }
                console.log(current_layer, layers)
                var sketchundo = _this.refs.sketchpad.state.sketchundo
                sketchundo.shift();
                sketchundo.push(data.sketchundo)
                console.log(sketchundo)
                _this.refs.sketchpad.setState({layers, current_layer, sketchundo})
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

            }else if(updated.indexOf('sketchpad_undo_add_a_layer')!=-1){
                var layer_id = updated.split('.')[1]
                var undo_id = updated.split('.')[2]
                var sketchundo = _this.refs.sketchpad.state.sketchundo
                var layers= _this.refs.sketchpad.state.layers
                var current_layer = _this.refs.sketchpad.state.current_layer
                var control_state = _this.refs.sketchpad.state.control_state
                var layer_idx =undefined
                for(var i in layers){
                    if(layers[i]==layer_id){
                        layers.splice(i, 1)
                        if(current_layer==i){
                            console.log('???')
                            current_layer = -1
                            control_state = 'move'
                        }
                        break
                    }
                }
                for(var i in sketchundo){
                    if(sketchundo[i]!=undefined){
                        if(sketchundo[i].undo_id==undo_id){
                            sketchundo.splice(i, 1)
                            
                            console.log('splicaE1')
                            break
                        }
                    }
                }
                sketchundo.unshift(null)
                _this.refs.sketchpad.setState({layers, sketchundo, current_layer, control_state})
            }
            // else if(updated.indexOf('moodboard_add_arts')!=-1){
            //     var arts = data.arts
            //     var art_ids = updated.split('.')
            //     var md_arts = _this.refs.moodboard.state.arts
            //     // var art = arts[art_id]
            //     for(var i in art_ids){
            //         if(i==0){
            //             continue
            //         }
            //         var art = arts[art_ids[i]]
            //         md_arts[art_ids[i]]=art
            //     }
            //     _this.refs.moodboard.setState({arts:md_arts})
            // }
            else if(updated.indexOf('moodboard_add_texts')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.refs.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_update_arts_texts')!=-1){
                var texts = data.texts
                var ids = updated.split('.')
                var md_texts = _this.refs.moodboard.state.texts
                // var art = arts[art_id]
                for(var i in ids){
                    if(i==0){
                        continue
                    }
                    if(ids[i].indexOf('text')!=-1){
                        var text_id = ids[i].split('_')[1]
                        var text = texts[text_id]
                        md_texts[text_id].position=text['position']
                        md_texts[text_id].choosen_by=text['choosen_by']
                        md_texts[text_id].fontsize=text['fontsize']
                        md_texts[text_id].text=text['text']
                    }
                    
                }
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_remove_arts_texts')!=-1){
                var texts = data.texts
                var md_texts = _this.refs.moodboard.state.texts
                for(var key in md_texts){
                    if(texts[key]==undefined){
                        delete md_texts[key]
                    }
                }
                _this.refs.moodboard.setState({texts:md_texts})

            }else if(updated.indexOf('moodboard_edit_text')!=-1){
                var texts = data.texts
                var text_id = updated.split('.')[1]
                var md_texts = _this.refs.moodboard.state.texts
                md_texts[text_id] = texts[text_id]
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_arts_texts_choosen')!=-1){
                // var arts = data.arts
                var texts = data.texts
                // var md_arts = _this.refs.moodboard.state.arts
                var md_texts = _this.refs.moodboard.state.texts
                var list =updated.split('.')
                for(var i in list){
                    if(i==0){continue}
                    var item = list[i]
                    // if(item.indexOf('art_')!=-1){
                    //     item = item.split('_')[1]
                    //     md_arts[item].choosen_by = arts[item].choosen_by
                    // }else 
                    if(item.indexOf('text_')!=-1){
                        item = item.split('_')[1]
                        md_texts[item].choosen_by = texts[item].choosen_by
                    }
                }
                _this.refs.moodboard.setState({texts:md_texts})
            }else if(updated.indexOf('moodboard_search_pane_toggle')!=-1){
                _this.refs.moodboard.setState({searchPane: data.searchPane})
            }else if(updated.indexOf('moodboard_search_image_select')!=-1){
                _this.refs.moodboard.setState({search_image_selected: data.search_image_selected})
            }else if(updated.indexOf('moodboard_search_slider_change')!=-1){
                _this.refs.moodboard.setState({search_slider_values: data.search_slider_values})
            }else if(updated.indexOf('moodboard_generate_slider_change')!=-1){
                _this.refs.moodboard.setState({generate_slider_values: data.generate_slider_values})
            }else if(updated.indexOf('moodboard_search_slider_distances')!=-1){
                _this.refs.moodboard.setState({search_slider_distances: data.search_slider_distances, search_slider_values: data.search_slider_values,
                generate_slider_values: data.generate_slider_values})
            }else if(updated.indexOf('moodboard_search_mode_toggle')!=-1){
                _this.refs.moodboard.setState({searchMode: data.searchMode})
            }
        })

        window.addEventListener("beforeunload", function (e) {
            _this.updateCollaboratorStatus(false);
          
            (e || window.event).returnValue = null;
            return null;
          });
    }

    loadALayer(layer){
        var el = document.getElementById('sketchpad_canvas_'+layer._id)
        var ctx = el.getContext('2d')
        var im = new Image()
        im.src = layer.image
        
        im.onload=function(){
            ctx.drawImage(im, 0,0,1000,1000)
        }  

    }

    updateALayerImage(layer_idx, layer_id, image, origin_image, cond='', selection=undefined){
        console.log('yaeh', cond, selection)
        var set = {}
        set['image'] = image
        set['updated'] = 'sketchpad_update_a_layer'
        var set2={}
        set2['updated'] = 'sketchpad_update_a_layer'
        set2['$push']  = {
            sketchundo: {
                undo_id: Math.random().toString(36).substring(2, 15), 
                user_id: this.state.user_id,
                type:'layer_image', 
                layer_id: layer_id,
                layer_image: origin_image,
                cond: cond,
                selection: selection
            }
        }
        Api.app.service('layers').patch(layer_id, {$set: set}).then(()=>{
            Api.app.service('boards').patch(this.state.board_id, set2).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, {$set: {updated: 'sketchpad_undoupdate'}, $pop: {sketchundo: -1}})
            })
        })
        
    }

    AddALayer(layer_idx, layer_id, layer){
        var set = {}
        layer.updated = 'sketchpad_add_a_layer'
        set['layers.'+layer_idx] = layer_id
        set['updated'] = 'sketchpad_add_a_layer'
        set['$push'] = {
            sketchundo: {
                undo_id: Math.random().toString(36).substring(2, 15), 
                user_id: this.state.user_id,
                type: 'layer_add',
                layer_idx: layer_idx,
                layer_id: layer_id,
                layer: layer
            }
        }

        Api.app.service('layers').create(layer).then(()=>{
            Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, {$set: {updated: 'sketchpad_undoupdate'}, $pop: {sketchundo: -1}}) 
            })
        })

        
    }

    RemoveALayer(layer_idx, layer, layers){
        var _this = this
        var set={}
        // var layers = this.refs.sketchpad.state.layers.slice()
        console.log(layers)
        set['updated'] = 'sketchpad_remove_a_layer'
        
        set['layers'] =  this.refs.sketchpad.state.layers.slice()
        console.log(layers)
        // layer = JSON.parse(JSON.stringify(layer))
        layer.choosen_by=''
        var push = {
            sketchundo: {
                undo_id: Math.random().toString(36).substring(2, 15), 
                user_id: this.state.user_id,
                type: 'layer_remove',
                layer_idx: layer_idx,
                layer_id: layer._id,
                layer: layer,
                layers: layers
            }
        }
        Api.app.service('layers').remove(layer._id).then(()=>{
            Api.app.service('boards').patch(this.state.board_id, {$set: set, $push: push}).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, {$set: {updated: 'sketchpad_undoupdate'}, $pop: {sketchundo: -1}})
            })
        })
        
        // .then(()=>{
        //     Api.app.service('boards').update(this.state.board_id, {$pull: {layers: null}})
        //     .then(()=>{
        //         Api.app.service('boards').patch(_this.state.board_id, {updated: 'sketchpad_remove_a_layer'})
        //     })
            
        // })
    }

    ReorderLayers(new_layer, prev_layer){
        var _this = this
        var patch={}
        patch['layers']=new_layer
        patch['updated']='sketchpad_reorder_layers'
        patch['$push'] = {
            sketchundo: {
                undo_id: Math.random().toString(36).substring(2, 15), 
                user_id: this.state.user_id,
                type: 'layer_reorder',
                layers: prev_layer
            }
        }
        Api.app.service('boards').patch(this.state.board_id, patch).then(()=>{
            Api.app.service('boards').patch(this.state.board_id, {$set: {updated: 'sketchpad_undoupdate'}, $pop: {sketchundo: -1}})
        })
    }

    SketchUndo(idx, undo_obj){

        var set = {
            $pull: {sketchundo: {
                undo_id: undo_obj['undo_id']
            }}
        }
        var set2 = {}
        set2['updated']='sketchpad_undoupdate'
        set2['$push']={
            sketchundo: {
                $each: [null], 
                $position: 0,
            }
        }
        var _this = this
        if(undo_obj.type=='layer_image'){
            set['updated'] = 'sketchpad_undo_update_a_layer.'+undo_obj.undo_id
            var set3 = {}
            set3['updated'] = 'sketchpad_undo_update_a_layer'
            set3['image'] = undo_obj.layer_image
            Api.app.service('layers').patch(undo_obj.layer_id, {$set:set3}).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{    
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
            // if(undo_obj.cond=='lasso'){
            //     this.refs.sketchpad.setState({lasso:undo_obj.selection}, function(){
            //         Promise.all([_this.refs.sketchpad.lassoEnd(),
            //         _this.refs.sketchpad.initializeMoveLayer()])
            //     })
            // }else if(undo_obj.cond=='nonlasso'){
            //     this.refs.sketchpad.setState({nonlasso_ret:undo_obj.selection}, function(){
            //         _this.refs.sketchpad.initializeMoveLayer();
            //     })
            // }
            
        }else if(undo_obj.type=='layer_add'){
            set['updated'] = 'sketchpad_undo_add_a_layer.'+undo_obj.layer_id+'.'+undo_obj.undo_id
           var layers = this.refs.sketchpad.state.layers.slice()
            var idx=-1
            for(var i in layers){
                if(layers[i]==undo_obj.layer_id){
                    idx=i
                    break
                }
            }
            if(idx>=0){
                set['$pull']['layers'] = undo_obj.layer_id
            } 
            Api.app.service('layers').remove(layers[idx]).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
        }else if(undo_obj.type=='layer_remove'){
            set['updated'] = 'sketchpad_undo_remove_a_layer.'+undo_obj.layer_id+'.'+undo_obj.undo_id
            set['layers'] = undo_obj.layers
            var set3 = undo_obj.layer
            set3['updated']='sketchpad_undo_remove_a_layer'
            console.log(set, set2)
            Api.app.service('layers').create(set3).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                    Api.app.service('boards').patch(this.state.board_id, set2)
                })
            })
            
        }else if(undo_obj.type=='layer_reorder'){
            set['updated'] = 'sketchpad_undo_reorder_a_layer..'+undo_obj.undo_id
            var layers = this.refs.sketchpad.state.layers.slice()
            var undo_layer = undo_obj.layers.slice()
            // for(var i in layers){
            //     for(var j in undo_layer){
            //         if(layers[i].layer_id==undo_layer[j].layer_id){
            //             undo_layer[j].choosen_by = layers[i].choosen_by
            //         }
            //     }
            // }
            set['layers'] = undo_obj.layers
            Api.app.service('boards').patch(this.state.board_id, set).then(()=>{
                Api.app.service('boards').patch(this.state.board_id, set2)
            })
            // TODO (also in channel and onpatch)
        }

        
    }

    AddArts(arts, art_ids){
        
        for(var i in art_ids){
            var create = arts[i]
            console.log(arts)
            create['_id']=art_ids[i]
            create['updated'] = 'moodboard_add_arts'
            create['board_id'] = this.state.board_id
            // patch['updated'] = patch['updated']+'.'+art_ids[i]
            Api.app.service('arts').create(create)
        }
        
        // Api.app.service('boards').patch(this.state.board_id, {$set:patch})

    }

    UpdateArtsTexts(arts, art_ids, texts, text_ids){
        var patch = {}
        patch['updated'] = 'moodboard_update_arts_texts'
        
        for(var i in art_ids){
            var art = {}
            art['updated'] = 'moodboard_update_arts_texts'
            art['position'] = arts[i].position
            // patch['updated'] = patch['updated']+'.art_'+art_ids[i]
            Api.app.service('arts').patch(art_ids[i], {$set:art})
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
            Api.app.service('arts').remove(arts[i])
        }
        for(var i in texts){
            unset['texts.'+texts[i]]=1
        }
        var set={}
        set['updated'] = 'moodboard_remove_arts_texts'
        if(Object.keys(unset).length>0){
            Api.app.service('boards').patch(this.state.board_id, {$unset: unset, $set: set})
        }
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
            Api.app.service('arts').patch(art_id, {$set:{choosen_by: this.state.user_id, updated:'moodboard_arts_texts_choosen'}})
        }
        for (var i in text_ids){
            var text_id = text_ids[i]
            patch['updated'] = patch['updated']+'.text_'+text_id
            patch['texts.'+text_id+'.choosen_by'] = this.state.user_id
        }
        for(var i in d_art_ids){
            var art_id = d_art_ids[i]
            Api.app.service('arts').patch(art_id, {$set:{choosen_by: '', updated: 'moodboard_arts_texts_choosen'}})
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
        var layers = this.refs.sketchpad.state.layers.slice()
        console.log(layer_idxs, d_layer_idxs)
        for(var i in layer_idxs){
            var patch={}
            patch['updated'] = 'sketchpad_layers_choosen'
            var layer_id = layer_idxs[i]
            patch['choosen_by']=this.state.user_id
            console.log('layer id is.... ' ,layer_id)
            Api.app.service('layers').patch(layer_id, {$set:patch})
        }
        for(var i in d_layer_idxs){
            var patch={}
            patch['updated'] = 'sketchpad_layers_choosen'
            var layer_id = d_layer_idxs[i]
            patch['choosen_by']=''
            Api.app.service('layers').patch(layer_id, {$set:patch})
        }
    }


    updateCollaboratorStatus(tf){
        // var pull = {}
        // pull['current_collaborators.'+user_id] = current_collaborators[user_id]
        // unset everyithing that are selected
        console.log(Object.keys(this.state.current_collaborators).length)
        if(Object.keys(this.state.current_collaborators).length>1){
            this.ChooseArtsTexts([],[], this.refs.moodboard.state.current_image.slice(0), this.refs.moodboard.state.current_text.slice(0))
            if(this.refs.sketchpad.state.current_layer!=-1){
                this.ChooseLayers([],[this.refs.sketchpad.state.layers[this.refs.sketchpad.state.current_layer]])
            }
        }else{
            this.ChooseArtsTexts([],[],Object.keys(this.refs.moodboard.state.arts), Object.keys(this.refs.moodboard.state.texts))
            this.ChooseLayers([],this.refs.sketchpad.layers)
            
        }
        
        
        var set = {}
        set['current_collaborators.'+this.state.user_id+'.active'] = tf
        set['updated'] = 'current_collaborators.'+this.state.user_id
        // console.log('leaaave', this.state.board_id, pull)
        Api.app.service('boards').update(this.state.board_id, {$set: set})
        
    }

    addSketchIntoMoodboard(e){
        e.stopPropagation();
        var _this = this
        var output_el= document.createElement('canvas')
        output_el.width = 1000
        output_el.height = 1000
        var output_canvas = output_el.getContext('2d')
        output_canvas.globalCompositeOperation = 'destination-over'

        console.log(this.refs.sketchpad.state.layers)
        for(var i in this.refs.sketchpad.state.layers){
            var key = this.refs.sketchpad.state.layers[i]
            var el = document.getElementById('sketchpad_canvas_'+key)
            var cur_canvas = el.getContext('2d')
            output_canvas.drawImage(el, 0, 0);
        }
        output_canvas.fillStyle = 'white'
        output_canvas.fillRect(0, 0, 1000, 1000);
        console.log('sketch image generated')

        var image = output_el.toDataURL()
        var arts =this.refs.moodboard.state.arts
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

        var pos = this.refs.moodboard.getPositionOnBoard(0, document.getElementById('moodboard').offsetHeight/2)
        var pos0 = Math.max(pos[0], 0)
        
        console.log(pos0, pos)
        arts[id] = {
            file: image,
            position: [pos0, pos[1]-0.05, pos0+0.1,pos[1]+0.05],
            ratio: 1,
            choosen_by: this.state.user_id
        }

        Promise.all([
            _this.ChooseArtsTexts([],[],_this.refs.moodboard.state.current_image, _this.refs.moodboard.state.current_text),
            _this.AddArts([arts[id]],[id]),
            _this.refs.moodboard.setState({arts:arts, control_state:'control_object', action:'idle', current_image: [id], current_text:[], 
            current_selected_pos: [pos0, pos[1]-0.05, pos0+0.1,pos[1]+0.05], current_selected_ratio: 1})
        ])

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
        <div id='board_whole' style={{flex: 'auto', width: '100%', position:'relative'}} className='row'>

            <SketchPad board_this={this} board_state={this.state} ref='sketchpad'></SketchPad>
            <MoodBoard board_this={this} board_state={this.state} ref='moodboard'></MoodBoard>
            <div style={{position:'absolute', right: '10px', top: '10px'}}>
                {this.renderCollaboartorStatus()}
            </div>
            <div style={{position:'absolute', left: 'calc(50% - 30px)', top: 'calc(50% + 38px)', 
            width:'60px', height:'60px', borderRadius: '50%', backgroundColor: '#333333',
            color: 'white', textAlign:'center', fontSize: '40px', cursor:'default'}} onMouseDown={this.addSketchIntoMoodboard.bind(this)}>
                →
            </div>
        </div>)
    }
}

export default Board