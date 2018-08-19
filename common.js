var COMMON = (function () {
    var STATE = {
        isLoggedIn: false,
        token: null,
    }

    var loginUser = function (callback) {
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
                    // get unread emails and storage status
                })
            } else {
                return callback(true, {
                    code: 1
                })
            }
        })
    }

    var getUnreadEmails = function(callback) {
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

    return {
        loginUser: loginUser,
        getState: getState,
        getUnreadEmails: getUnreadEmails,
        deleteEmail: deleteEmail,
    }
})();