var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var _ = require('lodash');
var Q = require('q');

var CONSTANTS = require('../../../lib/constants');
var expect = chai.expect;

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var WorkflowClient = require('../../../lib/client/workflow-client/index');


describe("Workflow Update Mediator Topic", function() {

  var mockWorkflowToUpdate = {
    id: "workflowidtoupdate",
    name: "This is a mock Work Order"
  };

  var expectedUpdatedWorkflow =  _.defaults({name: "Updated Workflow"}, mockWorkflowToUpdate);

  var updateTopic = "wfm:workflows:update";

  var syncUpdateTopic = "wfm:sync:workflows:update";

  var workflowSubscribers = new MediatorTopicUtility(mediator);
  workflowSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.WORKFLOW_ENTITY_NAME);

  var workflowClient = WorkflowClient(mediator);

  beforeEach(function() {
    this.subscribers = {};
    workflowSubscribers.on(CONSTANTS.TOPICS.UPDATE, require('./../../../lib/client/mediator-subscribers/update')(workflowSubscribers, workflowClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowSubscribers.unsubscribeAll();
  });

  it('should use the sync topics to update a workflow', function() {
    this.subscribers[syncUpdateTopic] = mediator.subscribe(syncUpdateTopic, function(parameters) {
      expect(parameters.itemToUpdate).to.deep.equal(mockWorkflowToUpdate);

      return Q.resolve(expectedUpdatedWorkflow);
    });

    return mediator.publish(updateTopic, {
      workflowToUpdate: mockWorkflowToUpdate
    }).then(function(updatedWorkflow) {
      expect(updatedWorkflow).to.deep.equal(expectedUpdatedWorkflow);
    });
  });

  it('should publish an error if there is no object to update', function() {
    return mediator.publish(updateTopic, {}).catch(function(error) {
      expect(error.message).to.have.string("Invalid Data");
    });
  });

  it('should handle an error from the sync create topic', function() {
    var expectedError = new Error("Error performing sync operation");

    this.subscribers[syncUpdateTopic] = mediator.subscribe(syncUpdateTopic, function(parameters) {
      expect(parameters.itemToUpdate).to.deep.equal(mockWorkflowToUpdate);

      return Q.reject(expectedError);
    });

    return mediator.publish(updateTopic, {
      workflowToUpdate: mockWorkflowToUpdate
    }).catch(function(error) {
      expect(error).to.deep.equal(expectedError);
    });
  });
});