#!/usr/bin/env bash

# Since both private and public keys are required to serve the application,
# and private key is hidden with git-secret, public key has also been hidden.
# This script may be used to generate new keys, which would not be checked in,
# allowing for testing the application without git-secret access.

SCRIPTPATH="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"
PRIVATEKEY="$SCRIPTPATH/../server/key.pem"
PUBLICKEY="$SCRIPTPATH/../client/cert.pem"

openssl req -x509 -newkey rsa:4096 -nodes -subj '/C=US' -keyout "$PRIVATEKEY" -out "$PUBLICKEY" -days 365
