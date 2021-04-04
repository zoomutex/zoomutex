import { useRef } from "react";

export interface VideoProps {
  mediaStream: MediaStream | null;
}

const Video = ({ mediaStream }: VideoProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (mediaStream === null) {
    console.log("media stream is null");
  } else {
    console.log("media stream is valid")
  }

  if (videoRef.current) {
    videoRef.current.srcObject = mediaStream;
  }

  return <video autoPlay playsInline ref={videoRef} />;
};

export default Video;
