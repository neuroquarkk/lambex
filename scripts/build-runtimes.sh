#!/bin/bash

echo "Building JavaScript Runtime..."
docker build -t rce-javascript:latest -f ./docker/javascript.Dockerfile .
