var express = require('express');
var chai = require('chai');
var expect = chai.expect;
var app = express();
var mockMbaasApi = {};
var mediator = require('fh-wfm-mediator/lib/mediator.js');

var CLOUD_TOPICS = {
  create: "wfm:cloud:workflows:create",
  list: "wfm:cloud:workflows:list",
  update: "wfm:cloud:workflows:update",
  read: "wfm:cloud:workflows:read",
  delete: "wfm:cloud:workflows:delete"
};
var CLOUD_DATA_TOPICS = {
  create: "wfm:cloud:data:workflows:create",
  list: "wfm:cloud:data:workflows:list",
  update: "wfm:cloud:data:workflows:update",
  read: "wfm:cloud:data:workflows:read",
  delete: "wfm:cloud:data:workflows:delete"
};
var DONE = 'done:';

/**
 * Set of unit tests for the sync topic subscribers
 */
describe('Workflow Sync', function() {
  var workflowServer = require('./index.js');

  //Create
  it('should publish to done create cloud topic when the request to create a workflow has been completed', function() {
    var mockWorkflowCreate = {value: 'test-workflow-create'};
    var expectedWorkflowVal = "test-workflow-create";
    var topicId = "testId";

    workflowServer(mediator, app, mockMbaasApi);

    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.create, function(createdWorkflow) {
      //Publish to done create data topic to fake workflow creation by storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.create + ':' + createdWorkflow.id, createdWorkflow);
    });

    return mediator.request(CLOUD_TOPICS.create, [mockWorkflowCreate, topicId], {uid: topicId}).then(function(createdWorkflow) {
      expect(createdWorkflow, 'Created workflow received should not be null or undefined').to.exist;
      expect(createdWorkflow, 'Created workflow received should be an object').to.be.an('object');
      expect(createdWorkflow.value, 'Created workflow received should have the same value as the original object passed').to.equal(expectedWorkflowVal);
      expect(createdWorkflow.id, 'Created workflow received should have a generated string ID').to.be.a('string');
    });

  });

  //List
  it('should publish to done list cloud topic when the request to list a workflow has been completed', function() {
    var mockWorkflowArray = [{id: 'test-workflow-1', value:'test-workflow'},
      {id: 'test-workflow-2', value:'test-workflow'},
      {id: 'test-workflow-3', value:'test-workflow'}];

    var expectedWorkflowArray = [{id: 'test-workflow-1', value:'test-workflow'},
      {id: 'test-workflow-2', value:'test-workflow'},
      {id: 'test-workflow-3', value:'test-workflow'}];

    workflowServer(mediator, app, mockMbaasApi);

    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.list, function(filter) {
      //Publish to done list data topic to fake getting the list of workflows by storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.list + ":" + filter.topicUid, mockWorkflowArray);
    });

    return mediator.request(CLOUD_TOPICS.list).then(function(listWorkflow) {
      expect(listWorkflow, 'List of workflows received should not be null or undefined').to.exist;
      expect(listWorkflow, 'List of workflows received should be an array').to.be.an('array');
      expect(listWorkflow, 'List of workflows received should have the same value as the list of workflows sent by the mock storage module').to.deep.equal(expectedWorkflowArray);
    });

  });

  // Update
  it('should publish to done update cloud topic when the request to update a workflow has been completed', function() {
    var mockWorkflowUpdated = {id:'testID', value: 'workflow-updated'};
    var expectedWorkflowUpdated = {id:'testID', value: 'workflow-updated'};

    workflowServer(mediator, app, mockMbaasApi);

    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.update, function(workflowToUpdate) {
      //Publish to done update data topic to fake getting the update of workflows by storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.update + ':' + workflowToUpdate.id, workflowToUpdate);
    });

    mediator.request(CLOUD_TOPICS.update, mockWorkflowUpdated, {uid: mockWorkflowUpdated.id}).then(function(updatedWorkflow) {
      expect(updatedWorkflow, 'Updated workflow received should not be null or undefined').to.exist;
      expect(updatedWorkflow, 'Updated workflow received should be an object').to.be.an('object');
      expect(updatedWorkflow, 'Updated workflow received should have the same value as the updated workflow sent by the mock storage module').to.deep.equal(expectedWorkflowUpdated);
    });
  });

  //Read
  it('should publish to done read cloud topic when the request to read a workflow has been completed', function() {
    var mockWorkflowRead = {id:'testID', value: 'workflow-read'};
    var expectedWorkflowRead = {id:'testID', value: 'workflow-read'};
    var uid = "testID";

    workflowServer(mediator, app, mockMbaasApi);

    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.read, function(uid) {
      //Publish to done read data topic to fake the reading of workflows by storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.read + ':' + uid, mockWorkflowRead);
    });

    return mediator.request(CLOUD_TOPICS.read, uid).then(function(readWorkflow) {
      expect(readWorkflow, 'Read workflow received should not be null or undefined').to.exist;
      expect(readWorkflow, 'Read workflow received should be an object').to.be.an('object');
      expect(readWorkflow, 'Read workflow received should have the same value as the read workflow sent by the mock storage module').to.deep.equal(expectedWorkflowRead);
    });
  });

  //Delete
  it('should publish to done delete cloud topic when the request to delete a workflow has been completed', function() {
    var mockWorkflowDelete = {id:'testID', value: 'workflow-deleted'};
    var expectedWorkflowDeleted = {id:'testID', value: 'workflow-deleted'};
    var uid = "testID";

    workflowServer(mediator, app, mockMbaasApi);

    //Mock of the data topic subscriber in the storage module
    mediator.subscribe(CLOUD_DATA_TOPICS.delete, function(uid) {
      //Publish to done delete data topic to fake the deleteing of workflows by storage module
      mediator.publish(DONE + CLOUD_DATA_TOPICS.delete + ':' + uid, mockWorkflowDelete);
    });

    return mediator.request(CLOUD_TOPICS.delete, uid).then(function(deletedWorkflow) {
      expect(deletedWorkflow, 'Deleted workflow received should not be null or undefined').to.exist;
      expect(deletedWorkflow, 'Deleted workflow received should be an object').to.be.an('object');
      expect(deletedWorkflow, 'Deleted workflow received should have the same value as the read workflow sent by the mock storage module').to.deep.equal(expectedWorkflowDeleted);
    });
  });

});
