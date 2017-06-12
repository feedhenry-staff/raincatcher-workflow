'use strict';

var config = require('../config');
var shortid = require('shortid');

var WorflowTopics = require('fh-wfm-mediator/lib/topics');

module.exports = function(mediator) {
  //Used for cloud data storage topics
  var workflowCloudDataTopics = new WorflowTopics(mediator);
  workflowCloudDataTopics.prefix(config.cloudDataTopicPrefix).entity(config.datasetId);

  //Used for cloud topics
  var workflowCloudTopics = new WorflowTopics(mediator);
  workflowCloudTopics.prefix(config.cloudTopicPrefix).entity(config.datasetId);

  /**
   * Subscribers to sync topics which publishes to a data storage topic, subscribed to by a storage module,
   * for CRUDL operations. Publishes the response received from the storage module back to sync
   */
  workflowCloudTopics.on('create', function(workflowToCreate) {
    // Adds an id field required by the new simple store module to the workflow object that will be created
    workflowToCreate.id = shortid.generate();

    return workflowCloudDataTopics.request('create', workflowToCreate);
  });

  workflowCloudTopics.on('list', function(listOptions) {
    listOptions = listOptions || {};
    listOptions.filter = listOptions.filter || {};

    return workflowCloudDataTopics.request('list', listOptions.filter);
  });

  workflowCloudTopics.on('update', function(workflowToUpdate) {
    return workflowCloudDataTopics.request('update', workflowToUpdate);
  });

  workflowCloudTopics.on('read', function(uid) {
    return workflowCloudDataTopics.request('read', uid);
  });

  workflowCloudTopics.on('delete', function(uid) {
    return workflowCloudDataTopics.request('delete', uid);
  });
};