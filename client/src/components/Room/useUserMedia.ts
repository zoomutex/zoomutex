import { useEffect, useState } from "react";

const useUserMedia = (
  requestedMedia?: MediaStreamConstraints
): MediaStream | null => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const enableStream = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(
          requestedMedia
        );
        setMediaStream(stream);
      } catch (err) {
        console.error(err);
      }
    };

    const cleanup = (): void => {
      mediaStream?.getTracks().forEach((track) => track.stop());
    };

    if (!mediaStream) {
      enableStream();
    } else {
      return cleanup;
    }
  }, [mediaStream, requestedMedia]);

  return mediaStream;
};

export default useUserMedia;
