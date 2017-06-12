var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var _ = require('lodash');
var CONSTANTS = require('../../../lib/constants');
var WorkflowClient = require('../../../lib/client/workflow-client/index');
var Q = require('q');
var expect = chai.expect;

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

describe("Workflow Create Mediator Topic", function() {

  var mockWorkflowToCreate = {
    name: "This is a mock Work Order"
  };

  var expectedCreatedWorkflow =  _.extend({_localuid: "createdWorkflowLocalId"}, mockWorkflowToCreate);


  var createTopic = "wfm:workflows:create";

  var syncCreateTopic = "wfm:sync:workflows:create";

  var workflowSubscribers = new MediatorTopicUtility(mediator);
  workflowSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.WORKFLOW_ENTITY_NAME);

  var workflowClient = WorkflowClient(mediator);

  beforeEach(function() {
    this.subscribers = {};
    workflowSubscribers.on(CONSTANTS.TOPICS.CREATE, require('./../../../lib/client/mediator-subscribers/create')(workflowSubscribers, workflowClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowSubscribers.unsubscribeAll();
  });

  it('should use the sync topics to create a workflow', function() {
    this.subscribers[syncCreateTopic] = mediator.subscribe(syncCreateTopic, function(parameters) {
      expect(parameters.itemToCreate).to.deep.equal(mockWorkflowToCreate);

      return Q.resolve(expectedCreatedWorkflow);
    });

    return  mediator.publish(createTopic, {
      workflowToCreate: mockWorkflowToCreate
    }).then(function(createdWorkflow) {
      expect(createdWorkflow).to.deep.equal(expectedCreatedWorkflow);
    });
  });

  it('should publish an error if there is no object to update', function() {
    return mediator.publish(createTopic, {}).catch(function(error) {
      expect(error.message).to.have.string("Invalid Data");
    });
  });

  it('should handle an error from the sync create topic', function() {
    var expectedError = new Error("Error performing sync operation");
    this.subscribers[syncCreateTopic] = mediator.subscribe(syncCreateTopic, function(parameters) {
      expect(parameters.itemToCreate).to.deep.equal(mockWorkflowToCreate);

      return Q.reject(expectedError);
    });

    return  mediator.publish(createTopic, {
      workflowToCreate: mockWorkflowToCreate
    }).catch(function(error) {
      expect(error).to.deep.equal(expectedError);
    });
  });
});