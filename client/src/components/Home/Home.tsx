import { Redirect } from "react-router";
import { roomRoute } from "../Room";
import { v4 } from "uuid";

const Home = (): JSX.Element => {
  const id = v4();
  return <Redirect to={roomRoute.replace(":roomId", id)} />;
};

export default Home;
