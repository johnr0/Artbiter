const onBoardUpdate = async context =>{

    context.app.service('boards').emit('changed', {
        data: context.arguments[1]
    })
    console.log(context.app.service('boards').emit)
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
      create: [],
      update: [onBoardUpdate],
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