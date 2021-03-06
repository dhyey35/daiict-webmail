
var BG = chrome.extension.getBackgroundPage();
var $ = BG.$, COMMON = BG.COMMON;

$(document).ready(function () {
    /* As we load jQuery in background scripts we need to find the element in document and cannot use $("#some-id") directly, we store all the elements
    in variables as find is expensive operation */
    var loginPage = $(document).find("#login-page");
    var emailPage = $(document).find("#email-page");
    var openWebmailLink = $(document).find(".webmail-link");
    var loginForm = $(document).find("#login-form");
    var studentIdField = $(document).find("#student-id");
    var passwordField = $(document).find("#password");
    var loginError = $(document).find("#login-error");
    var loginSubmitBtn = $(document).find("#login-submit-btn");
    var emailListContainer = $(document).find("#email-list");
    var emailListError = $(document).find("#email-list-error");
    var emailListEmpty = $(document).find("#email-list-empty");
    var internetError = $(document).find("#internet-error");
    var loginInternetError = $(document).find("#login-internet-error");
    var progressBar = $(document).find("#progress-bar");
    var progressBarContainer = $(document).find("#progress-bar-container");

    console.log("isLoggedIn", COMMON.getState('isLoggedIn'));
    if (!COMMON.getState('isLoggedIn')) {
        chrome.storage.sync.get(['studentId'], function (data) {
            if (data.studentId) {
                studentIdField.val(data.studentId);
            }
        });
        loginPage.removeClass("hidden");
    } else {
        emailPage.removeClass("hidden");
        showEmailList();
    }


    openWebmailLink.on('click', function () {
        /* Make webmail tab active if it is open, else open a new tab for webmail */
        chrome.tabs.query({
            url: 'https://webmail.daiict.ac.in/*'
        }, function (tabArr) {
            console.log("tabArr", tabArr);
            if (tabArr && tabArr[0]) {
                chrome.tabs.highlight({
                    windowId: tabArr[0].windowId,
                    tabs: tabArr[0].index
                })
            } else {
                chrome.tabs.create({
                    url: 'https://webmail.daiict.ac.in/'
                })
            }
        })
    })

    loginForm.on('submit', function (event) {
        event.preventDefault();

        loginInternetError.addClass("hidden");
        loginError.addClass("hidden");

        var studentId = studentIdField.val();
        var password = passwordField.val();
        loginSubmitBtn.attr("disabled", "disabled");
        console.log(studentId, password);
        chrome.storage.sync.set({
            studentId: studentId,
            password: password,
        }, function () {
            // data is stored, make api call
            COMMON.loginUser(function (err, data) {
                loginSubmitBtn.removeAttr("disabled");
                if (err) {
                    if (data && data.code === 99) {
                        return loginInternetError.removeClass("hidden");
                    }
                    return loginError.removeClass("hidden");
                }
                showEmailList();
                loginPage.addClass("hidden");
                emailPage.removeClass("hidden");
            })
        });
    });

    function showEmailList() {
        console.log("in showEmailList")
        emailListEmpty.addClass("hidden");
        emailListError.addClass("hidden");
        internetError.addClass("hidden");
        // TODO: show loading icon
        // TODO: do not call api every time, use data in storage
        // TODO: listen to event from background page
        COMMON.getUnreadEmails(function (err, data) {
            if (err) {
                if (data && data.code === 99) {
                    return internetError.removeClass("hidden");
                }
                return emailListError.removeClass("hidden");
            }
            emailListError.addClass("hidden");
            console.log("Popup Unread emails", data);
            emailListContainer.html('');
            if (data && data.length) {
                data.forEach(element => {
                    var emailFrom = element.e.$.p ? element.e.$.p : element.e.$.a;
                    var singleMail =
                        '<div class="single-mail">' +
                        '<span data-mail-id="' + element.$.id + '" class="mail-delete cursor-pointer"> Delete </span>' +
                        '<div class="mail-from" data-toggle="tooltip" data-placement="right" title="' + element.e.$.a + '">' + emailFrom + '</div>' +
                        '<div class="mail-subject">' + (element.su ? element.su : '') + '</div>' +
                        '<div class="mail-data">' + (element.fr ? element.fr : '') + '</div>' +
                        '</div>';
                    emailListContainer.append(singleMail);
                });
                var emailListDeleteBtns = $(document).find(".mail-delete");
                emailListDeleteBtns.on('click', function () {
                    var id = $(this).data("mail-id");
                    $(this).closest('.single-mail').remove();
                    COMMON.deleteEmail(id, function () {
                        showEmailList();
                    })
                });
            } else {
                emailListEmpty.removeClass("hidden");
            }
            COMMON.getStorageInfo(function(err, storageInfo) {
                if(err) return;
                // Convert bytes to megabytes
                var usedMb = parseInt(storageInfo.used) / ( 1024 * 1024 );
                var totalMb = parseInt(storageInfo.total) / ( 1024 * 1024 );
                var percentUsed = usedMb * 100 / totalMb;
                progressBar.css("width", parseInt(percentUsed) + "%");
                progressBarContainer.attr("title", "Used " + percentUsed.toFixed(1) + "% (" + usedMb.toFixed(1) + " MB of " + totalMb.toFixed(1) + " MB )");
                console.log("MBS", usedMb, totalMb);
            })
        })
    }
})