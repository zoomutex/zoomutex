export const getPort = (): number => {
  const port = parseInt(process.env.PORT!);

  if (!!port && !isNaN(port)) {
    return port;
  }

  // Default production
  if (process.env.NODE_ENV === "production") {
    return 443;
  }

  // Development default
  return 7000;
};
