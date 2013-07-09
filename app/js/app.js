angular.module('gdgPackagedApp', [])
    .config(function ($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: 'views/chat.html',
                controller: 'ChatController'
            })
            .when('/about', {
                templateUrl: 'views/about.html',
                controller: 'AboutController'
            })
            .otherwise({
                redirectTo: '/'
            });
    })
    .service({
        MessageService: function() {
            var self = this;
            chrome.storage.local.get('messages', function(obj) {
                self.updateListeners(obj.messages);
            });

            chrome.storage.onChanged.addListener(function(changes, areaName) {
                self.updateListeners(changes.messages.newValue);
            });

            this.listeners = [];
            this.addListener = function(listener) {
                this.listeners.push(listener);
                chrome.storage.local.get('messages', function(obj) {
                    listener(obj.messages);
                });
            };

            this.updateListeners = function(messages) {
                for (var i = 0; i < this.listeners.length; i++) {
                    this.listeners[i](messages);
                }
            }

            this.addMessage = function (message) {
                chrome.storage.local.get('messages', function(obj) {
                    if (!obj.messages) {
                        obj.messages = [];
                    }
                    obj.messages.push(message);
                    obj.messages = obj.messages.slice(-100);
                    chrome.storage.local.set(obj);
                });
            };
        }
    })
    .controller({
        NavController: function ($scope, $location) {
            $scope.appName = "GDG Austin Dev Fest";
            $scope.errorMessage = '';

            $scope.nav = function(path) {
                $location.path(path);
            }

            $scope.navClass = function(path) {
                if (path[0] != '/') {
                    path = '/' + path;
                }
                return $location.path() == path ? 'active' : '';
            }

            $scope.newWindow = function() {
                var bounds = chrome.app.window.current().getBounds();
                var newBounds =  {
                    left: (bounds.left + 50) % (screen.width - bounds.width),
                    // Need some slop or chrome positions window higher than desired (Mac only)?
                    top: (bounds.top + 50) % (screen.height - bounds.height - 80),
                    width: bounds.width,
                    height: bounds.height
                };
                chrome.app.window.create('index.html', {bounds: newBounds});
            }

            $scope.showError = function (message) {
                $scope.errorMessage = message;
            };
        },

        ChatController: function($scope, $rootScope, $timeout, MessageService) {
            $scope.$watch('userName', function() {
                $rootScope.userName = $scope.userName;
            });

            var chatDiv = $('div.chat')[0];

            $scope.sendMessage = function () {
                $scope.showError('');
                if (!$scope.userName) {
                    $scope.showError("Please enter a user name.");
                    // TODO: Should not reference DOM from controller (testability)
                    $('#user-name').focus();
                    return;
                }
                if (!$scope.messageText) {

                    $scope.showError("Empty message.");
                    return;
                }
                MessageService.addMessage({from: $scope.userName,
                                           text: $scope.messageText});
                $scope.messageText = "";
            }

            MessageService.addListener(function(messages) {
                // Need call $apply since this is an aysnc update to the scope.
                $scope.$apply(function () {
                    $scope.messages = messages;
                    // After page update - scroll to bottom - better to force scroll to bottom
                    // on update?
                    $timeout(function() {
                        chatDiv.scrollTop = chatDiv.scrollHeight;
                    });
                });
            });
        },

        AboutController: function($scope) {
            console.log("AboutController");
            chrome.socket.getNetworkList(function (adaptors) {
                $scope.$apply(function () {
                    $scope.adaptors = [];
                    for (var i = 0; i < adaptors.length; i++) {
                        if (adaptors[i].address.indexOf(':') == -1) {
                            $scope.adaptors.push(adaptors[i]);
                        }
                    }
                });
            });
        }

        });
