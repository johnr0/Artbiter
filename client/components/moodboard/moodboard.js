import { keys } from '@feathersjs/transport-commons/lib/channels'
import React, {Component} from 'react'
import ProtoBoard from '../proto/protoboard'
import MoodboardImage from './moodboard_image'
import MoodBoardImageAddController from './moodboard_image_add_controller'
import MoodBoardMainController from './moodboard_main_controller'
import MoodBoardText from './moodboard_text'

class MoodBoard extends ProtoBoard{
    state = {
        ...this.state,
        boardname:'moodboard',

        control_state: 'control_object',
        //control_state --> move_board, add_image, add_comment, add_text, control_object
        // action --> move_board: idle, move_board
        //            add_image: idle, 
        //            control_object: idle, image_selected, object_resizing, object_moving, text_selected, objects_selected

        current_image: [],
        current_selected_pos: undefined,
        current_selected_ratio: undefined,

        images_to_add: [],

        current_image_resize_direction: undefined, //top-left, top-right, bottom-left, bottom-right

        init_mouse_pos: undefined, 
        init_image_pos: undefined, 
        init_text_pos: undefined,

        current_text: [],
        // current_comment: undefined,

        arts: {},

        texts: {},

        shift_down: false,
        control_down: false,
    }

    // TODO: Getting images from clip board...

    componentDidMount(){
        super.componentDidMount();
        var _this = this
        document.addEventListener('keydown', function(e){
            e = e||window.event;
            console.log(e.key)
            if(e.key=="Shift"){
                _this.setState({shift_down: true})
                console.log('shiftdown')
            }else if(e.key=="Backspace"){
                console.log('delete')
                _this.delete_object()
            }else if(e.key=="Control"){
                _this.setState({control_down: true})
            }else if(e.key=='v'){
                if(_this.state.control_down){
                    _this.pasteImages(e)
                }
            }
        })

        document.addEventListener('keyup', function(e){
            e = e||window.event;
            // console.log('up?')
            if(e.key=="Shift"){
                _this.setState({shift_down: false})
                console.log('shiftup')
            }if(e.key=='Control'){
                _this.setState({control_down:false})
            }
        })

        window.addEventListener('paste', function(e){
            console.log('runnning?')
            _this.pasteImages(e);
        })
    }

    zoom_board_wheel(e){
        // console.log(e.deltaY)
        if(this.state.action=='idle' || this.state.action=='image_selected' || this.state.action=='text_selected' || this.state.action=='objects_selected'){
            var boardzoom_new = this.state.boardzoom+e.deltaY/100
            if(boardzoom_new<1){
                this.setState({boardzoom: 1})
            }else if(boardzoom_new>10){
                this.setState({boardzoom: 10})
            }else{
                this.setState({boardzoom: boardzoom_new})
            }
        }    
    }

    delete_object(){
        if((this.state.current_image.length>0||this.state.current_text.length>0) && this.state.control_state=='control_object' && this.state.action=='idle'){
            // this.setState({})
            var art_ids = []
            var text_ids = []
            var arts = this.state.arts
            for(var i in this.state.current_image){
                var key = this.state.current_image[i]
                art_ids.push(key)
                delete arts[key]
            }
            var texts = this.state.texts
            for(var i in this.state.current_text){
                var key = this.state.current_text[i]
                
                if(document.getElementById('textarea_'+key)!==document.activeElement){
                    text_ids.push(key)
                    delete texts[key]
                }else{
                    return
                }
                
            }
            this.props.board_this.RemoveArtsTexts(art_ids, text_ids)
            this.setState({current_selected_pos: undefined, current_selected_ratio:undefined, current_image:[], current_text:[], arts:arts, texts: texts})
        }
    }
    
    getPositionOnBoard(xpix, ypix){
        var xpos = this.state.boardcenter[0]-this.state.boardwidth/2/this.state.boardlength/this.state.boardzoom+xpix/this.state.boardzoom/this.state.boardlength
        var ypos = this.state.boardcenter[1]-this.state.boardheight/2/this.state.boardlength/this.state.boardzoom+ypix/this.state.boardzoom/this.state.boardlength
        return [xpos, ypos]
    }

    getCurrentMouseOnBoard(e){
        var xpix = e.pageX - document.getElementById(this.state.boardname).offsetLeft
        var ypix = e.pageY - document.getElementById(this.state.boardname).offsetTop
        // console.log(xpix, ypix)
        
        // console.log(xpos, ypos)

        return this.getPositionOnBoard(xpix, ypix);
    }
    
    dropImage(e){
        e.stopPropagation();
        e.preventDefault();
        
        var files = e.dataTransfer.files
        var arts = this.state.arts
        // var origin = this.getCurrentMouseOnBoard(e)
        var _this = this
        var pageX = e.pageX
        var pageY = e.pageY
        var current_image = []
        this.setState({current_image:[], current_text: [], current_selected_pos: undefined, current_selected_ratio: undefined}, function(){
            console.log(files)
            var counter=0
            var promises = []
    
            for(var i in files){
                var file = files[i]
                promises.push(this.dropOneImage(file, pageX, pageY, arts, counter))
                counter = counter+1
                
            }
            // promises.push(this.addImages())
            return Promise.all(promises).then(()=>{
                console.log('haechi?')
            })
        })
        
    }

    dropOneImage(file, pageX, pageY, arts, counter){
        var _this=this
        if(file && file['type']){
            if(file['type'].split('/')[0]==='image'){
            // add image...
            // console.log(file)
            var reader = new FileReader();
            reader.onload = function(){

                // var images_to_add = _this.state.images_to_add
                // images_to_add.push([reader.result, pageX, pageY, arts, counter])
                // console.log(reader.result)
                // _this.setState({images_to_add})
                // return
                _this.addAnImage(reader.result, pageX, pageY, arts, counter)

                // var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                // var image = new Image();
                
                // image.src = reader.result
                // image.onload = function(){
                //     var xpixo = pageX - document.getElementById(_this.state.boardname).offsetLeft+ counter*10
                //     var ypixo = pageY - document.getElementById(_this.state.boardname).offsetTop+counter*10
                //     var ypix = pageY - document.getElementById(_this.state.boardname).offsetTop+100+counter*10
                //     var xpix = pageX - document.getElementById(_this.state.boardname).offsetLeft+ 100/this.height*this.width+counter*10
                //     var cur = _this.getPositionOnBoard(xpix, ypix)
                //     var origin = _this.getPositionOnBoard(xpixo, ypixo)
                //     // console.log(xpixo, ypixo, xpix, ypix)
                //     // console.log([origin[0], origin[1], cur[0], cur[1]])
                //     arts[id]={
                //         file: reader.result,
                //         position: [origin[0], origin[1], cur[0], cur[1]], 
                //         ratio:  this.width/this.height,
                //     }
                    
                //     var current_image = _this.state.current_image
                //     var current_image_pos = _this.state.current_selected_pos
                //     var current_selected_ratio = _this.state.current_selected_ratio
                //     console.log(current_image_pos)
                //     if(current_image_pos==undefined){
                //         current_image_pos = [origin[0], origin[1], cur[0], cur[1]]
                //         current_selected_ratio = Math.abs((cur[0]-origin[0])/(cur[1]-origin[1]))
                //     }else{
                //         if(current_image_pos[2]<cur[0]){
                //             current_image_pos[2]=cur[0]
                //         }
                //         if(current_image_pos[3]<cur[1]){
                //             current_image_pos[3]=cur[1]
                //         }
                //         if(current_image_pos[0]>origin[0]){
                //             current_image_pos[0]=origin[0]
                //         }
                //         if(current_image_pos[1]>origin[1]){
                //             current_image_pos[1]=origin[1]
                //         }
                //         current_selected_ratio = Math.abs((current_image_pos[2]-current_image_pos[0])/(current_image_pos[3]-current_image_pos[1]))
                //     }
                //     current_image.push(id)
                //     console.log(current_image_pos)
                //     console.log('image ratio', current_selected_ratio, this.width/this.height)
                //     _this.setState({arts:arts, current_image: current_image, current_text: [], current_selected_pos:current_image_pos, current_selected_ratio: current_selected_ratio})
                //     // console.log('uyay', this.width, this.height)
                // }
            }
            reader.readAsDataURL(file)

            }
        }
        return
    }

    addAnImage(imgsrc, pageX, pageY, arts, counter){
        // console.log(this.state.current_image, this.state.images_to_add)
        // return
        var _this = this
        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var image = new Image();
        
        image.src = imgsrc
        image.onload = function(){
            var xpixo = pageX - document.getElementById(_this.state.boardname).offsetLeft+ counter*10
            var ypixo = pageY - document.getElementById(_this.state.boardname).offsetTop+counter*10
            var ypix = pageY - document.getElementById(_this.state.boardname).offsetTop+100+counter*10
            var xpix = pageX - document.getElementById(_this.state.boardname).offsetLeft+ 100/this.height*this.width+counter*10
            var cur = _this.getPositionOnBoard(xpix, ypix)
            var origin = _this.getPositionOnBoard(xpixo, ypixo)
            // console.log(xpixo, ypixo, xpix, ypix)
            // console.log([origin[0], origin[1], cur[0], cur[1]])
            arts[id]={
                file: imgsrc,
                position: [origin[0], origin[1], cur[0], cur[1]], 
                ratio:  this.width/this.height,
                choosen_by: _this.props.board_this.state.user_id, 
            }
            
            var current_image = _this.state.current_image
            var current_image_pos = _this.state.current_selected_pos
            var current_selected_ratio = _this.state.current_selected_ratio
            // console.log(current_image_pos)
            if(current_image_pos==undefined){
                current_image_pos = [origin[0], origin[1], cur[0], cur[1]]
                current_selected_ratio = Math.abs((cur[0]-origin[0])/(cur[1]-origin[1]))
            }else{
                if(current_image_pos[2]<cur[0]){
                    current_image_pos[2]=cur[0]
                }
                if(current_image_pos[3]<cur[1]){
                    current_image_pos[3]=cur[1]
                }
                if(current_image_pos[0]>origin[0]){
                    current_image_pos[0]=origin[0]
                }
                if(current_image_pos[1]>origin[1]){
                    current_image_pos[1]=origin[1]
                }
                current_selected_ratio = Math.abs((current_image_pos[2]-current_image_pos[0])/(current_image_pos[3]-current_image_pos[1]))
            }
            current_image.push(id)
            console.log(current_image_pos)
            console.log('image ratio', current_selected_ratio, this.width/this.height)
            Promise.all([
                _this.props.board_this.AddArts([arts[id]],[id]),
                _this.setState({current_image: current_image, current_text: [], current_selected_pos:current_image_pos, current_selected_ratio: current_selected_ratio})
            ])
            
            // console.log('uyay', this.width, this.height)
        }
    }

    pasteImages(e){
        // console.log(e.clipboardData.items)
        var _this = this
        this.setState({current_image:[], current_text: [],current_selected_pos: undefined, current_selected_ratio: undefined},function(){
            navigator.clipboard.read().then((items)=>{
                console.log(items)
                var promises = []
                var counter = 0
                for(var i=0; i<items.length; i++){
                    var item = items[i]
                    for (var j=0; j<item.types.length; j++){
                        var type = item.types[j]
                        if(type.startsWith('image/')){
                            promises.push(_this.pasteImage(item, type, counter))
                            counter = counter+1
                        }
                    }
                    console.log(i)
                }
                // promises.push(this.addImages())
                Promise.all(promises)
            })
        })
        
        // var items = e.clipboardData.items
        
    }

    pasteImage(item, type, counter){ 
        var _this = this
        item.getType(type).then((it)=>{
            console.log(it);
            var reader = new FileReader();
            reader.onload = function(){

                // var images_to_add = _this.state.images_to_add
                // images_to_add.push([reader.result, document.getElementById(_this.state.boardname).offsetLeft,document.getElementById(_this.state.boardname).offsetTop+100, 
                //     _this.state.arts, counter])
                // _this.setState({images_to_add})
                _this.addAnImage(reader.result, document.getElementById(_this.state.boardname).offsetLeft,document.getElementById(_this.state.boardname).offsetTop+100, 
                _this.state.arts, counter)
            }
            reader.readAsDataURL(it)
            
        })
        
    }

    dropenter(e){
        e.stopPropagation();
        e.preventDefault()
        
        console.log('in')
    }
    dropout(e){
        e.stopPropagation();
        e.preventDefault()
        
        console.log('out')
    }
    dropover(e){
        e.stopPropagation()
        e.preventDefault()
    }

    moodBoardMouseInit(e){
        if(this.state.control_state=='control_object' && this.state.action=='idle'){
            this.moveBoardInit(e)
        }else if(this.state.control_state=='add_image' && this.state.action=='add_image'){
            this.add_image_init(e)
        }else if(this.state.control_state=='add_text'&& this.state.action=='idle'){
            this.add_text_init(e)
        }
    }

    moodBoardMouseMove(e){
        // var pos = this.getCurrentMouseOnBoard(e)
        // this.props.board_this.setMoodboardPosition(pos[0], pos[1]);

        if(this.state.control_state=='control_object' && this.state.action=='move_board'){
            this.moveMouse(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_resizing'){
            this.object_resizing(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_moving'){
            this.object_moving(e)
        }
    }



    moodBoardMouseEnd(e){
        if(this.state.control_state=='control_object' && this.state.action=='move_board'){
            this.moveBoardEnd(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_resizing'){
            this.end_object_resizing(e)
        }else if(this.state.control_state=='control_object' && this.state.action=='object_moving'){
            this.object_moving_end(e)
        }
    }

    moveBoardEnd(e){
        if(this.state.move_board_init[0]==this.state.boardcenter[0] && this.state.move_board_init[1]==this.state.boardcenter[1]){
            var del_texts = []
            var replace_texts = []
            var replace_text_ids = []
            for(var i in this.state.current_text){
                var key = this.state.current_text[i]
                if(this.state.texts[key].text==''){
                    del_texts.push(key)
                    delete this.state.texts[key]
                }else{
                    replace_text_ids.push(key)
                    replace_texts.push(this.state.texts[key])
                }
            }
            var promises = [ 
                this.props.board_this.ChooseArtsTexts([],[],this.state.current_image.slice(0), this.state.current_text.slice(0)),
                this.props.board_this.UpdateArtsTexts([],[], replace_texts, replace_text_ids)
            ]
            if(del_texts.length>0){
                promises.push(this.props.board_this.RemoveArtsTexts([], del_texts))
            }
            promises.push(this.setState({action:'idle', current_image:[], current_text:[], current_selected_pos: undefined, current_selected_ratio: undefined, 
            move_board_init: undefined, move_board_mouse_init: undefined}))
            Promise.all(promises)
            
        }else{
            super.moveBoardEnd(e)
        }
    }

    add_text_init(e){
        console.log('text add!')
        var texts = this.state.texts
        var pos = this.getCurrentMouseOnBoard(e)

        var id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        var text = {
            text: '',
            fontsize: 0.02, 
            position: [pos[0], pos[1], pos[0]+0.2, pos[1]+0.023],
            ratio: 0.2/0.023,
            height_font_ratio: 0.02/0.023, 
            choosen_by: this.props.board_this.state.user_id, 
        }
        texts[id] = text
        Promise.all([
            this.props.board_this.AddAText(id, text),
            this.setState({control_state: 'control_object', texts: texts, current_text:[id], current_image: [],
            current_selected_pos:[pos[0], pos[1], pos[0]+0.2, pos[1]+0.023], current_selected_ratio:1/3}, function(){
                setTimeout(function(){
                    document.getElementById('textarea_'+id).focus()}, 50);
            })
        ])
        
    }

    add_image_init(e){
        var arts = this.state.arts
        var pos =  this.getCurrentMouseOnBoard(e)
        
        var art_pos = [pos[0], pos[1], pos[0]+0.01, pos[1]+0.01]
        // var art_pos = [origin[0], origin[1], cur[0], cur[1]]
        var ratio=Number.MIN_VALUE

        for(var i=0; i<this.state.current_image.length; i++){
            arts[this.state.current_image[i]]['position'] = art_pos
            if(ratio<arts[this.state.current_image[i]].ratio){
                ratio = arts[this.state.current_image[i]].ratio
            }
        }
        this.setState({control_state: 'control_object', action:'object_resizing', arts: arts, 
            current_selected_pos: art_pos.slice(), current_selected_ratio:ratio, current_image_resize_direction: 'top-left'})
    }

    object_moving_init(e){
        console.log('init?')
        if(e.stopPropagation!=undefined){
            e.stopPropagation()
        }   
        var init_mouse_pos = this.getCurrentMouseOnBoard(e)
        var init_image_pos = {}
        console.log(this.state)
        for(var i in this.state.current_image){
            init_image_pos[this.state.current_image[i]] = this.state.arts[this.state.current_image[i]].position
        }
        var init_text_pos = {}
        for(var i in this.state.current_text){
            init_text_pos[this.state.current_text[i]] = this.state.texts[this.state.current_text[i]].position
        }
        console.log(init_image_pos, init_mouse_pos, this.state.current_selected_pos)
        this.setState({action:'object_moving', init_mouse_pos: init_mouse_pos, init_text_pos: init_text_pos,init_image_pos:init_image_pos,  init_group_pos:this.state.current_selected_pos.slice()})
    }

    object_moving(e){
        if(e.stopPropagation!=undefined){
            e.stopPropagation()
        }   
        
        var cur_mouse_pos = this.getCurrentMouseOnBoard(e)
        if(cur_mouse_pos[0]>0 && cur_mouse_pos[0]<1 && cur_mouse_pos[1]>0 && cur_mouse_pos[1]<1){
            var xdiff = cur_mouse_pos[0]-this.state.init_mouse_pos[0]
            var ydiff = cur_mouse_pos[1]-this.state.init_mouse_pos[1]

            var arts = this.state.arts
            for(var i in this.state.current_image){
                var key = this.state.current_image[i]
                var init_pos = this.state.init_image_pos[key]
                arts[key].position = [init_pos[0]+xdiff, init_pos[1]+ydiff, init_pos[2]+xdiff, init_pos[3]+ydiff]
            }
            var texts = this.state.texts
            for(var i in this.state.current_text){
                var key = this.state.current_text[i]
                var init_pos = this.state.init_text_pos[key]
                texts[key].position = [init_pos[0]+xdiff, init_pos[1]+ydiff, init_pos[2]+xdiff, init_pos[3]+ydiff]
            }
            var cur_image_pos = this.state.init_group_pos
            cur_image_pos = [cur_image_pos[0]+xdiff, cur_image_pos[1]+ydiff, cur_image_pos[2]+xdiff, cur_image_pos[3]+ydiff]
            this.setState({arts:arts, texts: texts, current_selected_pos: cur_image_pos})
        }
        

    }

    object_moving_end(e){
        var cur_mouse_pos = this.getCurrentMouseOnBoard(e)
        
        e.stopPropagation()
        
        if(this.state.init_mouse_pos[0] != cur_mouse_pos[0] && this.state.init_mouse_pos[1]!=cur_mouse_pos[1]){
            
            var arts_to_push=[]
            var art_ids_to_push = []
            var arts = this.state.arts
            for(var i=0; i<this.state.current_image.length; i++){
                arts_to_push.push(arts[this.state.current_image[i]])
                art_ids_to_push.push(this.state.current_image[i])
            }
            var texts_to_push=[]
            var text_ids_to_push = []
            var texts = this.state.texts
            for(var i=0; i<this.state.current_text.length; i++){
                texts_to_push.push(texts[this.state.current_text[i]])
                text_ids_to_push.push(this.state.current_text[i])
            }
            this.props.board_this.UpdateArtsTexts(arts_to_push, art_ids_to_push, texts_to_push, text_ids_to_push)
        }

        this.setState({action:'idle', init_mouse_pos: undefined, init_image_pos: undefined, init_text_pos: undefined, init_group_pos: undefined})
    }

    object_resizing_init(direction, e){
        e.stopPropagation();
        this.setState({action:'object_resizing', current_image_resize_direction: direction})//, current_selected_pos:arts_pos, current_selected_ratio: Math.abs((arts_pos[3]-arts_pos[1])/(arts_pos[2]-arts_pos[0]))})
    }

    object_resizing(e){
        var arts = this.state.arts
        var texts = this.state.texts
        var pos = this.getCurrentMouseOnBoard(e)
        // console.log(pos)
        var fixed_x, moving_x, fixed_y, moving_y
        if(this.state.current_image_resize_direction=='top-left'){
            fixed_x = 0
            fixed_y = 1
            moving_x = 2
            moving_y =3
        }else if(this.state.current_image_resize_direction=='top-right'){
            fixed_x = 2
            fixed_y = 1
            moving_x = 0
            moving_y =3
        }else if(this.state.current_image_resize_direction=='bottom-right'){
            fixed_x = 2
            fixed_y = 3
            moving_x = 0
            moving_y =1
        }else if(this.state.current_image_resize_direction=='bottom-left'){
            fixed_x = 0
            fixed_y = 3
            moving_x = 2
            moving_y =1
        }

        var arts_pos = this.state.current_selected_pos.slice()
        var ratio = this.state.current_selected_ratio

        var ori_w= arts_pos[2]-arts_pos[0]
        var ori_h= arts_pos[3]-arts_pos[1]

        arts_pos[moving_x] = pos[0]
        arts_pos[moving_y] = pos[1]

        

        var w= arts_pos[2]-arts_pos[0]
        var h= arts_pos[3]-arts_pos[1]
        if(w==0||h==0||ori_h==0||ori_w==0){
            return
        }

        if(h!=0){
            if(Math.abs(w/h)>ratio){
                w = h*ratio
            }else{
                h = w/ratio
            }
        }
        arts_pos[moving_x]=((moving_x==2)?1:-1)*w+arts_pos[fixed_x]
        arts_pos[moving_y]=((moving_y==3)?1:-1)*h+arts_pos[fixed_y]

        

        for(var i=0; i<this.state.current_image.length; i++){
            var cur_art_pos= arts[this.state.current_image[i]]['position'].slice()
            if(ori_w==0 || ori_h==0){
                console.log('ori')
                return
                // if(this.state.current_image.length+this.state.current_text.length==1){
                //     cur_art_pos[0] = arts_pos[0]
                //     cur_art_pos[2] = arts_pos[2]
                //     cur_art_pos[1] = arts_pos[1]
                //     cur_art_pos[3] = arts_pos[3]
                // }else{
                //     return
                // }
            }else{
                cur_art_pos[0] = w/ori_w*(cur_art_pos[0]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[2] = w/ori_w*(cur_art_pos[2]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[1] = h/ori_h*(cur_art_pos[1]-arts_pos[fixed_y])+arts_pos[fixed_y]
                cur_art_pos[3] = h/ori_h*(cur_art_pos[3]-arts_pos[fixed_y])+arts_pos[fixed_y]
            }
            if(cur_art_pos[0]==cur_art_pos[2] || cur_art_pos[1]==cur_art_pos[3]){
                continue
            }
            arts[this.state.current_image[i]]['position'] = cur_art_pos
        }
        for(var i=0; i<this.state.current_text.length; i++){
            var cur_art_pos= texts[this.state.current_text[i]]['position'].slice()
            if(ori_w==0 || ori_h==0){
                // continue
                console.log('ori')
                return
                // if(this.state.current_image.length+this.state.current_text.length==1){
                //     cur_art_pos[0] = arts_pos[0]
                //     cur_art_pos[2] = arts_pos[2]
                //     cur_art_pos[1] = arts_pos[1]
                //     cur_art_pos[3] = arts_pos[3]
                // }else{
                //     return
                // }
            }else{
                cur_art_pos[0] = w/ori_w*(cur_art_pos[0]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[2] = w/ori_w*(cur_art_pos[2]-arts_pos[fixed_x])+arts_pos[fixed_x]
                cur_art_pos[1] = h/ori_h*(cur_art_pos[1]-arts_pos[fixed_y])+arts_pos[fixed_y]
                cur_art_pos[3] = h/ori_h*(cur_art_pos[3]-arts_pos[fixed_y])+arts_pos[fixed_y]
            }
            if(cur_art_pos[0]==cur_art_pos[2] || cur_art_pos[1]==cur_art_pos[3]){
                continue
            }
            texts[this.state.current_text[i]]['position'] = cur_art_pos
            // console.log(w/ori_w, Math.abs(w/ori_w))
            texts[this.state.current_text[i]]['fontsize'] = texts[this.state.current_text[i]]['height_font_ratio'] *Math.abs(cur_art_pos[3]-cur_art_pos[1])
        }
        
        this.setState({arts:arts, texts: texts, current_selected_pos: arts_pos})

    }
    
    end_object_resizing(e){
        var arts = this.state.arts
        var arts_to_push = []
        var art_ids_to_push = []
        for(var i=0; i<this.state.current_image.length; i++){
            var arts_pos = arts[this.state.current_image[i]]['position']
            if(arts_pos[0]>arts_pos[2]){
                var t = arts_pos[0]
                arts_pos[0] = arts_pos[2]
                arts_pos[2] = t
                
            }

            if(arts_pos[1]>arts_pos[3]){
                var t = arts_pos[1]
                arts_pos[1] = arts_pos[3]
                arts_pos[3] = t
                
            }
            arts[this.state.current_image[i]]['position'] = arts_pos
            arts_to_push.push(arts[this.state.current_image[i]])
            art_ids_to_push.push(this.state.current_image[i])
            
        }
             
        var texts = this.state.texts
        var texts_to_push = []
        var text_ids_to_push = []
        for(var i=0; i<this.state.current_text.length; i++){
            var texts_pos = texts[this.state.current_text[i]]['position']
            console.log(texts_pos)
            if(texts_pos[0]>texts_pos[2]){
                var t = texts_pos[0]
                texts_pos[0] = texts_pos[2]
                texts_pos[2] = t
                
            }

            if(texts_pos[1]>texts_pos[3]){
                var t = texts_pos[1]
                texts_pos[1] = texts_pos[3]
                texts_pos[3] = t
                
            }
            texts[this.state.current_text[i]]['position'] = texts_pos
            console.log(texts_pos, this.state.current_selected_pos)
            texts_to_push.push(texts[this.state.current_text[i]])
            text_ids_to_push.push(this.state.current_text[i])
        }

        this.props.board_this.UpdateArtsTexts(arts_to_push, art_ids_to_push, texts_to_push, text_ids_to_push)
        var current_selected_pos =this.state.current_selected_pos.slice()
        if(current_selected_pos[0]>current_selected_pos[2]){
            var t = current_selected_pos[0]
            current_selected_pos[0] = current_selected_pos[2]
            current_selected_pos[2] = t
        }
        if(current_selected_pos[1]>current_selected_pos[3]){
            var t = current_selected_pos[1]
            current_selected_pos[1] = current_selected_pos[3]
            current_selected_pos[3] = t
        }
        console.log(current_selected_pos)
        
        this.setState({texts: texts, action:'idle',current_selected_pos: current_selected_pos})
    }


    renderImages(){
        var _this = this
        return Object.keys(this.state.arts).map(function(key, index) {
            if(_this.state.arts[key]!=undefined){
                if(_this.state.arts[key].position!=undefined){
                    return (<MoodboardImage key={key} art_key={key} mother_this={_this} mother_state={_this.state} current_image={_this.state.current_image} art={_this.state.arts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodboardImage>)
                }
            }
            
        })
    }

    renderTexts(){
        var _this = this
        return Object.keys(this.state.texts).map(function(key, index) {
            if(_this.state.texts[key]!=undefined){
                if(_this.state.texts[key].position!=undefined){
                    if(!(_this.state.current_text.length==1 &&_this.state.current_image.length==0  && _this.state.current_text.indexOf(key)!=-1)){
                        return (<MoodBoardText edit={false} key={key} text_key={key} mother_this={_this} mother_state={_this.state} current_text={_this.state.current_text} text={_this.state.texts[key]} boardlength={_this.state.boardlength*_this.state.boardzoom}></MoodBoardText>)
                    } 
                }
            }
            
        })
    }
    
    rendereditingTexts(){
        if(this.state.current_text.length==1 &&this.state.current_image.length==0 ){
            var key=this.state.current_text[0]
            return (<MoodBoardText edit={true} key={key} text_key={key} mother_this={this} mother_state={this.state} current_text={this.state.current_text} text={this.state.texts[key]} boardlength={this.state.boardlength*this.state.boardzoom}></MoodBoardText>)
        }
    }

    renderImageHandle(){
        // console.log(this.state.current_selected_pos)
        var smallx = (this.state.current_selected_pos[0]<this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var bigx = (this.state.current_selected_pos[0]>this.state.current_selected_pos[2])?this.state.current_selected_pos[0]:this.state.current_selected_pos[2]
        var smally = (this.state.current_selected_pos[1]<this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var bigy = (this.state.current_selected_pos[1]>this.state.current_selected_pos[3])?this.state.current_selected_pos[1]:this.state.current_selected_pos[3]
        var x = smallx* this.state.boardlength*this.state.boardzoom
        var y = smally* this.state.boardlength*this.state.boardzoom

        var width = (bigx-smallx)* this.state.boardlength*this.state.boardzoom
        var height = (bigy-smally)* this.state.boardlength*this.state.boardzoom
        return (<g>
            <rect x={x-2} y={y-2} width={width+4} height={height+4} stroke='#333333' fill='transparent' strokeWidth='2' style={{cursor:'move'}} onPointerDown={this.object_moving_init.bind(this)}></rect>
            
            <rect x={x-8} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+width-4} y={y+4} width={12} height={height-8} fill='transparent' strokeWidth='0' style={{cursor:'ew-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect>
            <rect x={x+4} y={y-8} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></rect>
            <rect x={x+4} y={y+height-4} width={width-8} height={12} fill='transparent' strokeWidth='0' style={{cursor:'ns-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></rect>

            <circle className='bottom-right' cx={x} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'nw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-right')}></circle>
            <circle cx={x+width} cy={y} r='6' stroke='#333333' fill='white' style={{cursor:'ne-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'bottom-left')}></circle>
            <circle cx={x} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'sw-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-right')}></circle>
            <circle cx={x+width} cy={y+height} r='6' stroke='#333333' fill='white'  style={{cursor:'se-resize'}} onPointerDown={this.object_resizing_init.bind(this, 'top-left')}></circle>
        </g>)
    }


    

    // TODO add image through url
    // TODO make the image manipulatable
        // resize
        // move
        // deselect
        // select
    render(){
        var boardrender_cursor
        if(this.state.control_state=='add_image' && this.state.action!='idle'){
            boardrender_cursor='crosshair'
        }else if(this.state.control_state=='add_comment'){
            boardrender_cursor='cell'
        }else if(this.state.control_state=='add_text'){
            boardrender_cursor='text'
        }else if(this.state.control_state=='control_object' && this.state.action=='move_board'){
            boardrender_cursor='grab'
        }else{
            boardrender_cursor='default'
        }
        return (<div className='col s6 oneboard'>
            <h2>Moodboard</h2>
            <div id='moodboard' className='moodboard' onWheel={this.zoom_board_wheel.bind(this)} 
                //onPointerOut={this.moveBoardEnd.bind(this)}
                
                
                onPointerMove={this.moodBoardMouseMove.bind(this)}> 
                
                <div className='boardrender' onPointerDown={this.moodBoardMouseInit.bind(this)} onPointerUp={this.moodBoardMouseEnd.bind(this)} 
                // onPointerOut={this.props.board_this.setMoodboardPosition.bind(this.props.board_this, -1, -1)}

                onDrop={this.dropImage.bind(this)}
                onDragEnter={this.dropenter.bind(this)}
                onDragLeave={this.dropout.bind(this)}
                onDragOver={this.dropover.bind(this)}

                style={{
                    width:this.state.boardzoom*this.state.boardlength, 
                    height: this.state.boardzoom*this.state.boardlength,
                    top: this.state.boardheight/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[1],
                    left: this.state.boardwidth/2-this.state.boardzoom*this.state.boardlength*this.state.boardcenter[0],

                    cursor: boardrender_cursor,
                }}>
                    
                    <svg width={this.state.boardzoom*this.state.boardlength} height={this.state.boardzoom*this.state.boardlength}>
                        {this.renderImages()}
                        {this.renderTexts()}
                        {this.state.control_state=='control_object'&&(this.state.current_image.length>0||this.state.current_text.length>0)&&this.state.current_selected_pos!=undefined && 
                            this.renderImageHandle()
                        }
                        {this.rendereditingTexts()}
                        
                        
                    </svg>
                    {this.props.board_this.renderCollaboratorsOnMoodBoard()}
                    

                </div>

                <MoodBoardMainController mother_this={this} mother_state={this.state}></MoodBoardMainController>
                {this.state.control_state=='add_image' && this.state.action=='idle' && 
                    <MoodBoardImageAddController mother_this={this} mother_state={this.state}></MoodBoardImageAddController>}
                
            </div>
        </div>)
    }
}

export default MoodBoard