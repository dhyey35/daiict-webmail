COMMON.loginUser(function(err, data) {
    if(err) {
        var message = "Seems like webmail is down. Please try again later !!";
        if(data) {
            if(data.code === 1) return; // student ID or password weren't there
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
        console.log("Unread emails", data);
    });
    // TODO: emit event so popup can show latest emails
    setTimeout(function() {
        setUnreadInBadge();
    }, 30000)
}