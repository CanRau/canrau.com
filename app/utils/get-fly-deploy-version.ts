type IReturn = {
  appVersion: string;
  appStatus: string;
};

export const getDeployVersion = async (): Promise<IReturn> => {
  // done: set flyctl secrets
  const FLY_APP_NAME = process.env.FLY_APP_NAME;
  const FLY_API_TOKEN = process.env.FLY_API_TOKEN;
  if (!FLY_APP_NAME || !FLY_API_TOKEN) {
    return { appVersion: "", appStatus: "" };
  }

  const body = JSON.stringify({
    query: `
      query($appName: String!) {
        app(name: $appName) {
          currentRelease {
            version
            status
          }
        }
      }`,
    variables: {
      appName: FLY_APP_NAME,
    },
  });

  const res = await fetch("https://api.fly.io/graphql", {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FLY_API_TOKEN}`,
    },
    credentials: "include",
    cache: "no-cache",
  }).then((res) => res.json());

  const { version, status } = res.data.app.currentRelease;
  return { appVersion: version, appStatus: status };
};
