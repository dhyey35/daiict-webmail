var COMMON = (function () {
    var STATE = {
        isLoggedIn: false,
        token: null,
    }

    var loginUser = function (callback) {
        if(!isOnLine()) return callback(true, {
            code: 99 // code 99 is for no internet
        })
        chrome.storage.sync.get(['studentId', 'password'], function (data) {
            console.log("data", data);
            if (data.studentId && data.password) {
                APICALLS.getAuthToken(data.studentId, data.password, function (err, data) {
                    if (err) {
                        STATE.isLoggedIn = false;
                        STATE.token = null;
                        return callback(err, data);
                    }
                    STATE.isLoggedIn = true;
                    STATE.token = data;
                    chrome.storage.sync.set({ 'token': STATE.token }, function () {
                        callback(null, STATE.token);
                    });
                })
            } else {
                return callback(true, {
                    code: 1
                })
            }
        })
    }

    var getUnreadEmails = function(callback) {
        if(!isOnLine()) return callback(true, {
            code: 99 // code 99 is for no internet
        })
        getToken(function(err, token) {
            if(err) {
                return callback(err); // show user login page
            }
            APICALLS.searchRequest({
                token: token
            }, function(err, data) {
                if(err) return callback(err, null);
                chrome.browserAction.setBadgeText({
                    text: data.m ? data.m.length.toString() : '0'
                })
                chrome.storage.sync.set({
                    'unreadMsgs': data.m
                }, function() {
                    return callback(null, data.m);
                })
            })
        })
    }

    var deleteEmail = function(ids, callback) {
        if(!isOnLine()) return callback(true, {
            code: 99 // code 99 is for no internet
        })
        getToken(function(err, token) {
            if(err) {
                return callback(err);
            }
            APICALLS.itemAction({
                token: token,
                ids: ids,
                op: 'delete'
            }, function(err, done) {
                if(err) return callback(err, null);
                return callback(null, done);
            })
        })
    }

    var getStorageInfo = function(callback) {
        if(!isOnLine()) return callback(true, {
            code: 99 // code 99 is for no internet
        })
        getToken(function(err, token) {
            if(err) {
                return callback(err);
            }
            chrome.storage.sync.get(['studentId'], function(data) {
                if(!data.studentId) return callback(true, null);
                APICALLS.accountInfo({
                    token: token,
                    userid: data.studentId,
                }, function(err, done) {
                    if(err) return callback(err, null);
                    return callback(null, done);
                })
            });
        })
    }

    var getToken = function(callback) {
        if(STATE.token) return callback(null, STATE.token);
        chrome.storage.sync.get(['token'], function(data) {
            if(!data.token) {
                loginUser(function(err, data) {
                    return callback(err, data);
                })
            } else {
                // when browser was reopened, variable will be blank
                STATE.token = data.token;
                return callback(null, STATE.token);
            }
        })
    }

    var getState = function (key) {
        return STATE[key];
    }

    var isOnLine = function() {
        return window.navigator.onLine;
    }

    return {
        loginUser: loginUser,
        getState: getState,
        getUnreadEmails: getUnreadEmails,
        deleteEmail: deleteEmail,
        getStorageInfo: getStorageInfo,
    }
})();