# FeedHenry WFM workflow

This module contains a workflow model representation and its related services :
- Backend services
- Frontend services
- Frontend UI templates

## Client-side usage

### Client-side usage (via broswerify)

#### Setup
This module is packaged in a CommonJS format, exporting the name of the Angular namespace.  The module can be included in an angular.js as follows:

```javascript
angular.module('app', [
, require('fh-wfm-workflow')
...
])
```

#### Integration

##### Angular controller
A sync manager must first be initialized using the `workflowSync.createManager()`.  This can be placed, for instance, in the `resolve` config of a `ui-router` controlled application.

```javascript
resolve: {
  workflowManager: function(workflowSync) {
    return workflowSync.createManager();
  }
}
```
For a more complete example, please check the [demo portal app](https://github.com/feedhenry-staff/wfm-portal/blob/master/src/app/main.js).


##### `workflowSync` API
These workflowSync API methods all return Promises:

| workflowSync method | Description |
| -------------------- | ----------- |
| `workflowSync.manager.list` | list all workflows |
| `workflowSync.manager.create(workflow)` | create a workflow |
| `workflowSync.manager.read(workflowId)` | read a workflow |
| `workflowSync.manager.update(workflow)` | update a workflow |
| `workflowSync.manager.checkStatus(workorder, workflow, result)` | returns the current status of the workflow |
| `workflowSync.manager.nextStepIndex(steps, result)` | returns the next step index of the workflow |
| `workflowSync.manager.stepReview(steps, result)` | returns step review of the workflow |


#### workflow directives

| Name | Attributes |
| ---- | ----------- |
| workflow-progress | stepIndex, workflow |
| workflow-step | step, workflow |
| workflow-result | workflow, result |
| workflow-form | value |
| workflow-step-form | workflow, step, forms |
| workflow-step-detail | step |


## Usage in an express backend

### Setup
The server-side component of this WFM module exports a function that takes express and mediator instances as parameters, as in:

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

Check this [demo cloud application](https://github.com/feedhenry-staff/wfm-cloud/blob/master/lib/app/workflow.js)

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
