var Q = require('q');

/**
 *
 * Creating a handler for the previous step workflow topic.
 *
 * @param {object} workflowStepSubscribers
 * @param {WorkflowMediatorService}    workflowClient
 *
 */
module.exports = function workflowPreviousSubscriber(workflowStepSubscribers, workflowClient) {


  /**
   *
   * Handing a workflow back topic.
   *
   * In this case, we want to decrement the nextStepIndex of a result if it exists.
   *
   * @param parameters
   * @param parameters.workorderId - The workorder ID to step back for.
   */
  return function handleWorkflowBack(parameters) {
    return workflowClient.getWorkorderSummary(parameters.workorderId).then(function(workorderSummary) {

      var workorder = workorderSummary[0];
      var workflow = workorderSummary[1];
      var result = workorderSummary[2];

      if (!result) {
        //No result exists, The workflow should have been started
        return Q.reject( new Error("No result exists for workflow " + parameters.workorderId + ". The workflow back topic can only be used for a workflow that has begun"));
      }

      //Decrementing the result index. If it is 0 or doesn't exist, then default to 0
      result.nextStepIndex = result.nextStepIndex > -1 ? result.nextStepIndex - 1 : -1;

      return workflowClient.updateResult(result).then(function() {
        return {
          workorder: workorder,
          workflow: workflow,
          result: result,
          nextStepIndex: result.nextStepIndex,
          step: result.nextStepIndex > -1 ? workflow.steps[result.nextStepIndex] : null
        };
      });
    });
  };
};