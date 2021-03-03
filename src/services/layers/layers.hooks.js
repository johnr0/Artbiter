const layerPatch = async context =>{
  if(context.arguments[1]['$set']!=undefined){
    if(context.arguments[1]['$set']['updated']=='sketchpad_update_a_layer'){
      context.arguments[1]
      var sketchundo = context.arguments[1]['$set']['sketchundo']
      context.arguments[1]['$set']['sketchundo'] = undefined
      // console.log(sketchundo)
      context.app.service('layers').find({query: {_id: context.arguments[0]}})
      .then((res)=>{
        sketchundo['layer_id'] = res[0]._id
        sketchundo['board_id'] = res[0].board_id
        sketchundo['layer_image'] = res[0].image
        sketchundo['type']='layer_image'
        context.app.service('sketchundos').create(sketchundo)
      })
      
    }
  }
  
  
}


module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [],
      update: [],
      patch: [layerPatch],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
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