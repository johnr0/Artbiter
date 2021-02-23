const axios = require("axios")

const labelAddedImage = async context =>{
  var group_modeld = undefined
  console.log('output should be output')
  // console.log(context.arguments[0])
  context.app.service('arts').find({query: {_id: context.arguments[0].art_id}})
  .then((res)=>{
    // console.log(res[0])
    context.app.service('group_models').find({query: {board_id: res[0].board_id}})
    .then((res2)=>{
      // console.log(res2, 'pit[it os res')
      var group_models = []
      var l2ts = []
      var decs = []
      var images = {}
      images[res[0]._id] = res[0].embedding      
      for(var i in res2){
        group_models.push(res2[i].group_model)
        l2ts.push(res2[i].l2t)
        decs.push(res2[i].dec)
      }
      console.log('done')
      axios.post(context.app.get('ml_server')+'labelImages', {
        images: JSON.stringify(images),
        group_model: JSON.stringify(group_models),
        l2t: JSON.stringify(l2ts),
        dec: JSON.stringify(decs),
      }).then((response)=>{
        var label_result = JSON.parse(response.data['result'])
        
        for(var key in label_result){
          var set = {}
          for(var l2tkey in l2ts){
            var l2t = l2ts[l2tkey]
            for(var j in l2t){
              if(l2t[j]!='_random'){
                if(label_result[key][l2t[j]]==undefined){
                  label_result[key][l2t[j]]=0
                }
              }
            }
          }

          var set = {}
          for(key2 in label_result[key]){
            set['labels.'+key2] = label_result[key][key2]
          }
          set['updated'] = 'arts_label'
          context.app.service('arts').patch(key, {$set: set})
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
      patch: [],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [labelAddedImage],
      update: [],
      patch: [],
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