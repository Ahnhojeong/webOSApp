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

// EYEMINI 정보 UDP Client로 받아오기(IP,Port,..)
const dgram = require('dgram');
let udpClientRunning = false;
let udpClient = null;
let udpMessage = '';
let udpMessageUpdated = null;
let eyeminiDevices = [];
let eyeminiDeviceIp = ''; // 가장 최근 찾은 기기의 ip주소 저장 - ip 주소 없이 tcp client 시작할 때 기본값

service.register('udpClient/start', function (message) {
  if (udpClient != null) {
    // 이전 실행하고 있던 client 있을 경우 종료
    udpClient.close();
  }

  eyeminiDevices = [];
  eyeminiDeviceIp = '';

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

      if (eyemini.networkInfo.ipaddr !== undefined) {
        // 배열에서 같은 ipaddr을 가진 객체의 인덱스 찾기
        const existingIndex = eyeminiDevices.findIndex(
          (device) => device.networkInfo.ipaddr === eyemini.networkInfo.ipaddr,
        );

        if (existingIndex !== -1) {
          // 같은 ipaddr이 있을 경우 해당 객체의 값을 갱신
          eyeminiDevices[existingIndex] = eyemini;
        } else {
          // 같은 ipaddr이 없으면 배열에 새 객체를 push
          eyeminiDevices.push(eyemini);
        }

        // 가장 최근 찾은 기기의 ip주소 저장
        eyeminiDeviceIp = eyemini.networkInfo.ipaddr;
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

  message.respond({
    returnValue: true,
    data: 'udpClient : Start',
  });
});

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
    message.respond({
      returnValue: true,
      data: JSON.stringify(eyeminiDevices),
    });
  }
});

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
} = require('./EyeMiniSdk');

let tcpClientRequest = null;
let tcpClientNotify = null;

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

/*
service.register('tcpClient/sendPacketInit', function (message) {
  if(tcpClientRequest==null || tcpClientRequest.isRunning===false){
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });  
  } else {
    const packet = createPacketCr2Init();
    const req_id = packet.header.req_id;
    tcpClientRequest.sendPacket(packet);

    // 응답 대기 (3초 타임아웃 내에 0.5초마다 확인)
    // receivedPackets 배열에 ack_id == req_id인 object가 있는지 확인
    // 있으면 해당 object를 data에 리턴 
    message.respond({
      returnValue: true,
      data: 'tcpClientRequest : sendPacketInit'
    });
  }
});
*/

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

service.register('tcpClientRequest/sendPacketActCode', function (message) {
  if (tcpClientRequest == null || tcpClientRequest.isRunning === false) {
    message.respond({
      returnValue: false,
      data: 'tcpClientRequest : invalid',
    });
  } else {
    const packet = createPacket_GetActCode();
    tcpClientRequest.sendPacket(packet);
    message.respond({
      returnValue: true,
      data: 'tcpClientRequest : sendPacketActCode',
    });
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
  }
  logMessage(message) {
    this.tcpLog += message + '\n';
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
          this.logMessage('Packet sent : ' + this.senStringBuilder);
        });
      } else {
        let data = packet.param;
        let payload = '[' + data.encryptedData0.payload.join(',') + ']';

        this.senStringBuilder = JSON.stringify(packet);

        let jsonObject = JSON.parse(this.senStringBuilder);
        jsonObject.param.encryptedData0.payload = payload;

        let convertJsonString = JSON.stringify(jsonObject);
        let packetLength = Buffer.alloc(4);

        packetLength.writeUInt32BE(convertJsonString.length, 0);

        let packetArray = Buffer.from(convertJsonString, 'utf8');
        let packetMessage = Buffer.concat([
          EyeMiniSdk.MAGIC_NUMBER,
          packetLength,
          packetArray,
        ]);

        this.stream.write(packetMessage, () => {
          this.logMessage('Security Packet sent ' + convertJsonString);
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

        if (this.receivedPackets.length > 20) {
          this.receivedPackets.splice(0, this.receivedPackets.length - 20);
        }

        var resultJson = this.extractJson(data);
        if (resultJson != null) {
          resultJson.tcp_client_received = Date.now();
          this.receivedPackets.push(resultJson);

          if (this.name === 'notify') {
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                try {
                  client.send(JSON.stringify(resultJson));
                } catch (error) {
                  this.receivedPackets.push(
                    'Failed to send message to client:',
                    error,
                  );
                }
              }
            });
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
    this.logMessage('jsonString : ' + jsonString);

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

// CreatePacket_GetActCode 함수 정의
function createPacket_GetActCode() {
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

  //_sendPacketQueue.enqueue(packet);
  return packet;
}

// CRC32 Table (same as in C# code)
const crc_table = [
  0x00000000, 0x77073096, 0xee0e612c, 0x990951ba, 0x076dc419, 0x706af48f,
  0xe963a535, 0x9e6495a3, 0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
  0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91, 0x1db71064, 0x6ab020f2,
  0xf3b97148, 0x84be41de, 0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
  0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec, 0x14015c4f, 0x63066cd9,
  0xfa0f3d63, 0x8d080df5, 0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
  0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b, 0x35b5a8fa, 0x42b2986c,
  0xdbbbc9d6, 0xacbcf940, 0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
  0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116, 0x21b4f4b5, 0x56b3c423,
  0xcfba9599, 0xb8bda50f, 0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
  0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d, 0x76dc4190, 0x01db7106,
  0x98d220bc, 0xefd5102a, 0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
  0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818, 0x7f6a0dbb, 0x086d3d2d,
  0x91646c97, 0xe6635c01, 0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
  0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457, 0x65b0d9c6, 0x12b7e950,
  0x8bbeb8ea, 0xfcb9887c, 0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
  0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2, 0x4adfa541, 0x3dd895d7,
  0xa4d1c46d, 0xd3d6f4fb, 0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
  0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9, 0x5005713c, 0x270241aa,
  0xbe0b1010, 0xc90c2086, 0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
  0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4, 0x59b33d17, 0x2eb40d81,
  0xb7bd5c3b, 0xc0ba6cad, 0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
  0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683, 0xe3630b12, 0x94643b84,
  0x0d6d6a3e, 0x7a6a5aa8, 0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
  0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe, 0xf762575d, 0x806567cb,
  0x196c3671, 0x6e6b06e7, 0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
  0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5, 0xd6d6a3e8, 0xa1d1937e,
  0x38d8c2c4, 0x4fdff252, 0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
  0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60, 0xdf60efc3, 0xa867df55,
  0x316e8eef, 0x4669be79, 0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
  0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f, 0xc5ba3bbe, 0xb2bd0b28,
  0x2bb45a92, 0x5cb36a04, 0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
  0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a, 0x9c0906a9, 0xeb0e363f,
  0x72076785, 0x05005713, 0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
  0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21, 0x86d3d2d4, 0xf1d4e242,
  0x68ddb3f8, 0x1fda836e, 0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
  0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c, 0x8f659eff, 0xf862ae69,
  0x616bffd3, 0x166ccf45, 0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
  0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db, 0xaed16a4a, 0xd9d65adc,
  0x40df0b66, 0x37d83bf0, 0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
  0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6, 0xbad03605, 0xcdd70693,
  0x54de5729, 0x23d967bf, 0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
  0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d,
];

function cr_crc32(crc, buf, len) {
  if (!buf) return 0;

  crc = (crc ^ 0xffffffff) >>> 0;

  let index = 0;
  while (len >= 8) {
    crc = DO8(buf, index, crc);
    index += 8;
    len -= 8;
  }
  if (len !== 0) {
    do {
      crc = DO1(buf, index, crc);
      index += 1;
    } while (--len !== 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function DO1(buf, index, crc) {
  crc = crc_table[(crc ^ buf[index]) & 0xff] ^ (crc >>> 8);
  return crc >>> 0;
}

function DO2(buf, index, crc) {
  crc = DO1(buf, index, crc);
  crc = DO1(buf, index + 1, crc);
  return crc >>> 0;
}

function DO4(buf, index, crc) {
  crc = DO2(buf, index, crc);
  crc = DO2(buf, index + 2, crc);
  return crc >>> 0;
}

function DO8(buf, index, crc) {
  crc = DO4(buf, index, crc);
  crc = DO4(buf, index + 4, crc);
  return crc >>> 0;
}

/*
function cr_crc32(crc, buf, len) {
  if (!buf) return 0;

  crc ^= 0xffffffff;
  let i = 0;
  while (len >= 8) {
      DO8(buf, () => i++, (val) => { crc = val; }, crc);
      len -= 8;
  }
  if (len !== 0) {
      do {
          DO1(buf, () => i++, (val) => { crc = val; }, crc);
      } while (--len !== 0);
  }
  return crc ^ 0xffffffff;
}

function DO1(buf, getIndex, setCrc, crc) {
  crc = crc_table[(crc ^ buf[getIndex()]) & 0xff] ^ (crc >>> 8);
  setCrc(crc);
}

function DO2(buf, getIndex, setCrc, crc) {
  DO1(buf, getIndex, setCrc, crc);
  DO1(buf, getIndex, setCrc, crc);
}

function DO4(buf, getIndex, setCrc, crc) {
  DO2(buf, getIndex, setCrc, crc);
  DO2(buf, getIndex, setCrc, crc);
}

function DO8(buf, getIndex, setCrc, crc) {
  DO4(buf, getIndex, setCrc, crc);
  DO4(buf, getIndex, setCrc, crc);
}
*/
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

    //tcpClient.logMessage("GetActCodeParam(0)");

    // Create clientInfoBuffer of 64 bytes
    const clientInfoBuffer = Buffer.alloc(64);

    // Client_Code: byte[32]
    for (let i = 0; i < 32; i++) {
      clientInfoBuffer[i] = i;
    }

    // Client_Type: byte
    clientInfoBuffer[32] = EyeMiniSdk.CLIENT_DEV_TYPE_TABLET;

    // Account_String: char[17], set to 0
    for (let i = 0; i < 17; i++) {
      clientInfoBuffer[33 + i] = 0;
    }

    // Reserved: byte[10], set to 0
    for (let i = 0; i < 10; i++) {
      clientInfoBuffer[50 + i] = 0;
    }

    //tcpClient.logMessage("GetActCodeParam(1)");

    // Crc: uint32, set to 0 initially
    clientInfoBuffer.writeUInt32LE(0, 60);

    // Calculate CRC32 over clientInfoBuffer excluding Crc field
    const crc = cr_crc32(0, clientInfoBuffer.slice(0, 60), 60) >>> 0;

    tcpClientRequest.logMessage('GetActCodeParam(2) ' + crc);

    // Update Crc field
    clientInfoBuffer.writeUInt32LE(crc, 60);

    //tcpClient.logMessage("GetActCodeParam(2-1)");

    // Encrypt clientInfoBuffer using AES-128-CBC
    const cipher = crypto.createCipheriv('aes-128-cbc', Compk2, iv2);

    //tcpClient.logMessage("GetActCodeParam(2-2)");

    cipher.setAutoPadding(false);

    //tcpClient.logMessage("GetActCodeParam(2-3)");

    let encrypted = cipher.update(clientInfoBuffer);

    //tcpClient.logMessage("GetActCodeParam(2-4)");

    encrypted = Buffer.concat([encrypted, cipher.final()]);

    //tcpClient.logMessage("GetActCodeParam(3)");

    // Create EncryptedData buffer
    const payloadLength = encrypted.length;
    const encryptedDataBuffer = Buffer.alloc(8 + payloadLength);

    // Set Payload_Length
    encryptedDataBuffer.writeUInt32LE(payloadLength, 0);

    // Set Crc to 0 for now
    encryptedDataBuffer.writeUInt32LE(0, 4);

    // Copy encrypted payload
    encrypted.copy(encryptedDataBuffer, 8);

    //tcpClient.logMessage("GetActCodeParam(4)");

    // Calculate CRC over EncryptedData excluding Crc field
    const crcEncrypted = cr_crc32(
      0,
      Buffer.concat([
        encryptedDataBuffer.slice(0, 4), // Payload_Length
        encryptedDataBuffer.slice(8), // Payload
      ]),
      4 + payloadLength,
    );

    tcpClientRequest.logMessage('GetActCodeParam(5)');

    // Update Crc field
    encryptedDataBuffer.writeUInt32LE(crcEncrypted, 4);

    // Return EncryptedData object
    return {
      payload_length: payloadLength,
      crc: crcEncrypted,
      payload: encrypted,
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
      /* Replace with your 16-byte key */
    ]);
    const iv2 = Buffer.from([
      /* Replace with your 16-byte IV */
    ]);

    // Create AES decipher
    const decipher = crypto.createDecipheriv('aes-128-cbc', Compk2, iv2);
    decipher.setAutoPadding(false);

    // Decrypt the payload
    let decrypted = decipher.update(data.encryptedData0.Payload);
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

      console.warn(`EYE MINI ACT CODE 1 = [${UneekorRet}]`);
      console.warn(`EYE MINI ACT CODE 2 = [${CreatzRet}]`);

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
    console.warn(e.message);
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

// AckPacket 클래스 정의
class AckPacket {
  constructor(header, param) {
    this.Header = header;
    this.Param = param;
  }
}

// AckHeader 클래스 정의
class AckHeader {
  constructor(status, answer, command, ackId, length) {
    this.status = status;
    this.answer = answer;
    this.command = command;
    this.ack_id = ackId;
    this.length = length;
  }
}

// 패킷 관련 데이터 구조 정의

// RequestParam_Set_RightLeft 구조체 정의
class RequestParam_Set_RightLeft {
  constructor(rightLeft) {
    this.rightLeft = rightLeft;
  }
}

// RequestParam_Set_Wifi 구조체 정의
class RequestParam_Set_Wifi {
  constructor(configuration) {
    this.configuration = configuration;
  }
}

// RequestParam_Set_Wifi_Data 구조체 정의
class RequestParam_Set_Wifi_Data {
  constructor(encryption, ssid, password, type) {
    this.encryption = encryption;
    this.ssid = ssid;
    this.password = password;
    this.type = type;
  }
}

// AckParam_BallPosition 구조체 정의
class AckParam_BallPosition {
  constructor(teeBallPos, ironBallPos, puttingBallPos) {
    this.teeBallPos = teeBallPos;
    this.ironBallPos = ironBallPos;
    this.puttingBallPos = puttingBallPos;
  }
}

// AckParam_BallPosition_Result 구조체 정의
class AckParam_BallPosition_Result {
  constructor(ballExist, shotResult, x, y, z) {
    this.ballexist = ballExist;
    this.shotresult = shotResult;
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

// AckParam_Get_wifi 구조체 정의
class AckParam_Get_wifi {
  constructor(status, wifiInfo) {
    this.status = status;
    this.wifiInfo = wifiInfo;
  }
}

// AckParam_Get_WifiInfo 구조체 정의
class AckParam_Get_WifiInfo {
  constructor(ssid, quality, level) {
    this.ssid = ssid;
    this.quality = quality;
    this.level = level;
  }
}

// AckParam_Get_WifiList 구조체 정의
class AckParam_Get_WifiList {
  constructor(number, wifiList) {
    this.number = number;
    this.wifiList = wifiList;
  }
}

// AckParam_WifiList_Data 구조체 정의
class AckParam_WifiList_Data {
  constructor(ssidArray, qualityArray, levelArray, encryptionArray) {
    this.ssidArray = ssidArray;
    this.qualityArray = qualityArray;
    this.levelArray = levelArray;
    this.encryptionArray = encryptionArray;
  }
}

// EncryptedData0 클래스 정의
class EncryptedData0 {
  constructor(encryptedData0) {
    this.encryptedData0 = encryptedData0; // EncryptedData 인스턴스
  }
}

// EncryptedData 클래스 정의
class EncryptedData {
  constructor(payload_length, payload, crc) {
    this.payload_length = payload_length; // Number
    this.payload = payload; // Buffer 또는 Uint8Array (길이 64)
    this.crc = crc; // Number
  }
}

// ClientInfo 클래스 정의
class ClientInfo {
  constructor(client_code, account_string, client_type, reserved, crc) {
    this.client_code = client_code; // Buffer 또는 Uint8Array (길이 32)
    this.account_string = account_string; // String (길이 17)
    this.client_type = client_type; // Number (byte)
    this.reserved = reserved; // Buffer 또는 Uint8Array (길이 10)
    this.crc = crc; // Number
  }
}

// ActCode 클래스 정의
class ActCode {
  constructor(success, act_code, reserved, crc) {
    this.success = success; // Number (int)
    this.act_code = act_code; // Buffer 또는 Uint8Array (길이 32)
    this.reserved = reserved; // Buffer 또는 Uint8Array (길이 8)
    this.crc = crc; // Number
  }
}
