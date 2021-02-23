var axios =require('axios')
var ml_server = require('../../config')

const labelAllImages = async context => {
    // console.log(':P')
    var group_model = [context.arguments[0].group_model]
    var l2t = [context.arguments[0].l2t]
    var dec = [context.arguments[0].dec]

    var images = {}
    var searched_images = {}
    // console.log(':P', context.arguments[0].board_id)
    context.app.service('arts').find({query: {board_id: context.arguments[0].board_id}})
    .then((res)=>{
        for(var i in res){
            // console.log(res[i].embedding)
            if(res[i].embedding!=undefined){
                images[res[i]._id]=res[i].embedding
            }
        }
        // context.app.service("searched_arts").find({query:{board_id: context.arguments[0].board_id}})
        // .then((res)=>{

        // })
        // console.log(':Pdouble')
        axios.post(context.app.get('ml_server')+'labelImages', {
            images: JSON.stringify(images),
            group_model: JSON.stringify(group_model),
            l2t: JSON.stringify(l2t),
            dec: JSON.stringify(dec),
        }).then((response)=>{
            var label_result = JSON.parse(response.data['result'])
            for(var key in label_result){
                for(var j in l2t[0]){
                    if(l2t[0][j]!='_random'){
                        if(label_result[key][l2t[0][j]]==undefined){
                            label_result[key][l2t[0][j]] = 0
                        }
                        
                    }
                }
                var set = {}
                for(key2 in label_result[key]){
                    set['labels.'+key2] = label_result[key][key2]
                }
                // var set = {labels: JSON.parse(JSON.stringify(label_result[key]))}
                set['updated'] = 'arts_label'
                context.app.service('arts').patch(key, {$set: set})
            }
        })
    })


}

module.exports = {
    before: {
      all: [],
      find: [ ],
      get: [],
      create: [labelAllImages],
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