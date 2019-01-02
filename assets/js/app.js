angular.module('webkitMaterial', ['ngMaterial', 'angularLoad'])
    .config(function () {
        console.debug("webkit-material loading...");
    })
    .controller('loginController', function ($scope, $filter, $mdToast, settings) {

        var ls = localStorage;

        // Load possible users and sessions
        $scope.users = lightdm.users;
        $scope.sessions = lightdm.sessions;

        // Get previous user and session
        if (ls.getItem("settings.previousUser")) {
            $scope.user = ls.getItem("settings.previousUser");
        } else {
            $scope.user = lightdm.users[0].name;
        }
        if (ls.getItem("settings.previousSession")) {
            $scope.session = ls.getItem("settings.previousSession");
        } else {
            $scope.session = lightdm.sessions[0].key;
        }

        // Watch user and session for changes and update settings if changed
        $scope.$watch('user', function (current, previous) {
            if (typeof current === 'undefined')
                return;
            ls.setItem("settings.previousUser", $scope.user);
            if (lightdm._username)
                lightdm.cancel_authentication();
            lightdm.start_authentication($scope.user);
        });
        $scope.$watch('session', function (current) {
            if (typeof current === 'undefined')
                return;
            ls.setItem("settings.previousSession", $scope.session);
        });

        $scope.getUserImage = function (user) {
            return $filter('filter')($scope.users, { name: user })[0].image;
        };

        $scope.signIn = function () {
            lightdm.cancel_timed_login();
            $scope.state = 'signingin';
            lightdm.provide_secret($scope.password);
        };

        window.authentication_complete = function () {
            $scope.state = 'ready';
            if (lightdm.is_authenticated) {
                $mdToast.show(
                    $mdToast.simple()
                        .textContent('Loggin Successful')
                        .position('top right')
                        .hideDelay(3000)
                );
                lightdm.login(lightdm.authentication_user, $scope.session);
            } else {
                if (lightdm._username)
                    lightdm.cancel_authentication();
                lightdm.start_authentication($scope.user);
                $scope.loginForm.password.$setValidity("correct", false);
                $('#pass').select();
            }
        };
    })
    .directive('fallbackSrc', function ($mdToast) {
        var fallbackSrc = {
            link: function postLink(scope, iElement, iAttrs) {
                iElement.bind('error', function () {
                    var el = angular.element(this);
                    console.error('Unabled to load image', el.attr("src"));
                    $mdToast.show(
                        $mdToast.simple()
                            .textContent('Unabled to load image "' + el.attr("src") + '". Click help (upper right) for more info.')
                            .position('top left')
                            .hideDelay(5000)
                    );
                    el.attr("src", iAttrs.fallbackSrc);
                });
            }
        }
        return fallbackSrc;
    })
    .factory('settings', function () {

        var ls = localStorage;

        var factory = {};

        // Load possible languages
        factory.languages = lightdm.languages;

        // Get previous language, background, and clockFormat
        if (ls.getItem("settings.language")) {
            factory.language = ls.getItem("settings.language");
        } else {
            factory.language = lightdm.default_language.code;
        }
        if (ls.getItem("settings.backgroundEngine")) {
            factory.backgroundEngine = ls.getItem("settings.backgroundEngine");
        } else {
            factory.backgroundEngine = 'trianglify';
        }
        if (ls.getItem("settings.particlegroundDensity")) {
            factory.particlegroundDensity = parseInt(ls.getItem("settings.particlegroundDensity"));
        } else {
            factory.particlegroundDensity = 40000;
        }
        if (ls.getItem("settings.background")) {
            factory.background = ls.getItem("settings.background");
        } else {
            factory.background = 'random';
        }
        if (ls.getItem("settings.clockFormat")) {
            factory.clockFormat = ls.getItem("settings.clockFormat");
        } else {
            factory.clockFormat = 'H:mm:ss';
        }
        if (ls.getItem("settings.animation")) {
            factory.animation = ls.getItem("settings.animation");
        } else {
            factory.animation = 'fadeIn';
        }
        if (ls.getItem("settings.animationDuration")) {
            factory.animationDuration = parseInt(ls.getItem("settings.animationDuration"));
        } else {
            factory.animationDuration = 1000;
        }

        factory.animations = ['fadeIn', 'bounceIn', 'flipInX', 'flipInY', 'lightSpeedIn', 'rotateIn', 'slideInUp', 'slideInDown', 'zoomIn', 'rollIn'];

        return factory;
    })
    .filter('cleanAnimationName', function () {
        return function (input) {
            return input
                // insert a space before all caps
                .replace(/([A-Z])/g, ' $1')
                // uppercase the first character
                .replace(/^./, function (str) {
                    return str.toUpperCase();
                });
        };
    })
    .controller('settingsController', function ($rootScope, $scope, settings) {

        var ls = localStorage;

        $scope.settings = settings;

        // Watch language, background, and clockFormat and update settings if changed
        $scope.$watch('settings.language', function (current, previous) {
            if (typeof current === 'undefined' || current === previous)
                return;
            ls.setItem("settings.language", $scope.settings.language);
        });
        $scope.$watch('settings.clockFormat', function (current, previous) {
            if (typeof current === 'undefined' || current === previous)
                return;
            ls.setItem("settings.clockFormat", $scope.settings.clockFormat);
        });
        $scope.$watch('settings.animation', function (current, previous) {
            if (typeof current === 'undefined' || current === previous)
                return;
            $rootScope.animation = settings.animation;
            ls.setItem("settings.animation", $scope.settings.animation);
        });
        $scope.$watch('settings.animationDuration', function (current, previous) {
            if (typeof current === 'undefined' || current === previous)
                return;
            $rootScope.animationDuration = { 'animationDuration': settings.animationDuration + 'ms' };
            ls.setItem("settings.animationDuration", $scope.settings.animationDuration);
        });

        $scope.user = localStorage.getItem("settings.previousUser");
    })
    .controller('timeController', function ($scope, settings) {

        $scope.$watch(function () {
            return settings.clockFormat;
        }, function (current, previous) {
            if (typeof current === 'undefined' || current === previous)
                return;
            $scope.format = settings.clockFormat;
        });

        $scope.clock = "loading clock..."; // initialise the time variable
        $scope.format = settings.clockFormat;
        $scope.tickInterval = 1000 //ms

        var tick = function () {
            $scope.clock = Date.now(); // get the current time
            if (!$scope.$$phase)
                $scope.$digest();
            setTimeout(tick, $scope.tickInterval); // reset the timer
        };

        setTimeout(tick, $scope.tickInterval); // Start the timer
    })
    .run(function ($rootScope, settings) {

        $rootScope.animation = settings.animation;
        $rootScope.animationDuration = { 'animationDuration': settings.animationDuration + 'ms' };
    });
