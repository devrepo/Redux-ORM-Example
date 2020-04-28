import {
  ORM,
  Model,
  attr,
  createReducer,
  createSelector,
  many
} from "redux-orm";
import { createStore, combineReducers, applyMiddleware, compose } from "redux";
import logger from "redux-logger";
import { Provider, connect } from "react-redux";
import React, { Component } from "react";
import ReactDom from "react-dom";
import "./styles.css";

class ReportConfig extends Model {
  static reducer(action, ReportConfig, session) {
    switch (action.type) {
      case "reportConfig/getSuccess":
        // check following report config json data for action payload
        ReportConfig.create({ ...action.payload });
        action.payload.groups.forEach(group => {
          session.ReportConfigGroup.upsert(group);
          group.items.forEach(item => {
            session.ReportConfigItem.upsert(item);
          });
        });
        break;
      default:
        break;
    }

    return undefined;
  }
  toString() {
    return `ReportConfig: ${this.name}`;
  }
}

ReportConfig.modelName = "ReportConfig";

ReportConfig.fields = {
  id: attr(),
  name: attr(),
  description: attr(),
  groups: many("ReportConfigGroup", "groups")
};

class ReportConfigGroup extends Model {
  static reducer(action, ReportConfigGroup, session) {
    switch (action.type) {
      case "reportConfigGroup/add":
        action.payload.groups.forEach(group => {
          ReportConfigGroup.upsert(group);
        });
        console.log("state", session.state);
        break;
      case "reportConfigGroup/delete":
        ReportConfigGroup.withId(action.payload.id).delete();
        console.log("state", session.state);
        break;
      default:
        break;
    }

    return undefined;
  }
  toString() {
    return `ReportConfigGroup: ${this.name}`;
  }
}

ReportConfigGroup.modelName = "ReportConfigGroup";

ReportConfigGroup.fields = {
  id: attr(),
  name: attr(),
  description: attr(),
  items: many("ReportConfigItem", "items")
};

class ReportConfigItem extends Model {
  toString() {
    return `ReportConfigItem: ${this.name}`;
  }

  static reducer(action, ReportConfigItem, session) {
    switch (action.type) {
      case "reportConfig/updateItem":
        console.log("reportConfig/updateItem");
        ReportConfigItem.withId(action.payload.id).update(action.payload);
        console.log("state", session.state);
        break;
    }

    return undefined;
  }
}
ReportConfigItem.modelName = "ReportConfigItem";

ReportConfigItem.fields = {
  id: attr(),
  name: attr(),
  description: attr()
};

const orm = new ORM({
  stateSelector: state => state.orm
});
orm.register(ReportConfig, ReportConfigGroup, ReportConfigItem);

const middleware = applyMiddleware(logger);
const reduxDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  combineReducers({
    orm: createReducer(orm)
  }),
  reduxDevTools(middleware)
);

store.dispatch({
  type: "reportConfig/getSuccess",
  payload: {
    id: 1,
    name: "默认",
    description: "默认",
    created_at: "2019-09-22 17:50:34",
    updated_at: "2019-09-22 17:50:34",
    groups: [
      {
        id: 2,
        name: "moren ",
        priority: 1,
        items: [
          {
            id: 8,
            name: "item 1",
            priority: 7
          }
        ]
      }
    ]
  }
});

const configs = createSelector(orm.ReportConfig);
const configGroups = createSelector(orm.ReportConfig.groups);
const configGroupItems = createSelector(orm.ReportConfigGroup.items);
const state = store.getState();

console.log(
  configs(state),
  configGroups(state),
  configGroupItems(state),
  state.orm
);

class App extends Component {
  constructor(props) {
    super(props);
    this.handleUpdate = this.handleUpdate.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  handleUpdate(e) {
    console.log("HandleUpdate");
    store.dispatch({
      type: "reportConfig/updateItem",
      payload: {
        id: 8,
        name: "Devender",
        description: "默认",
        created_at: "2019-09-22 17:50:34",
        updated_at: "2019-09-22 17:50:34"
      }
    });
  }
  handleAdd(e) {
    store.dispatch({
      type: "reportConfigGroup/add",
      payload: {
        id: 1,
        groups: [
          {
            id: 3,
            name: "New Item 1",
            description: "默认",
            created_at: "2019-09-22 17:50:34",
            updated_at: "2019-09-22 17:50:34"
          },
          {
            id: 4,
            name: "New Item 2",
            description: "默认",
            created_at: "2019-09-22 17:50:34",
            updated_at: "2019-09-22 17:50:34"
          }
        ]
      }
    });
  }

  handleDelete(e) {
    store.dispatch({
      type: "reportConfigGroup/delete",
      payload: { id: 3 }
    });
  }

  render() {
    const { configs } = this.props;
    return (
      <div>
        <h3>all configs</h3>
        <pre>
          <code>${JSON.stringify(configs(state))}</code>
        </pre>
        <h3>groups of config with ID 1</h3>
        <pre>
          <code>${JSON.stringify(configGroups(state, 1))}</code>
        </pre>
        <h3>items of group with ID 2</h3>
        <pre>
          <code>${JSON.stringify(configGroupItems(state, 2))}</code>
        </pre>
        <h3>ORM state</h3>
        <pre>
          <code>${JSON.stringify(state.orm)}</code>
        </pre>
        <pre>
          <button onClick={this.handleUpdate}>Update</button>
          <button onClick={this.handleAdd}>Add Groups</button>
          <button onClick={this.handleDelete}>Delete Group</button>
        </pre>
      </div>
    );
  }
}

const mapStateToProps = (state, props) => {
  return {
    configs: configs
  };
};

const ConnectedApp = connect(mapStateToProps)(App);
ReactDom.render(
  <Provider store={store}>
    <ConnectedApp />
  </Provider>,
  document.getElementById("app")
);
