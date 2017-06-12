var Q = require('q');

/**
 * Initialsing a subscriber for removing workflows.
 *
 * @param {object} workflowEntityTopics
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function removeWorkflowSubscriber(workflowEntityTopics, workflowClient) {


  /**
   *
   * Handling the removal of a single workflow
   *
   * @param {object} parameters
   * @param {string} parameters.id - The ID of the workflow to remove.
   * @returns {*}
   */
  return function handleRemoveWorkflow(parameters) {
    parameters = parameters || {};

    //If there is no ID, then we can't read the workflow.
    if (!parameters.id) {
      return Q.reject(new Error("Expected An ID When Removing A Workflow"));
    }

    return workflowClient.remove({
      id: parameters.id
    });
  };
};