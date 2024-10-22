export const getDevice = [
  {
    devGuid: [
      203, 44, 251, 84, 171, 99, 72, 155, 141, 171, 65, 166, 52, 22, 95, 167,
    ],
    modelName: 'EYEMINI',
    hwVersion: '5010',
    swVersion: '2.6.19',
    serialNumber: '501000008535',
    hashKey: '4C98EA8AE9493EBC5233DB8DEB13664A8B8207A04411A0984E44101DFEA6AED7',
    networkInfo: {
      interface: 'wlan0',
      ipaddr: '192.168.1.56',
      mac: 'E4:5F:01:BC:7A:6E',
    },
    updated: 1729583191600,
  },
  {
    devGuid: [
      69, 169, 246, 18, 134, 253, 79, 189, 160, 215, 167, 241, 123, 112, 249,
      177,
    ],
    modelName: 'EYEMINI',
    hwVersion: '5010',
    swVersion: '2.6.19',
    serialNumber: '501000406119',
    hashKey: '3D0D1C53D86AC7A17A5897EF1F5B5996B1F43E12D0BFBD42E7E25FD5844D8910',
    networkInfo: {
      interface: 'wlan0',
      ipaddr: '192.168.1.62',
      mac: 'E4:5F:01:BC:79:9C',
    },
    updated: 1729583191087,
  },
];

export const tcpClientInitRes = {
  header: { status: 0, answer: 179, command: 0, ack_id: 0, length: 4 },
  param: null,
  tcp_client_received: 1729585450465,
};

export const tcpClientGetWifiListRes = {
  header: { status: 0, answer: 177, command: 205, ack_id: 1, length: 763 },
  param: {
    wifiList: {
      ssidArray: [
        'Bmat_0273',
        'Creatz_Newbiz_Guest',
        'JGCGSEOUL',
        'Creatz_Newbiz_2G',
        'Creatz_Newbiz_Guest',
        'Creatz_Newbiz_2G',
        'Creatz_Newbiz_Guest',
        'Creatz_Newbiz_Guest',
        'Creatz_Newbiz_5G',
        'DIRECT-a7-HP M282 LaserJet',
        'Creatz_Newbiz_5G',
        'Creatz_Newbiz_2G',
        'Creatz_Newbiz_2G',
        'JGCGSEOUL',
        'AT_410_AFAN_910604_WW_2816',
      ],
      qualityArray: [
        '42/70',
        '46/70',
        '27/70',
        '70/70',
        '70/70',
        '63/70',
        '63/70',
        '38/70',
        '55/70',
        '36/70',
        '48/70',
        '45/70',
        '39/70',
        '32/70',
        '28/70',
      ],
      levelArray: [
        '-68 dBm  ',
        '-64 dBm  ',
        '-83 dBm  ',
        '-33 dBm  ',
        '-34 dBm  ',
        '-47 dBm  ',
        '-47 dBm  ',
        '-72 dBm  ',
        '-55 dBm  ',
        '-74 dBm  ',
        '-62 dBm  ',
        '-65 dBm  ',
        '-71 dBm  ',
        '-78 dBm  ',
        '-82 dBm  ',
      ],
      encryptionArray: [
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
        'on',
      ],
    },
    number: 15,
  },
  tcp_client_received: 1729585460365,
};

export const tcpClientSetWifiRes = {
  header: { status: 0, answer: 177, command: 202, ack_id: 2, length: 4 },
  param: null,
  tcp_client_received: 1729585470725,
};

export const goodShot = {
  header: {
    hard_key: 82,
    event_id: 192,
    command: 1,
    req_id: 8,
    length: 977,
  },
  param: {
    status: 16,
    shotdataEX1: {
      shotguid: {
        Data1: 4133916799,
        Data2: 50417,
        Data3: 1613,
        Data4: [136, 128, 245, 69, 105, 222, 162, 231],
      },
      category: 12,
      rightlefthanded: 0,
      xposx1000: 166,
      yposx1000: -27,
      zposx1000: 92,
      ballspeedx1000: 10391,
      inclineX1000: -8134,
      azimuthX1000: 13098,
      spincalc_method: 2,
      assurance_spin: 5,
      backspinX1000: 2435104,
      sidespinX1000: 373168,
      rollspinX1000: 24628,
      clubcalc_method: 2,
      assurance_clubspeed: 81,
      assurance_clubpath: 90,
      assurance_faceangle: 0,
      assurance_attackangle: 0,
      assurance_loftangle: 0,
      assurance_lieangle: 0,
      assurance_faceimpactLateral: 0,
      assurance_faceimpactVertical: 0,
      clubspeedX1000: 8706,
      clubpathX1000: -15842,
      faceangleX1000: 0,
      attackangleX1000: 0,
      loftangleX1000: 0,
      lieangleX1000: 0,
      faceimpactLateralX1000: 0,
      faceimpactVerticalX1000: 0,
      impactTimestamp: 1729497752369390,
    },
    statedata: {
      rightleft: 0,
      clubtype: 17,
      allowTee: 1,
      allowIron: 1,
      allowPutter: 0,
      unitDistance: 17,
      unitSpeed: 33,
      altitude: 0,
      altitude_mode: 0,
    },
  },
  tcp_client_received: 1729497752142,
};

export const shotImg = {
  header: { hard_key: 82, event_id: 192, command: 2, req_id: 15, length: 34 },
  param: { shotImgPath: 'SCAMIMG/CURRENT/' },
  tcp_client_received: 1729506975794,
};