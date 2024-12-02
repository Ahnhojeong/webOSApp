import React, { useEffect, useRef, useState } from 'react';
import { Camera, StopCircle, Video } from 'lucide-react';

interface VideoDevice {
  deviceId: string;
  label: string;
}

const CameraRecorder = () => {
  // webOS JS-service 호출
  const callToast = (msg: string) => {
    console.log('Call my toast service');
    const url = 'luna://com.hojeong.app.service/';
    window.webOS.service.request(url, {
      method: 'toast',
      parameters: { msg: msg },
      onFailure: () => {
        console.log('Fail js-service callToast');
      },
      onSuccess: () => {
        console.log('Success js-service callToast');
      },
    });
  };

  const [devices, setDevices] = useState<VideoDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<string>('');
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 5)}...`,
          }));

        console.log('getDevices --> ', { devices, videoDevices });

        if (videoDevices.length === 0) {
          setError(
            'No camera devices found. Please connect a camera and refresh the page.',
          );
          callToast(
            'No camera devices found. Please connect a camera and refresh the page.',
          );
          return;
        }

        setDevices(videoDevices);
        setSelectedDevice(videoDevices[0].deviceId);
        setError(null);
      } catch (error) {
        console.log('Error accessing devices:', error);
        callToast(
          'Failed to access camera. Please check your camera permissions and connection.',
        );
        setError(
          'Failed to access camera. Please check your camera permissions and connection.',
        );
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    const startStream = async () => {
      if (selectedDevice) {
        try {
          // 이전 스트림 정리
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }

          const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: selectedDevice },
          });
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
          setError(null);

          // MediaRecorder 초기화
          const recorder = new MediaRecorder(mediaStream, {
            mimeType: 'video/webm;codecs=vp8,opus',
          });

          mediaRecorderRef.current = recorder;

          recorder.onstart = () => {
            setRecordingStatus('Recording started');
            setRecordedChunks([]);
          };

          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              setRecordedChunks((chunks) => [...chunks, event.data]);
            }
          };

          recorder.onstop = () => {
            setRecordingStatus('Recording stopped');
          };
        } catch (error) {
          console.log('Error accessing camera:', error);
          setError(
            'Failed to access the selected camera. Please try another device or check your connection.',
          );
        }
      }
    };

    startStream();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [selectedDevice]);

  const startRecording = () => {
    if (mediaRecorderRef.current && stream) {
      try {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordingStatus('Recording...');
      } catch (error) {
        console.log('Error starting recording:', error);
        setError('Failed to start recording. Please try again.');
      }
    } else {
      setError('Cannot start recording. Media recorder not initialized.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        setRecordingStatus('Stopped');
      } catch (error) {
        console.log('Error stopping recording:', error);
        setError('Failed to stop recording. Please try again.');
      }
    }
  };

  const saveRecording = () => {
    if (recordedChunks.length === 0) {
      setError('No recording available to save');
      return;
    }

    try {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = `recording-${new Date().toISOString()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setRecordingStatus('Recording saved');
    } catch (error) {
      console.log('Error saving recording:', error);
      setError('Failed to save recording. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Camera
        </label>
        <select
          className="w-full p-2 border rounded-lg"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
        >
          {devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))}
        </select>
      </div>

      <div className="relative aspect-video mb-4 bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex gap-4 justify-center">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            <Video className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            <StopCircle className="w-5 h-5" />
            Stop Recording
          </button>
        )}
        <button
          onClick={saveRecording}
          disabled={recordedChunks.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Camera className="w-5 h-5" />
          Save Recording
        </button>
      </div>
    </div>
  );
};

export default CameraRecorder;
