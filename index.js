'use strict';

const NodePath = require('path');
const express = require('express');
const proxy = require('./proxy');

module.exports = function configure(config) {
    const app = express();
    const topic = config && config.topic || 'hystrix:metrics';

    app.use('/hystrix.stream', function hystrixStreamResponse(request, response) {
        response.append('Content-Type', 'text/event-stream;charset=UTF-8');
        response.append('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        response.append('Pragma', 'no-cache');

        const listener = data => {
            if (typeof data !== 'string') {
                data = JSON.stringify(data);
            }
            response.write('data: ' + data + '\n\n');
        };

        process.on(topic, listener);

        const cleanAll = () => process.removeListener(topic, listener);

        request.once('close', cleanAll);
        request.once('aborted', cleanAll);
        response.once('close', cleanAll);
        response.once('finish', cleanAll);
    });

    app.use('/proxy.stream', proxy(config && config.proxy));

    app.use('/hystrix', express.static(NodePath.join(__dirname, './webapp')));

    return app;
};
