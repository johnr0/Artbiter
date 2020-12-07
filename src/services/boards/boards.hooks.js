var axios = require('axios')
var ml_server = require('../../config')


function searchImages(search_start_image_embedding, cavs, search_slider_values, context){
  axios.post(ml_server.ml_server+'searchImages', {
    search_start_image_embedding: JSON.stringify(search_start_image_embedding),
    cavs: JSON.stringify(cavs),
    search_slider_values: JSON.stringify(search_slider_values)
  }).then((response)=>{
    var returned_images = JSON.parse(response.data['returned_images'])
    console.log('returned images:', returned_images.length)

    // TODO show returned images... 
    context.app.service('searched_arts').find({query: {board_id: context.result._id}})
    .then((res0)=>{
      for(var i in res0){
        context.app.service('searched_arts').remove(res0[i]._id)
      }
      for(var i in returned_images){
        var searched_art = {
          image: returned_images[i],
          board_id: context.result._id,
          order: i,
        }
        context.app.service('searched_arts').create(searched_art)
      }
    })
    
  }, (error)=>{
    console.log('error')
  })
}

const onBoardUpdate = async context =>{

    context.app.service('boards').emit('changed', {
        data: context.arguments[1]
    })
    // console.log(context.app.service('boards').emit)
    return context
}

const boardSearchImage = async context => {
  if(context.result.updated=='moodboard_search_images'){
    console.log('board search starts')
    var search_start_image = context.result.search_image_selected
    var search_slider_values = context.result.search_slider_values
    var search_slider_groups = Object.keys(search_slider_values)
    if(search_start_image!=undefined && search_slider_values!=undefined){
      console.log(search_start_image, search_slider_values)
      context.app.service('arts').find({query: {_id: search_start_image}})
      .then((res1)=>{
        var search_start_image_embedding = res1[0].embedding
        var cavs = {}
        context.app.service('groups').find({_id: {$in: search_slider_groups}})
        .then((res2)=>{

          for(var i in res2){
            cavs[res2[i]._id] = res2[i].cav
          }
          
          searchImages(search_start_image_embedding, cavs, search_slider_values, context)

        })
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
      patch: [],
      remove: []
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [],
      update: [],
      patch: [boardSearchImage],
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