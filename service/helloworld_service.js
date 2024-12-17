/* eslint-disable no-var */
/* eslint-disable import/no-unresolved */

// 필요 모듈 선언
const pkgInfo = require('./package.json');
const Service = require('webos-service');
const service = new Service(pkgInfo.name);
let greeting = 'Hello, World!';
const WebSocket = require('ws');
const http = require('http');
//const express = require('express');
//const path = require('path');

//const app = express();

const wsPort = 9000;
//const webglPort = 8000;

const logHeader = `[${pkgInfo.name}]`;

let wss = null;

// heartbeat 변수
let heartbeatSubscription = null;
let isMonitoring = false;

/*
// webgl
const webglPath = path.join(__dirname, './webgl'); // webgl 경로
app.use('/webgl', express.static(webglPath)); // 정적 파일 제공하기 위한 미들웨어

app.get('/front', (req, res) => {
  res.sendFile(path.join(webglPath, 'front/index.html'));
});

app.get('/trajectory', (req, res) => {
  res.sendFile(path.join(webglPath, 'trajectory/index.html'));
});

http.createServer(app).listen(webglPort, () => {
  console.log(`Server runiing ${webglPort}`);
});
*/

// Sample Test Code1 (임시)
let name = 'World';
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

  wss = new WebSocket.Server({ port: wsPort });

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

  console.log(logHeader, `WebSocket server is running on port ${wsPort}`);
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

    // 웹소켓 실행과 함께 udp도 실행되어야 함 - 기기 찾기
    startUdpClient();

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
const heartbeat = service.register('heartbeat');
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

// EYEMINI 정보 UDP Client로 받아오기(IP,Port,..)
const dgram = require('dgram');
let udpClientRunning = false;
let udpClient = null;
let udpMessage = '';
let udpMessageUpdated = null;
let eyeminiDevices = [];
let eyeminiDeviceIp = ''; // 가장 최근 찾은 기기의 ip주소 저장 - ip 주소 없이 tcp client 시작할 때 기본값
let eyeminiDeviceSerialNumber = ''; // 가장 최근 찾은 기기의 serialNumber 저장

service.register('udpClient/start', function (message) {
  startUdpClient();

  message.respond({
    returnValue: true,
    data: 'udpClient : Start',
  });
});

function startUdpClient() {
  if (udpClient != null) {
    // 이전 실행하고 있던 client 있을 경우 종료
    udpClient.close();
  }

  eyeminiDevices = [];
  eyeminiDeviceIp = '';
  eyeminiDeviceSerialNumber = '';

  startMonitoring(); // heartbeat

  udpClient = dgram.createSocket({ type: 'udp4', reuseAddr: true });

  // 바인드된 소켓으로 모든 IP에서 들어오는 패킷을 수신
  udpClient.bind(EyeMiniSdk.DiscoveryPort, '0.0.0.0', () => {
    console.log(
      `udpClient : Listening for UDP packets on port ${EyeMiniSdk.DiscoveryPort}`,
    );
    udpClientRunning = true;
  });
  // 데이터 수신 이벤트 핸들러
  udpClient.on('message', (message, rinfo) => {
    console.log(
      `udpClient : Received message from ${rinfo.address}:${rinfo.port} - ${message}`,
    );
    udpMessage = `${message}`;
    udpMessageUpdated = Date.now();

    // udpMessage에 EYEMINI 기기 정보 있을 경우 기기정보 저장

    try {
      var obj = JSON.parse(udpMessage);
      var eyemini = obj.device;
      eyemini.updated = Date.now();

      if (eyemini.serialNumber !== undefined) {
        // 배열에서 같은 serialNumber를 가진 객체의 인덱스 찾기
        const existingIndex = eyeminiDevices.findIndex(
          (device) => device.serialNumber === eyemini.serialNumber,
        );

        if (existingIndex !== -1) {
          // 같은 serialNumber 있을 경우 해당 객체의 값을 갱신
          eyeminiDevices[existingIndex] = eyemini;
        } else {
          // 같은 ipaddr이 없으면 배열에 새 객체를 push
          eyeminiDevices.push(eyemini);
        }

        // 가장 최근 찾은 기기의 ip주소 저장
        eyeminiDeviceIp = eyemini.networkInfo.ipaddr;
        eyeminiDeviceSerialNumber = eyemini.serialNumber;
      }
    } catch (e) {
      console.log(e.message);
    }
  });
  // 에러 처리
  udpClient.on('error', (err) => {
    console.log(`udpClient : Socket error:\n${err.stack}`);
    if (udpClient) {
      udpClient.close();
    }
    udpClient = null;
    udpClientRunning = false;
  });
}

service.register('udpClient/getMessage', function (message) {
  if (udpClient == null || udpClientRunning === false) {
    message.respond({
      returnValue: false,
      data: 'udpClient : invalid',
    });
  } else {
    message.respond({
      returnValue: true,
      data: udpMessage,
      updated: udpMessageUpdated,
    });
  }
});

service.register('udpClient/devices', function (message) {
  if (udpClient == null || udpClientRunning === false) {
    message.respond({
      returnValue: false,
      data: 'udpClient : invalid',
    });
  } else {
    // eyeminiDevices 배열에서 updated가 10초 이전인 항목들을 제거
    const tenSecondsAgo = Date.now() - 10000;
    eyeminiDevices = eyeminiDevices.filter(
      (device) => device.updated >= tenSecondsAgo,
    );

    message.respond({
      returnValue: true,
      data: JSON.stringify(eyeminiDevices),
    });
  }
});

service.register('udpClient/stop', function (message) {
  if (udpClient != null) {
    udpClient.close();
  }
  udpClient = null;
  udpClientRunning = false;

  message.respond({
    returnValue: true,
    data: 'udpClient : stop',
  });
});

// TCP client 동작
const net = require('net');
const crypto = require('crypto');
const { Buffer } = require('buffer');
const {
  EyeMiniSdk,
  RequestPacket,
  RequestHeader,
  RequestParamCR2Init,
  crCrc32,
  EncryptedData0,
} = require('./EyeMiniSdk');

let tcpClientRequest = null;
let tcpClientNotify = null;
const tcpClientAckCheckPeriod = 500; // 요청에 대한 ack packet 수신했는지 확인하는 주기 (ms)
const tcpClientAckCheckTimeout = 3000; // 요청에 대한 ack packet 수신 실패 기준 (ms)

service.register('tcpClient/start', function (message) {
  if (tcpClientRequest != null || tcpClientNotify != null) {
    // 이전 실행하고 있던 client 있을 경우 종료
    tcpClientRequest.clearClient();
    tcpClientNotify.clearClient();
  }

  startMonitoring(); // heartbeat

  var ip = '';
  if (message.payload && message.payload.ip) {
    ip = message.payload.ip;
  }
  if (ip === '' && eyeminiDevices.length > 0 && eyeminiDeviceIp !== '') {
    ip = eyeminiDeviceIp;
  }
  if (ip === '') {
    message.respond({
      returnValue: false,
      data: 'tcpClient : Start fail',
    });
  }

  const existingIndex = eyeminiDevices.findIndex(
    (device) => device.networkInfo.ipaddr === ip,
  );
  if (existingIndex >= 0) {
    deviceConnectionSerialNumber = eyeminiDevices[existingIndex].serialNumber;
  }

  tcpClientRequest = new TcpClient('request');
  tcpClientRequest.createClient(ip, EyeMiniSdk.RequestAckPort);
  tcpClientNotify = new TcpClient('notify');
  tcpClientNotify.createClient(ip, EyeMiniSdk.NotifyPort);

  message.respond({
    returnValue: true,
    data: 'tcpClient : Start',
  });
});

service.register('tcpClient/status', function (message) {
  var result = {};
  result.ip = tcpClientRequest.ip;

  if (tcpClientRequest == null) {
    result.requestRunning = false;
  } else {
    result.requestRunning = tcpClientRequest.isRunning;
  }
  if (tcpClientNotify == null) {
    result.notifyRunning = false;
  } else {
    result.notifyRunning = tcpClientNotify.isRunning;
  }

  message.respond({
    returnValue: true,
    data: JSON.stringify(result),
  });
});

service.register('tcpClient/stop', function (message) {
  tcpClientRequest.clearClient();
  tcpClientNotify.clearClient();

  message.respond({
    returnValue: true,
    data: 'tcpClient : stop',
  });
});

service.register('tcpClient/sendPacketInit', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketCr2Init();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketSetWifilist', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketCr2CmdSetWifilist();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketGetWifi', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketCr2CmdGetWifi();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);
    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketGetWifilist', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketCr2CmdGetWifilist();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);
    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketSetWifi', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const messagePayload = message.payload;
    const encryption = messagePayload.encryption || 'on';
    const ssid = messagePayload.ssid || '';
    const password = messagePayload.password || '';
    const type = messagePayload.type || 1;

    if (ssid.trim() === '') {
      message.respond({
        returnValue: false,
        data: 'empty ssid ' + JSON.stringify(messagePayload),
      });
      return;
    }

    const packet = createPacketCr2CmdSetWifi(encryption, ssid, password, type);
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);
    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketCalcTrajectoryFile', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const ballspeedX10 = message.payload.ballspeedX10 || 0;
    const clubspeed_BX10 = message.payload.clubspeed_BX10 || 0;
    const clubspeed_AX10 = message.payload.clubspeed_AX10 || 0;
    const clubpathX10 = message.payload.clubpathX10 || 0;
    const clubfaceangleX10 = message.payload.clubfaceangleX10 || 0;
    const sidespin = message.payload.sidespin || 0;
    const backspin = message.payload.backspin || 0;
    const azimuthX10 = message.payload.azimuthX10 || 0;
    const inclineX10 = message.payload.inclineX10 || 0;

    const packet = createPacketCr2CmdCalcTrajectoryFile(
      ballspeedX10,
      clubspeed_BX10,
      clubspeed_AX10,
      clubpathX10,
      clubfaceangleX10,
      sidespin,
      backspin,
      azimuthX10,
      inclineX10,
    );
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClient/sendPacketSetUnit', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const unitDistance = message.payload.unitDistance || 0;
    const unitSpeed = message.payload.unitSpeed || 0;

    if (unitDistance === 0 || unitSpeed === 0) {
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : invalid payload',
      });
      return;
    }
    userUnitDistance = unitDistance;
    userUnitSpeed = unitSpeed;

    if (userUnitDistance < EyeMiniSdk.CR2UNIT_DISTANCE_YARD) {
      userUnitDistance = EyeMiniSdk.CR2UNIT_DISTANCE_YARD;
    } else if (userUnitDistance > EyeMiniSdk.CR2UNIT_DISTANCE_METER) {
      userUnitDistance = EyeMiniSdk.CR2UNIT_DISTANCE_METER;
    }
    if (userUnitSpeed < EyeMiniSdk.CR2UNIT_SPEED_MPH) {
      userUnitSpeed = EyeMiniSdk.CR2UNIT_SPEED_MPH;
    } else if (userUnitSpeed > EyeMiniSdk.CR2UNIT_SPEED_YDS) {
      userUnitSpeed = EyeMiniSdk.CR2UNIT_SPEED_YDS;
    }

    const packet = createPacketSetUnit(userUnitDistance, userUnitSpeed);
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, tcpClientAckCheckPeriod);

    // 타임아웃 설정
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, tcpClientAckCheckTimeout);
  }
});

service.register('tcpClient/sendPacketSetRightLeft', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const rightLeft = message.payload.rightLeft || 0;

    userRightLeft = rightLeft;

    if (userRightLeft < 0) {
      userRightLeft = 0;
    } else if (userRightLeft > 1) {
      userRightLeft = 1;
    }

    const packet = createPacketSetRightLeft(userRightLeft);
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, tcpClientAckCheckPeriod);

    // 타임아웃 설정
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, tcpClientAckCheckTimeout);
  }
});

service.register('tcpClient/sendPacketUseClub', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const club = message.payload.club || 0;

    if (club === 0) {
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : invalid payload',
      });
      return;
    }
    userClub = club;

    if (userClub < 1) {
      userClub = 1;
    }

    const packet = createPacketUseClub(userClub);
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, tcpClientAckCheckPeriod);

    // 타임아웃 설정
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, tcpClientAckCheckTimeout);
  }
});

service.register('tcpClient/sendPacketAreaAllow', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const allowTee = message.payload.allowTee || 0;
    const allowIron = message.payload.allowIron || 0;
    const allowPutter = message.payload.allowPutter || 0;

    userAllowTee = allowTee;
    userAllowIron = allowIron;
    userAllowPutter = allowPutter;

    const packet = createPacketAreaAllow(
      userAllowTee,
      userAllowIron,
      userAllowPutter,
    );
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, tcpClientAckCheckPeriod);

    // 타임아웃 설정
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, tcpClientAckCheckTimeout);
  }
});

service.register('tcpClient/sendPacketGetDeviceInfo', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketCr2CmdGetDeviceInfo();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);
    // 응답 대기
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);
        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, tcpClientAckCheckPeriod);

    // 타임아웃
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, tcpClientAckCheckTimeout);
  }
});

service.register('tcpClient/getNotifyPacket', function (message) {
  if (tcpClientNotify == null || tcpClientNotify.isRunning === false) {
    message.respond({
      returnValue: false,
      errorText: 'tcpClientNotify : invalid',
    });
  } else {
    if (tcpClientNotify.receivedPackets.length < 1) {
      message.respond({
        returnValue: false,
        errorText: 'tcpClientNotify : empty',
      });
    } else {
      var packet = tcpClientNotify.receivedPackets.shift();
      message.respond({
        returnValue: true,
        data: JSON.stringify(packet),
      });
    }
  }
});

service.register('tcpClient/sendPacketActCode', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacketGetActCode();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    let checkInterval = setInterval(() => {
      const ackPacket = tcpClientRequest.receivedPackets.find(
        (p) => p.header.ack_id === req_id,
      );
      if (ackPacket) {
        clearInterval(checkInterval);
        clearTimeout(timeoutHandle);

        /*
        var res = DecryptionData(ackPacket.param);
        ackPacket.actCodeResult = res;
        */

        message.respond({
          returnValue: true,
          data: JSON.stringify(ackPacket),
        });
      }
    }, 500);

    // 타임아웃 설정 (3초 후)
    let timeoutHandle = setTimeout(() => {
      clearInterval(checkInterval);
      message.respond({
        returnValue: false,
        data: 'tcpClientRequest : timeout',
      });
    }, 3000);
  }
});

service.register('tcpClientRequest/getLog', function (message) {
  var log = '';
  if (tcpClientRequest != null) {
    log = tcpClientRequest.getLog();
  }
  message.respond({
    returnValue: true,
    data: log,
  });
});
service.register('tcpClientNotify/getLog', function (message) {
  var log = '';
  if (tcpClientNotify != null) {
    log = tcpClientNotify.getLog();
  }
  message.respond({
    returnValue: true,
    data: log,
  });
});

let messageGetSensorStatus = null;
let intervalGetSensorStatus = null;
service.register('tcpClient/startGetSensorStatus', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    messageGetSensorStatus = message;

    startGetSensorStatus();

    message.respond({
      returnValue: true,
      data: 'tcpClient : startGetSensorStatus',
    });
  }
});

function startGetSensorStatus() {
  // 일정 주기로 센서 상태 확인 명령 전송
  if (intervalGetSensorStatus == null) {
    intervalGetSensorStatus = setInterval(function () {
      if (tcpClientRequest != null && tcpClientRequest.isRunning === true) {
        {
          const param = null;
          const header = new RequestHeader(
            EyeMiniSdk.JSON_EVENT_CR2CMD,
            EyeMiniSdk.CR2CMD_SENSORSTATUS,
            0,
          );
          const packet = new RequestPacket(header, param);
          tcpClientRequest.sendPacket(packet);
        }
        {
          const param = null;
          const header = new RequestHeader(
            EyeMiniSdk.JSON_EVENT_CR2CMD,
            EyeMiniSdk.CR2CMD_BALLPOSITION,
            0,
          );
          const packet = new RequestPacket(header, param);
          tcpClientRequest.sendPacket(packet);
        }
      }
    }, 1000);
  }
}

service.register('tcpClient/stopGetSensorStatus', function (message) {
  clearInterval(intervalGetSensorStatus);

  messageGetSensorStatus = null;
  intervalGetSensorStatus = null;

  message.respond({
    returnValue: true,
    data: 'tcpClient : stopGetSensorStatus',
  });
});

class TcpClient {
  constructor(name) {
    this.tcpClient = null;
    this.stream = null;
    this.senStringBuilder = '';
    this.tcpLog = '';
    this.port = '';
    this.name = name;
    this.ip = '';
    this.isRunning = false;
    this.receivedPackets = [];
    this.logMsgCnt = 0;
    this.lastRecived = null;
  }
  logMessage(message) {
    if (this.logMsgCnt >= 30) {
      this.logMsgCnt = 0;
      this.tcpLog = '';
    }

    this.tcpLog += message + '\n';
    this.logMsgCnt++;
  }
  getLog() {
    return this.tcpLog;
  }
  createClient(ipAddress, port) {
    this.ip = ipAddress;
    this.tcpClient = new net.Socket();
    this.isRunning = false;

    this.tcpClient.connect(port, ipAddress, () => {
      this.logMessage('Connected to server at ' + ipAddress + ':' + port);
      this.stream = this.tcpClient;
      this.beginReceive(); // 연결 완료 후 데이터 수신 시작
      this.isRunning = true;
    });

    this.tcpClient.on('error', (err) => {
      this.logMessage('Socket error: ' + err.message);
    });
  }

  sendPacket(packet) {
    try {
      if (!this.tcpClient || !this.stream) {
        this.logMessage('Packet sent : (!this.tcpClient || !this.stream)');
        return;
      }
      if (packet.header.event_id === EyeMiniSdk.JSON_EVENT_ERROR) {
        this.logMessage(
          'Packet sent : (packet.Header.EventId === EyeMiniSdk.JSON_EVENT_ERROR)',
        );
        return;
      }
      // 남아있는 string 초기화
      this.senStringBuilder = '';

      if (packet.header.command !== EyeMiniSdk.CR2CMD_SECURE_GET_ACT_CODE) {
        // 패킷을 문자열로 변환
        this.senStringBuilder = JSON.stringify(packet);
        let length = Buffer.byteLength(this.senStringBuilder, 'utf8');
        let packetLength = Buffer.alloc(4); // 4바이트 크기 버퍼

        packetLength.writeUInt32BE(length, 0);

        let packetArray = Buffer.from(this.senStringBuilder, 'utf8');
        let packetMessage = Buffer.concat([
          EyeMiniSdk.MAGIC_NUMBER,
          packetLength,
          packetArray,
        ]);

        this.stream.write(packetMessage, () => {
          //this.logMessage('Packet sent : ' + this.senStringBuilder);
        });
      } else {
        let payload = '[' + packet.param.encryptedData0.payload.join(',') + ']';
        packet.param.encryptedData0.payload = JSON.parse(payload);
        let convertJsonString = JSON.stringify(packet);

        let packetLength = Buffer.alloc(4);
        packetLength.writeUInt32BE(convertJsonString.length, 0);

        let packetArray = Buffer.from(convertJsonString, 'utf8');
        let packetMessage = Buffer.concat([
          EyeMiniSdk.MAGIC_NUMBER,
          packetLength,
          packetArray,
        ]);

        this.stream.write(packetMessage, () => {
          //this.logMessage('Security Packet sent ' + convertJsonString);
        });
      }
    } catch (e) {
      this.logMessage('Error: ' + e.message);
    }
  }

  clearClient() {
    if (this.tcpClient) {
      this.tcpClient.destroy(); // 소켓 연결 종료
      this.tcpClient = null;
    }
    this.logMessage('Client cleared');
    this.isRunning = false;
    this.receivedPackets = [];
  }

  beginReceive() {
    if (this.tcpClient && this.stream) {
      this.tcpClient.on('data', (data) => {
        //this.logMessage('Data received: ' + data.toString());
        this.lastRecived = Date.now();

        if (this.receivedPackets.length > 20) {
          this.receivedPackets.splice(0, this.receivedPackets.length - 20);
        }

        var resultJson = this.extractJson(data);
        if (resultJson != null) {
          resultJson.tcp_client_received = Date.now();
          if (this.name === 'request') {
            if (
              resultJson.header.command === EyeMiniSdk.CR2CMD_SENSORSTATUS ||
              resultJson.header.command === EyeMiniSdk.CR2CMD_BALLPOSITION
            ) {
              // 센서 상태 확인 응답일 경우
              if (wss) {
                wss.clients.forEach((client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    try {
                      client.send(JSON.stringify(resultJson));
                    } catch (error) {
                      this.logMessage(
                        'Failed to send message to client:' + error,
                      );
                    }
                  }
                });
              }
              /*
              // subscribe 사용 방식
              if(messageGetSensorStatus!=null){
                messageGetSensorStatus.respond({
                  returnValue: true,
                  data: JSON.stringify(resultJson),
                });
              }
              */
            } else {
              // 기타 명령에 대한 응답일 경우
              this.receivedPackets.push(resultJson);
            }
          } else if (this.name === 'notify') {
            // unitDistance, unitSpeed 변경인 경우, 사용자 설정값과 다르면 재설정
            if (
              resultJson.header.command === EyeMiniSdk.NOTIFYCMD_STATECHANGED
            ) {
              if (
                userUnitDistance !== resultJson.param.statedata.unitDistance ||
                userUnitSpeed !== resultJson.param.statedata.unitSpeed
              ) {
                const packet = createPacketSetUnit(
                  userUnitDistance,
                  userUnitSpeed,
                );
                tcpClientRequest.sendPacket(packet);
              } else if (
                userRightLeft !== resultJson.param.statedata.rightleft
              ) {
                const packet = createPacketSetRightLeft(userRightLeft);
                tcpClientRequest.sendPacket(packet);
              } else if (userClub !== resultJson.param.statedata.clubtype) {
                const packet = createPacketUseClub(userClub);
                tcpClientRequest.sendPacket(packet);
              } else if (
                userAllowTee !== resultJson.param.statedata.allowTee ||
                userAllowIron !== resultJson.param.statedata.allowIron ||
                userAllowPutter !== resultJson.param.statedata.allowPutter
              ) {
                const packet = createPacketAreaAllow(
                  userAllowTee,
                  userAllowIron,
                  userAllowPutter,
                );
                tcpClientRequest.sendPacket(packet);
              }
            }

            // goodshot 이벤트인 경우 샷 데이터 traj 요청
            // if (resultJson.header.command === EyeMiniSdk.NOTIFYCMD_GOODSHOT) {
            //   serviceLogMessage('NOTIFYCMD_GOODSHOT');
            //   if (
            //     tcpClientRequest == null ||
            //     tcpClientRequest.isRunning === false
            //   ) {
            //     serviceLogMessage(
            //       'NOTIFYCMD_GOODSHOT - tcpClientRequest not running',
            //     );
            //   } else {
            //     const shotData = resultJson.param.shotdataEX1;
            //     const ballspeedX10 =
            //       Math.round(shotData.ballspeedx1000 / 100) || 0;
            //     const clubspeed_BX10 =
            //       Math.round(shotData.clubspeedX1000 / 100) || 0;
            //     const clubspeed_AX10 =
            //       Math.round(shotData.clubspeedX1000 / 100) || 0;
            //     const clubpathX10 =
            //       Math.round(shotData.clubpathX1000 / 100) || 0;
            //     const clubfaceangleX10 =
            //       Math.round(shotData.faceangleX1000 / 100) || 0;
            //     const sidespin = Math.round(shotData.sidespinX1000 / 1000) || 0;
            //     const backspin = Math.round(shotData.backspinX1000 / 1000) || 0;
            //     const azimuthX10 = Math.round(shotData.azimuthX1000 / 100) || 0;
            //     const inclineX10 = Math.round(shotData.inclineX1000 / 100) || 0;

            //     const packet = createPacketCr2CmdCalcTrajectoryFile(
            //       ballspeedX10,
            //       clubspeed_BX10,
            //       clubspeed_AX10,
            //       clubpathX10,
            //       clubfaceangleX10,
            //       sidespin,
            //       backspin,
            //       azimuthX10,
            //       inclineX10,
            //     );
            //     const req_id = packet.header.req_id;
            //     tcpClientRequest.sendPacket(packet);

            //     // 응답 대기
            //     let checkInterval = setInterval(() => {
            //       const ackPacket = tcpClientRequest.receivedPackets.find(
            //         (p) => p.header.ack_id === req_id,
            //       );
            //       if (ackPacket) {
            //         clearInterval(checkInterval);
            //         clearTimeout(timeoutHandle);
            //         wsSendMessage(JSON.stringify(ackPacket));
            //         if (ackPacket.header.status === 0) {
            //           const traj_file_path = ackPacket.param.traj_file_path;
            //           getTrajFromPath(traj_file_path);
            //         }
            //       }
            //     }, tcpClientAckCheckPeriod);

            //     // 타임아웃 설정
            //     let timeoutHandle = setTimeout(() => {
            //       clearInterval(checkInterval);
            //       serviceLogMessage(
            //         'tcpClientRequest : timeout - CR2CMD_CALC_TRAJECTORY_FILE',
            //       );
            //     }, tcpClientAckCheckTimeout);
            //   }
            // }

            wsSendMessage(JSON.stringify(resultJson));
            this.receivedPackets.push(resultJson);
          }
        }
      });

      this.tcpClient.on('close', () => {
        this.logMessage('Connection closed by server');
        this.clearClient(); // 서버에서 연결이 닫힐 경우 처리
      });
    }
  }

  /*
  // 데이터 수신 완료 후 처리
  onCompletedReceive(data) {
    //this.logMessage('onCompletedReceive '+ data.toString());

    var resultJson = this.extractJson(data);
    if(resultJson==null) return;

    this.logMessage('status : '+resultJson.header.status);
    this.logMessage('answer : '+resultJson.header.answer);
    this.logMessage('command : '+resultJson.header.command);
    this.logMessage('ack_id : '+resultJson.header.ack_id);
    
  }
*/

  // 데이터 수신 완료 후 처리
  extractJson(data) {
    //this.logMessage('extractJson : '+ data.toString());

    const jsonStart = data.toString().indexOf('{');
    if (jsonStart === -1) {
      console.error('Error: JSON object not found in the string.');
      return null;
    }

    const jsonString = data.toString().substring(jsonStart);
    //this.logMessage('jsonString : ' + jsonString);

    // 추출된 문자열을 JSON으로 파싱
    try {
      const parsedJson = JSON.parse(jsonString);
      return parsedJson;
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }
}

function createPacketCr2Init() {
  const param = new RequestParamCR2Init(
    EyeMiniSdk.JSON_EVENT_CR2INIT,
    0,
    0,
    0,
    0,
    0,
  );
  const header = new RequestHeader(EyeMiniSdk.JSON_EVENT_CR2INIT, 0, 0);
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketSetUnit(unitDistance, unitSpeed) {
  const param = { unitDistance: unitDistance, unitSpeed: unitSpeed };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_SETUNIT,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}

function createPacketSetRightLeft(rightLeft) {
  const param = { rightLeft: rightLeft };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_SETRIGHTLEFT,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketUseClub(club) {
  const param = { club: club };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_USECLUB,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketAreaAllow(allowTee, allowIron, allowPutter) {
  const param = {
    allowTee: allowTee,
    allowIron: allowIron,
    allowPutter: allowPutter,
  };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_AREAALLOW,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}

function createPacketCr2CmdSetWifilist() {
  const param = null;
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_SET_WIFILIST,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketCr2CmdGetWifi() {
  const param = null;
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_GET_WIFI,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketCr2CmdGetWifilist() {
  const param = null;
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_GET_WIFILIST,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}

function createPacketCr2CmdSetWifi(encryption, ssid, password, type) {
  const param = {
    configuration: {
      encryption: encryption, //"on", // Maximum string size is 4 byte
      ssid: ssid, // "shin_5G", // Maximum string size is 32 byte
      password: password, // "ht_01071697404", // Maximum string size is 256 byte
      type: type, //1 // Maximum size is 1 byte
      /*
      encryption wireless secure mode(password) which is either "on" or "off".
      type
      Set the type to 1(normal) : Normal Wi-Fi networks are scanned.
      Set the type to 2(hidden) : Hidden Wi-Fi networks are not scanned, only known to the user.
      Set the type to 3(reconnect mode) : Attempting to reconnect to Wi-Fi.
      */
    },
  };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_SET_WIFI,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}

function createPacketCr2CmdCalcTrajectoryFile(
  ballspeedX10,
  clubspeed_BX10,
  clubspeed_AX10,
  clubpathX10,
  clubfaceangleX10,
  sidespin,
  backspin,
  azimuthX10,
  inclineX10,
) {
  const param = {
    shotdata: {
      ballspeedX10: ballspeedX10,
      clubspeed_BX10: clubspeed_BX10,
      clubspeed_AX10: clubspeed_AX10,
      clubpathX10: clubpathX10,
      clubfaceangleX10: clubfaceangleX10,
      sidespin: sidespin,
      backspin: backspin,
      azimuthX10: azimuthX10,
      inclineX10: inclineX10,
    },
  };
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_CALC_TRAJECTORY_FILE,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}
function createPacketCr2CmdGetDeviceInfo() {
  const param = null;
  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_GET_DEVICE_INFO,
    0,
  );
  const packet = new RequestPacket(header, param);
  return packet;
}

// CreatePacket_GetActCode 함수 정의
function createPacketGetActCode() {
  const param = new EncryptedData0();
  param.encryptedData0 = GetActCodeParam();

  if (param.encryptedData0.crc === 0) {
    tcpClientRequest.logMessage(
      "param.encryptedData0.Crc : can't create encrypted data",
    );
    return;
  }
  const size = param.encryptedData0.payload_length + 4 + 4; // sizeof(uint)는 4바이트로 간주

  const header = new RequestHeader(
    EyeMiniSdk.JSON_EVENT_CR2CMD,
    EyeMiniSdk.CR2CMD_SECURE_GET_ACT_CODE,
    size,
  );

  const packet = new RequestPacket(header, param);

  //tcpClientRequest.logMessage(JSON.stringify(packet));

  //_sendPacketQueue.enqueue(packet);
  return packet;
}

function GetActCodeParam() {
  try {
    // Encryption key and IV (16 bytes each)
    const Compk2 = Buffer.from([
      0x47, 0x11, 0x05, 0x8e, 0x4c, 0x72, 0x62, 0x84, 0x33, 0x14, 0x55, 0x33,
      0x9a, 0x02, 0x11, 0x25,
    ]);
    const iv2 = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);

    // Create clientInfoBuffer of 64 bytes
    const clientInfoBuffer = Buffer.alloc(64);

    // Client_Code: byte[32]
    for (let i = 0; i < 32; i++) {
      clientInfoBuffer[i] = i;
    }

    // Account_String: char[17], set to 0
    for (let i = 0; i < 17; i++) {
      clientInfoBuffer[33 + i] = 0;
    }

    // Reserved: byte[10], set to 0
    for (let i = 0; i < 10; i++) {
      clientInfoBuffer[50 + i] = 0;
    }

    // Crc: uint32, set to 0 initially
    clientInfoBuffer.writeUInt32LE(0, 60);
    clientInfoBuffer[49] = EyeMiniSdk.CLIENT_DEV_TYPE_TABLET;

    // Calculate CRC32 over clientInfoBuffer excluding Crc field
    const crc = crCrc32(0, clientInfoBuffer.slice(0, 60), 60) >>> 0;
    // Update Crc field
    clientInfoBuffer.writeUInt32LE(crc, 60);

    // Encrypt clientInfoBuffer using AES-128-CBC
    const cipher = crypto.createCipheriv('aes-128-cbc', Compk2, iv2);

    cipher.setAutoPadding(false);

    let encrypted = cipher.update(clientInfoBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Create EncryptedData buffer
    const payloadLength = encrypted.length;
    const encryptedDataBuffer = Buffer.alloc(8 + payloadLength);

    // Set Payload_Length
    encryptedDataBuffer.writeUInt32LE(payloadLength, 0);

    // Set Crc to 0 for now
    encryptedDataBuffer.writeUInt32LE(0, 4);

    // Copy encrypted payload
    encrypted.copy(encryptedDataBuffer, 8);

    // Calculate CRC over EncryptedData excluding Crc field
    const crcEncrypted = crCrc32(
      0,
      Buffer.concat([
        encryptedDataBuffer.slice(0, 4), // Payload_Length
        encryptedDataBuffer.slice(8), // Payload
      ]),
      4 + payloadLength,
    );

    // Update Crc field
    encryptedDataBuffer.writeUInt32LE(crcEncrypted, 4);

    // Return EncryptedData object
    return {
      payload_length: payloadLength,
      payload: encrypted,
      crc: crcEncrypted,
    };
  } catch (e) {
    tcpClientRequest.logMessage('GetActCodeParam Error - ' + e.message);
    return {
      crc: 0,
      payload: Buffer.alloc(64),
      payload_length: 0,
    };
  }
}

function DecryptionData(data) {
  try {
    // Encryption key and IV (16 bytes each)
    const Compk2 = Buffer.from([
      0x47, 0x11, 0x05, 0x8e, 0x4c, 0x72, 0x62, 0x84, 0x33, 0x14, 0x55, 0x33,
      0x9a, 0x02, 0x11, 0x25,
    ]);
    const iv2 = Buffer.from([
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00,
    ]);

    // Create AES decipher
    const decipher = crypto.createDecipheriv('aes-128-cbc', Compk2, iv2);
    decipher.setAutoPadding(false);

    // Decrypt the payload
    var payloadData = Buffer.from(data.encryptedData0.payload);
    let decrypted = decipher.update(payloadData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    // The ActCode structure has a size of 48 bytes
    const ActCodeSize = 48;

    if (decrypted.length === ActCodeSize) {
      // Parse the ActCode structure from the decrypted data
      const actCode = parseActCode(decrypted);

      // Master Bit Check (Act_Code[31], bit 7)
      const MasterValue = actCode.Act_Code[31];
      const MasterRet = (MasterValue & (1 << 7)) !== 0;

      // Uneekor Bit Check (Act_Code[16], bit 0)
      const UneekorValue = actCode.Act_Code[16];
      const UneekorRet = (UneekorValue & (1 << 0)) !== 0;

      // Creatz Bit Check (Act_Code[17], bit 0)
      const CreateValue = actCode.Act_Code[17];
      const CreatzRet = (CreateValue & (1 << 0)) !== 0;

      //wsSendMessage(`EYE MINI ACT CODE 1 = [${UneekorRet}]`);
      //wsSendMessage(`EYE MINI ACT CODE 2 = [${CreatzRet}]`);

      if (UneekorRet || CreatzRet) {
        return true;
      }

      // Invalid License
      // Uneekor false -> Contact Uneekor
      // Creatz false -> Contact Creatz
      return false;
    }

    return false;
  } catch (e) {
    wsSendMessage(e.message);
    return false;
  }
}

// Helper function to parse ActCode from decrypted bytes
function parseActCode(buffer) {
  // Initialize offset
  let offset = 0;

  // Read Success (int, 4 bytes)
  const Success = buffer.readInt32LE(offset);
  offset += 4;

  // Read Act_Code (byte[32])
  const Act_Code = buffer.slice(offset, offset + 32);
  offset += 32;

  // Read Reserved (byte[8])
  const Reserved = buffer.slice(offset, offset + 8);
  offset += 8;

  // Read Crc (uint32, 4 bytes)
  const Crc = buffer.readUInt32LE(offset);
  offset += 4;

  // Return the ActCode object
  return {
    Success,
    Act_Code,
    Reserved,
    Crc,
  };
}

// 기기 연결 과정 일괄 service 구현 - deviceConnection
let deviceConnectionCurrentDevice = null; // 현재 연결된 eyemini 기기 정보
let deviceConnectionRunning = false; // 중복 연결 시도 막음
let deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED; // 현재 연결 상태
let deviceConnectionStateTryCnt = 0; // 연결 상태 확인 시도 횟수 - 일정 수 이상일 경우 timeout, 무한으로 연결 시도하는 경우 방지
let deviceConnectionSerialNumber = ''; // 연결 대상 eyemini serial number - ip 주소는 경우에 따라 바뀔 수 있음
let deviceConnectionInterval = null; // 주기적으로 연결 상태 확인 - 단계에 따라 STATE 전환 수행
let deviceConnectionConnctedTime = null; // 연결 성공 시각
let userUnitDistance = EyeMiniSdk.CR2UNIT_DISTANCE_METER;
let userUnitSpeed = EyeMiniSdk.CR2UNIT_SPEED_MS;
let userRightLeft = 0; // 우타 = 0, 좌타 = 1
let userClub = 1;
let userAllowTee = 0;
let userAllowIron = 0;
let userAllowPutter = 1;

service.register('device/connect', function (message) {
  // 연결 대상 serialNumber
  var serialNumber = '';
  if (message.payload && message.payload.serialNumber) {
    serialNumber = message.payload.serialNumber;
  }
  if (
    serialNumber === '' &&
    eyeminiDevices.length > 0 &&
    eyeminiDeviceSerialNumber !== ''
  ) {
    serialNumber = eyeminiDeviceSerialNumber;
  }
  if (serialNumber === '') {
    message.respond({
      returnValue: false,
      data: 'invalid serialNumber',
    });
    return;
  }
  deviceConnectionSerialNumber = serialNumber;

  if (message.payload && message.payload.unitDistance) {
    userUnitDistance = message.payload.unitDistance;
  }
  if (message.payload && message.payload.unitSpeed) {
    userUnitSpeed = message.payload.unitSpeed;
  }
  if (userUnitDistance < EyeMiniSdk.CR2UNIT_DISTANCE_YARD) {
    userUnitDistance = EyeMiniSdk.CR2UNIT_DISTANCE_YARD;
  } else if (userUnitDistance > EyeMiniSdk.CR2UNIT_DISTANCE_METER) {
    userUnitDistance = EyeMiniSdk.CR2UNIT_DISTANCE_METER;
  }
  if (userUnitSpeed < EyeMiniSdk.CR2UNIT_SPEED_MPH) {
    userUnitSpeed = EyeMiniSdk.CR2UNIT_SPEED_MPH;
  } else if (userUnitSpeed > EyeMiniSdk.CR2UNIT_SPEED_YDS) {
    userUnitSpeed = EyeMiniSdk.CR2UNIT_SPEED_YDS;
  }

  if (message.payload) {
    if ('rightLeft' in message.payload) {
      userRightLeft = message.payload.rightLeft;
    }
    if ('club' in message.payload) {
      userClub = message.payload.club;
    }
    if ('allowTee' in message.payload) {
      userAllowTee = message.payload.allowTee;
    }
    if ('allowIron' in message.payload) {
      userAllowIron = message.payload.allowIron;
    }
    if ('allowPutter' in message.payload) {
      userAllowPutter = message.payload.allowPutter;
    }
  }

  // 이미 연결 시도중인 경우 중지
  if (deviceConnectionRunning) {
    message.respond({
      returnValue: false,
      data: 'deviceConnectionRunning',
    });
    return;
  }
  deviceConnectionRunning = true;
  if (deviceConnectionInterval != null) {
    clearInterval(deviceConnectionInterval);
  }

  if (!udpClientRunning) {
    // udpClient 실행중이 아닌 경우 실행
    startUdpClient();
  }
  deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_UDP_SEARCHING;
  deviceConnectionStateTryCnt = 0;

  deviceConnectionInterval = setInterval(function () {
    checkDeviceConnection();
  }, 500);

  message.respond({
    returnValue: true,
    data: 'device/connect : Start',
  });
});

function checkDeviceConnection() {
  switch (deviceConnectionState) {
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_UDP_SEARCHING:
      // 연결 시도하는 기기 udp packet 찾기

      const existingIndex = eyeminiDevices.findIndex(
        (device) => device.serialNumber === deviceConnectionSerialNumber,
      );

      if (existingIndex !== -1) {
        // 기기 찾은 경우
        deviceConnectionCurrentDevice = eyeminiDevices[existingIndex];

        // tcp client 시작

        if (tcpClientRequest != null || tcpClientNotify != null) {
          // 이전 실행하고 있던 client 있을 경우 종료
          tcpClientRequest.clearClient();
          tcpClientNotify.clearClient();
        }

        var ip = deviceConnectionCurrentDevice.networkInfo.ipaddr;

        tcpClientRequest = new TcpClient('request');
        tcpClientRequest.createClient(ip, EyeMiniSdk.RequestAckPort);
        tcpClientNotify = new TcpClient('notify');
        tcpClientNotify.createClient(ip, EyeMiniSdk.NotifyPort);

        deviceConnectionStateTryCnt = 0;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_START;
      } else {
        // 찾지 못한 경우
        deviceConnectionStateTryCnt++;

        // timeout
        if (deviceConnectionStateTryCnt > 10) {
          wsSendMessage(
            JSON.stringify({
              device_connection: false,
              message: 'device_not_found',
            }),
          );
          deviceConnectionRunning = false;
          deviceConnectionState =
            EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
        }
      }

      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_START:
      if (
        tcpClientRequest != null &&
        tcpClientNotify != null &&
        tcpClientRequest.isRunning &&
        tcpClientNotify.isRunning
      ) {
        // tcp init 전송
        const packet = createPacketCr2Init();
        const req_id = packet.header.req_id;
        tcpClientRequest.sendPacket(packet);

        deviceConnectionState =
          EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_INIT_WAIT;
        deviceConnectionStateTryCnt = 0;

        // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
        let checkInterval = setInterval(() => {
          const ackPacket = tcpClientRequest.receivedPackets.find(
            (p) => p.header.ack_id === req_id,
          );
          if (ackPacket) {
            clearInterval(checkInterval);

            /*
            // 수신 성공
            deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_INIT_SUCCESS;
            deviceConnectionStateTryCnt = 0;
            */

            // ACT CODE 확인 과정 생략 - 항상 성공
            deviceConnectionState =
              EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_SUCCESS;
            deviceConnectionStateTryCnt = 0;
          }

          if (
            deviceConnectionState !==
            EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_INIT_WAIT
          ) {
            clearInterval(checkInterval);
          }
        }, 500);
      } else {
        deviceConnectionStateTryCnt++;
        // timeout
        if (deviceConnectionStateTryCnt > 10) {
          wsSendMessage(
            JSON.stringify({
              device_connection: false,
              message: 'tcp_client_cannot_start',
            }),
          );
          deviceConnectionRunning = false;
          deviceConnectionState =
            EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
        }
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_INIT_WAIT:
      deviceConnectionStateTryCnt++;
      // timeout
      if (deviceConnectionStateTryCnt > 10) {
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'tcp_client_cannot_init',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_INIT_SUCCESS:
      if (
        tcpClientRequest != null &&
        tcpClientNotify != null &&
        tcpClientRequest.isRunning &&
        tcpClientNotify.isRunning
      ) {
        // tcp get act code 전송
        const packet = createPacketGetActCode();
        const req_id = packet.header.req_id;
        tcpClientRequest.sendPacket(packet);

        deviceConnectionState =
          EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_WAIT;
        deviceConnectionStateTryCnt = 0;

        // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
        let checkInterval = setInterval(() => {
          const ackPacket = tcpClientRequest.receivedPackets.find(
            (p) => p.header.ack_id === req_id,
          );
          if (ackPacket) {
            clearInterval(checkInterval);
            var res = DecryptionData(ackPacket.param);
            if (res) {
              // ACT CODE 확인 완료
              deviceConnectionState =
                EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_SUCCESS;
              deviceConnectionStateTryCnt = 0;
            }
          }

          if (
            deviceConnectionState !==
            EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_WAIT
          ) {
            clearInterval(checkInterval);
          }
        }, 500);
      } else {
        deviceConnectionStateTryCnt++;
        // timeout
        if (deviceConnectionStateTryCnt > 10) {
          wsSendMessage(
            JSON.stringify({
              device_connection: false,
              message: 'tcp_client_cannot_send_act_code',
            }),
          );
          deviceConnectionRunning = false;
          deviceConnectionState =
            EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
        }
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_WAIT:
      deviceConnectionStateTryCnt++;
      // timeout
      if (deviceConnectionStateTryCnt > 10) {
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'tcp_client_cannot_get_act_code',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_ACT_CODE_SUCCESS:
      if (
        tcpClientRequest != null &&
        tcpClientNotify != null &&
        tcpClientRequest.isRunning &&
        tcpClientNotify.isRunning
      ) {
        // tcp get set unit 전송
        const packet = createPacketSetUnit(userUnitDistance, userUnitSpeed);
        const req_id = packet.header.req_id;
        tcpClientRequest.sendPacket(packet);

        deviceConnectionState =
          EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_SET_UNIT_WAIT;
        deviceConnectionStateTryCnt = 0;

        // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
        let checkInterval = setInterval(() => {
          const ackPacket = tcpClientRequest.receivedPackets.find(
            (p) => p.header.ack_id === req_id,
          );
          if (ackPacket) {
            clearInterval(checkInterval);

            // 연결 성공
            wsSendMessage(
              JSON.stringify({
                device_connection: true,
                message: 'set_unit_success',
              }),
            );
            deviceConnectionRunning = false;
            deviceConnectionStateTryCnt = 0;
            deviceConnectionState =
              EyeMiniSdk.DEVICE_CONNECTION_STATE_CONNECTED;
            deviceConnectionConnctedTime = Date.now();
            startGetSensorStatus();
          }
          if (
            deviceConnectionState !==
            EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_SET_UNIT_WAIT
          ) {
            clearInterval(checkInterval);
          }
        }, 500);
      } else {
        deviceConnectionStateTryCnt++;
        // timeout
        if (deviceConnectionStateTryCnt > 10) {
          wsSendMessage(
            JSON.stringify({
              device_connection: false,
              message: 'tcp_client_cannot_set_unit',
            }),
          );
          deviceConnectionRunning = false;
          deviceConnectionState =
            EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
        }
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_TCP_SET_UNIT_WAIT:
      deviceConnectionStateTryCnt++;
      // timeout
      if (deviceConnectionStateTryCnt > 10) {
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'tcp_client_cannot_set_unit',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      }
      break;
    case EyeMiniSdk.DEVICE_CONNECTION_STATE_CONNECTED:
      // 기기 연결 이상 확인 - tcp 이상, udp 이상, notify 수신 불가
      if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
        // tcp client 연결 이상인 경우
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'tcp_client_request_disconncted',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      } else if (
        tcpClientNotify == null ||
        tcpClientNotify.isRunning === false
      ) {
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'tcp_client_notify_disconncted',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      } else if (udpClient == null || udpClientRunning === false) {
        // udp client 연결 이상
        wsSendMessage(
          JSON.stringify({
            device_connection: false,
            message: 'udp_client_disconncted',
          }),
        );
        deviceConnectionRunning = false;
        deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
      }

      // udp 기기 찾기 실패한 경우
      if (
        deviceConnectionState === EyeMiniSdk.DEVICE_CONNECTION_STATE_CONNECTED
      ) {
        // eyeminiDevices 배열에서 updated가 10초 이전인 항목들을 제거
        const tenSecondsAgo = Date.now() - 10000;
        eyeminiDevices = eyeminiDevices.filter(
          (device) => device.updated >= tenSecondsAgo,
        );

        const existingIndex = eyeminiDevices.findIndex(
          (device) => device.serialNumber === deviceConnectionSerialNumber,
        );
        if (existingIndex === -1) {
          wsSendMessage(
            JSON.stringify({
              device_connection: false,
              message: 'udp_packet_not_found',
            }),
          );
          deviceConnectionRunning = false;
          deviceConnectionState =
            EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
        }
      }

      // 센서 상태 수신이 일정 시간 이상 이뤄지지 않은 경우 - 5초(임의로 정함)
      if (
        deviceConnectionState === EyeMiniSdk.DEVICE_CONNECTION_STATE_CONNECTED
      ) {
        if (tcpClientRequest.lastRecived == null) {
          if (Date.now() - deviceConnectionConnctedTime > 5000) {
            wsSendMessage(
              JSON.stringify({
                device_connection: false,
                message: 'sensor_status_not_received',
              }),
            );
            deviceConnectionRunning = false;
            deviceConnectionState =
              EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
          }
        } else {
          if (Date.now() - tcpClientRequest.lastRecived > 5000) {
            wsSendMessage(
              JSON.stringify({
                device_connection: false,
                message: 'sensor_status_not_received',
              }),
            );
            deviceConnectionRunning = false;
            deviceConnectionState =
              EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
          }
        }
      }

      break;

    default:
  }

  wsSendMessage(
    JSON.stringify({ device_connection_state: deviceConnectionState }),
  );
}

service.register('device/disconnect', function (message) {
  // 연결 시도중인 경우 - 연결 해제할 수 없음
  if (deviceConnectionRunning) {
    message.respond({
      returnValue: false,
      data: 'deviceConnectionRunning',
    });
    return;
  }

  if (deviceConnectionInterval != null) {
    clearInterval(deviceConnectionInterval);
    deviceConnectionInterval = null;
  }
  if (intervalGetSensorStatus != null) {
    clearInterval(intervalGetSensorStatus);
    intervalGetSensorStatus = null;
  }

  deviceConnectionState = EyeMiniSdk.DEVICE_CONNECTION_STATE_DISCONNECTED;
  deviceConnectionStateTryCnt = 0;
  eyeminiDevices = [];

  message.respond({
    returnValue: true,
    data: 'device/disconnect success',
  });
});

function getTrajFromPath(traj_file_path) {
  const url =
    'http://' +
    deviceConnectionCurrentDevice.networkInfo.ipaddr +
    '/' +
    traj_file_path;
  serviceLogMessage(url);
  http
    .get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        var jsonData = JSON.parse(data);
        jsonData.http_from = EyeMiniSdk.CR2CMD_CALC_TRAJECTORY_FILE;
        jsonData.http_url = url;
        wsSendMessage(JSON.stringify(jsonData));
      });
    })
    .on('error', (err) => {
      serviceLogMessage(err);
    });
}

function serviceLogMessage(msg) {
  wsSendMessage(JSON.stringify({ service_log_message: msg }));
}
function wsSendMessage(msg) {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(msg);
        } catch (error) {
          console.log('Failed to send message to client:' + error);
        }
      }
    });
  }
}

let deviceSetWifiRunning = false; // set wifi 중복 시도 막음
let deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_READY;
let deviceSetWifiStateTryCnt = 0;
let deviceSetWifiInterval = null;

let deviceSetWifiEncryption = 'on';
let deviceSetWifiSsid = '';
let deviceSetWifiPassword = '';
let deviceSetWifiType = 1;

service.register('device/setWifi', function (message) {
  var encryption = 'on';
  var ssid = '';
  var password = '';
  var type = 1;
  if (message.payload) {
    if ('encryption' in message.payload) {
      encryption = message.payload.encryption;
    }
    if ('ssid' in message.payload) {
      ssid = message.payload.ssid;
    }
    if ('password' in message.payload) {
      password = message.payload.password;
    }
    if ('type' in message.payload) {
      type = message.payload.type;
    }
  }
  if (ssid === '') {
    message.respond({
      returnValue: false,
      data: 'invalid ssid',
    });
    return;
  }

  deviceSetWifiEncryption = encryption;
  deviceSetWifiSsid = ssid;
  deviceSetWifiPassword = password;
  deviceSetWifiType = type;

  /*
  // 기기 연결상태인지 확인
  if(deviceConnectionState !== EyeMiniSdk.DEVICE_CONNECTION_STATE_CONNECTED){
    message.respond({
      returnValue: false,
      data: 'deviceNotConnected',
    });
    return;
  }
  */

  // 이미 SetWifi 시도중인 경우 중지
  if (deviceSetWifiRunning) {
    message.respond({
      returnValue: false,
      data: 'deviceSetWifiRunning',
    });
    return;
  }

  deviceSetWifiRunning = true;
  if (deviceSetWifiInterval != null) {
    clearInterval(deviceSetWifiInterval);
  }

  deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_READY;
  deviceSetWifiStateTryCnt = 0;

  deviceSetWifiInterval = setInterval(function () {
    checkDeviceSetWifi();
  }, 500);

  message.respond({
    returnValue: true,
    data: 'device/setWifi : Start',
  });
});

function checkDeviceSetWifi() {
  switch (deviceSetWifiState) {
    case EyeMiniSdk.DEVICE_SET_WIFI_STATE_READY:
      if (
        tcpClientRequest != null &&
        tcpClientNotify != null &&
        tcpClientRequest.isRunning &&
        tcpClientNotify.isRunning
      ) {
        // tcp set wifi 전송
        const packet = createPacketCr2CmdSetWifi(
          deviceSetWifiEncryption,
          deviceSetWifiSsid,
          deviceSetWifiPassword,
          deviceSetWifiType,
        );
        const req_id = packet.header.req_id;
        tcpClientRequest.sendPacket(packet);

        deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_CMD_SENT;
        deviceSetWifiStateTryCnt = 0;

        // 응답 대기
        let checkInterval = setInterval(() => {
          const ackPacket = tcpClientRequest.receivedPackets.find(
            (p) => p.header.ack_id === req_id,
          );
          if (ackPacket) {
            clearInterval(checkInterval);

            if (ackPacket.header.status === 0) {
              // SET_WIFI 응답 성공인 경우 udp 확인 시작
              eyeminiDevices = [];
              deviceSetWifiState =
                EyeMiniSdk.DEVICE_SET_WIFI_STATE_UDP_SEARCHING;
              deviceSetWifiStateTryCnt = 0;
            } else {
              deviceSetWifiRunning = false;
              deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_FAILED_CMD;
            }
          }

          if (
            deviceSetWifiState !== EyeMiniSdk.DEVICE_SET_WIFI_STATE_CMD_SENT
          ) {
            clearInterval(checkInterval);
          }
        }, 500);
      } else {
        deviceSetWifiStateTryCnt++;
        // timeout
        if (deviceSetWifiStateTryCnt > 10) {
          //wsSendMessage(JSON.stringify({'device_set_wifi':false,'message':'DEVICE_SET_WIFI_STATE_FAILED_CMD'}));
          deviceSetWifiRunning = false;
          deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_FAILED_CMD;
        }
      }
      break;
    case EyeMiniSdk.DEVICE_SET_WIFI_STATE_CMD_SENT:
      deviceSetWifiStateTryCnt++;
      // timeout
      if (deviceSetWifiStateTryCnt > 10) {
        //wsSendMessage(JSON.stringify({'device_set_wifi':false,'message':'DEVICE_SET_WIFI_STATE_FAILED_CMD'}));
        deviceSetWifiRunning = false;
        deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_FAILED_CMD;
      }
      break;
    case EyeMiniSdk.DEVICE_SET_WIFI_STATE_UDP_SEARCHING:
      if (
        deviceSetWifiStateTryCnt >
        EyeMiniSdk.DEVICE_SET_WIFI_TIMEOUT_SEC * 2
      ) {
        // 다시 발견되지 않은 경우 (기기 ap모드 재설정 및 pw 재입력 필요)
        deviceSetWifiRunning = false;
        deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_FAILED_NOT_FOUND;
      } else {
        if (udpClientRunning === false) {
          startUdpClient();
        }

        // SET_WIFI 전송 직후엔 udp 기기 정보 무시
        if (deviceSetWifiStateTryCnt < 4) {
          eyeminiDevices = [];
        }

        // eyeminiDevices 배열에서 updated가 10초 이전인 항목들을 제거
        const tenSecondsAgo = Date.now() - 10000;
        eyeminiDevices = eyeminiDevices.filter(
          (device) => device.updated >= tenSecondsAgo,
        );

        const existingIndex = eyeminiDevices.findIndex(
          (device) => device.serialNumber === deviceConnectionSerialNumber,
        );
        if (existingIndex >= 0) {
          // udp에서 기기 찾음
          var device = eyeminiDevices[existingIndex];
          if (device.networkInfo.interface === 'ap0') {
            // 다시 발견되었는데 ap 연결인경우 (pw 실패나 네트워크 연결 이상 등으로 ap모드에서 바뀌지 않음)
            deviceSetWifiRunning = false;
            deviceSetWifiState =
              EyeMiniSdk.DEVICE_SET_WIFI_STATE_FAILED_AP_MODE;
          } else if (device.networkInfo.interface === 'wlan0') {
            // wlan0 정상 연결된 경우
            deviceSetWifiRunning = false;
            deviceSetWifiState = EyeMiniSdk.DEVICE_SET_WIFI_STATE_SUCCESS;
            wsSendMessage(
              JSON.stringify({
                device_set_wifi: true,
                message: 'DEVICE_SET_WIFI_STATE_SUCCESS',
              }),
            );
          }
        }
        deviceSetWifiStateTryCnt++;
      }
      break;
    case EyeMiniSdk.DEVICE_SET_WIFI_STATE_SUCCESS:
      break;

    default:
  }

  wsSendMessage(JSON.stringify({ device_set_wifi_state: deviceSetWifiState }));
}
