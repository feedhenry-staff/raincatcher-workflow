var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var _ = require('lodash');
var CONSTANTS = require('../../../lib/constants');
var expect = chai.expect;
var Q = require('q');

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var WorkflowClient = require('../../../lib/client/workflow-client/index');

describe("Workflow Remove Mediator Topic", function() {

  var mockWorkflow = {
    id: "workflowid",
    name: "This is a mock Work Order"
  };

  var removeTopic = "wfm:workflows:remove";

  var syncRemoveTopic = "wfm:sync:workflows:remove";

  var workflowSubscribers = new MediatorTopicUtility(mediator);
  workflowSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.WORKFLOW_ENTITY_NAME);

  var workflowClient = WorkflowClient(mediator);

  beforeEach(function() {
    this.subscribers = {};
    workflowSubscribers.on(CONSTANTS.TOPICS.REMOVE, require('./../../../lib/client/mediator-subscribers/remove')(workflowSubscribers, workflowClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowSubscribers.unsubscribeAll();
  });

  it('should use the sync topics to remove a workflow', function() {
    this.subscribers[syncRemoveTopic] = mediator.subscribe(syncRemoveTopic, function(parameters) {
      expect(parameters.id).to.be.a('string');

      return Q.resolve(mockWorkflow);
    });


    return  mediator.publish(removeTopic, {id: mockWorkflow.id});
  });

  it('should publish an error if there is no ID to remove', function() {

    return mediator.publish(removeTopic).catch(function(error) {
      expect(error.message).to.have.string("Expected An ID");
    });
  });

  it('should handle an error from the sync create topic', function() {
    var expectedError = new Error("Error performing sync operation");
    this.subscribers[syncRemoveTopic] = mediator.subscribe(syncRemoveTopic, function(parameters) {
      expect(parameters.id).to.be.a('string');

      return Q.reject(expectedError);
    });


    return mediator.publish(removeTopic, {id: mockWorkflow.id,}).catch(function(error) {
      expect(error).to.deep.equal(expectedError);
    });
  });
});