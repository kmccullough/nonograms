# Multiplayer online cooperative/competitive nonograms

## Setup

### Dependencies

 - [Node.JS](https://nodejs.org/en/download) (>= 8.0.0)
 - [npm](https://docs.npmjs.com/getting-started/installing-node)
 - [MongoDB](https://docs.mongodb.com/manual/installation)

```bash
npm install
```

### SSL

The application requires an HTTPS connection. This means two things:

* Make sure you access the site using the HTTPS:// prefix
* You'll need public and private keys to serve the application

For the public and private keys, they can be generated with the
`/bin/generate-ssl.sh` script, if all you are interested in is running
the application. To use the official keys you must contact the maintainer
to be added to the git-secrets repo (See https://git-secret.io/).

# Dev and Deployment

#### Run server on port 3000

```bash
node server/index.js
```

or 

```bash
nodemon server/index.js
```
