var axios =require('axios')
var ml_server = require('../../config')
// import ml_server from '../../config'

const turnImageToEmbedding = async context => {
  // console.log(context.argument)
  // console.log(context)
  var image = context.arguments[0].file
  console.log('ml_server', ml_server)

  axios.post(ml_server.ml_server+'image_to_embedding', {
    image: image,
  }).then((response)=>{
    // console.log(response.data)
    var embedding = JSON.parse(response.data.embedding)
    console.log(context.arguments[0]._id)
    context.app.service('arts').patch(context.arguments[0]._id, {$set:{updated:'moodboard_update_arts_embedding', embedding: embedding}})
  }, (error)=>{
    console.log('error')
  })
  return context
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
      create: [turnImageToEmbedding],
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