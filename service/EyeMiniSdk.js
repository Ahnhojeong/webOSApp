const EyeMiniSdk = {
  DiscoveryPort: 43265,
  RequestAckPort: 43266,
  NotifyPort: 43267,
  DummyPort: 43268,

  HARD_KEY:0x52,
  MAGIC_NUMBER: Buffer.from([0x99, 0x01, 0x28, 0x28]),
  JSON_EVENT_ERROR: 0x00000000, 
  CR2CMD_SECURE_GET_ACT_CODE: 0x000000D9,
  JSON_EVENT_CR2INIT:0x000000B2,
  JSON_EVENT_CR2CMD:0x000000B0,
  JSON_EVENT_CR2CMD_ACK:0x000000B1,
  JSON_EVENT_NOTIFY_CR2CMD:0x000000C0,
  REQUEST_ID:0,
  CR2CMD_SET_WIFILIST:0x000000CC,
  CR2CMD_GET_WIFILIST:0x000000CD,
  CR2CMD_SET_WIFI: 0x000000CA,
  CR2CMD_GET_WIFI: 0x000000CB,

  CLIENT_DEV_TYPE_TABLET:2,
}


class RequestPacket {
  constructor(header, param) {
      this.header = header;
      this.param = param;
  }
}
class RequestHeader {
  constructor(eventId, command, length) {
    this.hard_key = EyeMiniSdk.HARD_KEY;
    this.event_id = eventId;
    this.command = command;
    this.req_id = EyeMiniSdk.REQUEST_ID++;
    this.length = length;
  }
}
class RequestParamCR2Init {
  constructor(sensorcode, sensornum, p0, p1, p2, p3) {
    this.sensorcode = sensorcode;
    this.sensornum = sensornum;
    this.p0 = p0;
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
  }
}

module.exports = {
  EyeMiniSdk,
  RequestPacket,
  RequestHeader,
  RequestParamCR2Init
};