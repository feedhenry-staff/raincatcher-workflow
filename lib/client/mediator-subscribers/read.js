var Q = require('q');

/**
 * Initialsing a subscriber for reading workflows.
 *
 * @param {object} workflowEntityTopics
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function readWorkflowSubscriber(workflowEntityTopics, workflowClient) {


  /**
   *
   * Handling the reading of a single workflow
   *
   * @param {object} parameters
   * @param {string} parameters.id - The ID of the workflow to read.
   * @returns {*}
   */
  return function handleReadWorkflowsTopic(parameters) {
    parameters = parameters || {};

    //If there is no ID, then we can't read the workflow.
    if (!parameters.id) {
      return Q.reject(new Error("Expected An ID When Reading A Workflow"));
    }

    return workflowClient.read(parameters.id);
  };

};