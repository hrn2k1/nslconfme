/* lib/mailee.js
 *
 * Reads unread mails from imap inbox defined in config.js.
 * Checks if sender is an user in SqERL and parses email
 * sender, subject, body and image attachment to new whatshot
 * item poster, title, body and image respectively. Mails
 * are then marked as read. This is currently run from app.js
 * peridiocally.
 */

var debug = false;
var markSeen = true;

var Imap = require('imap');
var MailParser = require('mailparser').MailParser;
var fs = require('fs');
var inspect = require('util').inspect;
var icalendar = require('icalendar');
//var sqerlConfig = require('../config/config.js');

var imap = new Imap({
    user: 'confme@ext.movial.com',
    password: 'aivohyiey0iePh',
    host: 'imap.gmail.com',
    port: 993,
    secure: true
});

//var db_ = null;
var isUser = {}
var urlRegExp = new RegExp('https?://[-!*\'();:@&=+$,/?#\\[\\]A-Za-z0-9_.~%]+');

var mpns = require('mpns');

var pushUri = "";

var http = require("http");
var url = require("url");

var PARSE_RES = { "fetch" : "empty", "fetchMessage" : "Cold start, fetching in progress..."};

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    if (uri === "/conf") {
        response.setHeader("content-type", "text/plain");
        response.write(JSON.stringify(PARSE_RES));
        response.end();
    } else {
        response.setHeader("content-type", "text/plain");
        response.end();
    }
}).listen(process.env.port || 8080);


function checkConfMe(uri) {
    pushUri = uri;
    checkMails();
}

function checkMails() {
    console.log('Connecting imap');
    imap.connect(function(err) {
        if (err) {
            PARSE_RES['fetchMessage'] = 'Unable to connect imap: ' + err;
            console.log(PARSE_RES['fetchMessage']);
            return;
        }
        
        console.log('Connected imap');
        
        imap.openBox('INBOX', false, function(err, mailbox) {
            if (err) {
                PARSE_RES['fetchMessage'] = 'Unable to open inbox: ' + err;
                console.log(PARSE_RES['fetchMessage']);
                imap.logout();
                return;
            }

            imap.search([ 'FLAGGED', ['SINCE', 'June 01, 2013'] ], function(err, results) {
                //console.log('err:'+err+' results:'+inspect(results, false, Infinity));
                
                if (err) {
                    PARSE_RES['fetchMessage'] = 'Cannot search inbox: ' + err;
                    console.log(PARSE_RES['fetchMessage']);
                    imap.logout();
                    return;
                }

                if ( !results || results.length <= 0 ) {
                    PARSE_RES['fetchMessage'] = 'No new mail';
                    console.log(PARSE_RES['fetchMessage']);
                    imap.logout();
                    return;
                }
                
                imap.fetch(results, { markSeen: markSeen }, { headers: { parse: false }, body: true, cb: fetchMailProcess}, fetchMailDone);
            });
        });
    });
}

function fetchMailProcess(fetch) {
    fetch.on('message', function(msg) {
        console.log('BEGIN SeqNo:'+msg.seqno);
        mailParser = new MailParser();

        mailParser.on('end', function(mail) {
            var out = parseMail(mail);
            if (!out)
                return;

            out['fetch'] = "success";
            PARSE_RES = out;
            sendPushNotification(out);
        });

        msg.on('data', function(data) {
            //console.log('data:'+data.toString('utf8'));
            mailParser.write(data.toString());
        });

        msg.on('end', function() {
            console.log('END SeqNo:'+msg.seqno);
            mailParser.end();
        });
    });

    fetch.on('error', function(error) {
        console.log(error);
    });
}

function fetchMailDone(err) {
    if (err) {
        console.log('Mail fetching failed:'+err);
    }
    
    console.log('Mail fetching completed');
    imap.logout();
}

function sendPushNotification(obj)
{
    console.log("sending push notification");
    mpns.sendTile(pushUri,
        {
            'title': (debug ? hours + ":" + minutes + ":" + seconds + " " : "" ) + obj['subject'],
            'backTitle': "Next Conference",
            'backBackgroundImage': "/Assets/Tiles/BackTileBackground.png",
            'backContent': obj['time'] + ", " + obj['date'],
        },
        function(){}
    );
}

function parseMail(mail)
{
    //console.log(inspect(mail, false, Infinity));

    var out = null;

    if (mail.attachments)
        out = parseAttachments(mail.attachments);

    if (!out)
        out = parseBody(mail);

    console.log(inspect(out));

    if (!out || !out['toll'] || !out['code'] || !out['subject'] )
        return null;

    //if (out['date'] && out['time'])
    //    out['date_time'] = new Date(out['date'] + ", " + out['time']);

    //console.log(JSON.stringify(out));

    var currentTime = new Date()
    var hours = currentTime.getHours()
    var minutes = currentTime.getMinutes()
    var seconds = currentTime.getSeconds()
    out['timestamp'] = currentTime;

    return out;
}

function parseBody(mail)
{
    //console.log(inspect(mail));
    var out = null;
    if (mail.text) {
        console.log('##### fallback to parsing text BODY ######');
        out = parseString(mail.text, ':', '\n', true, false);
    } else if (mail.html) {
        console.log('##### fallback to parsing html BODY ######');
        var text = mail.html.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>?|&nbsp;/gi, '');
        out = parseString(text, ':', '\n', true, false);
    } else {
        return null;
    }

    out["subject"] = mail.subject;
    return out;

    /*
    if ( mail.inReplyTo ) {
        // do not post replies, for example vacation notices
        return;
    }

    if ( mail.from ) {
        for ( var i=0; i<mail.from.length; i++ ) {
            var sender = mail.from[i].address.toLowerCase();
            if ( isUser[sender] ) {
                parseAttachments(mail);
                return;
            }
        }
    }

    if ( mail.replyTo ) {
        for ( var i=0; i<mail.replyTo.length; i++ ) {
            var sender = mail.replyTo[i].address.toLowerCase();
            if ( isUser[sender] ) {
                parseAttachments(mail);
                return;
            }
        }
    }

    if ( mail.headers && mail.headers.sender ) {
        var sender = mail.headers.sender.toLowerCase();
        if ( isUser[sender] ) {
            parseAttachments(mail);
            return;
        }
    }
    */

    //var sender = mail.headers && mail.headers.sender ? mail.headers.sender : 'nobody';
    //parseAttachments(mail);

    // X-Sender and other fields?
}

function parseAttachments(attachments)
{
    var out = {};

    for (var i = 0; i < attachments.length; i++) {
        var atch = attachments[i];
        console.log('##### parsing ATTACHMENT ' + i + ' ######');
        if (atch.contentType && atch.contentType.match(/calendar/) && atch.content) {
            var str_data = atch.content.toString('utf-8');

            var icalendar_res = icalendar.parse_calendar(str_data);

            //console.log(inspect(icalendar_res, false, Infinity));

            var res = {};
            while (!res['toll'] || !res['code']) {
                // case 1, phone and pin in LOCATION
                if (icalendar_res.events()[0].properties.LOCATION) {
                    var LOCATION = icalendar_res.events()[0].properties.LOCATION[0].value;
                    res = parseString(LOCATION, ':', '\\s*', false, true);
                    if (res['toll'] && res['code'])
                        break;
                }

                // case 2, search in DESCRIPTION
                if (icalendar_res.events()[0].properties.DESCRIPTION) {
                    var DESCRIPTION = icalendar_res.events()[0].properties.DESCRIPTION[0].value;
                    var res = parseString(DESCRIPTION, ':', '\\n', true, false);
                    if (res['toll'] && res['code'])
                        break;
                }

                break;
            }

            if (!res['toll'] || ! res['code'])
                return null;

            out['toll'] = res['toll'];
            out['code'] = res['code'];

            var date = new Date(icalendar_res.events()[0].properties.DTSTART[0].value);
            out['date_time'] = date.toString();
            var date_split = out['date_time'].split(" ");
            out['date'] = date_split.slice(0, 4).join(" ");
            out['time'] = date_split.slice(4).join(" ");;

            out['subject'] = icalendar_res.events()[0].properties.SUMMARY[0].value;

            return out;
        }
    }
}

function parseString(str, delimiter, endMarker, allowFuzzy, usePattern)
{
    var dict =
    [
        {
            keyword: 'toll', // TODO: rename to 'phone'
            alts: 'toll|bridge|dial-in',
            pattern: '[0-9\\-+]+',
            fuzzy: true,
        },
        {
            keyword: 'code', // TODO: rename to 'pin'
            alts: 'pin|code',
            pattern: '[0-9]+',
            fuzzy: true,
        },
        {
            keyword: 'password',
            alts: 'password',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'date',
            alts: 'date',
            pattern: '.+',
            fuzzy: false,
        },
        {
            keyword: 'time',
            alts: 'time',
            pattern: '.+',
            fuzzy: false,
        },
    ];

    var out = {};

    for (i = 0; i < dict.length; i++) {
        var re = new RegExp('\\b(?:' + dict[i].alts + ')\\b' +
                            (allowFuzzy && dict[i].fuzzy ? '.*' : '(?:\\s*)?') + delimiter +
                            '\\s*(' + (usePattern ? dict[i].pattern : '.+') + ')' + endMarker, 'i');
        var match = str.match(re);
        if (match && match.length > 0) {
            out[dict[i].keyword] = match[1];
        }
    }

    return out;
}

/*function addItem(senderEmail, senderName, imgPath, title, link, content) {
    //console.log('addItem email:'+senderEmail+' name:'+senderName+' title:'+title+' link:'+link);
    //console.log('imgPath: '+imgPath+' content: '+content);

    var newItem = {
        pubDate: new Date(),
        title: title,
        link: link,
        description: content,
        content: content,
        security: 3,
        submitterName: senderName,
        submitterEmail: senderEmail,
        tags: [ "PUBLIC" ],
        likeCount: 0 };

    if ( imgPath )
        newItem['image'] = imgPath;

    db_.conn.model('WhatsHot').create(newItem, function(err, savedItem) {
        if (err)
            console.log(err);
        else
            console.log('Added whatshot');
    });
}

function populateIsUser(cb) {
    isUser = {};
    db_.User.find().exec(function(err, userList) {
        if ( err ) {
            console.log(err);
            cb(err);
            return;
        }

        for ( var i=0; i<userList.length; i++ ) {
            var isUserData = {};
            isUserData['security'] = userList[i].security;
            isUserData['fullName'] = userList[i].firstName+' '+userList[i].lastName;
            isUser[userList[i].email] = isUserData;
        }

        cb(null);
    });
}
*/

exports.checkConfMe = checkConfMe;
