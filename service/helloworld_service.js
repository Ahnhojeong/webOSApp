/* eslint-disable no-var */
/* eslint-disable import/no-unresolved */

// 필요 모듈 선언
var pkgInfo = require('./package.json');
var Service = require('webos-service');
var service = new Service(pkgInfo.name);
var greeting = 'Hello, World!';
const WebSocket = require('ws');

const logHeader = `[${pkgInfo.name}]`;
const port = 9000;
let wss = null;

// heartbeat 변수
let heartbeatSubscription = null;
let isMonitoring = false;

// Sample Test Code1 (임시)
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

// Sample Test Code2 (임시)
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

// 웹소켓 메시지 처리
function handleMessage(message) {
  console.log('handleMessage :: ', message);
}

// 웹소켓 서버 생성
function createWebSocketServer() {
  if (wss) {
    console.log(logHeader, 'WebSocket server already exists');
    return;
  }

  wss = new WebSocket.Server({ port: port });

  // 클라이언트 연결
  wss.on('connection', (ws) => {
    console.log(logHeader, 'New client connected');

    // 메시지 수신
    ws.on('message', handleMessage);

    // 에러 발생
    ws.on('error', (error) => {
      console.error(logHeader, 'WebSocket error:', error);
    });

    // 연결 종료
    ws.on('close', () => {
      console.log(logHeader, 'Client disconnected');
      clearInterval(ws.interval);
    });

    // 3초마다 클라이언트에게 메시지 전송
    ws.interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('서버에서 클라이언트로 메시지를 보냅니다.');
      }
    }, 3000);
  });

  console.log(logHeader, `WebSocket server is running on port ${port}`);
}

// 웹소켓 서버 닫기
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

// serviceOn 서비스 메서드 등록
service.register('serviceOn', (message) => {
  console.log(logHeader, 'serviceOn called');

  // 모니터링 중이 아니면 모니터링(heartbeat)과 웹소켓 서버 실행
  if (!isMonitoring) {
    startMonitoring();
    createWebSocketServer();

    message.respond({
      returnValue: true,
      Response: 'serviceOn service has been started.',
    });
  } else {
    message.respond({
      returnValue: false,
      Response: 'serviceOn service is already running.',
    });
  }
});

// serviceOff 서비스 메서드 등록
service.register('serviceOff', (message) => {
  console.log(logHeader, 'serviceOff called');

  // 모니터링 중이면 모니터링(heartbeat)과 웹소켓 서버 중지
  if (isMonitoring) {
    stopMonitoring();
    closeWebSocketServer();
    message.respond({
      returnValue: true,
      Response: 'Monitoring service and WebSocket server have been stopped.',
    });
  } else {
    message.respond({
      returnValue: false,
      Response: 'Monitoring service is not running.',
    });
  }
});

// 모니터링 시작
function startMonitoring() {
  if (heartbeatSubscription) {
    return;
  }

  console.log(logHeader, 'Starting monitoring service');
  isMonitoring = true;

  // heartbeat 서비스 구독
  heartbeatSubscription = service.subscribe(
    'luna://com.hojeong.app.service/heartbeat',
    { subscribe: true },
  );
  heartbeatSubscription.addListener('response', function (msg) {
    console.log(JSON.stringify(msg.payload));
  });
}

// 모니터링 중지
function stopMonitoring() {
  if (heartbeatSubscription) {
    console.log(logHeader, 'Stopping monitoring service');
    heartbeatSubscription.cancel();
    heartbeatSubscription = null;
    isMonitoring = false;
  }
}

// 구독 요청 처리를 위한 변수
const subscriptions = {};
let heartbeatinterval;
let x = 1;

// heartbeat 인터벌
function createHeartBeatInterval() {
  if (heartbeatinterval) {
    return;
  }
  console.log(logHeader, 'create_heartbeatinterval');
  heartbeatinterval = setInterval(function () {
    sendResponses();
  }, 1000);
}

// 모든 구독자에게 응답
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

// heartbeat 서비스 메서드 등록
var heartbeat = service.register('heartbeat');
heartbeat.on('request', function (message) {
  console.log('SERVICE_METHOD_CALLED:/heartbeat');
  console.log(logHeader, 'SERVICE_METHOD_CALLED:/heartbeat');
  message.respond({ event: 'beat' }); // 초기 응답
  if (message.isSubscription) {
    subscriptions[message.uniqueToken] = message; // 메시지를 "subscriptions"에 추가
    if (!heartbeatinterval) {
      createHeartBeatInterval();
    }
  }
});

// heartbeat 구독 취소 처리
heartbeat.on('cancel', function (message) {
  delete subscriptions[message.uniqueToken]; // 메시지를 "subscriptions"에서 제거
  var keys = Object.keys(subscriptions);
  if (keys.length === 0) {
    // count the remaining subscriptions
    console.log('no more subscriptions, canceling interval');
    clearInterval(heartbeatinterval);
    heartbeatinterval = undefined;
  }
});
