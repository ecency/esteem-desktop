(function() {

  var fs = require('fs');

  var app = angular.module('steem', [
  	'ionic', 
    'steem.controllers',
    'steem.services',
  	'ngStorage', 
  	'ngCordova',
    'rzModule',
    'ion-floating-menu',
    'pascalprecht.translate',
    'ja.qr',
    'toaster',
    'textAngular'
  ]);

  if (localStorage.getItem("socketUrl") === null) {
    localStorage.setItem("socketUrl", "wss://steemit.com/wspa");
  }

  var steemRPC = require("steem-rpc");
  window.Api = steemRPC.Client.get({url:localStorage.socketUrl}, true);
  window.steemJS = require("steemjs-lib");
  window.diff_match_patch = require('diff-match-patch');
  window.dialog = require('electron').dialog;
  window.getSlug = require('speakingurl');


  app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $sceDelegateProvider, $logProvider, $compileProvider, $animateProvider, $translateProvider, $provide) {
    $stateProvider

    .state('app', {
      url: '/app',
      abstract: true,
      templateUrl: 'scripts/templates/menu.html',
      controller: 'AppCtrl'
    })

    .state('app.settings', {
      url: '/settings',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

    .state('app.about', {
      url: '/about',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/about.html',
        }
      }
    })

    .state('app.send', {
      url: '/send',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/send.html',
          controller: 'SendCtrl'

        }
      }
    })

    .state('app.follow', {
      url: '/follow',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/follow.html',
          controller: 'FollowCtrl'
        }
      }
    })


    .state('app.exchange', {
      url: '/exchange/:username',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/exchange.html',
          controller: 'ExchangeCtrl'
        }
      }
    })

    .state('app.profile', {
      url: '/profile/:username',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/profile.html',
          controller: "ProfileCtrl"
        }
      }
    })

    .state('app.posts', {
      url: '/posts/:tags',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/posts.html',
          controller: 'PostsCtrl'
        }
      }
    })
    
    .state('app.bookmark', {
      url: '/bookmark',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/bookmarks.html',
          controller: 'BookmarkCtrl'
        }
      }
    })

    .state('app.notifications', {
      url: '/notifications',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/notifications.html',
          controller: 'NotificationsCtrl'
        }
      }
    })

    .state('app.single', {
      url: '/single/:postdata',
      views: {
        'menuContent': {
          templateUrl: 'scripts/templates/post.html',
          controller: 'PostCtrl'
        }
      }
    });
    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/app/posts/');
    $ionicConfigProvider.navBar.alignTitle('left')
    $ionicConfigProvider.backButton.text('').icon('ion-chevron-left');
    $ionicConfigProvider.views.swipeBackEnabled(false);
    $ionicConfigProvider.views.maxCache(2);

    $animateProvider.classNameFilter( /\banimated\b/ );
    $ionicConfigProvider.scrolling.jsScrolling(false);
    
    if (window.cordova) {
        $logProvider.debugEnabled(false);
        $compileProvider.debugInfoEnabled(false);
    }

    $translateProvider.translations('en', require('./scripts/locales/en')); //English
    $translateProvider.translations('ru', require('./scripts/locales/ru')); //Russian
    $translateProvider.translations('de', require('./scripts/locales/de')); //German
    $translateProvider.translations('fr', require('./scripts/locales/fr')); //French
    $translateProvider.translations('es', require('./scripts/locales/es')); //Spanish
    $translateProvider.translations('gr', require('./scripts/locales/gr')); //Greek
    $translateProvider.translations('bg', require('./scripts/locales/bg')); //Bulgarian
    $translateProvider.translations('nl', require('./scripts/locales/nl')); //Dutch
    $translateProvider.translations('hu', require('./scripts/locales/hu')); //Hungarian
    $translateProvider.translations('cs', require('./scripts/locales/cs')); //Czech
    $translateProvider.translations('iw', require('./scripts/locales/iw')); //Hebrew
    $translateProvider.translations('pl', require('./scripts/locales/pl')); //Polish
    $translateProvider.translations('pt', require('./scripts/locales/pt')); //Portuguese
    $translateProvider.translations('id', require('./scripts/locales/id')); //Indonesian
    $translateProvider.translations('zh', require('./scripts/locales/zh')); //Chinese traditional

    $translateProvider.useSanitizeValueStrategy(null);

    $translateProvider.preferredLanguage('en');  
    $translateProvider.fallbackLanguage('en');
        
    $provide.decorator('taOptions', ['taRegisterTool', '$delegate', function(taRegisterTool, taOptions) { // $delegate is the taOptions we are decorating
          
          taOptions.toolbar = [
              ['h1', 'h2', 'h3', 'h4', 'h5', 'quote',
              'bold', 'italics', 'underline', 'strikeThrough', 'ul', 'ol',
              'justifyLeft', 'justifyCenter', 'justifyRight',
              'html', 'insertImage', 'wordcount', 'charcount']
          ];

          /*taRegisterTool('image', {
              buttontext: 'Image',
              action: function() {
                //TODO upload image and save in localstorage
                  console.log('InsertImage');
              }
          });*/

          return taOptions;
      }]);


    //$sceDelegateProvider.resourceUrlWhitelist(['self', new RegExp('^(http[s]?):\/\/(w{3}.)?youtube\.com/.+$')]);
  });
       

  app.run(function($ionicPlatform, $rootScope, $localStorage, $interval, $ionicPopup, $ionicLoading, $ionicModal, $timeout, APIs, $state, $log, $ionicScrollDelegate, $filter, $translate, $window, toaster) {
    $rootScope.$storage = $localStorage;
    $rootScope.log = function(message) {
      $log.info(message);
    };

    $rootScope.sendNotifications = function(title, message, data) {
      var myNotification = new Notification(title, {
        body: message,
        data: data
      });
      var found = false;
      var mdata = {title:title, message:message, created: new Date(), author: data.voter||data.author||data.account, author_reputation: data.author_reputation, permlink: data.permlink||data.parent_permlink, notification: data.notification};
      if (!angular.isDefined($rootScope.$storage.notifications)) {
        $rootScope.$storage.notifications = [];
      }
      if ($rootScope.$storage.notifications && $rootScope.$storage.notifications.length<200) {
        /*angular.forEach($rootScope.$storage.notifications, function(v,k){
          if (v.permlink == data.permlink) {
            found = true;
          }  
        });*/
        if (!found) {
          $rootScope.$storage.notifications.push(mdata);
        }
      } else {
        $rootScope.$storage.notifications.shift();
        $rootScope.$storage.notifications.push(mdata);
      }
      
      myNotification.onclick = function(event) {
        console.log('Notification clicked'+angular.toJson(event));
        $state.go('app.notifications');
      }
    };

    window.Api.initPromise.then(function(response) {
      $rootScope.log("Api ready init:" + angular.toJson(response));
      $rootScope.$broadcast('fetchPosts');
      var interval = setInterval(function() {  
        window.Api.database_api().exec("get_dynamic_global_properties", []).then(function(response){
          $rootScope.log("get_dynamic_global_properties "+ response.head_block_number);
          if ($rootScope.$storage.user) {
            $rootScope.mylogin = new window.steemJS.Login();
            $rootScope.mylogin.setRoles(["posting"]);
            var loginSuccess = $rootScope.mylogin.checkKeys({
                accountName: $rootScope.$storage.user.username,    
                password: $rootScope.$storage.user.password || null,
                auths: {
                    posting: $rootScope.$storage.user.posting.key_auths
                },
                privateKey: $rootScope.$storage.user.privatePostingKey || null
              }
            );
            //$rootScope.log("login "+loginSuccess);
          }

          window.Api.database_api().exec("get_block", [response.head_block_number]).then(function(response) {
            //console.log('get_block tx: '+response.transactions.length);
            for (var i = 0; i < response.transactions.length; i++) {
              
              (function() {
              
                var operate = response.transactions[i].operations[0][0];
                var essence = response.transactions[i].operations[0][1];

                if ($rootScope.$storage.subscription.vote && operate == "vote") {
                  //console.log(essence);
                  if ($rootScope.$storage.user && $rootScope.$storage.user.username === essence.author) {
                    $rootScope.log("send notification vote "+essence.voter);
                    $rootScope.log("New Vote @"+essence.voter+" voted "+essence.weight/100+"% "+essence.author+" "+essence.permlink);
                    essence.notification = 'vote.png';
                    $rootScope.sendNotifications("New vote","@"+essence.voter+" voted "+essence.weight/100+"% "+essence.author+" "+essence.permlink, essence);
                  }
                } else if ($rootScope.$storage.subscription.comment && operate == "comment"){

                  if ($rootScope.$storage.user && $rootScope.$storage.user.username === essence.parent_author) {
                    $rootScope.log("send notification of comment "+essence.author);    
                    $rootScope.log("New Comment @"+essence.author+" "+essence.parent_author+" "+essence.parent_permlink);
                    essence.notification = 'comment.png';
                    $rootScope.sendNotifications("New comment","@"+essence.author+" made comment on "+essence.parent_author+" "+essence.parent_permlink, essence);
                  }
                } else if ( ($rootScope.$storage.subscription.follow || $rootScope.$storage.subscription.resteem) && operate == "custom_json" && essence.id == "follow") {
                  //console.log(essence);
                  var js = JSON.parse(essence.json);
                  //console.log(js[1].following);
                  if (js[0] === "reblog") {
                    if ($rootScope.$storage.user && $rootScope.$storage.user.username === js[1].author) {
                      $rootScope.log(js[1].account+" Reblogged your post "+js[1].permlink);
                      js[1].notification = 'reblog.png';
                      $rootScope.sendNotifications("ReSteem","Yay, "+js[1].account+" Reblogged your post "+js[1].permlink, js[1]);
                    }
                  }
                  if (js[0] === "follow") {
                    if ($rootScope.$storage.user && $rootScope.$storage.user.username === js[1].following) {
                      if (js[1].what.length==0) {
                        $rootScope.log("Unfollow @"+js[1].follower);
                        js[1].notification = 'unfollow.png';
                        $rootScope.sendNotifications("Unfollow","@"+js[1].follower+" unfollowed you", js[1]);
                      } else {
                        $rootScope.log("New Follow @"+js[1].follower);
                        js[1].notification = 'follow.png';
                        $rootScope.sendNotifications("Follow", "Yay, you have new follower "+js[1].follower, js[1]);
                      }
                    }  
                  }
                }
              })();
            }
          });
        });
      }, 3000);
    });

    $ionicPlatform.ready(function() {
      var language = $window.navigator.language || $window.navigator.userLanguage || undefined; 
      if (language === 'en-US') {
        console.log("language is english");
      }
      console.log("language is "+language);
      if (!angular.isDefined($rootScope.$storage.language)) {
        if (angular.isDefined(language)) {
          $translate.use((language).split("-")[0]).then(function(data) {
              console.log("SUCCESS -> " + data);
              $rootScope.$storage.language = language.split('-')[0];
          }, function(error) {
              console.log("ERROR -> " + error);
          });
        } else {
          $rootScope.$storage.language = 'en';
        }  
      } else {
        $translate.use($rootScope.$storage.language);
      }
      
      $rootScope.$storage.languages = [{id:'en', name: 'English'}, {id:'es', name: 'Español'}, {id:'gr', name: 'Ελληνικά'}, {id:'fr', name: 'Français'}, {id:'de', name: 'Deutsch'}, {id:'ru', name: 'Русский'}, {id:'bg', name: 'Български'}, {id:'nl', name: 'Nederlands'}, {id:'hu', name: 'Magyar'}, {id:'cs', name: 'Čeština'}, {id:'iw', name: 'עברית‎'}, {id:'pl', name: 'Polski‎'}, {id:'pt', name: 'Português'}, {id:'id', name:'Bahasa Indonesia'}, {id:'zh', name:'繁體中文'}];
      
      if (!$rootScope.$storage.view) {
        $rootScope.$storage.view = 'card';
      }
      if (!$rootScope.$storage.filter) {
        $rootScope.$storage.filter = "trending";
      }
      
      $rootScope.log("app start ready");
      setTimeout(function() {
        if ($rootScope.$storage.pincode) {
          $rootScope.pincheck = true;
          $rootScope.$broadcast("pin:check");
        }  
      }, 1000);

      $rootScope.showAlert = function(title, msg) {
        var alertPopup = $ionicPopup.alert({
          title: title,
          template: msg
        });
        if (msg.indexOf("error")>-1) {
          //window.Api.initPromise.then(function(response) {
          $rootScope.log("broadcast error");
          //});
        }
        return alertPopup/*.then(function(res) {
          $rootScope.log('Thank you ...');
        });*/
      };
      $rootScope.showMessage = function(title, msg) {
        if (title) {
          //toast
          toaster.pop({
                type: 'info',
                title: title,
                body: msg,
                showCloseButton: true
            });
        }
      };
      $rootScope.$on('show:loading', function(event, args){
        $rootScope.log('show:loading');
        $ionicLoading.show({
          noBackdrop : true,
          template: '<ion-spinner icon="ripple" class="spinner-energized"></ion-spinner>'
        });
      });
      $rootScope.$on('hide:loading', function(event, args){
        $rootScope.log('hide:loading');
        setTimeout(function() {
          $ionicLoading.hide();
        }, 1000);
      });

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
        $rootScope.log("from "+fromState.name+" to "+toState.name);
      });
      
      $ionicPlatform.on('offline', function(){
        $rootScope.log("app offline");
      });

      $rootScope.init = function() {
        $rootScope.passcode = "";
        if (!$rootScope.$$phase) {
          $rootScope.$apply();
        }
      };
   
      $rootScope.add = function(value) {
        $rootScope.pinerror = "";
        if($rootScope.passcode.length < 4) {
          $rootScope.passcode = $rootScope.passcode + value;
          if($rootScope.passcode.length == 4) {
            $timeout(function() {
              $rootScope.log("PIN "+$rootScope.passcode);
              if ($rootScope.pintype == 3) {
                if ($rootScope.$storage.pincode == $rootScope.passcode) {
                  $rootScope.passcode = "";
                  $rootScope.closePin();
                } else {
                  $rootScope.pintry += 1;
                  $rootScope.pinerror = $filter('translate')('NOT_MATCH')+"("+$rootScope.pintry+")"; 
                  if ($rootScope.pintry>3) {
                    $rootScope.$storage.pincode = undefined;
                    $rootScope.pintry = 0;
                    $rootScope.$broadcast("pin:failed");
                    $rootScope.closePin();  
                  }
                }
              }
              if ($rootScope.pintype == 0) {
                $rootScope.log("type 0: set pin");
                if ($rootScope.$storage.pincode) {
                  $rootScope.pincheck = true;
                  $rootScope.$broadcast("pin:check");
                  $rootScope.closePin();
                } else {
                  $rootScope.$storage.pincode = $rootScope.passcode;  
                  $rootScope.pinsubtitle = $filter('translate')('CONFIRM_PIN');
                  $rootScope.passcode = "";
                  $rootScope.pintype = 3;
                  $rootScope.pintry = 0;
                }
              }
              if ($rootScope.pintype == 1) {
                $rootScope.log("type 1: check pin");                  
                if ($rootScope.$storage.pincode == $rootScope.passcode){
                  $rootScope.$broadcast('pin:correct');
                  $rootScope.passcode = "";
                  $rootScope.closePin();
                } else {
                  $rootScope.pintry += 1;
                  $rootScope.pinerror = $filter('translate')('INCORRECT')+"("+$rootScope.pintry+")"; 
                  if ($rootScope.pintry>3) {
                    $rootScope.$storage.$reset();
                    $rootScope.closePin();  
                  }
                }
              }
              
            }, 50);
          }
        }
      };
   
      $rootScope.delete = function() {
        $rootScope.pinerror = "";
        if($rootScope.passcode.length > 0) {
          $rootScope.passcode = $rootScope.passcode.substring(0, $rootScope.passcode.length - 1);
        }
      }

      $ionicModal.fromTemplateUrl('scripts/templates/pincode.html', {
        scope: $rootScope
      }).then(function(modal) {
        $rootScope.pinmodal = modal;
      });
      $rootScope.closePin = function() {
        $rootScope.pinmodal.hide();
        if ($rootScope.pinenabled) {
          if ($rootScope.$storage.notifData) {
            var alertPopup = $ionicPopup.confirm({
              title: $rootScope.$storage.notifData.title,
              template: $rootScope.$storage.notifData.body + $filter('translate')('OPENING_POST')
            });
            alertPopup.then(function(res) {
              $rootScope.log('Thank you for seeing alert from tray');
              if (res) {
                $rootScope.getContentAndOpen({author:$rootScope.$storage.notifData.author, permlink:$rootScope.$storage.notifData.permlink});  
                $rootScope.$storage.notifData = undefined;
              } else {
                $rootScope.log("not sure to open alert");
                $rootScope.$storage.notifData = undefined;
              }
              $rootScope.pinenabled = false;
            });    
          }
        }
      };
      $rootScope.openPin = function(type) {
        $rootScope.passcode = "";
        if (type == 0) {
          $rootScope.pintype = 0;
          $rootScope.pintitle = $filter('translate')('SET_PIN');
          $rootScope.pinsubtitle = $filter('translate')('SET_PIN');
        }
        if (type == 1) {
          $rootScope.pintype = 1;
          $rootScope.pintry = 0;
          $rootScope.pintitle = $filter('translate')('ENTER_PIN');
          $rootScope.pinsubtitle = $filter('translate')('ENTER_PIN');
        }
        $rootScope.pinmodal.show();
      };
      $rootScope.$on("pin:new", function(){
        $rootScope.pincheck = false;
        $rootScope.openPin(0);
      });
      $rootScope.$on("pin:check", function(){
        $rootScope.pincheck = true;
        $rootScope.openPin(1);
      });


      $ionicModal.fromTemplateUrl('scripts/templates/info.html', {
        scope: $rootScope
        //animation: "null"
      }).then(function(modal) {
        $rootScope.infomodal = modal;
      });
      $rootScope.openInfo = function(xx) {
        $rootScope.voters = xx;
        $rootScope.infomodal.show();
      };

      $rootScope.closeInfo = function() {
        $rootScope.infomodal.hide();
        //$rootScope.infomodal.remove();
      };

      String.prototype.replaceAt=function(index, character) {
          return this.substr(0, index) + character + this.substr(index+character.length);
      }

      $rootScope.getContentAndOpen = function(item) {
        
        window.Api.initPromise.then(function(response) {
          if (item.follower) {
            $state.go('app.profile', {username: item.follower});
          } else {
            window.Api.database_api().exec("get_content", [item.author, item.permlink]).then(function(result){  
              var _len = result.active_votes.length;
              for (var j = _len - 1; j >= 0; j--) {
                if (result.active_votes[j].voter === $rootScope.$storage.user.username) {
                  if (result.active_votes[j].percent > 0) {
                    result.upvoted = true;  
                  } else if (result.active_votes[j].percent < 0) {
                    result.downvoted = true;  
                  } else {
                    result.downvoted = false;  
                    result.upvoted = false;  
                  }
                }
              }
              result.json_metadata = angular.fromJson(result.json_metadata);
              $rootScope.$storage.sitem = result;
              setTimeout(function() {
                $state.go('app.single');  
              }, 5);

              if (!$rootScope.$$phase) {
                $rootScope.$apply();
              }
            });
          }
        });
        //$state.go('app.single');
        $rootScope.$broadcast('hide:loading');
      };

      $rootScope.reBlog = function(author, permlink) {
        var confirmPopup = $ionicPopup.confirm({
          title: $filter('translate')('ARE_YOU_SURE'),
          template: $filter('translate')('REBLOG_TEXT')
        });
        confirmPopup.then(function(res) {
          if(res) {
            $rootScope.log('You are sure');
            $rootScope.$broadcast('show:loading');
            if ($rootScope.$storage.user) {
                $rootScope.mylogin = new window.steemJS.Login();
                $rootScope.mylogin.setRoles(["posting"]);
                var loginSuccess = $rootScope.mylogin.checkKeys({
                    accountName: $rootScope.$storage.user.username,    
                    password: $rootScope.$storage.user.password || null,
                    auths: {
                        posting: $rootScope.$storage.user.posting.key_auths
                    },
                    privateKey: $rootScope.$storage.user.privatePostingKey || null
                  }
                );
                if (loginSuccess) {
                  var tr = new window.steemJS.TransactionBuilder();
                  var json;
                  
                  json = ["reblog",{account:$rootScope.$storage.user.username, author:author, permlink:permlink}];  

                  tr.add_type_operation("custom_json", {
                    id: 'follow',
                    required_posting_auths: [$rootScope.$storage.user.username],
                    json: JSON.stringify(json)
                  });
                  localStorage.error = 0;
                  tr.process_transaction($rootScope.mylogin, null, true);

                  setTimeout(function() {
                    if (localStorage.error == 1) {
                      $rootScope.showAlert($filter('translate')('ERROR'), $filter('translate')('REBLOG_TEXT')+" "+localStorage.errormessage)
                    } else {
                      //$scope.refreshFollowers();
                      $rootScope.showMessage($filter('translate')('SUCCESS'), $filter('translate')('REBLOGGED_POST'));
                    }
                    $rootScope.$broadcast('hide:loading');
                  }, 3000);
                } else {
                  $rootScope.showMessage($filter('translate')('ERROR'), $filter('translate')('LOGIN_FAIL'));
                }
              $rootScope.$broadcast('hide:loading');
            } else {
              $rootScope.$broadcast('hide:loading');
              $rootScope.showAlert($filter('translate')('WARNING'), $filter('translate')('LOGIN_TO_X'));
            }
          } else {
            $rootScope.log('You are not sure');
          }
        });
      };

      $rootScope.votePost = function(post, type, afterward) {
        post.invoting = true;
        var tt = 1;
        if (type === "upvote") {
          tt = 1;
        }
        if (type === "downvote") {
          tt = -1;
        }
        if (type === "unvote") {
          tt = 0;
        }
        $rootScope.log('voting '+tt);

        if ($rootScope.$storage.user) {
          window.Api.initPromise.then(function(response) {
            $rootScope.log("Api ready:" + angular.toJson(response));
            $rootScope.mylogin = new window.steemJS.Login();
            $rootScope.mylogin.setRoles(["posting"]);
            var loginSuccess = $rootScope.mylogin.checkKeys({
                accountName: $rootScope.$storage.user.username,    
                password: $rootScope.$storage.user.password || null,
                auths: {
                    posting: $rootScope.$storage.user.posting.key_auths
                },
                privateKey: $rootScope.$storage.user.privatePostingKey || null
              }
            );
            if (loginSuccess) {
              var tr = new window.steemJS.TransactionBuilder();
              tr.add_type_operation("vote", {
                  voter: $rootScope.$storage.user.username,
                  author: post.author,
                  permlink: post.permlink,
                  weight: $rootScope.$storage.voteWeight*tt || 10000*tt
              });
              localStorage.error = 0;
              tr.process_transaction($rootScope.mylogin, null, true);
              setTimeout(function() {
                post.invoting = false;
                if (localStorage.error == 1) {
                  $rootScope.showAlert($filter('translate')('ERROR'), $filter('translate')('BROADCAST_ERROR')+" "+localStorage.errormessage)
                } else {
                  if (afterward === 'fetchContent') {
                    $rootScope.$broadcast(afterward, { any: {author: post.author, permlink: post.permlink} });
                  } else {
                    $rootScope.$broadcast(afterward);    
                  }                
                }
                $rootScope.$broadcast('hide:loading');
              }, 3000);
            } else {
              $rootScope.showMessage($filter('translate')('ERROR'), $filter('translate')('LOGIN_FAIL'));
              $rootScope.$broadcast('hide:loading');
              post.invoting = false;
            }
            $rootScope.$broadcast('hide:loading');
            if (!$rootScope.$$phase) {
              $rootScope.$apply();
            }
          });
        } else {
          $rootScope.$broadcast('hide:loading');
          post.invoting = false;
          $rootScope.showAlert($filter('translate')('WARNING'), $filter('translate')('LOGIN_TO_X'));
        }
      };

      $rootScope.isWitnessVoted = function() {
        if ($rootScope.$storage.user && $rootScope.$storage.user.witness_votes.indexOf("good-karma")>-1) {
          return true;
        } else {
          return false;
        }
      };
      $rootScope.voteWitness = function() {
          var confirmPopup = $ionicPopup.confirm({
            title: $filter('translate')('ARE_YOU_SURE'),
            template: $filter('translate')('VOTE_FOR_WITNESS')+" @good-karma"
          });
          confirmPopup.then(function(res) {
            if(res) {
              $rootScope.log('You are sure');
              $rootScope.$broadcast('show:loading');
              if ($rootScope.$storage.user) {
                if ($rootScope.$storage.user.password || $rootScope.$storage.user.privateActiveKey) {
                  $rootScope.mylogin = new window.steemJS.Login();
                  $rootScope.mylogin.setRoles(["active"]);
                  var loginSuccess = $rootScope.mylogin.checkKeys({
                      accountName: $rootScope.$storage.user.username,    
                      password: $rootScope.$storage.user.password || null,
                      auths: {
                          active: $rootScope.$storage.user.active.key_auths
                      },
                      privateKey: $rootScope.$storage.user.privateActiveKey || null
                    }
                  );
                  if (loginSuccess) {
                    var tr = new window.steemJS.TransactionBuilder();
                    tr.add_type_operation("account_witness_vote", {
                        account: $rootScope.$storage.user.username,
                        approve: true,
                        witness: "good-karma"
                    });
                    localStorage.error = 0;

                    tr.process_transaction($rootScope.mylogin, null, true);

                    setTimeout(function() {
                      if (localStorage.error === 1) {
                        $rootScope.showAlert($filter('translate')('ERROR'), $filter('translate')('BROADCAST_ERROR')+" "+localStorage.errormessage)
                      } else {
                        //$scope.refreshFollowers();
                        $rootScope.showMessage($filter('translate')('SUCCESS'),$filter('translate')('VOTED_FOR_WITNESS')+' @good-karma');
                        $rootScope.$broadcast('refreshLocalUserData');
                      }
                    }, 3000);
                  } else {
                    $rootScope.showMessage($filter('translate')('ERROR'), $filter('translate')('LOGIN_FAIL'));
                  }
                } else {
                  $rootScope.showMessage($filter('translate')('ERROR'), $filter('translate')('LOGIN_FAIL'));
                }
                $rootScope.$broadcast('hide:loading');
              } else {
                $rootScope.$broadcast('hide:loading');
                $rootScope.showAlert($filter('translate')('WARNING'), $filter('translate')('LOGIN_TO_X'));
              }
            } else {
              $rootScope.log('You are not sure');
            }
          });
      };

      $rootScope.following = function(xx, mtype) {
        $rootScope.$broadcast('show:loading');
        $rootScope.log(xx);
        if ($rootScope.$storage.user) {
            $rootScope.mylogin = new window.steemJS.Login();
            $rootScope.mylogin.setRoles(["posting"]);
            var loginSuccess = $rootScope.mylogin.checkKeys({
                accountName: $rootScope.$storage.user.username,    
                password: $rootScope.$storage.user.password || null,
                auths: {
                    posting: $rootScope.$storage.user.posting.key_auths
                },
                privateKey: $rootScope.$storage.user.privatePostingKey || null
              }
            );
            if (loginSuccess) {
              var tr = new window.steemJS.TransactionBuilder();
              var json;
              if (mtype === "follow") {
                json = ['follow',{follower:$rootScope.$storage.user.username, following:xx, what: ["blog"]}];
              } else {
                json = ['follow',{follower:$rootScope.$storage.user.username, following:xx, what: []}];
              }
              
              tr.add_type_operation("custom_json", {
                id: 'follow',
                required_posting_auths: [$rootScope.$storage.user.username],
                json: angular.toJson(json)
              });
              localStorage.error = 0;
              tr.process_transaction($rootScope.mylogin, null, true);

              setTimeout(function() {
                if (localStorage.error == 1) {
                  $rootScope.showAlert($filter('translate')('ERROR'), $filter('translate')('BROADCAST_ERROR')+" "+localStorage.errormessage)
                } else {
                  //$scope.refreshFollowers();
                  $rootScope.$broadcast('current:reload');
                }
              }, 3000);
            } else {
              $rootScope.showMessage($filter('translate')('ERROR'), $filter('translate')('LOGIN_FAIL'));
            }
          $rootScope.$broadcast('hide:loading');
        } else {
          $rootScope.$broadcast('hide:loading');
          $rootScope.showAlert($filter('translate')('WARNING'), $filter('translate')('LOGIN_TO_X'));
        }
      };

      setTimeout(function() {
        window.Api.initPromise.then(function(response) {
          window.Api.database_api().exec("get_feed_history", []).then(function(r){
          //$rootScope.log(r);
            $rootScope.$storage.base = r.current_median_history.base.split(" ")[0];
            window.Api.database_api().exec("get_dynamic_global_properties", []).then(function(r){
              //$rootScope.log(r);
              $rootScope.$storage.steem_per_mvests = (Number(r.total_vesting_fund_steem.substring(0, r.total_vesting_fund_steem.length - 6)) / Number(r.total_vesting_shares.substring(0, r.total_vesting_shares.length - 6))) * 1e6;
            });
          });
        });
      }, 10);

    });
  });

}());