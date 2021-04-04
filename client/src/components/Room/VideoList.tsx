import Video from "./Video";

export interface Streams {
  [userId: string]: MediaStream;
}

export interface VideoListProps {
  streams: Streams;
}

const VideoList = ({ streams }: VideoListProps): JSX.Element => {
  const elements: JSX.Element[] = [];

  for (const key in streams) {
    if (streams.hasOwnProperty(key)) {
      elements.push(<Video key={key} mediaStream={streams[key]} />);
    }
  }

  return <>{elements}</>;
};

export default VideoList;
