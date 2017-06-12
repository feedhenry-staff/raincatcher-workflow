
/**
 *
 * Creating a handler for the workflow summary topic.
 *
 * @param {object}                     workflowStepSubscribers
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function workflowSummarySubscriber(workflowStepSubscribers, workflowClient) {


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
  return function handleWorkflowSummary(parameters) {

    return workflowClient.getWorkorderSummary(parameters.workorderId).then(function(workorderSummary) {
      var workorder = workorderSummary[0];
      var workflow = workorderSummary[1];
      var result = workorderSummary[2];

      //We now have the current status of the workflow for this workorder, the begin step is now complete.
      return {
        workorder: workorder,
        workflow: workflow,
        status: workflowClient.checkStatus(workorder, workflow, result),
        nextStepIndex: workflowClient.stepReview(workflow.steps, result).nextStepIndex,
        result: result
      };
    });
  };
};