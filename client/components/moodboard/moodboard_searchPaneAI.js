import React, {Component} from 'react'
import Api from '../../middleware/api'
import interpolate from 'color-interpolate'

class MoodBoardSearchPaneAI extends Component{

    toggleSearchPane(e){
        e.stopPropagation()
        e.preventDefault()
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {
            $set: {updated: 'moodboard_search_pane_toggle', searchPane: !this.props.mother_state.searchPane}
        })
    }

    selectSearchImageChoose(){
        if(this.props.mother_state.control_state=='control_object'){
            var promises = [this.props.mother_this.props.board_this.ChooseArtsTexts([],[],this.props.mother_state.current_image.slice(0), this.props.mother_state.current_text.slice(0))]
            
            var del_texts = []
            var replace_texts = []
            var replace_text_ids = []
            for(var i in this.props.mother_state.current_text){
                var key = this.props.mother_state.current_text[i]
                if(this.props.mother_state.texts[key].text==''){
                    del_texts.push(key)
                    delete this.props.mother_state.texts[key]
                }else{
                    replace_text_ids.push(key)
                    replace_texts.push(this.props.mother_state.texts[key])
                }
            }
            promises.push(this.props.mother_this.props.board_this.UpdateArtsTexts([],[], replace_texts, replace_text_ids))
            if(del_texts.length>0){
                promises.push(this.props.mother_this.props.board_this.RemoveArtsTexts([], del_texts))
            }
            promises.push(this.props.mother_this.setState({current_image:[], current_text:[], current_selected_pos: undefined, current_selected_ratio: undefined}))
            Promise.all(promises)
            
        }
        this.props.mother_this.setState({control_state:'search_image_select'})
    }

    cancelSearchImageChoose(){
        this.props.mother_this.setState({control_state:'control_object'})
    }

    changeSliders(group_id, e){
        var search_slider_values = this.props.mother_state.search_slider_values
        search_slider_values[group_id] = e.target.value/100
        this.props.mother_this.setState({search_slider_values: search_slider_values})
        // Api.app.service('boards').patch(this.props.mother_this.props.board_this.statee.board_id, {$set:{updated:'moodboard_search_slider_change', search_slider_values: this.props.mother_state.search_slider_values}})
    }

    doneChangeSliders(group_id, e){
        var search_slider_values = this.props.mother_state.search_slider_values
        for(var group_key in search_slider_values){
            if(this.props.mother_state.groups[group_key]==undefined){
                delete search_slider_values[group_key]
            }
        }
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set:{updated:'moodboard_search_slider_change', search_slider_values: search_slider_values}})
    }

    search(){
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_search_images'}})
    }

    generate(){
        Api.app.service('boards').patch(this.props.mother_this.props.board_this.state.board_id, {$set: {updated: 'moodboard_generate_image'}})
    }

    renderGradientFromDistance(distance){
        var colormap = interpolate(['#ffbb00', '#0069c4'])

        return distance.map((val, idx)=>{
            var color = colormap(val)
            return (<stop offset={(10*idx)+'%'} style={{stopColor: color, stopOpacity: 1}}></stop>)
        })
    }

    renderSliders(){
        var higher_groups = {}
        for(var i in this.props.mother_state.groups){
            var group = this.props.mother_state.groups[i]
            if(higher_groups[group.higher_group]==undefined){
                higher_groups[group.higher_group] = []
            }
            higher_groups[group.higher_group].push(group._id)
        }

        return Object.keys(this.props.mother_state.groups).map((key, idx)=>{
            var group = this.props.mother_state.groups[key]
            var val = this.props.mother_state.search_slider_values[key]
            if(val==undefined){
                val = 0
            }else{
                val = val * 100
            }
            var group_name2
            if(higher_groups[group.higher_group].length==2 && higher_groups[group.higher_group][1]==group._id){
                return
            }else if(higher_groups[group.higher_group].length==2 && higher_groups[group.higher_group][0]==group._id){
                group_name2 = this.props.mother_state.groups[higher_groups[group.higher_group][1]].group_name
            }
            var distance = this.props.mother_state.search_slider_distances[key]
            if(distance == undefined){
                distance = [0,0,0,0,0,0,0,0,0,0,0]
            }
            return (<div key={'slider_'+group._id}>
                {higher_groups[group.higher_group].length==2 && 
                <div>
                    <div style={{display:'inline-block', float:'right'}}>{group.group_name}</div>
                    <div style={{display:'inline-block', float:'left'}}>{group_name2}</div>
                </div>
                }
                {higher_groups[group.higher_group].length!=2 && <div>{group.group_name}</div>}
                <div style={{width: '100%', position:'relative'}}>
                    <svg width='100%' height='15.2px' preserveAspectRatio="none" viewBox="0 0 300 15.2" style={{display:'inline-block',position:'absolute'}}>
                        <defs>
                            <linearGradient id={'grad'+idx} x1="0%" y1="0%" x2="100%" y2="0%">
                            {this.renderGradientFromDistance(distance)}
                            </linearGradient>
                        </defs>
                    <rect fill={'url(#grad'+idx+')'} style={{width:'100%', height:'100%'}}></rect>
                    </svg>
                    <input type='range' style={{margin: '5px 0'}} min={-100} max={100} value={val} onChange={this.changeSliders.bind(this, group._id)} onMouseUp={this.doneChangeSliders.bind(this, group._id)}></input>
                </div>
                
                
            </div>)
        })
    }

    renderSearchedArts(){
        var searched_arts = Object.keys(this.props.mother_state.searched_arts).map((key, idx)=>{
            var searched_art = this.props.mother_state.searched_arts[key]
            return [key, searched_art.image, searched_art.order]
        })

        searched_arts.sort(function(first, second){
            return parseInt(first[2])-parseInt(second[2])
        })
        // console.log(searched_arts)

        return searched_arts.map((val,idx)=>{
            return (<div style={{display:'inline-block', height: 'calc(100% - 6px)', padding: '3px'}}>
                <img src={val[1]} style={{height: '100%', maxWidth: '100%'}}></img>
            </div>)
        })
        // return Object.keys(this.props.mother_state.searched_arts).map((key, idx)=>{
        //     var searched_art = this.props.mother_state.searched_arts[key]

        //     return (<div style={{display:'inline-block', height: 'calc(100% - 6px)', padding: '3px'}}>
        //         <img src={searched_art.image} style={{height: '100%'}}></img>
        //     </div>)
        // })
    }

    searchWheel(e){
        e.stopPropagation()
    }

    render(){
        var art_exist = true
        var group_exist = true
        var art
        if(this.props.mother_state.search_image_selected==undefined || this.props.mother_state.arts[this.props.mother_state.search_image_selected]==undefined){
            art_exist = false
        }else{
            art = this.props.mother_state.arts[this.props.mother_state.search_image_selected]
        }
        if(Object.keys(this.props.mother_state.groups).length==0){
            group_exist= false
        }
        
        if(this.props.mother_state.searchPane){
            return (<div className='moodboard_search_pane controller'>
                <div className='moodboard_search_pane_close' style={{marginBottom: '5px'}} onMouseDown={this.toggleSearchPane.bind(this)}>
                ▽ Collaborative Search
                </div>
                <div className='row' style={{position:'relative'}}>
                    <div className='col s3 moodboard_search_pane_subpane' style={{textAlign:'center'}}>
                        {art_exist && <div className='moodboard_search_pane_subpane_div'>
                            <div style={{position: 'relative', height: 'calc(100% - 40px)'}}>
                                <img src={art.file} style={{maxHeight: '100%', maxWidth: '100%'}}></img>
                            </div>
                            {this.props.mother_state.control_state!='search_image_select' &&
                                <div className='btn' onMouseDown={this.selectSearchImageChoose.bind(this)}>Select Image</div>
                            }
                            {this.props.mother_state.control_state=='search_image_select' &&
                                <div className='btn red' onMouseDown={this.cancelSearchImageChoose.bind(this)}>Cancel</div>
                            }
                        </div>}
                        {!art_exist && <div className='moodboard_search_pane_subpane_div'>
                            <div>Select an art before performing the search.</div>
                            {this.props.mother_state.control_state!='search_image_select' &&
                                <div className='btn' onMouseDown={this.selectSearchImageChoose.bind(this)}>Select Image</div>
                            }
                            {this.props.mother_state.control_state=='search_image_select' &&
                                <div className='btn red' onMouseDown={this.cancelSearchImageChoose.bind(this)}>Cancel</div>
                            }
                            
                        </div>}
                    </div>
                    <div className='col s3 moodboard_search_pane_subpane' style={{textAlign:'center'}}>
                        {group_exist && <div className='moodboard_search_pane_subpane_div'>
                            <div>Controls</div>
                            {this.renderSliders()}    
                        </div>}
                        {!group_exist && <div className='moodboard_search_pane_subpane_div'>
                            Define group(s) before performing the search.
                        </div>}
                    </div>
                    <div className='col s6 moodboard_search_pane_subpane'>
                        <div style={{position: 'absolute', top: '-30px'}}>
                            <div className='btn tiny-btn' style={{marginRight:'3px'}} disabled={(!art_exist||!group_exist)} onMouseUp={this.search.bind(this)}>Search</div>
                            <div className='btn tiny-btn' disabled={(!art_exist||!group_exist)} onMouseUp={this.generate.bind(this)}>Generate</div>
                        </div>
                        <div className='moodboard_search_pane_subpane_div' style={{overflowY: 'auto'}} onWheel={this.searchWheel.bind(this)}>
                            {this.renderSearchedArts()}
                        </div>
                    </div>
                </div>
            </div>)
        }else{
            return (<div className='moodboard_search_pane_open controller' onMouseDown={this.toggleSearchPane.bind(this)}>
                △ Collaborative Search
            </div>)
        }
       
    }
}

export default MoodBoardSearchPaneAI