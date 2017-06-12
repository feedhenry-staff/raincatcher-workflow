
/**
 * Initialsing a subscriber for Listing workflows.
 *
 * @param {object} workflowEntityTopics
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function listWorkflowSubscriber(workflowEntityTopics, workflowClient) {

  /**
   *
   * Handling the listing of workflows
   *
   * @returns {*}
   */
  return function handleListWorkflowsTopic() {
    return workflowClient.list();
  };
};