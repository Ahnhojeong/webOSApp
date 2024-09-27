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
const logHeader = `[${pkgInfo.name}]`;
let wss = null;

function handleMessage(message) {
  // 메시지 로직 처리
  console.log('handleMessage :: ', message);
}

// ==== Websocket Server Open + Heartbeat ====
service.register('serviceOn', (message) => {
  console.log(logHeader, message);
  if (!wss) {
    wss = new WebSocketServer({
      port: port,
    });
  }

  wss.on('connection', (ws) => {
    ws.on('message', handleMessage);
    console.log('Someone has been connected', message);

    ws.on('error', (error) => {
      // 에러 시
      console.error(error);
    });
    ws.on('close', () => {
      // 연결 종료 시
      console.log('클라이언트 접속 해제');
      clearInterval(ws.interval);
    });

    ws.interval = setInterval(() => {
      // 3초마다 클라이언트로 메시지 전송
      if (ws.readyState === ws.OPEN) {
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
      }
    }, 3000);
  });

  // Toast Sample
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
  }, 500);

  message.respond({
    returnValue: true,
    Response: 'serviceOn has been started.',
  });
});

// ==== Websocket Server Close ====
service.register('serviceOff', (message) => {
  if (wss) {
    wss.close();
  }
  wss = null;

  message.respond({
    returnValue: true,
    Response: 'serviceOff.',
  });
});
