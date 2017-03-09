# FeedHenry RainCatcher workflow

This module contains a workflow model representation and its related services :
- Backend services
- Frontend services
- Frontend UI templates

## Client-side usage

### Setup
This module is packaged in a CommonJS format, exporting the name of the Angular namespace.  The module can be included in an angular.js as follows:

```javascript
angular.module('app', [
, require('fh-wfm-workflow')
...
])
```

### Integration

#### Angular controller
A sync manager must first be initialized using the `workflowSync.createManager()`.  This can be placed, for instance, in the `resolve` config of a `ui-router` controlled application.

```javascript
resolve: {
  workflowManager: function(workflowSync) {
    return workflowSync.createManager();
  }
}
```
For a more complete example, please check the [demo portal app](https://github.com/feedhenry-raincatcher/raincatcher-demo-portal/blob/master/src/app/main.js).


#### `workflowSync` API
These workflowSync API methods all return Promises:

| workflowSync method | Description |
| -------------------- | ----------- |
| `workflowSync.manager.list` | list all workflows |
| `workflowSync.manager.create(workflow)` | create a workflow |
| `workflowSync.manager.read(workflowId)` | read a workflow |
| `workflowSync.manager.update(workflow)` | update a workflow |

### workflow directives

| Name | Attributes |
| ---- | ----------- |
| workflow-progress | stepIndex, workflow |
| workflow-step | step, workflow |
| workflow-result | workflow, result |
| workflow-form | value |
| workflow-step-form | workflow, step, forms |
| workflow-step-detail | step |

### Topic Subscriptions

#### wfm:workflows:create

##### Description

Creating a new Workflow

##### Example


```javascript
var parameters = {
  workflowToCreate: {
    //A Valid JSON Object
  },
  //Optional topic unique identifier.
  topicUid: "uniquetopicid"
}

mediator.publish("wfm:workflows:create", parameters);
```

#### wfm:workflows:read

##### Description

Read a single Workflow

##### Example


```javascript
var parameters = {
  id: "workflowId",
  //Optional topic unique identifier.
  topicUid: "uniquetopicid"
}

mediator.publish("wfm:workflows:read", parameters);
```

#### wfm:workflows:update

##### Description

Update a single Workflow

##### Example


```javascript
var parameters = {
  workflowToUpdate: {
    ...
    id: "workflowId"
    ...
  },
  //Optional topic unique identifier.
  topicUid: "uniquetopicid"
}

mediator.publish("wfm:workflows:update", parameters);
```


#### wfm:workflows:remove

##### Description

Remove a single Workflow

##### Example


```javascript
var parameters = {
  id: "workflowId",
  //Optional topic unique identifier.
  topicUid: "uniquetopicid"
}

mediator.publish("wfm:workflows:remove", parameters);
```


#### wfm:workflows:list

##### Description

List All Workflows

##### Example


```javascript
var parameters = {
  //Optional topic unique identifier.
  topicUid: "uniquetopicid"
}

mediator.publish("wfm:workflows:list", parameters);
```


### Published Topics

The following topics are published by this module. Developers are free to implement these topics subscribers, or use a module that already has these subscribers implement (E.g. the [raincatcher-sync](https://github.com/feedhenry-raincatcher/raincatcher-sync) module).


| Topic         | Description           |
| ------------- |:-------------:| 
| wfm:sync:workflows:create              |   Create a new item in the sync `workflows` collection |
| wfm:sync:workflows:update              |   Update an existing item in the sync `workflows` collection |
| wfm:sync:workflows:list              |   List all items in the sync `workflows` collection |
| wfm:sync:workflows:remove              |   Remove an existing item from the sync `workflows` collection |
| wfm:sync:workflows:read              |   Read a single item from the sync `workflows` collection |
| wfm:sync:workflows:start              |   Start the sync process for sync `workflows` collection |
| wfm:sync:workflows:stop              |   Stop the sync process for sync `workflows` collection |
| wfm:sync:workflows:force_sync        |   Force a sync cycle from client to cloud for sync `workflows` collection |


### Topic Subscriptions

| Topic         | Description           |
| ------------- |:-------------:| 
| done:wfm:sync:workflows:create        |   A workflow was created in the `workflows` dataset |
| error:wfm:sync:workflows:create        |   An error occurred when creating an item in the `workflows` dataset. |
| done:wfm:sync:workflows:update        |   A workflow was updated in the `workflows` dataset |
| error:wfm:sync:workflows:update        |   An error occurred when updating an item in the `workflows` dataset. |
| done:wfm:sync:workflows:list        |   A list of the items in the `workflows` dataset completed |
| error:wfm:sync:workflows:list        |   An error occurred when listing items in the `workflows` dataset. |
| done:wfm:sync:workflows:remove        |   A workflow was removed from the `workflows` dataset |
| error:wfm:sync:workflows:remove        |   An error occurred when removing an item in the `workflows` dataset. |
| done:wfm:sync:workflows:read        |   A item was read correctly from the `workflows` dataset |
| error:wfm:sync:workflows:read        |   An error occurred when reading an item in the `workflows` dataset. |
| done:wfm:sync:workflows:start        |   The sync process started for the `workflows` dataset. |
| error:wfm:sync:workflows:start        |   An error occurred when starting the `workflows` dataset. |
| done:wfm:sync:workflows:stop        |   The sync process stopped for the `workflows` dataset. |
| error:wfm:sync:workflows:stop        |   An error occurred when stopping the `workflows` dataset sync process. |
| done:wfm:sync:workflows:force_sync        |  A force sync process completed for the `workflows` dataset. |
| error:wfm:sync:workflows:force_sync        |   An error occurred when forcing the sync process for the `workflows` dataset. |


## Usage in an express backend

### Setup
The server-side component of this RainCatcher module exports a function that takes express and mediator instances as parameters, as in:

```javascript
var express = require('express')
  , app = express()
  , mbaasExpress = mbaasApi.mbaasExpress()
  , mediator = require('fh-wfm-mediator/lib/mediator')
  ;

// configure the express app
...

// setup the wfm workflow sync server
require('fh-wfm-workflow/server')(mediator, app, mbaasExpress);

```

### Server side events
the module broadcasts, and listens for the following events

| Listens for | Responds with |
| ----------- | ------------- |
| `wfm:workflow:list` | `done:wfm:workflow:list` |
| `wfm:workflow:read` | `done:wfm:workflow:read` |
| `wfm:workflow:update` | `done:wfm:workflow:update` |
| `wfm:workflow:create` | `done:wfm:workflow:create` |

### Integration

Check this [demo cloud application](https://github.com/feedhenry-raincatcher/raincatcher-demo-cloud/blob/master/lib/app/workflow.js)

### workflow data structure example

```javascript

  {
    id: 1338,
    title: 'App forms',
    steps: [
      {code: 'identification', name: 'Identification', formId: '56c1fce7c0a909d74e823317'},
      {code: 'signoff', name: 'Signoff', formId: '56bdf252206b0cba6f35837b'}
    ]
  }

```
