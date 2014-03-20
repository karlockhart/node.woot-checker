var jsdom = require('jsdom');
var nodemailer = require('nodemailer');
var async = require('async');

var config = require('./config.json');

var hits = [];


var transport = nodemailer.createTransport("SMTP", {
    service: config.email.service,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

hits.length = 0;
process();

function process()
{
    if (config.sites.length > 0)
    {
        item = config.sites.pop();
        processSite(item, process);
    } else {

        if (hits.length > 0)
        {
            sendMail();
        }
    }

}

function processSite(item, callback) {

    jsdom.env({
        url: item,
        scripts: ["http://code.jquery.com/jquery.js"],
        done: function(errors, window) {
            $ = window.$;

            today = $('#todays-deal > #summary > .overview');
            title = today.find('h2').html();
            price = today.find('.price').html();

            config.keywords.forEach(function(keyword) {
                if (title.toLowerCase().indexOf(keyword.toLowerCase()) >= 0)
                {
                    console.log(title + ' - ' + price);
                    hits.push(item + ' - ' + title + ' - ' + price + "  matches keyword '" + keyword + "'");
                }
            });

            callback();

        }
    });
}

function sendMail()
{

    var text;

    hits.forEach(function(hit) {
        text = text + '\r\n' + hit;
    });

    var mailOptions = {
        from: config.email.from,
        to: config.email.to,
        subject: config.email.subject,
        text: text
    };

    transport.sendMail(mailOptions, function(error, response) {
        transport.close();
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + response.message);
        }
    });
}
