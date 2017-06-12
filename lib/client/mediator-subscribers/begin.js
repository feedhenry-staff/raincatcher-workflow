var Q = require('q');


/**
 *
 * Creating a handler for the workflow step begin topic.
 *
 * @param {object}                     workflowStepSubscribers
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function workflowBeginSubscriber(workflowStepSubscribers, workflowClient) {


  /**
   *
   * Handling the beginning of a workflow.
   *
   * The beginning of a workflow for a single workorder requires checking the current status of the workflow.
   *
   * To do this we need to check if a result already exists related to this workorder.
   * If it does, then then we can proceed to the next step in the workflow.
   *
   * @param parameters
   * @param parameters.workorderId
   */
  return function handleWorkflowBegin(parameters) {

    return workflowClient.getWorkorderSummary(parameters.workorderId).then(function(workorderSummary) {
      var workorder = workorderSummary[0];
      var workflow = workorderSummary[1];
      var result = workorderSummary[2] || workflowClient.createNewResult(parameters.workorderId);

      //When the result has been read/created, then we can move on.
      return Q.when(result).then(function(result) {
        //Now we check the current status of the workflow to see where the next step should be.
        var stepReview = workflowClient.stepReview(workflow.steps, result);

        result.nextStepIndex = stepReview.nextStepIndex;
        result.status = workflowClient.checkStatus(workorder, workflow, result);

        //We now have the current status of the workflow for this workorder, the begin step is now complete.
        return {
          workorder: workorder,
          workflow: workflow,
          result: result,
          nextStepIndex: result.nextStepIndex,
          step: result.nextStepIndex > -1 ? workflow.steps[result.nextStepIndex] : workflow.steps[0]
        };
      });
    });
  };
};