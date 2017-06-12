var q = require('q');
var _ = require('lodash');
var CONSTANTS = require('../../constants');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

/**
 *
 * A mediator service that will publish and subscribe to topics to be able to render workflow data.
 *
 * @param {Mediator} mediator
 * @param {object}   config
 * @constructor
 */
function WorkflowMediatorService(mediator, config) {
  this.mediator = mediator;
  this.config = config || {};

  this.resultsTopics = new MediatorTopicUtility(mediator)
    .prefix(CONSTANTS.TOPIC_PREFIX)
    .entity(CONSTANTS.RESULTS_ENTITY_NAME);

  this.workordersTopics = new MediatorTopicUtility(mediator)
    .prefix(CONSTANTS.TOPIC_PREFIX)
    .entity(CONSTANTS.WORKORDER_ENTITY_NAME);


  this.usersTopics =  new MediatorTopicUtility(mediator)
    .prefix(CONSTANTS.TOPIC_PREFIX)
    .entity(CONSTANTS.USERS_ENTITY_NAME);

  this.workflowSyncSubscribers = new MediatorTopicUtility(mediator)
    .prefix(CONSTANTS.SYNC_TOPIC_PREFIX)
    .entity(CONSTANTS.WORKFLOW_ENTITY_NAME);
}


/**
 *
 * Listing All Results
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.listResults = function listResults() {
  return this.mediator.publish(this.resultsTopics.getTopic(CONSTANTS.TOPICS.LIST));
};

/**
 *
 * Creating A Result
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.createResult = function createResult(resultToCreate) {
  return this.mediator.publish(this.resultsTopics.getTopic(CONSTANTS.TOPICS.CREATE), {
    resultToCreate: resultToCreate
  });
};

/**
 *
 * Updating A Result
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.updateResult = function updateResult(resultToUpdate) {
  return this.mediator.publish(this.resultsTopics.getTopic(CONSTANTS.TOPICS.UPDATE), {
    resultToUpdate: resultToUpdate
  });
};

/**
 *
 * Checking the status of a workorder
 *
 * @param {object} workorder  - The workorder to check status
 * @param {object} workflow   - The workflow to check status
 * @param {object} result     - The result to check status
 * @returns {*}
 */
WorkflowMediatorService.prototype.checkStatus = function checkStatus(workorder, workflow, result) {
  var status;
  var stepReview = this.stepReview(workflow.steps, result);
  if (stepReview.nextStepIndex >= workflow.steps.length - 1 && stepReview.complete) {
    status = CONSTANTS.STATUS.COMPLETE_DISPLAY;
  } else if (!workorder.assignee) {
    status = CONSTANTS.STATUS.UNASSIGNED_DISPLAY;
  } else if (stepReview.nextStepIndex < 0) {
    status = CONSTANTS.STATUS.NEW_DISPLAY;
  } else {
    status = CONSTANTS.STATUS.PENDING_DISPLAY;
  }
  return status;
};

/**
 *
 * This function checks each of the result steps to determine if the workflow is complete,
 * and if not, what is the next step in the workflow to display to the user.
 *
 *
 * @param {object} steps
 * @param {object} result
 * @returns {{nextStepIndex: number, complete: *}}
 */
WorkflowMediatorService.prototype.stepReview = function stepReview(steps, result) {
  var nextIncompleteStepIndex = 0;
  var complete = false;

  //If there is no result, then the first step is the next step.
  if (result && result.stepResults && result.stepResults.length !== 0) {
    nextIncompleteStepIndex = _.findIndex(steps, function(step) {
      //The next incomplete step is the step with no entry or it's not complete yet.
      return !result.stepResults[step.code] || result.stepResults[step.code].status !== CONSTANTS.STATUS.COMPLETE;
    });

    if (nextIncompleteStepIndex === -1) {
      complete = true;
      nextIncompleteStepIndex = steps.length;
    }
  }
  return {
    nextStepIndex: nextIncompleteStepIndex,
    complete: complete // false is any steps are "pending"
  };
};


/**
 *
 * Building a summary of a single workorder.
 *
 * In this case, we need access to the workorder, workflow and result objects.
 *
 * @param workorderId
 */
WorkflowMediatorService.prototype.getWorkorderSummary = function(workorderId) {
  var self = this;

  return this.readWorkorder(workorderId).then(function(workorder) {
    return q.all([self.read(workorder.workflowId), self.getResultByWorkorderId(workorderId)])
      .then(function(workorderResult) {
        var workflow = workorderResult[0];
        var result = workorderResult[1];

        return [workorder, workflow, result];
      });
  });
};

/**
 *
 * Finding a result based on a workorder ID
 *
 * @param {string} workorderId - The ID of the workorder to filter by.
 */
WorkflowMediatorService.prototype.getResultByWorkorderId = function getResultByWorkorderId(workorderId) {
  return this.listResults().then(function(resultsArray) {
    return _.find(resultsArray || [], function(result) {
      return result.workorderId === workorderId;
    }) || null;
  });
};

/**
 *
 * Creating a new result object for a workorder ID
 *
 * @param workorderId
 */
WorkflowMediatorService.prototype.createNewResult = function createNewResult(workorderId) {
  return this.createResult({status: CONSTANTS.STATUS.NEW_DISPLAY, nextStepIndex: 0, workorderId: workorderId, stepResults: {}});
};

/**
 *
 * Listing All Workflows
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.list = function listWorkflows() {
  return this.mediator.publish(this.workflowSyncSubscribers.getTopic(CONSTANTS.TOPICS.LIST));
};

/**
 *
 * Listing all workorders
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.listWorkorders = function listWorkorders() {
  return this.mediator.publish(this.workordersTopics.getTopic(CONSTANTS.TOPICS.LIST));
};

/**
 *
 * Reading a single workorder
 *
 * @param {string} workorderId - The ID of the workorder to read
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.readWorkorder = function readWorkorder(workorderId) {
  return this.mediator.publish(this.workordersTopics.getTopic(CONSTANTS.TOPICS.READ), {
    id: workorderId
  });
};

/**
 *
 * Reading A single workflow
 *
 * @param {string} workflowId
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.read = function readWorkflow(workflowId) {
  return this.mediator.publish(this.workflowSyncSubscribers.getTopic(CONSTANTS.TOPICS.READ), {id: workflowId});
};

/**
 *
 * Updating A Single Workflow
 *
 * @param {object} workflowToUpdate - The Workflow To Update
 * @param {string} workflowToUpdate.id - The ID of the Workorder To Update
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.update = function updateWorkflow(workflowToUpdate) {
  return this.mediator.publish(this.workflowSyncSubscribers.getTopic(CONSTANTS.TOPICS.UPDATE), {
    itemToUpdate: workflowToUpdate
  });
};


/**
 *
 * Creating A Single Workflow
 *
 * @param {object} workflowToCreate - The Workflow To Create
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.create = function createWorkflow(workflowToCreate) {
  return this.mediator.publish(this.workflowSyncSubscribers.getTopic(CONSTANTS.TOPICS.CREATE), {
    itemToCreate: workflowToCreate
  });
};

/**
 *
 * Removing A Single Workflow
 *
 * @param {object} workflowToRemove - The Workorder To Remove
 * @param {string} workflowToRemove.id - The ID of the workorder to remove.
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.remove = function removeWorkorder(workflowToRemove) {
  return this.mediator.publish(this.workflowSyncSubscribers.getTopic(CONSTANTS.TOPICS.REMOVE), {
    id: workflowToRemove.id
  });
};


/**
 *
 * Reading The Logged In Profile For The User
 *
 * @returns {Promise}
 */
WorkflowMediatorService.prototype.readUserProfile = function readUserProfile() {
  return this.mediator.publish(this.usersTopics.getTopic(CONSTANTS.TOPICS.READ_PROFILE));
};

module.exports = WorkflowMediatorService;