var _ = require("lodash");
var Q = require('q');

/**
 * Initialsing a subscriber for updating a workflow.
 *
 * @param {object} workflowEntityTopics
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function updateWorkflowSubscriber(workflowEntityTopics, workflowClient) {

  /**
   *
   * Handling the update of a workflow
   *
   * @param {object} parameters
   * @param {object} parameters.workflowToUpdate   - The workflow item to update
   * @returns {*}
   */
  return function handleUpdateTopic(parameters) {
    parameters = parameters || {};

    var workflowToUpdate = parameters.workflowToUpdate;

    //If no workorder is passed, can't update one. Also require the ID of the workfo to update it.
    if (!_.isPlainObject(workflowToUpdate)) {
      return Q.reject(new Error("Invalid Data To Update A Workflow."));
    }

    return workflowClient.update(workflowToUpdate);
  };
};