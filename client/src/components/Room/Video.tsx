import { useRef } from "react";

export interface VideoProps {
  mediaStream: MediaStream | null;
  isCamera?: boolean;
}

const Video = ({ mediaStream, isCamera = false }: VideoProps): JSX.Element => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  if (videoRef.current) {
    videoRef.current.srcObject = mediaStream;
  }

  return (
    <video
      style={{ border: isCamera ? "5px solid red" : undefined }}
      autoPlay
      playsInline
      ref={videoRef}
    />
  );
};

export default Video;
