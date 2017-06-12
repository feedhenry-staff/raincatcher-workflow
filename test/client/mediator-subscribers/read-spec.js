var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var _ = require('lodash');
var CONSTANTS = require('../../../lib/constants');
var expect = chai.expect;
var Q = require('q');

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var WorkflowClient = require('../../../lib/client/workflow-client/index');

describe("Workflow Read Mediator Topic", function() {

  var mockWorkflow = {
    id: "workflowid",
    name: "This is a mock Work Order"
  };

  var readTopic = "wfm:workflows:read";

  var syncReadTopic = "wfm:sync:workflows:read";

  var workflowSubscribers = new MediatorTopicUtility(mediator);
  workflowSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.WORKFLOW_ENTITY_NAME);

  var workflowClient = WorkflowClient(mediator);

  var readSubscribers = require('./../../../lib/client/mediator-subscribers/read')(workflowSubscribers, workflowClient);

  beforeEach(function() {
    this.subscribers = {};
    workflowSubscribers.on(CONSTANTS.TOPICS.READ, readSubscribers);
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowSubscribers.unsubscribeAll();
  });

  it('should use the sync topics to read workflow', function() {
    this.subscribers[syncReadTopic] = mediator.subscribe(syncReadTopic, function(parameters) {
      expect(parameters.id).to.be.a('string');

      return Q.resolve(mockWorkflow);
    });

    return mediator.publish(readTopic, {id: mockWorkflow.id}).then(function(readWorkflow) {
      expect(readWorkflow).to.deep.equal(mockWorkflow);
    });
  });

  it('should publish an error if there is no ID to read', function() {
    return  mediator.publish(readTopic).catch(function(error) {
      expect(error.message).to.have.string("Expected An ID");
    });
  });

  it('should handle an error from the sync create topic', function() {
    var expectedError = new Error("Error performing sync operation");
    this.subscribers[syncReadTopic] = mediator.subscribe(syncReadTopic, function(parameters) {
      expect(parameters.id).to.be.a('string');

      return Q.reject(expectedError);
    });

    return mediator.publish(readTopic, {id: mockWorkflow.id}).catch(function(error) {
      expect(error).to.deep.equal(expectedError);
    });
  });
});