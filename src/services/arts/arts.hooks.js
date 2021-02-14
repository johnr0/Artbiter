var axios =require('axios')
var ml_server = require('../../config')
// import ml_server from '../../config'

const turnImageToEmbedding = async context => {
  // console.log(context.argument)
  // console.log(context)
  var image = context.arguments[0].file
  console.log('ml_server', ml_server)
  console.log(context.app.get('ml_server'))

  // console.log(image)

  axios.post(context.app.get('ml_server')+'image_to_embedding', {
    image: image,
  }).then((response)=>{
    // console.log(response.data)
    // console.log('e1?')
    var embedding = JSON.parse(response.data.embedding)
    var style = JSON.parse(response.data.style)
    console.log(Object.keys(style))
    // console.log(context.arguments[0]._id)
    context.app.service('arts').patch(context.arguments[0]._id, {$set:{updated:'moodboard_update_arts_embedding', embedding: embedding, enabled:true}})
    
    context.app.service('art_styles').create({
      art_id: context.arguments[0]._id,
      style: style
    })
  }, (error)=>{
    console.log(error)
    console.log('error')
  })
  return context
}

const turnColorChangeToEmbedding = async context =>{
  if(context.result.updated=='moodboard_color_swatch_change'){
    console.log(context.arguments)
    var image = context.result.file
    console.log('ml_server', ml_server)

    axios.post(context.app.get('ml_server')+'image_to_embedding', {
      image: image,
    }).then((response)=>{
      // console.log(response.data)
      // console.log('e1?')
      var embedding = JSON.parse(response.data.embedding)
      var style = JSON.parse(response.data.style)
      console.log(Object.keys(style))
      // console.log(context.arguments[0]._id)
      console.log('color embedding patching')
      context.app.service('arts').patch(context.result._id, {$set:{updated:'moodboard_update_arts_embedding', embedding: embedding}})
      
      context.app.service('art_styles').find({query: {art_id:context.result._id}})
      .then((res)=>{
        console.log('color style patching')
        context.app.service('art_styles').patch(res[0]._id, {$set:{style:style}})
      })
    }, (error)=>{
      // console.log(error)
      console.log('error')
    })
  }
  
}

const artStyleRemove = async context =>{
  context.app.service('art_styles').find({query: {art_id: context.arguments[0]}})
  .then((res)=>{
    for(var i in res){
      context.app.service('art_styles').remove(res[i]._id)
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
      patch: [],
      remove: [artStyleRemove]
    },
  
    after: {
      all: [],
      find: [],
      get: [],
      create: [turnImageToEmbedding],
      update: [],
      patch: [turnColorChangeToEmbedding],
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