# Zoomutex

## Development

Set up server env:

```txt
# server/.env
PORT=7000
```

Start running the server:

```shell
npm run dev:server
```

Start compiling the client in watch mode:

```shell
npm run dev:client
```

## Building

Build the application:

```shell
npm run build
```

Run the application in production:

```shell
npm run start
```

## Deploy

To deploy, run `deploy.sh`:

```shell
./deploy.sh <target-dir> <commit-message>
```

For example, if your folder structure looks like:

```
.
├── zoomutex
└── zoomutex-heroku
```

you can run

```shell
./deploy.sh ../zoomutex-heroku "fresh deploy"
```
