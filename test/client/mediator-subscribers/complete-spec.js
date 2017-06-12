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

var donePrefix = "done:";
var errorPrefix = "error:";

var readProfileTopic = "wfm:users:read_profile";

var updateResultTopic = "wfm:results:update";

var completeWorkflowStepTopic = "wfm:workflows:step:complete";

var listResultsTopic = "wfm:results:list";

var readWorkorderTopic = "wfm:workorders:read";

var readWorkflowTopic = "wfm:sync:workflows:read";

var workflowStepSubscribers = new MediatorTopicUtility(mediator);
workflowStepSubscribers.prefix(CONSTANTS.WORKFLOW_PREFIX).entity(CONSTANTS.STEPS_ENTITY_NAME);


describe("Completing A Workflow Step For A Single Workorder", function() {

  var mockWorkflow = fixtures.mockWorkflow();

  var mockWorkorder = fixtures.mockWorkorder();

  var mockResult = fixtures.mockResult();
  mockResult.stepResults = {};

  var mockUser = fixtures.mockUser();

  function getMockResults(includeResult) {
    var results = [];

    if (includeResult) {
      results.push(mockResult);
    }

    return results;
  }

  var mockSubmission = {
    subKey1: "subVal1",
    subKey2: "subVal2"
  };

  var workflowClient = new WorkflowClient(mediator);

  function createSubscribers(includeResult, expectedResult) {
    //Subscribing to the list results topic
    this.subscribers[listResultsTopic] = mediator.subscribe(listResultsTopic, function() {

      return Q.resolve(getMockResults(includeResult));
    });

    this.subscribers[readProfileTopic] = mediator.subscribe(readProfileTopic, function() {

      return Q.resolve(mockUser);
    });

    this.subscribers[updateResultTopic] = mediator.subscribe(updateResultTopic, function(parameters) {
      expect(parameters.resultToUpdate).to.be.an('object');

      return Q.resolve(expectedResult);
    });

    //Subscribing to the readWorkorder Topic
    this.subscribers[readWorkorderTopic] = mediator.subscribe(readWorkorderTopic, function(parameters) {
      expect(parameters.id).to.equal(mockWorkorder.id);

      return Q.resolve(mockWorkorder);
    });

    this.subscribers[readWorkflowTopic] = mediator.subscribe(readWorkflowTopic, function(parameters) {
      expect(parameters.id).to.equal(mockWorkflow.id);

      return Q.resolve(mockWorkflow);
    });
  }

  beforeEach(function() {
    this.subscribers = {};
    workflowStepSubscribers.on(CONSTANTS.STEP_TOPICS.COMPLETE, require('./../../../lib/client/mediator-subscribers/complete')(workflowStepSubscribers, workflowClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    workflowStepSubscribers.unsubscribeAll();
  });

  it('should publish an error if no result exists', function() {
    _.bind(createSubscribers, this)(false);

    return mediator.publish(completeWorkflowStepTopic, {
      workorderId: mockWorkorder.id,
      submission: mockSubmission,
      stepCode: mockWorkflow.steps[0].code
    }).catch(function(error) {
      expect(error.message).to.contain("No result exists");
      expect(error.message).to.contain(mockWorkorder.id);
    });
  });

  it("should add the step details to the result and increment the step", function() {

    var expectedResult = fixtures.mockResult();
    expectedResult.stepResults = {

    };
    expectedResult.stepResults[mockWorkflow.steps[0].code] = {
      step: mockWorkflow.steps[0],
      submission: mockSubmission,
      type: CONSTANTS.STEP_TYPES.STATIC,
      status: CONSTANTS.STATUS.COMPLETE,
      submitter: mockUser.id
    };

    expectedResult.status = CONSTANTS.STATUS.PENDING_DISPLAY;
    expectedResult.nextStepIndex = 1;

    _.bind(createSubscribers, this)(true, expectedResult);

    return mediator.publish(completeWorkflowStepTopic, {
      workorderId: mockWorkorder.id,
      submission: mockSubmission,
      stepCode: mockWorkflow.steps[0].code
    }).then(function(stepSummary) {
      expect(stepSummary.workflow).to.deep.equal(mockWorkflow);
      expect(stepSummary.workorder).to.deep.equal(mockWorkorder);


      expect(stepSummary.nextStepIndex).to.equal(1);
      //It should move to the next step.
      expect(stepSummary.step).to.deep.equal(mockWorkflow.steps[1]);


      //Checking a timestamp was applied to the step.
      expect(stepSummary.result.stepResults[mockWorkflow.steps[0].code].timestamp).to.be.a('number');

      //Removing it for checking the expected result
      delete stepSummary.result.stepResults[mockWorkflow.steps[0].code].timestamp;
      expect(stepSummary.result).to.deep.equal(expectedResult);
    });
  });

});
