var axios = require('axios')
var ml_server = require('../../config')
var nj = require('numjs');

function sliderImpact(board_id, context){
  context.app.service('boards').find({query: {_id: board_id}})
  .then((res0)=>{
    var search_slider_values = res0[0].search_slider_values
    if(search_slider_values==undefined){
      search_slider_values = {}
    }
    var search_image_selected = res0[0].search_image_selected
    context.app.service('groups').find({query: {board_id:board_id}})
    .then((res1)=>{
      var higher_groups = {}
      var ids = []
      for(var i in res1){
        ids.push(res1[i]._id)
      }
      for(var i in search_slider_values){
        if(ids.indexOf(i)==-1){
          delete search_slider_values[i]
        }
      }

      // console.log(res)
      for(var i in res1){
        console.log('_id is', res1[i]._id, res1[i].higher_group)//, res[i]._id)
        if(higher_groups[res1[i].higher_group]==undefined){
          higher_groups[res1[i].higher_group]=[]
        }
        higher_groups[res1[i].higher_group].push(res1[i]._id)
      }
      console.log(higher_groups)
      for(var i in res1){
        if(search_slider_values[res1[i]._id]==undefined){
          if(higher_groups[res1[i].higher_group].length==2 ){
            if(higher_groups[res1[i].higher_group][1]==res1[i]._id){
              delete search_slider_values[res1[i]._id]
            }else if(higher_groups[res1[i].higher_group][0]==res1[i]._id){
              search_slider_values[res1[i]._id]=0
            }
          }else{
            search_slider_values[res1[i]._id]=0
          }
        }else{
          if(higher_groups[res1[i].higher_group].length==2 ){
            if(higher_groups[res1[i].higher_group][1]==res1[i]._id){
              delete search_slider_values[res1[i]._id]
            }
          }
        }
      }

      console.log(search_slider_values)
      cavs = {}
      for(var i in search_slider_values){
        cavs[i] = res1[ids.indexOf(i)].cav
      }

      context.app.service('arts').find({query: {_id: search_image_selected}})
      .then((res2)=>{
        console.log(search_image_selected, res2[0]._id)
        var embedding = res2[0].embedding
        axios.post(ml_server.ml_server+'sliderImpact', {
          search_slider_values: JSON.stringify(search_slider_values),
          cavs: JSON.stringify(cavs),
          cur_image: JSON.stringify(embedding),
        }).then((response)=>{
          console.log(response.data['distances'])
          var distances = JSON.parse(response.data['distances'])
          context.app.service('boards').patch(board_id, {$set: {search_slider_distances:distances, updated:'moodboard_search_slider_distances'}})
        }, (error)=>{
          console.log('error')
        })
      })

      

    })
  })
  
}

function trainCAV(embeddings, context, board_id){
  console.log('embedding--', Object.keys(embeddings))
  // console.log(JSON.stringify(styles))
  axios.post(ml_server.ml_server+'trainCAV', {
    embeddings: JSON.stringify(embeddings),
  }).then((response)=>{
    // console.log(response.data)
    var cavs = JSON.parse(response.data['cavs'])

    // var avg_styles = JSON.parse(response.data['avg_styles'])
    // console.log(avg_styles)
    var promises = []
    for(var i in cavs){
      // console.log(cavs[i])
      promises.push(context.app.service('groups').patch(i, {$set: {cav: cavs[i], updated: 'moodboard_group_cav_update'}}))
    }

    Promise.all(promises).then(data=>{
      console.log('all')
      sliderImpact(board_id, context)
    })
  }, (error)=>{
    console.log('error')
    
  })

}

function averageStyles(styles, context){
  var avg_styles = {}
    for(var i in styles){
      avg_styles[i] = {}
      for(var dim_key in styles[i][0]){
        var sum_vec = undefined
        for(var k in styles[i]){
          var vec = styles[i][k][dim_key]
          var vec = nj.array(vec);
          if(sum_vec==undefined){
            sum_vec = vec
          }else{
            sum_vec.add(vec, false)
          }
        }
        // console.log('fail?')
        var l = []
        for(var n1=0; n1<sum_vec.shape[0]; n1++){
          l.push([])
          for(var n2=0; n2<sum_vec.shape[1]; n2++){
            l[n1].push([])
            for(var n3=0; n3<sum_vec.shape[2]; n3++){
              l[n1][n2].push([])
              for(var n4=0; n4<sum_vec.shape[3]; n4++){
                l[n1][n2][n3].push(sum_vec.get(n1,n2,n3,n4)/styles[i].length)
              }
            }
          }
        }
        avg_styles[i][dim_key]=l
        // console.log(l)
      }
    }
    for(var i in avg_styles){
      context.app.service('group_styles').find({query : {group_id: i}})
      .then((res)=>{
        if(res.length>0){
          context.app.service('group_styles').patch(res._id, {$set: {style: avg_styles[i]}})
        }else{
          context.app.service('group_styles').create({style: avg_styles[i], group_id: i})
        }
      })
      
    }

}

const createTrainCAV = async context => {
  console.log('art ids are ', context.arguments[0].art_ids)
  // console.log(context.result)
  context.app.service('arts').find({query: {_id: {$in:context.arguments[0].art_ids}}})
  .then((res)=>{
    console.log('length is ', res.length,',', context.result._id)
    var embeddings = {}
    // var styles = {}

    embeddings[context.result._id] = []
    // styles[context.result._id] = []
    for(var i in res){
      console.log(res[i]._id)
      if(res[i].embedding!=undefined){
        embeddings[context.result._id].push(res[i].embedding)
      }
    }
    // console.log(embeddings)

    trainCAV(embeddings, context, res[0].board_id)
    // averageStyles(style)
  })

  context.app.service('art_styles').find({query: {art_id:{$in: context.arguments[0].art_ids}}})
  .then((res2)=>{
    var styles = {}
    styles[context.result._id] = []
    for(var j in res2){
      if(res2[j].style!=undefined){
        styles[context.result._id].push(res2[j].style)
      }  
    }
    averageStyles(styles, context)
  })
  // context.app.service('boards').find({query: {_id: context.arguments[0].board_id}})
  // .then((res)=>{
  //   var search_slider_values = res[0].search_slider_values
  //   search_slider_values[context.result._id] = 0
  //   context.app.service('boards').patch(res[0]._id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
  // })

  return context
}

const RelateCAV = async context => {
  // console.log('relate')
  // console.log('relate~~', context)
  if(context.result.updated=='groups_relate_r'){
    // console.log('relate 2')
    // console.log(context.result.higher_group)
    context.app.service('groups').find({query: {higher_group: context.result.higher_group}})
    .then((res)=>{
      var art_ids = []
      var embeddings = {}
      var styles = {}
      for(var i in res){
        var group = res[i]
        art_ids = art_ids.concat(group.art_ids)
      }
      context.app.service('arts').find({query:{_id:{$in:art_ids}}})
      .then((res2)=>{
        var art_embeddings = {}
        for(var j in res2){
          art_embeddings[res2[j]._id] = res2[j].embedding
        }
        for(var i in res){
          var group = res[i]
          embeddings[group._id] = []
          for(var j in group.art_ids){
            var art_id = group.art_ids[j]
            // console.log(art_id, 'fourth')
            embeddings[group._id].push(art_embeddings[art_id])
          }
        }
        console.log(embeddings, 'embeddings')
        trainCAV(embeddings, context, context.result.board_id)
      })

      context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
      .then((res3)=>{
        var art_styles = {}
        for(var j in res3){
          art_styles[res3[j].art_id] = res3[j].style
        }
        for(var i in res){
          var group = res[i]
          styles[group._id] = []
          for(var j in group.art_ids){
            var art_id = group.art_ids[j]
            styles[group._id].push(art_styles[art_id])
          }
        }
        averageStyles(styles, context)
      })
      // console.log(res)
      // if(res.length==2){
      //   context.app.service('boards').find({query: {_id: context.result.board_id}})
      //   .then((res3)=>{
      //     var search_slider_values = res3[0].search_slider_values
      //     delete search_slider_values[context.result._id]
      //     context.app.service('boards').patch(res3[0]._id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
      //   })
      // }else if(res.length>2){
      //   context.app.service('boards').find({query: {_id: context.result.board_id}})
      //   .then((res3)=>{
      //     var search_slider_values = res3[0].search_slider_values
      //     delete search_slider_values[context.result._id]
      //     context.app.service('boards').patch(res3[0]._id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
      //   })
      // }
    })

    
  }
}

const UnrelateCAV = async context => {

  // console.log(context.arguments[1], 'unrelate')
  if(context.arguments[1]['$set'].updated=='groups_relate_u'){
      context.app.service('groups').find({query:{_id: context.arguments[0]}})
      .then((res)=>{
        console.log(res[0].higher_group)
        context.app.service('groups').find({query: {higher_group: res[0].higher_group}})
        .then((res2)=>{
          console.log(res2.length)
          var art_ids = []
          
          for(var i in res2){
            var group = res2[i]
            art_ids = art_ids.concat(group.art_ids)
          }
          context.app.service('arts').find({query:{_id:{$in:art_ids}}})
          .then((res3)=>{
            var art_embeddings = {}
            for(var j in res3){
              art_embeddings[res3[j]._id] = res3[j].embedding
            }
            for(var i in res2){
              var embeddings = {}
              var group = res2[i]
              embeddings[group._id] = []
              for(var j in group.art_ids){
                var art_id = group.art_ids[j]
                embeddings[group._id].push(art_embeddings[art_id])

              }
              // console.log(embeddings, 'embeddings')
              trainCAV(embeddings, context, res[0].board_id)
            }
            
          })

          context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
          .then((res4)=>{
            var art_styles = {}
            for(var j in res4){
              art_styles[res4[j].art_id] = res4[j].style
            }
            for(var i in res2){
              var styles = {}
              var group = res2[i]
              if(group._id!=context.arguments[0]){
                styles[group._id] = []
                for(var j in group.art_ids){
                  var art_id = group.art_ids[j]
                  styles[group._id].push(art_styles[art_id])
                }
                averageStyles(styles, context)
              }
            }
            
          })
        })
        // context.app.service('boards').find({query: {_id: res[0].board_id}})
        // .then((res4)=>{
        //   var search_slider_values = res4[0].search_slider_values
        //   search_slider_values[context.arguments[0]]=0
        //   context.app.service('boards').patch(res4[0]._id, {$set:{search_slider_values: search_slider_values, updated: 'moodboard_search_slider_change'}})
        // })
      })
      
  }
}

const AddRemoveArtCAV = async context => {
  // console.log('add remove')
  if(context.result.updated=='groups_add' || context.result.updated=='groups_remove'){
    context.app.service('groups').find({query: {higher_group: context.result.higher_group}})
    .then((res)=>{
      var art_ids = []
      var embeddings = {}
      var styles = {}
      for(var i in res){
        var group = res[i]
        art_ids = art_ids.concat(group.art_ids)
      }
      context.app.service('arts').find({query:{_id:{$in:art_ids}}})
      .then((res2)=>{
        var art_embeddings = {}
        for(var j in res2){
          art_embeddings[res2[j]._id] = res2[j].embedding
        }
        console.log('arts',Object.keys(art_embeddings))
        for(var i in res){
          var group = res[i]
          embeddings[group._id] = []
          for(var j in group.art_ids){
            var art_id = group.art_ids[j]
            embeddings[group._id].push(art_embeddings[art_id])
          }
        }
        // console.log(embeddings, 'embeddings')
        trainCAV(embeddings, context, res[0].board_id)
      })

      context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
      .then((res3)=>{
        var art_styles = {}
        for(var j in res3){
          art_styles[res3[j].art_id] = res3[j].style
        }
        for(var i in res){
          var group = res[i]
          styles[group._id] = []
          for(var j in group.art_ids){
            var art_id = group.art_ids[j]
            styles[group._id].push(art_styles[art_id])
          }
        }
        averageStyles(styles, context)
      })
    })
  } 
}

const RemoveGroupCAV = async context => {
  console.log('remove group')
  context.app.service('groups').find({query:{_id: context.arguments[0]}})
  .then((res)=>{
    console.log(res[0].higher_group)
    context.app.service('groups').find({query: {higher_group: res[0].higher_group}})
    .then((res2)=>{
      console.log(res2.length)
      var art_ids = []
      
      for(var i in res2){
        var group = res2[i]
        if(group._id!=context.arguments[0]){
          art_ids = art_ids.concat(group.art_ids)
        }
        
      }

      context.app.service('arts').find({query:{_id:{$in:art_ids}}})
      .then((res3)=>{
        var art_embeddings = {}
        for(var j in res3){
          art_embeddings[res3[j]._id] = res3[j].embedding
        }
        for(var i in res2){
          var embeddings = {}
          var group = res2[i]
          console.log(group._id, context.arguments[0])
          if(group._id!=context.arguments[0]){
            console.log('proce...')
            embeddings[group._id] = []
            for(var j in group.art_ids){
              var art_id = group.art_ids[j]
              // console.log(art_id, 'fourth')
              embeddings[group._id].push(art_embeddings[art_id])
            }
            console.log('resres000', res[0].board_id)
            trainCAV(embeddings, context, res[0].board_id)
          }
          
        }
      })

      context.app.service('art_styles').find({query: {art_id:{$in: art_ids}}})
      .then((res4)=>{
        var art_styles = {}
        for(var j in res4){
          art_styles[res4[j].art_id] = res4[j].style
        }
        for(var i in res2){
          var styles = {}
          var group = res2[i]
          if(group._id!=context.arguments[0]){
            styles[group._id] = []
            for(var j in group.art_ids){
              var art_id = group.art_ids[j]
              styles[group._id].push(art_styles[art_id])
            }
            averageStyles(styles, context)
          }
        }
        
      })
    })
  })
}

const groupStyleRemove = async context =>{
  context.app.service('group_styles').find({query: {group_id: context.arguments[0]}})
  .then((res)=>{
    for(var i in res){
      context.app.service('group_styles').remove(res[i]._id)
    }
  })
}

module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [],
      update: [],
      patch: [UnrelateCAV],
      remove: [RemoveGroupCAV, groupStyleRemove]
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [createTrainCAV],
      update: [],
      patch: [RelateCAV, AddRemoveArtCAV],
      remove: []
    },
  
    error: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [],
      remove: []
    }
  };