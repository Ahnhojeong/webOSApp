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
service.register('hello', function (message) {
  console.log('In hello callback');
  message.respond({
    returnValue: true,
    message: greeting,
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

// call toast
service.register('toast', (msg) => {
  console.log('hi');
  console.log(msg.payload);

  service.call(
    'luna://com.webos.notification/createToast',
    { message: msg.payload.msg },
    function (m2) {
      msg.respond({
        returnValue: true,
        Response: JSON.stringify(m2.payload),
      });
    },
  );
});