# FeedHenry WFM workflow [![Coverage Status](https://coveralls.io/repos/github/feedhenry-raincatcher/raincatcher-workflow/badge.svg?branch=master)](https://coveralls.io/github/feedhenry-raincatcher/raincatcher-workflow?branch=master)

This module contains a workflow model representation and its related services :
- Backend services
- Frontend services

## Client Topics

### Topic Subscriptions

| Topic | Parameters |
| ----------- | ------------- |
| wfm:workflows:list |  ```NONE```  |
| wfm:workflows:read | ```{id: <<id of workflow to read>>}``` |
| wfm:workflows:update | ```{workflowToUpdate: {<<A valid workflow>>}}``` |
| wfm:workflows:create | ```{workflowToCreate: {<<A valid workflow>>}}``` |
| wfm:workflows:remove | ```{id: <<id of workflow to remove>>}``` |


#### Step Topics

The following topics allow the updating of the workflow state to progress through a workflow.


```
{
    workflow: {
      //The details of the current workflow being progressed
    },
    workorder: {
      //The details of the current workorder being progressed
    },
    result: {
      //The current result object for this workorder being progressed
    },
    nextStepIndex: 0 //The index of the next step to display
    step: {
        //The details of the step to display
    }
}
```

| Topic | Parameters |
| ---- | ----------- |
| *wfm:workflows:step:begin*| `{workorderId: "WORKORDERID", topicUid: "WORKORDERID"}` |
| *wfm:workflows:step:summary*| `{workorderId: "WORKORDERID", topicUid: "WORKORDERID"}` |
| *wfm:workflows:step:previous*| `{workorderId: "WORKORDERID", topicUid: "WORKORDERID"}` |
| *wfm:workflows:step:complete*| `{workorderId: "WORKORDERID", topicUid: "WORKORDERID", submission: {...}, stepCode: "CODEOFCOMPLETEDSTEP"}` |



### Published Topics

The following topics are published by this module. Developers are free to implement these topics subscribers, or use a module that already has these subscribers implement (E.g. the [raincatcher-sync](https://github.com/feedhenry-raincatcher/raincatcher-sync) module).

| Topic         | Parameters           |
| ------------- |:-------------:| 
| wfm:sync:workflows:create              |  ```{itemToCreate: workflowToCreate}```  |
| wfm:sync:workflows:update              |  ```{itemToUpdate: workflowToUpdate}```  |
| wfm:sync:workflows:list              |  ```NONE```  |
| wfm:sync:workflows:remove              |  ```{id: <<ID Of Workflow To Remove>>}```  |
| wfm:sync:workflows:read              |  ```{id: <<ID Of Workflow To Read>>}```  |

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
require('fh-wfm-workflow/lib/cloud')(mediator, app, mbaasExpress);
```

### Cloud Topics

#### Subscribed Topics

The module subscribes to the following topics

| Topic | Parameters |
| ----------- | ------------- |
| wfm:cloud:workflows:list |  ```{filter: {<<filter parameters>>}}```  |
| wfm:cloud:workflows:read | ```<<id of workflow to read>>``` |
| wfm:cloud:workflows:update | ```{<<<workflow to update>>>}``` |
| wfm:cloud:workflows:create | ```{<<<workflow to create>>>}``` |
| wfm:cloud:workflows:delete | ```<<id of workflow to delete>>``` |


#### Published Topics
The module publishes the following topics

| Topic | Parameters |
| ----------- | ------------- |
| wfm:cloud:data:workflows:list |  ```{<<filter parameters>>}```  |
| wfm:cloud:data:workflows:read | ```<<id of workflow to read>>``` |
| wfm:cloud:data:workflows:update | ```{<<<workflow to update>>>}``` |
| wfm:cloud:data:workflows:create | ```{<<<workflow to update>>>}``` |
| wfm:cloud:data:workflows:delete | ```<<id of workflow to delete>>``` |

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
