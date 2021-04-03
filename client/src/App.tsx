import Home, { homeRoute } from './components/Home';
import Room, { roomRoute } from './components/Room';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom';

import React from 'react';

const App = (): JSX.Element => {
  return (
    <Router>
      <Switch>
        <Route path={homeRoute} exact={true} component={Home} />
        <Route path={roomRoute} exact={true} component={Room} />
      </Switch>
    </Router>
  );
}

export default App;
