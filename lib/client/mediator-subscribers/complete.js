var CONSTANTS = require('../../constants');
var _ = require('lodash');
var Q = require('q');

/**
 *
 * Setting up a handler for the workflow step complete topic.
 *
 * @param {object} workflowStepSubscribers
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function workflowStepDoneSubscriber(workflowStepSubscribers, workflowClient) {


  /**
   *
   * Handling the complete topic for workflow steps.
   *
   * This handler updates the result of the current step
   *
   * @param {object} parameters
   * @param {string} parameters.workorderId
   * @param {object} parameters.submission
   * @param {number} parameters.stepCode
   *
   */
  return function handleWorkflowStepDone(parameters) {

    //Getting the currently logged in user data.
    return workflowClient.readUserProfile().then(function(profileData) {
      return workflowClient.getWorkorderSummary(parameters.workorderId).then(function(workorderSummary) {
        var workorder = workorderSummary[0];
        var workflow = workorderSummary[1];
        var result = workorderSummary[2];

        if (!result) {
          //No result exists, The workflow should have been started
          return Q.reject(new Error("No result exists for workorder " + parameters.workorderId + ". The workflow done topic can only be used for a workflow that has begun"));
        }

        var step = _.find(workflow.steps, function(step) {
          return step.code === parameters.stepCode;
        });

        //If there is no step, then this step submission is invalid.
        if (!step) {
          //No result exists, The workflow should have been started
          return Q.reject(new Error("Invalid step to assign completed data for workorder " + parameters.workorderId + " and step code " + parameters.stepCode));
        }

        //Got the workflow, now we can create the step result.
        var stepResult = {
          step: step,
          submission: parameters.submission,
          type: CONSTANTS.STEP_TYPES.STATIC,
          status: CONSTANTS.STATUS.COMPLETE,
          timestamp: new Date().getTime(),
          submitter: profileData.id
        };

        //The result needs to be updated with the latest step results
        result.stepResults = result.stepResults || {};
        result.stepResults[step.code] = stepResult;
        result.status = workflowClient.checkStatus(workorder, workflow, result);
        result.nextStepIndex = workflowClient.stepReview(workflow.steps, result).nextStepIndex;

        //Updating the result
        return workflowClient.updateResult(result).then(function() {

          return {
            workorder: workorder,
            workflow: workflow,
            result: result,
            nextStepIndex: result.nextStepIndex,
            step: result.nextStepIndex > -1 ? workflow.steps[result.nextStepIndex] : workflow.steps[0]
          };
        });
      });
    });
  };
};