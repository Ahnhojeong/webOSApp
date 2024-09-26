/*
 * Copyright (c) 2024 LG Electronics Inc.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-var */
/* eslint-disable import/no-unresolved */
var pkgInfo = require('./package.json');
var Service = require('webos-service');
var service = new Service(pkgInfo.name);
var greeting = 'Hello, World!';

// a method that always returns the same value
var name = 'World';
service.register('hello', function (message) {
  console.log('In hello callback');
  if (message.payload && message.payload.name) {
    name = message.payload.name;
  }
  message.respond({
    returnValue: true,
    data: 'Hello, ' + name + '!',
  });
});

// set some state in the service
service.register('/config/setGreeting', function (message) {
  console.log('In setGreeting callback');
  if (message.payload.greeting) {
    greeting = message.payload.greeting;
  } else {
    message.respond({
      returnValue: false,
      errorText: "argument 'greeting' is required",
      errorCode: 1,
    });
  }
  message.respond({
    returnValue: true,
    greeting: greeting,
  });
});

// websocket
const WebSocketServer = require('ws').WebSocketServer;
const port = 9000;

function handleMessage() {
  console.log('handleMessage');
}

service.register('wsServerOn', function (message) {
  const wss = new WebSocketServer({
    port: port,
  });

  wss.on('connection', (ws) => {
    ws.addEventListener('message', handleMessage);
    console.log('Someone has been connected', message);
    ws.send('Hello');
  });

  // ==== heartbeat 구독
  const sub = service.subscribe(`luna://${pkgInfo.name}/heartbeat`, {
    subscribe: true,
  });
  const max = 120;
  let count = 0;
  sub.addListener('response', function (msg) {
    console.log(JSON.stringify(msg.payload));
    if (++count >= max) {
      sub.cancel();
      setTimeout(function () {
        console.log(max + ' responses received, exiting...');
        process.exit(0);
      }, 1000);
    }
  });

  message.respond({
    reply: 'websocket server open',
  });
});

// ==== Heartbeat Test ====
const logHeader = `[${pkgInfo.name}]`;

service.register('serviceOn', (message) => {
  console.log(logHeader, message);

  const max = 5;
  let i = 0;
  let interval = setInterval(() => {
    let url = 'luna://com.webos.notification/createToast';
    let params = {
      message: `Hello! +${i}`,
    };

    service.call(url, params, (m2) => {
      console.log(
        logHeader,
        'SERVICE_METHOD_CALLED:com.webos.notification/createToast',
      );
    });

    if (++i > max) {
      clearInterval(interval);
    }
  }, 3000);

  //heartbeat 구독
  const sub = service.subscribe('luna://com.hojeong.app.service/heartbeat', {
    subscribe: true,
  });
  const heartbeatMax = 120;
  let heartbeatCnt = 0;
  sub.addListener('response', function (msg) {
    console.log(JSON.stringify(msg.payload));
    if (++heartbeatCnt > heartbeatMax) {
      sub.cancel();
      setTimeout(function () {
        console.log(heartbeatMax + ' responses received, exiting...');
        process.exit(0);
      }, 1000);
    }
  });

  message.respond({
    returnValue: true,
    Response: 'My service has been started.',
  });
});

// handle subscription requests
const subscriptions = {};
let heartbeatinterval;

let x = 1;
function createHeartBeatInterval() {
  if (heartbeatinterval) {
    return;
  }
  console.log(logHeader, 'create_heartbeatinterval');
  heartbeatinterval = setInterval(function () {
    sendResponses();
  }, 1000);
}

// send responses to each subscribed client
function sendResponses() {
  console.log(logHeader, 'send_response');
  console.log(
    'Sending responses, subscription count=' +
      Object.keys(subscriptions).length,
  );
  for (const i in subscriptions) {
    if (Object.prototype.hasOwnProperty.call(subscriptions, i)) {
      const s = subscriptions[i];
      s.respond({
        returnValue: true,
        event: 'beat ' + x,
      });
    }
  }
  x++;
}

var heartbeat = service.register('heartbeat');
heartbeat.on('request', function (message) {
  console.log(logHeader, 'SERVICE_METHOD_CALLED:/heartbeat');
  message.respond({ event: 'beat' }); // initial response
  if (message.isSubscription) {
    subscriptions[message.uniqueToken] = message; //add message to "subscriptions"
    if (!heartbeatinterval) {
      createHeartBeatInterval();
    }
  }
});
heartbeat.on('cancel', function (message) {
  delete subscriptions[message.uniqueToken]; // remove message from "subscriptions"
  var keys = Object.keys(subscriptions);
  if (keys.length === 0) {
    // count the remaining subscriptions
    console.log('no more subscriptions, canceling interval');
    clearInterval(heartbeatinterval);
    heartbeatinterval = undefined;
  }
});
