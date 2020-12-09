var axios = require('axios')
var ml_server = require('../../config')

function sliderImpact(board_id, context){
  context.app.service('boards').find({query: {_id: board_id}})
  .then((res0)=>{
    var search_slider_values = res0[0].search_slider_values
    if(search_slider_values==undefined){
      search_slider_values = {}
    }
    var search_image_selected = res0[0].search_image_selected
    if(search_image_selected==undefined){
      return
    }
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

function generateImage(content, content_weight, styles, style_weights, context){
  console.log('run this how?')
  console.log(JSON.stringify(content))
  axios.post(ml_server.ml_server+'generateImage', {
    content: JSON.stringify(content),
    content_weight: content_weight,
    styles: JSON.stringify(styles),
    style_weights: JSON.stringify(style_weights)
  }, {
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  }).then((response)=>{
    console.log('response')
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

const boardGenerateImage = async context =>{
  if(context.result.updated=='moodboard_generate_image'){
    console.log('board generatee starts')
    var search_start_image = context.result.search_image_selected
    if(search_start_image==undefined){
      return
    }
    var search_slider_values = JSON.parse(JSON.stringify(context.result.search_slider_values))
    var search_slider_groups = Object.keys(search_slider_values)
    for(var gk in search_slider_values){
      search_slider_values[gk] = (search_slider_values[gk]+1)/2
    }
    context.app.service('groups').find({query:{board_id: context.result._id}})
    .then((groups)=>{
      var group_ids = []
      var groups_with_higher = {}
      for(var i in groups){
        if(groups_with_higher[groups[i].higher_group]==undefined){
          groups_with_higher[groups[i].higher_group] = []
        }
        group_ids.push(groups[i]._id)
        groups_with_higher[groups[i].higher_group].push(groups[i]._id)
        
      }
      for(var hk in groups_with_higher){
        if(groups_with_higher[hk].length==2){
          for(var i in groups_with_higher[hk]){
            if(search_slider_values[groups_with_higher[hk][i]]==undefined){
              var idx = 0
              if(i==0){
                idx=1
              }
              search_slider_values[groups_with_higher[hk][i]]= 1-search_slider_values[groups_with_higher[hk][idx]]
            }
          }
        }
      }
      var weight_sum = 0
      for(var gk in search_slider_values){
        weight_sum = weight_sum + search_slider_values[gk]
      }
      var art_weight = (Object.keys(search_slider_values).length-weight_sum)/Object.keys(search_slider_values).length
      console.log(art_weight)
      var art_weight = 0
      for(var gk in search_slider_values){
        search_slider_values[gk]= search_slider_values[gk]/weight_sum
        // search_slider_values[gk]= search_slider_values[gk]/Object.keys(search_slider_values).length
      }

      console.log(search_slider_values)
      context.app.service('group_styles').find({query: {group_id: {$in: group_ids}}})
      .then((group_styles)=>{
        var styles_of_groups = {}
        for(var i in group_styles){
          styles_of_groups[group_styles[i].group_id] = group_styles[i].style
        }
        context.app.service('art_styles').find({query: {art_id: search_start_image}})
        .then((art_styles)=>{
          var art_style = art_styles[0].style

          generateImage(art_style, art_weight, styles_of_groups, search_slider_values, context)
        })
      })
    })

  }
}

const afterSliderValuesChange = async context =>{
  if(context.result.updated=='moodboard_search_slider_change'){
    sliderImpact(context.result._id, context)
  }
}

const afterSearchImageSelected = async context =>{
  if(context.result.updated=='moodboard_search_image_select'){
    sliderImpact(context.result._id, context)
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
      patch: [boardSearchImage, boardGenerateImage, afterSliderValuesChange, afterSearchImageSelected],
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