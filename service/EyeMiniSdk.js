const EyeMiniSdk = {
  DiscoveryPort: 43265,
  RequestAckPort: 43266,
  NotifyPort: 43267,
  DummyPort: 43268,

  REQUEST_ID: 0,
  HARD_KEY: 0x52,
  MAGIC_NUMBER: Buffer.from([0x99, 0x01, 0x28, 0x28]),

  JSON_EVENT_ERROR: 0x00000000,
  JSON_EVENT_CR2INIT: 0x000000b2,
  JSON_EVENT_CR2CMD: 0x000000b0,
  JSON_EVENT_CR2CMD_ACK: 0x000000b1,
  JSON_EVENT_NOTIFY_CR2CMD: 0x000000c0,

  CR2CMD_USECLUB: 0x00000021,
  CR2CMD_SETRIGHTLEFT: 0x00000024,
  CR2CMD_SETUNIT: 0x00000025,
  CR2CMD_SENSORSTATUS: 0x00000030,
  CR2CMD_AREAALLOW: 0x00000032,
  CR2CMD_BALLPOSITION: 0x00000033,
  CR2CMD_CALC_TRAJECTORY_FILE: 0x0000004a,

  CR2CMD_GET_DEVICE_INFO: 0x000000bc,
  CR2CMD_SET_WIFI: 0x000000ca,
  CR2CMD_GET_WIFI: 0x000000cb,
  CR2CMD_SET_WIFILIST: 0x000000cc,
  CR2CMD_GET_WIFILIST: 0x000000cd,

  CR2CMD_SECURE_GET_ACT_CODE: 0x000000d9,

  CLIENT_DEV_TYPE_TABLET: 2,

  NOTIFYCMD_GOODSHOT: 0x00000001,
  NOTIFYCMD_STATECHANGED: 0x00000004,

  CR2UNIT_DISTANCE_YARD: 0x0010,
  CR2UNIT_DISTANCE_METER: 0x0011,
  CR2UNIT_SPEED_MPH: 0x0020,
  CR2UNIT_SPEED_MS: 0x0021,
  CR2UNIT_SPEED_KMH: 0x0022,
  CR2UNIT_SPEED_YDS: 0x0023,

  // DEVICE_CONNECTION_STATE_UDP_START:1001,
  // DEVICE_CONNECTION_STATE_UDP_READY:1010,
  DEVICE_CONNECTION_STATE_UDP_SEARCHING: 1020, // 연결 시도하는 기기 udp packet 찾는중
  DEVICE_CONNECTION_STATE_TCP_START: 1030, // tcp client 시작
  DEVICE_CONNECTION_STATE_TCP_INIT_WAIT: 1031,
  DEVICE_CONNECTION_STATE_TCP_INIT_SUCCESS: 1032,
  DEVICE_CONNECTION_STATE_TCP_ACT_CODE_WAIT: 1033,
  DEVICE_CONNECTION_STATE_TCP_ACT_CODE_SUCCESS: 1034,
  DEVICE_CONNECTION_STATE_TCP_SET_UNIT_WAIT: 1035,
  //DEVICE_CONNECTION_STATE_TCP_SET_UNIT_SUCCESS:1036,

  //DEVICE_CONNECTION_STATE_TCP_READY:1040,
  //DEVICE_CONNECTION_STATE_NOTIFY_READY:1050,
  DEVICE_CONNECTION_STATE_CONNECTED: 1060,
  DEVICE_CONNECTION_STATE_DISCONNECTED: 1099,

  DEVICE_SET_WIFI_TIMEOUT_SEC: 20, // SET_WIFI 동작 timeout을 판단할 최대 시간 (초)

  DEVICE_SET_WIFI_STATE_READY: 2000,
  DEVICE_SET_WIFI_STATE_CMD_SENT: 2010,
  DEVICE_SET_WIFI_STATE_UDP_SEARCHING: 2020,
  DEVICE_SET_WIFI_STATE_GET_WIFI_SENT: 2030,
  DEVICE_SET_WIFI_STATE_SUCCESS: 2100, // 성공
  DEVICE_SET_WIFI_STATE_FAILED_CMD: 2200, // SET_WIFI 명령 발송 과정에서 실패
  DEVICE_SET_WIFI_STATE_FAILED_NOT_FOUND: 2201, // 다시 발견되지 않은 경우 (기기 ap모드 재설정 및 pw 재입력 필요)
  DEVICE_SET_WIFI_STATE_FAILED_AP_MODE: 2202, // 다시 발견되었는데 ap 연결인경우 (pw 실패나 네트워크 연결 이상 등으로 ap모드에서 바뀌지 않음)
};

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

function crCrc32(crc, buf, len) {
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

class EncryptedData0 {
  constructor(encryptedData0) {
    this.encryptedData0 = encryptedData0; // EncryptedData 인스턴스
  }
}

module.exports = {
  EyeMiniSdk,
  RequestPacket,
  RequestHeader,
  RequestParamCR2Init,
  crCrc32,
  EncryptedData0,
};
