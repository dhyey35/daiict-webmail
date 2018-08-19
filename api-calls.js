/* To make a function or variable accessible to other scripts return it at the end */
var APICALLS = (function () {
    var mainUrl = 'https://webmail.daiict.ac.in/';
    var soapUrl = mainUrl + 'service/soap/';

    $.soap({
        url: soapUrl,
        appendMethodToURL: false,
        timeout: 30000, // 30 seconds
        error: function (soapResponse) {
            // show error
            console.log("Global Error Handler", soapResponse);
        }
    });

    var getSoapBody = function (data) {
        return data["#document"]["soap:Envelope"]["soap:Body"];
    }

    var getAuthToken = function (studentID, password, callback) {
        console.log("getAuthToken", studentID, password);
        var authXml = [
            '<?xml version="1.0" ?>',
            '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">',
            '<soap:Header>',
            '<context xmlns="urn:zimbra">',
            '<format type="xml"/>',
            '</context>',
            '</soap:Header>',
            '<soap:Body>',
            '<AuthRequest persistAuthTokenCookie="1" xmlns="urn:zimbraAccount">',
            '<account by="name">' + studentID + '</account>',
            '<password>' + password + '</password>',
            '</AuthRequest></soap:Body></soap:Envelope>',
        ];
        $.soap({
            data: authXml.join(''),
            success: function (soapResponse) {
                var res = soapResponse.toJSON();
                console.log("RES", res);
                var token = getSoapBody(res)["AuthResponse"]["authToken"];
                console.log("token", token);
                callback(null, token);
            },
            error: function (errorResponse) {
                console.log("Auth Err", errorResponse.toJSON());
                callback(true, errorResponse.toJSON());
            }
        })
    }

    var searchRequest = function (data, callback) {
        /* 
            data: {
                token: string,
                query: string,
                types: string,
                limit: string,
            }
        */
        if (!data.query) data.query = "is:unread";
        if (!data.types) data.types = "message";
        if (!data.limit) data.limit = "10";
        var xml = [
            '<?xml version="1.0" ?>',
            '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">',
            '<soap:Header>',
            '<context xmlns="urn:zimbra">',
            '<format type="xml"/>',
            '<authToken>' + data.token + '</authToken>',
            '</context>',
            '</soap:Header>',
            '<soap:Body>',
            '<SearchRequest xmlns="urn:zimbraMail" limit="' + data.limit + '" types="' + data.types + '">',
            '<query>' + data.query + '</query>',
            '</SearchRequest>',
            '</soap:Body>',
            '</soap:Envelope>',
        ];
        $.soap({
            data: xml.join(''),
            success: function (soapResponse) {
                var res = soapResponse.toJSON();
                console.log("searchReq res", res);
                var allItems = getSoapBody(res)["SearchResponse"];
                console.log("allItems", allItems);
                callback(null, allItems);
            },
            error: function (errorResponse) {
                console.log("searchReq Err", errorResponse.toJSON());
                callback(true, errorResponse.toJSON());
            }
        })
    }

    var itemAction = function (data, callback) {
        /* 
            data: {
                token: string,
                ids: string, ( comma seperated )
                op: string,
            }
        */
        var xml = [
            '<?xml version="1.0" ?>',
            '<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">',
            '<soap:Header>',
            '<context xmlns="urn:zimbra">',
            '<format type="xml"/>',
            '<authToken>' + data.token + '</authToken>',
            '</context>',
            '</soap:Header>',
            '<soap:Body>',
            '<ItemActionRequest xmlns="urn:zimbraMail">',
            '<action id="' + data.ids + '" op="' + data.op + '" />',
            '</ItemActionRequest>',
            '</soap:Body>',
            '</soap:Envelope>',
        ];
        $.soap({
            data: xml.join(''),
            success: function (soapResponse) {
                var res = soapResponse.toJSON();
                console.log("itemAction res", res);
                callback(null, true);
            },
            error: function (errorResponse) {
                console.log("itemAction Err", errorResponse.toJSON());
                callback(true, errorResponse.toJSON());
            }
        })
    }

    /* All the variables returned will be accessible by other scripts */
    return {
        getAuthToken: getAuthToken,
        searchRequest: searchRequest,
        itemAction: itemAction,
    }
})()