﻿"use strict";

codeCampControllers.controller("eventController", ["$scope", "$routeParams", "$http", "$location", "codeCampServiceFactory", function ($scope, $routeParams, $http, $location, codeCampServiceFactory) {

    $scope.codeCamp = {};

    $scope.HasSuccess = false;
    $scope.HasErrors = false;

    var factory = codeCampServiceFactory;
    factory.init(moduleId, moduleName);

    $scope.LoadData = function () {
        factory.callGetService("GetEventByModuleId")
           .then(function (response) {
               var fullResult = angular.fromJson(response);
               var serviceResponse = JSON.parse(fullResult.data);

               $scope.codeCamp = serviceResponse.Content;

               if ($scope.codeCamp != null) {
                   $scope.codeCamp.BeginDate = moment($scope.codeCamp.BeginDate).format($momentDateFormat);
                   $scope.codeCamp.EndDate = moment($scope.codeCamp.EndDate).format($momentDateFormat);
               }

               if ($scope.codeCamp === null) {
                   $scope.hasCodeCamp = false;
                   $scope.codeCamp = { CodeCampId: -1 };
               } else {
                   $scope.hasCodeCamp = true;
               }

               $scope.LoadEditPermissions();

               LogErrors(serviceResponse.Errors);
           },
           function (data) {
               console.log("Unknown error occurred calling GetEventByModuleId");
               console.log(data);
           });
    }

    $scope.LoadEditPermissions = function () {
        factory.callGetService("UserCanEditEvent?itemId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.userCanEdit = (serviceResponse.Content == "Success");

                LogErrors(serviceResponse.Errors);
            },
            function (data) {
                console.log("Unknown error occurred calling UserCanEditEvent");
                console.log(data);
            });
    }

    $scope.createEvent = function () {
        var action = "CreateEvent";

        if ($scope.codeCamp.CodeCampId > 0) {
            action = "UpdateEvent";
        }

        $scope.codeCamp.BeginDate = moment(new Date($scope.codeCamp.BeginDate)).format($momentFullDateFormat);
        $scope.codeCamp.EndDate = moment(new Date($scope.codeCamp.EndDate)).format($momentFullDateFormat);

        factory.callPostService(action, $scope.codeCamp)
            .success(function (data) {
                $scope.HasSuccess = true;

                var serviceResponse = angular.fromJson(data);

                $scope.LoadData();

                LogErrors(serviceResponse.Errors);
            })
            .error(function (data, status) {
                $scope.HasErrors = true;
                console.log("Unknown error occurred calling " + action);
                console.log(data);
            });
    }

    $scope.goToAbout = function () {
        $location.path("/about");
    }

    $scope.SyncDates = function () {
        if (!angular.isDefined($scope.codeCamp.BeginDate)) {
            $scope.codeCamp.BeginDate = moment(new Date($scope.codeCamp.EndDate.toString())).format($momentDateFormat);
            return;
        }

        if (moment(new Date($scope.codeCamp.BeginDate)).isAfter(moment(new Date($scope.codeCamp.EndDate)))) {
            $scope.codeCamp.EndDate = moment(new Date($scope.codeCamp.BeginDate.toString())).format($momentDateFormat);
        }
    }

    /* DatePicker */

    $scope.datePicker = (function () {

        var method = {};
        method.instances = [];

        method.open = function ($event, instance) {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }

            method.instances[instance] = true;
        };

        method.minDate = new Date() + 1;

        method.maxDate = new Date(2023, 12, 24);

        method.options = {
            formatYear: "yyyy",
            startingDay: 1
        };

        method.format = "MM/dd/yyyy";

        return method;
    }());

    $scope.LoadData();

}]);