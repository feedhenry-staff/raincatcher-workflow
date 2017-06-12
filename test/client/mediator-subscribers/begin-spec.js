var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
require('sinon-as-promised');
var _ = require('lodash');
var Q = require('q');
var CONSTANTS = require('../../../lib/constants');
var WorkflowClient = require('../../../lib/client/workflow-client/index');
var fixtures = require('../../fixtures/index');

var expect = chai.expect;

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

var beginWorkflowTopic = "wfm:workflows:step:begin";

var listResultsTopic = "wfm:results:list";

var readWorkorderTopic = "wfm:workorders:read";


var readWorkflowTopic = "wfm:sync:workflows:read";

var createResultTopic = "wfm:results:create";

var workflowStepSubscribers = new MediatorTopicUtility(mediator);
workflowStepSubscribers.prefix(CONSTANTS.WORKFLOW_PREFIX).entity(CONSTANTS.STEPS_ENTITY_NAME);


describe("Beginning A Workflow For A Single Workorder", function() {

  var mockWorkflow = fixtures.mockWorkflow();

  var mockWorkorder = fixtures.mockWorkorder();

  var mockResult = fixtures.mockResult();

  var newResult = {
    status: "New",
    nextStepIndex: 0,
    workorderId: mockWorkorder.id,
    stepResults: {}
  };

  function getMockResults(includeResult) {
    var results = [];

    if (includeResult) {
      results.push(mockResult);
    }

    return results;
  }

  var workflowClient = new WorkflowClient(mediator);

  function createSubscribers(includeResult) {
    //Subscribing to the list results topic
    this.subscribers[listResultsTopic] = mediator.subscribe(listResultsTopic, function() {

      return Q.resolve(getMockResults(includeResult));
    });

    //Subscribing to the readWorkorder Topic
    this.subscribers[readWorkorderTopic] = mediator.subscribe(readWorkorderTopic, function(parameters) {
      expect(parameters.id).to.equal(mockWorkorder.id);

      return Q.resolve(mockWorkorder);
    });

    this.subscribers[createResultTopic] = mediator.subscribe(createResultTopic, function(parameters) {

      if (includeResult) {
        throw new Error("Expected the create result topic not to be called");
      }

      expect(parameters.resultToCreate).to.deep.equal(newResult);

      return Q.resolve(newResult);
    });

    this.subscribers[readWorkflowTopic] = mediator.subscribe(readWorkflowTopic, function(parameters) {
      expect(parameters.id).to.equal(mockWorkflow.id);

      return Q.resolve(mockWorkflow);
    });
  }

  beforeEach(function() {
    this.subscribers = {};
    workflowStepSubscribers.on(CONSTANTS.STEP_TOPICS.BEGIN, require('./../../../lib/client/mediator-subscribers/begin')(workflowStepSubscribers, workflowClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowStepSubscribers.unsubscribeAll();
  });

  it("should create a result if no result exists", function() {

    _.bind(createSubscribers, this)(false);

    return mediator.publish(beginWorkflowTopic, {
      workorderId: mockWorkorder.id
    }).then(function(stepSummary) {
      expect(stepSummary.workflow).to.deep.equal(mockWorkflow);
      expect(stepSummary.workorder).to.deep.equal(mockWorkorder);
      expect(stepSummary.nextStepIndex).to.equal(0);
      expect(stepSummary.step).to.deep.equal(mockWorkflow.steps[0]);
      expect(stepSummary.result).to.deep.equal(newResult);
    });
  });

  it("should not create a result if one already exists", function() {
    _.bind(createSubscribers, this)(true);

    return  mediator.publish(beginWorkflowTopic, {
      workorderId: mockWorkorder.id
    }).then(function(stepSummary) {
      expect(stepSummary.workflow).to.deep.equal(mockWorkflow);
      expect(stepSummary.workorder).to.deep.equal(mockWorkorder);
      expect(stepSummary.nextStepIndex).to.equal(2);
      expect(stepSummary.step).to.deep.equal(undefined);
      expect(stepSummary.result).to.deep.equal(mockResult);
    });
  });

});
