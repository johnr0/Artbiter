import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import store, { history } from './store'
import { Router, Route, IndexRoute } from 'react-router'
import injectTapEventPlugin from 'react-tap-event-plugin'

import App from './App'
import Home from './containers/Home'
import Interface from './containers/Interface'
import NotFound from './containers/NotFound'
import 'materialize-css/dist/css/materialize.css'
import './style.css';

injectTapEventPlugin()

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App}>
        <IndexRoute component={Interface} />
        <Route path="*" component={NotFound}/>
      </Route>
    </Router>
  </Provider>,
document.getElementById('root'))
