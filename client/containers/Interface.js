import React, { Component, PropTypes } from 'react'
import MoodBoard from '../components/moodboard/moodboard'
import SketchPad from '../components/sketchpad/sketchpad'

class Interface extends Component {
  render() {
    return(
      <div className="main">
        <div style={{flex: 'auto', width: '100%'}} className='row'>
            <SketchPad></SketchPad>
            <MoodBoard></MoodBoard>
        </div>
      </div>
    )
  }
}

export default Interface