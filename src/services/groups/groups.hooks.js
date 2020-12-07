var axios = require('axios')
var ml_server = require('../../config')

function trainCAV(embeddings, context){
  console.log('embedding--', Object.keys(embeddings))
  axios.post(ml_server.ml_server+'trainCAV', {
    embeddings: JSON.stringify(embeddings)
  }).then((response)=>{
    // console.log(response.data)
    var cavs = JSON.parse(response.data['cavs'])
    for(var i in cavs){
      
      // console.log(cavs[i])
      context.app.service('groups').patch(i, {$set: {cav: cavs[i], updated: 'moodboard_group_cav_update'}})
    }
  }, (error)=>{
    console.log('error')
  })
}

const createTrainCAV = async context => {
  console.log('art ids are ', context.arguments[0].art_ids)
  // console.log(context.result)
  context.app.service('arts').find({query: {_id: {$in:context.arguments[0].art_ids}}})
  .then((res)=>{
    console.log('length is ', res.length,',', context.result._id)
    var embeddings = {}

    embeddings[context.result._id] = []
    for(var i in res){
      console.log(res[i]._id)
      if(res[i].embedding!=undefined){
        embeddings[context.result._id].push(res[i].embedding)
      }
    }
    // console.log(embeddings)

    trainCAV(embeddings, context)
  })

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
        trainCAV(embeddings, context)
      })
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
                // console.log(art_id, 'fourth')
                embeddings[group._id].push(art_embeddings[art_id])
              }
              // console.log(embeddings, 'embeddings')
              trainCAV(embeddings, context)
            }
            
          })
        })
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
            // console.log(art_id, 'fourth')
            embeddings[group._id].push(art_embeddings[art_id])
          }
        }
        // console.log(embeddings, 'embeddings')
        trainCAV(embeddings, context)
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
            // console.log(embeddings, 'embeddings')
            trainCAV(embeddings, context)
          }
          
        }
        
      })
    })
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
      remove: [RemoveGroupCAV]
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