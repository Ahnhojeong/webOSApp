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

function createWebSocketServer() {
  if (wss) {
    console.log(logHeader, 'WebSocket server already exists');
    return;
  }

  wss = new WebSocketServer({ port: port });

  wss.on('connection', (ws) => {
    console.log(logHeader, 'New client connected');

    ws.on('message', handleMessage);

    // 에러 시
    ws.on('error', (error) => {
      console.error(logHeader, 'WebSocket error:', error);
    });

    // 연결 종료 시
    ws.on('close', () => {
      console.log(logHeader, 'Client disconnected');
      clearInterval(ws.interval);
    });

    ws.interval = setInterval(() => {
      // 3초 마다 클라이언트에게 메시지 전송
      if (ws.readyState === ws.OPEN) {
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
      }
    }, 3000);
  });

  console.log(logHeader, `WebSocket server is running on port ${port}`);
}

function closeWebSocketServer() {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });

    wss.close(() => {
      console.log(logHeader, 'WebSocket server closed');
      wss = null;
    });
  }
}

// ==== Websocket Server Open + Heartbeat ====
service.register('serviceOn', (message) => {
  console.log(logHeader, 'serviceOn called');
  createWebSocketServer();

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
  console.log(logHeader, 'serviceOff called');

  closeWebSocketServer();

  message.respond({
    returnValue: true,
    Response: 'serviceOff has been completed.',
  });
});
