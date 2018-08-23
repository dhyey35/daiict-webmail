COMMON.loginUser(function(err, data) {
    if(err) {
        var message = "Seems like webmail is down. Please try again later !!";
        if(data) {
            if(data.code === 1 || data.code === 99) return; // student ID or password weren't there, or no internet
            message = "Login Failed. Please check ID and password and try logging in again !!";
        }
        // post message to popup to show error
        chrome.notifications.create(null, {
            type: 'basic',
            title: 'DAIICT Webmail',
            message: message,
            iconUrl: 'images/da-logo-128.png'
        });
    } else {
        setUnreadInBadge();
    }
});

function setUnreadInBadge() {
    COMMON.getUnreadEmails(function(err, data) {
        console.log("Unread emails", err, data);
        if(data && data.length) {
            var newEmails = data.length;
            chrome.storage.sync.get('lastNotification', function(storageData) {
                if(storageData.lastNotification) {
                    newEmails = 0;
                    data.map(function(msg) {
                        if(parseInt(msg.$.d) > storageData.lastNotification) {
                            newEmails++;
                        }
                    })
                }
                if(newEmails) {
                    chrome.notifications.create(null, {
                        type: 'basic',
                        title: 'DAIICT Webmail',
                        message: 'You have ' + newEmails + ' new ' + (newEmails > 1 ?'emails' : 'email'),
                        iconUrl: 'images/da-logo-128.png'
                    });
                }
                chrome.storage.sync.set({ lastNotification: Date.now() });
            });
        }
        // TODO: emit event so popup can show latest emails
        setTimeout(function() {
            setUnreadInBadge();
        }, 30000)
    });
}