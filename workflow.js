'use strict';

var angular = require('angular');
var config = require('./config');
var ngModule = angular.module('wfm.workflow', ['wfm.core.mediator','wfm.core.sync', 'ngFeedHenry'])
var _ = require('lodash');

ngModule.run(function($q, $timeout, mediator, sync, FHCloud) {
  
    //manage the dataSet
   sync.getSync().manage(config.datasetId, {}, {}, {}, function() {
    console.log(config.datasetId + " managed by the sync service ");
    $fh.sync.doList(config.datasetId,
    function(res) {
      var workorders =  sync.transformDataSet(res);
    },
    function(err) {
      console.log('Error result from list:', JSON.stringify(err));
    });
  });

  var asyncListWorkflows = function() {
    var d = $q.defer();
    $fh.sync.doList(config.datasetId,
    function(res) {
      var workflows = sync.transformDataSet(res);
      d.resolve(workflows);
    },
    function(err) {
      d.reject(err);
    }); 
    return d.promise;
  }; 
  var promise = FHCloud.get(config.apiPath).then(function(response) {
    return response;
  }, function(err) {
    console.error(err);
  }); // TODO: introduce retry/error-handling logic

  mediator.subscribe('workflows:load', function() {
    asyncListWorkflows().then(function(workflows) {
      mediator.publish('workflows:loaded', workflows);
    });
  });

  mediator.subscribe('workflow:load', function(id) {
    promise.then(function(workflows) {
      var workflow = _.find(workflows, function(_workflow) {
        return _workflow.id == id;
      });
      mediator.publish('workflow:loaded', workflow);
    });
  });
})

ngModule.directive('workflowProgress', function($timeout) {
  var draw = function(scope, element, attrs) {
    var div = element[0].querySelector('.progtrckr');
    if (div) {
      while (div.firstChild) {
        angular.element(div.firstChild).remove();
      }
      div = angular.element(div);
    } else {
      div = angular.element('<ol class="progtrckr" />');
      element.append(div);
    }
    if (scope.step) {
      var completed = false;
      scope.steps.forEach(function(_step) {
        var cssClass;
        if (_step.code === scope.step.code) {
          cssClass = 'progtrckr-current';
          completed = true;
        } else {
          cssClass = completed ? 'progtrckr-todo' : 'progtrckr-done'
        }
        div.append('<li class="step '+cssClass+'">' + _step.name + '</li>')
      });
    }
  };

  return {
    restrict: 'E'
  , scope: {
      step: '=',
      steps: '='
    }
  , link: function (scope, element, attrs) {
      scope.$watch('step', function(step) {
        draw(scope, element, attrs);
      });
    }
  , controller: function() {
      var self = this;
      self.selectWorkorder = function(event, workorder) {
        mediator.publish('workorder:selected', workorder);
        event.preventDefault();
      }
    }
  , controllerAs: 'ctrl'
  };
})

.directive('workflowStep', function($templateRequest, $compile, mediator) {
  return {
    restrict: 'E'
  , scope: {
      step: '=' // { ..., template: "an html template to use", templatePath: "a template path to load"}
    , workorder: '='
    , workflow: '='
    }
  , link: function (scope, element, attrs) {
      scope.$watch('step', function(step) {
        if (scope.step) {
          if (scope.step.formId) {
            mediator.publish('wfm:appform:form:load', scope.step.formId);
            mediator.promise('wfm:appform:form:loaded').then(function(form) {
              scope.$apply(function() {
                scope.form = form;
                element.html('<appform-mobile form="form"></appform-mobile>');
                $compile(element.contents())(scope);
              });
            })
          } else if (scope.step.templatePath) {
            $templateRequest(scope.step.templatePath).then(function(template) {
              element.html(template);
              $compile(element.contents())(scope);
            });
          } else {
            element.html(scope.step.templates.form);
            $compile(element.contents())(scope);
          };
        };
      });
    }
  , controller: function() {
      var self = this;
      self.mediator = mediator;
    }
  , controllerAs: 'ctrl'
  };
})

.directive('workflowStepSummary', function($compile) {
  var render = function(scope, element, attrs) {
    if (scope.workflow.steps && scope.workorder) {
      var portal = scope.portal === 'true';
      element.children().remove();
      scope.workflow.steps.forEach(function(step, i) {
        if (i==0 || scope.workorder.steps && scope.workorder.steps[step.code] && scope.workorder.steps[step.code].status === 'complete' ) {
          var template = '';
          if (step.formId) {
            var submission = scope.workorder.steps[step.code].submission;
            if (submission.submissionId || submission._submissionLocalId) {
              template = portal && false ? '<appform-portal-submission-view submission-id="workorder.steps[\''+step.code+'\'].submission.submissionId" submission-local-id="workorder.steps[\''+step.code+'\'].submission._submissionLocalId"></appform-portal-submission-view>'
                                         : '<appform-mobile-submission-view submission-id="workorder.steps[\''+step.code+'\'].submission.submissionId" submission-local-id="workorder.steps[\''+step.code+'\'].submission._submissionLocalId"></appform-mobile-submission-view>';
            }
          } else {
            template = portal && step.templates.portal && step.templates.portal.view
              ? step.templates.portal.view
              : step.templates.view;
          };
          if (portal && i != 0) {
            var padding = angular.element('<div layout-padding layout-margin class="md-body-1"></div>');
            padding.append(template);
            element.append(padding);
          } else {
            element.append(template);
          }
        }
      });
      $compile(element.contents())(scope);
    };
  }
  return {
    restrict: 'E'
  , scope: {
      workorder: '=workorder'
    , workflow: '=workflow'
    , portal: '@'
    }
  , link: function (scope, element, attrs) {
      render(scope, element, attrs);
      scope.$watch('workflow', function() {
        render(scope, element, attrs);
      });
      scope.$watch('workorder', function() {
        render(scope, element, attrs);
      });
    }
  };
})
;

module.exports = 'wfm.workflow';
