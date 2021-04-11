# Zoomutex

## Development

Set up server env:

```txt
# server/.env
PORT=7000
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
