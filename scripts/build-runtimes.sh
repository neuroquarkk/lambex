#!/bin/bash

echo "Building JavaScript Runtime..."
docker build -t rce-javascript:latest -f ./docker/javascript.Dockerfile .

echo "Building TypeScript Runtime..."
docker build -t rce-typescript:latest -f ./docker/typescript.Dockerfile .

echo "Building Python Runtime..."
docker build -t rce-python:latest -f ./docker/python.Dockerfile .

echo "Building C Runtime..."
docker build -t rce-c:latest -f ./docker/c.Dockerfile .

echo "Building CPP Runtime..."
docker build -t rce-cpp:latest -f ./docker/cpp.Dockerfile .
