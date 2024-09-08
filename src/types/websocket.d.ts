// <--- Common Type --->
export type Position3D = {
  x: number;
  y: number;
  z: number;
};

export interface IShotValue {
  value: number;
  method: string;
  // name: string;
  // acquisition_method: string;
  confidence: number;
}

export type ImageValue = {
  format: string;
  image: any;
  index: number;
  is_impact: boolean;
  timestamp: number;
  url: string;
};

export type ShotDataType =
  | 'ShotDataInfo'
  | 'ShotEvent'
  | 'ShotDataBall'
  | 'ShotDataClub'
  | 'ShotDataFlight'
  | 'ShotImage'
  | 'ReadyToShot'
  | 'NotReady';

export type BallListType = {
  position: Position3D[];
  is_in_hitting_area: boolean;
};

// <--- Search_BALL_EVENT --->
export interface ISearchBallEventData {
  ball_list: BallListType;
}

// <--- READY_TO_SHOT_EVENT Type --->
export interface IReadyToShotEventData {
  ball: BallListType;
}

// <--- SHOT_EVENT Type --->
export interface IShotEventData {
  shot_id: string;
  // shot_data_type: string;
  shot_mode: string;
  impact_timestamp: number;
}

// <--- BALL_DATA Type --->
export interface IBallData {
  back_spin: string;
  ball_position_before_launch: Position3D;
  horizontal_launch_angle: IShotValue;
  roll_spin: IShotValue;
  shot_id: string;
  side_spin: IShotValue;
  speed: IShotValue;
  spin_tilt_axis: IShotValue;
  total_spin: IShotValue;
  vertical_launch_angle: IShotValue;
}

// <--- CLUB_DATA Type --->
export interface IClubData {
  attack_angle: IShotValue;
  ball_impact_position_horizontal: IShotValue;
  ball_impact_position_vertical: IShotValue;
  dynamic_loft_angle: IShotValue;
  face_angle: IShotValue;
  face_to_path_angle: IShotValue;
  head_speed: IShotValue;
  lie_angle: IShotValue;
  path: IShotValue;
  shot_id: string;
  smash_factor: IShotValue;
}

// <--- FLIGHT_DATA Type --->
export interface IFlightData {
  apex_distance: IShotValue;
  apex_height: IShotValue;
  carry_distance: IShotValue;
  flight_time: IShotValue;
  flight_type: IShotValue;
  shot_id: string;
  side_distance: IShotValue;
  trajectory_array: any;
  trajectory_array_encoded: IShotValue;
  trajectory_array_length: number;
  trajectory_array_time_delta: number;
}

// <--- SHOT_IMAGE_INFO Type --->
export interface IShotImageInfoData {
  ball_images: ImageValue[];
  club_images: ImageValue[];
  impact_images: ImageValue[];
  impact_timestamp: number;
  shot_id: string;
}
