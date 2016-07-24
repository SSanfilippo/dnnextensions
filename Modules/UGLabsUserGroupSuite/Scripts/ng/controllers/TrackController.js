﻿"use strict";

codeCampControllers.controller("trackController", [
    "$scope", "$routeParams", "$http", "$location", "$uibModal", "codeCampServiceFactory", function ($scope, $routeParams, $http, $location, $uibModal, codeCampServiceFactory) {

        var factory = codeCampServiceFactory;
        factory.init(moduleId, moduleName);

        $scope.speaker = [];
        $scope.availableSessions = [];
        $scope.assignedSessions = [];
        $scope.SessionRegistration = [];
        $scope.userCanEdit = false;
        $scope.TrackId = $routeParams.trackId;
        $scope.availableListFilter = "";
        $scope.assignedListFilter = "";

        $scope.LoadData = function() {
            factory.callGetService("GetCurrentUserId")
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.currentUserId = serviceResponse.Content;

                        $scope.LoadEventDetails();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetCurrentUserId");
                        console.log(data);
                    });
        }

        $scope.LoadEventDetails = function() {
            factory.callGetService("GetEventByModuleId")
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.codeCamp = serviceResponse.Content;

                        if ($scope.codeCamp === null) {
                            $scope.hasCodeCamp = false;
                        } else {
                            $scope.hasCodeCamp = true;

                            if ($scope.codeCamp != null) {
                                $scope.codeCamp.BeginDate = ParseDate($scope.codeCamp.BeginDate);
                                $scope.codeCamp.EndDate = ParseDate($scope.codeCamp.EndDate);
                            }

                            $scope.LoadEditPermissions();

                            $scope.getCurrentUserId();
                        }

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetEventByModuleId");
                        console.log(data);
                    });
        }

        $scope.LoadEditPermissions = function() {
            factory.callGetService("UserCanEditEvent?itemId=" + $scope.codeCamp.CodeCampId)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.userCanEdit = (serviceResponse.Content == "Success");

                        $scope.LoadTrack();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling UserCanEditEvent");
                        console.log(data);
                    });
        }

        $scope.LoadTrack = function() {
            factory.callGetService("GetTrack?itemId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.track = serviceResponse.Content;

                        $scope.LoadUnassignedSessions();

                        $scope.LoadAssignedSessions();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetTrack");
                        console.log(data);
                    });
        }

        $scope.getCurrentUserId = function() {
            factory.callGetService("GetCurrentUserId")
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.currentUserId = serviceResponse.Content;

                        $scope.getEventRegistration();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetCurrentUserId");
                        console.log(data);
                    });
        }

        $scope.getEventRegistration = function() {
            factory.callGetService("GetRegistrationByUserId?userId=" + $scope.currentUserId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.currentUserRegistration = serviceResponse.Content;

                        $scope.getSpeaker();

                        $scope.LoadTimeSlots();

                        $scope.UpdateSessionRegistration();

                        $scope.DetermineRegisterEnablement();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetRegistrationByUserId");
                        console.log(data);
                    });
        }

        $scope.getSpeaker = function() {
            if ($scope.currentUserRegistration != null) {
                factory.callGetService("GetSpeakerByRegistrationId?codeCampId=" + $scope.codeCamp.CodeCampId + "&registrationId=" + $scope.currentUserRegistration.RegistrationId)
                    .then(function(response) {
                            var fullResult = angular.fromJson(response);
                            var serviceResponse = JSON.parse(fullResult.data);

                            $scope.speaker = serviceResponse.Content;
                        },
                        function(data) {
                            console.log("Unknown error occurred calling GetSpeakerByRegistrationId");
                            console.log(data);
                        });
            }
        }

        $scope.LoadUnassignedSessions = function () {
            factory.callGetService("GetSessionsUnassigned?codeCampId=" + $scope.codeCamp.CodeCampId)
                .then(function (response) {
                    var fullResult = angular.fromJson(response);
                    var serviceResponse = JSON.parse(fullResult.data);

                    $scope.availableSessions = serviceResponse.Content;

                    LogErrors(serviceResponse.Errors);
                },
                    function (data) {
                        console.log("Unknown error occurred calling GetSessionsUnassigned");
                        console.log(data);
                        return null;
                    });
        }

        $scope.LoadAssignedSessions = function () {
            factory.callGetService("GetSessionsByTrackId?trackId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
                .then(function (response) {
                    var fullResult = angular.fromJson(response);
                    var serviceResponse = JSON.parse(fullResult.data);

                    $scope.assignedSessions = serviceResponse.Content;

                    LogErrors(serviceResponse.Errors);
                },
                    function (data) {
                        console.log("Unknown error occurred calling GetSessionsByTrackId");
                        console.log(data);
                        return null;
                    });
        }

        $scope.LoadTimeSlots = function () {
            factory.callGetService("GetTimeSlots?codeCampId=" + $scope.codeCamp.CodeCampId)
                .then(function (response) {
                    var fullResult = angular.fromJson(response);
                    var serviceResponse = JSON.parse(fullResult.data);

                    $scope.timeSlots = serviceResponse.Content;

                    angular.forEach($scope.timeSlots, function (timeSlot, index) {
                        var beginDateTime = moment(timeSlot.BeginTime);

                        timeSlot.BeginTime = moment(timeSlot.BeginTime).format("hh:mm A");
                        timeSlot.EndTime = moment(timeSlot.EndTime).format("hh:mm A");

                        var seconds = beginDateTime.seconds();
                        var minutes = beginDateTime.minutes();
                        var hours = beginDateTime.hours();

                        timeSlot.sortTime = hours * 60 * 60 + minutes * 60 + seconds;
                    });

                    LogErrors(serviceResponse.Errors);
                },
                    function (data) {
                        console.log("Unknown error occurred calling GetTimeSlots");
                        console.log(data);
                    });
        }

        $scope.UpdateSessionRegistration = function() {
            $scope.SessionRegistration.length = 0;

            if ($scope.currentUserRegistration !== null) {
                $.each($scope.assignedSessions, function(index, session) {
                    factory.callGetService("GetSessionRegistrationByRegistrantId?sessionId=" + session.SessionId + "&registrantId=" + $scope.currentUserRegistration.RegistrationId)
                        .then(function(response) {
                                var fullResult = angular.fromJson(response);
                                var serviceResponse = JSON.parse(fullResult.data);

                                var result = (serviceResponse.Content != null);

                                if (result) {
                                    $scope.SessionRegistration.push(session.SessionId);
                                }

                                LogErrors(serviceResponse.Errors);
                            },
                            function(data) {
                                console.log("Unknown error occurred calling GetSessionRegistrationByRegistrantId");
                                console.log(data);
                            });
                });
            }
        }

        $scope.DetermineRegisterEnablement = function() {
            var validRegistration = ($scope.currentUserRegistration != null);

            if (!validRegistration) {
                $scope.SessionRegistrationIsDisabled = true;
            } else {
                if ($scope.speaker != null) {
                    var speakerIsSame = ($scope.speaker.RegistrationId == $scope.currentUserRegistration.RegistrationId);

                    $scope.SessionRegistrationIsDisabled = speakerIsSame;
                } else {
                    $scope.SessionRegistrationIsDisabled = false;
                }
            }
        }

        $scope.IsUserRegisteredForSession = function(sessionId) {
            var result = $scope.SessionRegistration.indexOf(sessionId) >= 0;
            return result;
        }

        $scope.GetSessionRegistrationStatus = function(sessionId) {
            var result = false;

            if ($scope.currentUserRegistration != null) {
                factory.callGetService("GetSessionRegistrationByRegistrantId?sessionId=" + sessionId + "&registrantId=" + $scope.currentUserRegistration.RegistrationId)
                    .then(function(response) {
                            var fullResult = angular.fromJson(response);
                            var serviceResponse = JSON.parse(fullResult.data);

                            result = (serviceResponse.Content != null);

                            LogErrors(serviceResponse.Errors);

                            return result;
                        },
                        function(data) {
                            console.log("Unknown error occurred calling GetSessionRegistrationByRegistrantId");
                            console.log(data);
                            return result;
                        });
            }

            return result;
        }

        $scope.GetSessionRegistrationCount = function(sessionId) {
            var count = 0;

            factory.callGetService("GetSessionRegistrations?sessionId=" + sessionId)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        if (serviceResponse.Content != null) {
                            count = serviceResponse.Content;
                        }

                        LogErrors(serviceResponse.Errors);

                        return count;
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetSessionRegistrationByRegistrantId");
                        console.log(data);
                        return null;
                    });
        }

        $scope.RegisterForSession = function(sessionId) {
            var registration = {
                SessionId: sessionId,
                RegistrationId: $scope.currentUserRegistration.RegistrationId
            };

            factory.callPostService("CreateSessionRegistration", registration)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        $scope.UpdateSessionRegistration();

                        LogErrors(serviceResponse.Errors);
                    },
                    function(data) {
                        console.log("Unknown error occurred calling CreateSessionRegistration");
                        console.log(data);
                    });
        }

        $scope.UnregisterForSession = function(sessionId) {
            var registration = {};

            factory.callGetService("GetSessionRegistrationByRegistrantId?sessionId=" + sessionId + "&registrantId=" + $scope.currentUserRegistration.RegistrationId)
                .then(function(response) {
                        var fullResult = angular.fromJson(response);
                        var serviceResponse = JSON.parse(fullResult.data);

                        LogErrors(serviceResponse.Errors);

                        registration = serviceResponse.Content;

                        if (registration != null) {
                            factory.callDeleteService("DeleteSessionRegistration?itemId=" + registration.SessionRegistrationId + "&sessionId=" + registration.SessionId)
                                .then(function(response) {
                                        var fullResult = angular.fromJson(response);
                                        var serviceResponse = JSON.parse(fullResult.data);

                                        $scope.UpdateSessionRegistration();

                                        LogErrors(serviceResponse.Errors);
                                    },
                                    function(data) {
                                        console.log("Unknown error occurred calling CreateSessionRegistration");
                                        console.log(data);
                                    });
                        }
                    },
                    function(data) {
                        console.log("Unknown error occurred calling GetSessionRegistrationByRegistrantId");
                        console.log(data);
                        return null;
                    });
        }
        
        $scope.goToPage = function(pageName) {
            $location.path(pageName);
        }

        $scope.AssignSessions = function() {
            var modalInstance = $uibModal.open({
                templateUrl: "AssignSessionsModal.html",
                controller: "AssignSessionsModalController",
                size: "lg",
                backdrop: "static",
                scope: $scope,
                resolve: {
                    trackId: function() {
                        return $scope.TrackId;
                    },
                    codeCampId: function () {
                        return $scope.codeCamp.CodeCampId;
                    },
                    availableSessions: function() {
                        return $scope.availableSessions;
                    },
                    assignedSessions: function() {
                        return $scope.assignedSessions;
                    }
                }
            });

            modalInstance.result.then(function() {
                $scope.LoadAssignedSessions();
                $scope.LoadUnassignedSessions();
            }, function() {
                console.log("Modal dismissed at: " + new Date());
            });
        };

        $scope.SortSessions = function () {
            var modalInstance = $uibModal.open({
                templateUrl: "SortSessionsModal.html",
                controller: "SortSessionsModalController",
                size: "md",
                backdrop: "static",
                scope: $scope,
                resolve: {
                    trackId: function () {
                        return $scope.TrackId;
                    },
                    codeCampId: function () {
                        return $scope.codeCamp.CodeCampId;
                    },
                    assignedSessions: function () {
                        return $scope.assignedSessions;
                    }
                }
            });

            modalInstance.result.then(function () {
                $scope.LoadAssignedSessions();
            }, function () {
                console.log("Modal dismissed at: " + new Date());
            });
        };

        $scope.DeleteTrack = function() {
            var modalInstance = $uibModal.open({
                templateUrl: "ConfirmModal.html",
                controller: "ConfirmModalController",
                size: "sm",
                backdrop: "static",
                scope: $scope,
                resolve: {
                    trackId: function() {
                        return $scope.TrackId;
                    },
                    codeCampId: function() {
                        return $scope.codeCamp.CodeCampId;
                    }
                }
            });

            modalInstance.result.then(function() {
                $scope.goToPage("/tracks");
            }, function() {
                console.log("Modal dismissed at: " + new Date());
            });
        };

        $scope.LoadData();

    }
]);

/*
 * Assign Sessions Modal
 */
codeCampApp.controller("AssignSessionsModalController", ["$scope", "$rootScope", "$uibModalInstance", "trackId", "codeCampId", "assignedSessions", "availableSessions", "codeCampServiceFactory", function ($scope, $rootScope, $uibModalInstance, trackId, codeCampId, assignedSessions, availableSessions, codeCampServiceFactory) {

    var factory = codeCampServiceFactory;
    factory.init(moduleId, moduleName);

    $scope.titleLimit = 50;

    $scope.availableSessions = availableSessions;
    $scope.assignedSessions = assignedSessions;

    $scope.LoadTrack = function () {
        factory.callGetService("GetTrack?itemId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.track = serviceResponse.Content;

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetTrack");
                    console.log(data);
                });
    }

    $scope.LoadUnassignedSessions = function () {
        factory.callGetService("GetSessionsUnassigned?codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.availableSessions = serviceResponse.Content;

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSessionsUnassigned");
                    console.log(data);
                    return null;
                });
    }

    $scope.LoadAssignedSessions = function () {
        factory.callGetService("GetSessionsByTrackId?trackId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.assignedSessions = serviceResponse.Content;

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSessionsByTrackId");
                    console.log(data);
                    return null;
                });
    }

    $scope.RemoveFromTrack = function(sessionId) {
        factory.callPostService("UnassignSessionFromTrack?sessionId=" + sessionId + "&codeCampId=" + codeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.LoadAssignedSessions();
                $scope.LoadUnassignedSessions();

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSpeakerByRegistrationId");
                    console.log(data);
                });
    }

    $scope.AddToTrack = function (sessionId) {
        factory.callPostService("AssignSessionToTrack?sessionId=" + sessionId + "&trackId=" + trackId + "&codeCampId=" + codeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.LoadAssignedSessions();
                $scope.LoadUnassignedSessions();

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSpeakerByRegistrationId");
                    console.log(data);
                });
    }

    $scope.DisplaySpeakers = function (speakers) {
        var speakerText = "";

        if (speakers != null) {
            $.each(speakers, function(index, speaker) {
                if (index > 0) {
                    speakerText = speakerText + ", " + speaker.SpeakerName;
                } else {
                    speakerText = speaker.SpeakerName;
                }
            });
        }

        return speakerText;
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("cancel");
    };

    $scope.LoadTrack();
}]);

/*
 * Sort Sessions Modal
 */
codeCampApp.controller("SortSessionsModalController", ["$scope", "$rootScope", "$uibModalInstance", "trackId", "codeCampId", "assignedSessions", "codeCampServiceFactory", function ($scope, $rootScope, $uibModalInstance, trackId, codeCampId, assignedSessions, codeCampServiceFactory) {

    var factory = codeCampServiceFactory;
    factory.init(moduleId, moduleName);

    $scope.titleLimit = 50;

    $scope.assignedSessions = assignedSessions;

    $scope.LoadTrack = function () {
        factory.callGetService("GetTrack?itemId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.track = serviceResponse.Content;

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetTrack");
                    console.log(data);
                });
    }

    $scope.LoadAssignedSessions = function () {
        factory.callGetService("GetSessionsByTrackId?trackId=" + $scope.TrackId + "&codeCampId=" + $scope.codeCamp.CodeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                $scope.assignedSessions = serviceResponse.Content;

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling GetSessionsByTrackId");
                    console.log(data);
                    return null;
                });
    }

    $scope.sortableOptions = {
        diabled: false,
        update: function (e, ui) {
        },
        stop: function (e, ui) {
            $scope.updateSessionOrder();
        }
    };

    $scope.updateSessionOrder = function () {
        angular.forEach($scope.assignedSessions, function(session, index) {
            factory.callPostService("UpdateSessionTimeSlotOrder?sessionId=" + session.SessionId + "&codeCampId=" +  + $scope.codeCamp.CodeCampId + "&newPosition=" + index)
                .success(function (data) {
                    var serviceResponse = angular.fromJson(data);

                    LogErrors(serviceResponse.Errors);
                })
                .error(function (data, status) {
                    $scope.HasErrors = true;
                    console.log("Unknown error occurred calling UpdateSessionsTimeSlotOrder");
                    console.log(data);
                });
        });

        $scope.LoadAssignedSessions();
    }

    $scope.ok = function () {
        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("cancel");
    };

    $scope.LoadTrack();
}]);

/*
 * Delete Modal
 */
codeCampApp.controller("ConfirmModalController", ["$scope", "$rootScope", "$uibModalInstance", "trackId", "codeCampId", "codeCampServiceFactory", function ($scope, $rootScope, $uibModalInstance, trackId, codeCampId, codeCampServiceFactory) {

    var factory = codeCampServiceFactory;
    factory.init(moduleId, moduleName);

    $scope.ok = function () {
        factory.callDeleteService("DeleteTrack?itemId=" + trackId + "&codeCampId=" + codeCampId)
            .then(function (response) {
                var fullResult = angular.fromJson(response);
                var serviceResponse = JSON.parse(fullResult.data);

                LogErrors(serviceResponse.Errors);
            },
                function (data) {
                    console.log("Unknown error occurred calling DeleteTrack");
                    console.log(data);
                });

        $uibModalInstance.close();
    };

    $scope.cancel = function () {
        $uibModalInstance.dismiss("cancel");
    };
}]);