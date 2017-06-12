var _ = require('lodash');
var Q = require('q');


/**
 * Initialising a subscriber for creating a workflow.
 *
 * @param {object} workflowEntityTopics
 * @param {WorkflowMediatorService}    workflowClient
 */
module.exports = function createWorkflowSubscriber(workflowEntityTopics, workflowClient) {

  /**
   *
   * Handling the creation of a workflow
   *
   * @param {object} parameters
   * @param {object} parameters.workflowToCreate   - The workflow item to create
   * @returns {*}
   */
  return function handleCreateWorkflowTopic(parameters) {
    parameters = parameters || {};

    var workflowToCreate = parameters.workflowToCreate;

    //If no workflow is passed, can't create one
    if (!_.isPlainObject(workflowToCreate)) {
      return Q.reject(new Error("Invalid Data To Create A Workflow."));
    }

    return workflowClient.create(workflowToCreate);
  };
};