'use strict';

var express = require('express')
  , config = require('./config')
  ;

function initRouter(mediator) {
  var router = express.Router();
  router.route('/steps').get(function(req, res, next) {
    mediator.publish('workflow:steps:load');
    mediator.once('workflow:steps:loaded', function(steps) {
      res.json(steps);
    });
  });
  router.route('/').get(function(req, res, next) {
    mediator.publish('workflows:load');
    mediator.once('workflows:loaded', function(workflows) {
      res.json(workflows);
    });
  });
  router.route('/:id').put(function(req, res, next) {
    var workflowId = req.params.id;
    var workflow = req.body;
    // console.log('req.body', req.body);
    mediator.once('workflow:saved:' + workflowId, function(savedWorkflow) {
      res.json(savedWorkflow);
    });
    mediator.publish('workflow:save', workflow);
  });

  return router;
};

function initSync(mediator, mbaasApi) {

  var dataListHandler = function(dataset_id, query_params, cb, meta_data){
    var syncData = {};
    mediator.publish('workflows:load');
    return mediator.promise('workflows:loaded').then(function(data) {
      data.forEach(function(workflow) {
        syncData[workflow.id] = workflow;
      });
      return cb(null, syncData);
    });
  };  
 
  //start the sync service
  mbaasApi.sync.init(config.datasetId, config.syncOptions, function(err) {
    if (err) {
      console.error(err);
    } else {
      mbaasApi.sync.handleList(config.datasetId, dataListHandler);
    }
  });
}

module.exports = function(mediator, app, mbaasApi) {
  var router = initRouter(mediator);
  initSync(mediator,mbaasApi);
  app.use(config.apiPath, router);
};
