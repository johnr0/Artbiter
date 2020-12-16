import React, {Component} from 'react'
import Api from '../../middleware/api'

class MoodboardDisagreementRevealerAI extends Component{

    checkSelectedGroups(){
        var groups = this.props.mother_state.groups
        var current_image = this.props.mother_state.current_image
        var selectedGroups = []
        var included_groups = []


        for(var k in groups){
            included_groups.push(k)
            var filtered=current_image.filter(value => groups[k].art_ids.includes(value))
            if(filtered.length == current_image.length && filtered.length==groups[k].art_ids.length){
                selectedGroups.push(k)
            }  
            
        }

        for(var idx in included_groups){
            var group = groups[included_groups[idx]]
            var choosen_bys=[]
            for(var jdx in group.art_ids){
                var art_id = group.art_ids[jdx]
                if(this.props.mother_state.arts[art_id]!=undefined){
                    choosen_bys.push(this.props.mother_state.arts[art_id].choosen_by)
                }
            }
            choosen_bys.sort()
            if(choosen_bys[0]==choosen_bys[choosen_bys.length-1] && choosen_bys[0]!=''){
                
                var passed = true
                for(var k in this.props.mother_state.arts){
                    if(group.art_ids.indexOf(k)==-1){
                        if(this.props.mother_state.arts[k].choosen_by==choosen_bys[0]){
                            passed=false
                        }
                    }
                }
                console.log(choosen_bys[0], k, passed)
                if(passed && selectedGroups.indexOf(group._id)==-1){
                    selectedGroups.push(group._id)
                }
            }

        }

        return selectedGroups
    }

    checkUserInputsInSelectedGroups(higher_group_id){
        var groups = this.props.mother_state.groups

        var user_counts=[]

        for(var group_key in groups){
            var group = groups[group_key]
            if(group.higher_group == higher_group_id){
                user_counts.push(0)
            }
        }

        var user_idx = 0
        for(var group_key in groups){
            var group = groups[group_key]
            
            if(group.higher_group == higher_group_id){
                for(var user in group.user_info){
                    if(group.user_info[user].arts.length >0){
                        console.log(user, user_idx)
                        user_counts[user_idx] = user_counts[user_idx] + 1
                    }
                }
                user_idx=user_idx+1
            }
        }

        user_counts.sort()

        console.log(user_counts, Object.keys(this.props.mother_this.props.board_this.state.collaborator_dict).length)
        if(user_counts[0]==user_counts[user_counts.length-1] && user_counts[0]==Object.keys(this.props.mother_this.props.board_this.state.collaborator_dict).length+1){
            return true
        }else{
            return false
        }
    }

    getGroupUserInfo(group_id){
        return this.props.mother_state.groups[group_id].user_info
    }

    revealDisagreeement(group_id){

        Api.app.service('groups').patch(group_id, {$set: {updated: 'groups_reveal_disagreement' }})
    }


    render(){
        var selectedGroups = this.checkSelectedGroups()



        if(selectedGroups.length==1){
            var valid_user = 0
            var groupUserInfo = this.getGroupUserInfo([selectedGroups[0]])
            var allUsersMadeInput = this.checkUserInputsInSelectedGroups(this.props.mother_state.groups[selectedGroups[0]].higher_group)
            for(var i in groupUserInfo){
                if(groupUserInfo[i].arts.length>0){
                    valid_user = valid_user+1
                }
            }

            if(valid_user>1 && allUsersMadeInput){
                if(this.props.mother_state.control_state!='reveal_disagreement'){
                    return (
                        <div className={'btn'} style={{position:'absolute', right: 10, top: 10}} 
                        onPointerDown={this.revealDisagreeement.bind(this, selectedGroups[0])}>Reveal Disagreement</div>)
                }
            }else{
                if(this.props.mother_state.control_state!='reveal_disagreement'){
                    return (
                        <div className={'btn'} style={{position:'absolute', right: 10, top: 10}} disabled>Reveal Disagreement</div>)
                }
            }

            
            
        }

        console.log('selected groups', selectedGroups)


        return (<div></div>)
    }
}

export default MoodboardDisagreementRevealerAI