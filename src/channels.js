module.exports = function(app) {
    if(typeof app.channel !== 'function') {
      // If no real-time functionality has been configured just return
      return;
    }
  
    app.on('connection', connection => {
      // On a new real-time connection, add it to the anonymous channel
      app.channel('anonymous').join(connection);
    });
  
    app.on('login', (authResult, { connection }) => {
      // connection can be undefined if there is no
      // real-time connection, e.g. when logging in via REST
    //   console.log('isthis?', connection.user._id)
      if(connection) {
        // Obtain the logged in user from the connection
        const user = connection.user;
        
        // The connection is no longer anonymous, remove it
        app.channel('anonymous').leave(connection);
  
        // Add it to the authenticated user channel
        app.channel('authenticated').join(connection);
  
        // Channels can be named anything and joined on any condition 
        
        // E.g. to send real-time events only to admins use
        // if(user.isAdmin) { app.channel('admins').join(connection); }
  
        // If the user has joined e.g. chat rooms
        // if(Array.isArray(user.rooms)) user.rooms.forEach(room => app.channel(`rooms/${room.id}`).join(channel));
        
        // Easily organize users by email and userid for things like messaging
        // app.channel(`emails/${user.email}`).join(channel);
        // app.channel(`a`).join(connection);
        app.channel(`userIds/${user._id}`).join(connection);


      }
    });
  
    // // eslint-disable-next-line no-unused-vars
    // app.publish((data, hook) => {
    //   // Here you can add event publishers to channels set up in `channels.js`
    //   // To publish only for a specific event use `app.publish(eventname, () => {})`
  
    //   console.log('Publishing all events to all authenticated users. See `channels.js` and https://docs.feathersjs.com/api/channels.html for more information.'); // eslint-disable-line
  
    //   // e.g. to publish all service events to all authenticated users use
    //   return app.channel('authenticated');
    // });
  

  
    // Here you can also add service specific event publishers
    // e.g. the publish the `users` service `created` event to the `admins` channel
    // app.service('users').publish('created', () => app.channel('admins'));
    
    // With the userid and email organization from above you can easily select involved users
    app.service('boards').publish((data) => {
        // console.log('owner', data.owner)
        var data_to_return = {}
        console.log(data.updated)
        if(data.updated.indexOf('sketchpad_update_a_layer')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['layers']=[]
          for(var i in data.layers){
            if(data.layers[i].layer_id==data.updated.split('.')[1]){
              data_to_return['layers'].push(data.layers[i])
            }
          }
          
        }else if(data.updated.indexOf('sketchpad_remove_a_layer')!=-1 || data.updated.indexOf('sketchpad_add_a_layer')!=-1 || data.updated.indexOf('sketchpad_reorder_layers')!=-1){
          data_to_return['updated']=data.updated
          data_to_return['layers']=data.layers
          
        }else if(data.updated.indexOf('sketchpad_layers_choosen')!=-1){
          data_to_return['layers'] = []
          data_to_return['updated']=data.updated
          var list = data.updated.split('.')
          for(var i in list){
            if(i==0){continue}
            for(var j in data.layers){
              if(data.layers[j].layer_id==list[i]){
                data_to_return['layers'][j]={choosen_by:data.layers[j].choosen_by}
              }
            }
          }
        }else if(data.updated.indexOf('moodboard_add_arts')!=-1){
          data_to_return['arts'] = {}
          data_to_return['updated']=data.updated
          var arts_list = data.updated.split('.')
          for(var i in arts_list){
            if(i==0){
              continue
            }
            var art_id = arts_list[i]
            data_to_return['arts'][art_id] = data.arts[art_id]
          }
        }else if(data.updated.indexOf('moodboard_add_texts')!=-1){
          data_to_return['texts'] = {}
          data_to_return['updated']=data.updated
          var texts_list = data.updated.split('.')
          for(var i in texts_list){
            if(i==0){
              continue
            }
            var text_id = texts_list[i]
            data_to_return['texts'][text_id] = data.texts[text_id]
          }
        }else if(data.updated.indexOf('moodboard_update_arts_texts')!=-1){
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          var arts_texts_list = data.updated.split('.')
          for(var i in arts_texts_list){
            if(i==0){
              continue
            }
            if(arts_texts_list[i].indexOf('art_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['arts'][_id] = {
                position: data.arts[_id].position,
                choosen_by: data.arts[_id].choosen_by,
              }
            }else if(arts_texts_list[i].indexOf('text_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['texts'][_id] = {
                position: data.texts[_id].position,
                fontsize: data.texts[_id].fontsize,
                text: data.texts[_id].text,
                choosen_by: data.texts[_id].choosen_by,
              }
            }
          }
          
        }else if(data.updated.indexOf('moodboard_remove_arts_texts')!=-1){
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          for(var key in data.arts){
            data_to_return.arts[key]=1
          }
          for(var key in data.texts){
            data_to_return.texts[key]=1
          }
        }else if(data.updated.indexOf('moodboard_edit_text')!=-1){
          data_to_return['updated'] = data.updated
          data_to_return['texts'] = {}
          data_to_return['texts'][data.updated.split('.')[1]] = data.texts[data.updated.split('.')[1]]

        }else if(data.updated.indexOf('moodboard_arts_texts_choosen')!=-1){
          console.log('here')
          data_to_return['updated'] = data.updated
          data_to_return['arts'] = {}
          data_to_return['texts']={}
          var arts_texts_list = data.updated.split('.')
          for(var i in arts_texts_list){
            if(i==0){
              continue
            }
            if(arts_texts_list[i].indexOf('art_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              // console.log(data.arts[_id])
              data_to_return['arts'][_id] = {
                choosen_by: data.arts[_id]['choosen_by']
              }
            }else if(arts_texts_list[i].indexOf('text_')!=-1){
              var _id = arts_texts_list[i].split('_')[1]
              data_to_return['texts'][_id] = {
                choosen_by: data.texts[_id]['choosen_by']
              }
            }
          }
          console.log(data_to_return)
        }else if(data.updated.indexOf('current_collaborators_sketch_pos')!=-1){
          data_to_return['updated'] = data.updated

          data_to_return['pos'] = data.current_collaborators[data.updated.split('.')[1]].sketch_pos
        
        }else if(data.updated.indexOf('current_collaborators_moodboard_pos')!=-1){
          data_to_return['updated'] = data.updated
          console.log(data.current_collaborators[data.updated.split('.')[1]].moodboard_pos)
          data_to_return['pos'] = data.current_collaborators[data.updated.split('.')[1]].moodboard_pos
        
        }else{
          data_to_return = data
          
        }
        // console.log(data_to_return)
        var return_list = [app.channel(`userIds/${data.owner}`).send(data_to_return)]
        // console.log('collaborators', data.collaborators)
        for(var i in data.collaborators){
            // console.log(data.collaborators[i])
            return_list.push(app.channel(`userIds/${data.collaborators[i]}`).send(data_to_return))
        }
        // console.log(return_list)
      return return_list;
    });
  };