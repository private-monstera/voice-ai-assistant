var express = require('express');
var axios = require('axios');
var moment = require('moment-timezone');
var router = express.Router();
var MicrosoftGraph = require('@microsoft/microsoft-graph-client/lib/src');
require('isomorphic-fetch');

/* GET /authorize. */
router.post('/', async function (req, res, next) {
    // Get auth code
    let token;
    const tokenAvailable = req.headers.authorization ||
        req.headers['x-access-token'];

    if (req.headers.authorization) {
        [, token] = req.headers.authorization.split(' ');
    } else {
        token = tokenAvailable;
    }

    if (token) {
        // const date = new Date();
        const timezone = req.body.timezone;

        const config = {
            headers: {Authorization: `Bearer ${token}`}
        };
        const date = moment.tz(timezone);
        const today = date.toISOString();
        const tomorrow = date.add(24, 'hours').toISOString();
        try {
            // Get Calendar event
            let response = await axios.get(`https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=${today}&endDateTime=${tomorrow}`, config)

            console.log("Calendar response: " + response.data);

            const eventResult = [];

            response.data.value.forEach((data, i) => {
                let index = '';
                const startTime = moment(data.start.dateTime).tz(timezone).format('hh:mm a')
                let timeprefix = '';
                let endTime = moment(data.end.dateTime).tz(timezone).format('hh:mm a')
                if (i === 0) {
                    index = "first"
                } else if (i === 1) {
                    index = 'second'
                } else if (i === 2) {
                    index = 'third'
                }
                if (moment(startTime, "MM-DD-YYYY").isSame(moment(), "day")) {
                    timeprefix = "today"
                } else {
                    timeprefix = "tomorrow";
                }
                const title = `${index} meeting ${timeprefix}, from ${startTime} to ${endTime}, at the location, ${data.location.displayName}, regarding, ${data.subject}.`;
                eventResult.push(title);
            });

            res.send({
                count: response.data.value.length,
                eventResult: eventResult.splice(0, 3)
            })

        } catch (error) {
            console.log(error, '----->')
        }

    } else {
        res.send({
            error: "No access token"
        })
    }
});

module.exports = router;