#!/usr/bin/env bash
# [wf] execute setup.sh stage

# create a network for the experiment
docker network create retrolambda-comparison 

# prepare docker image
docker build ../../sample-applications -t retrolambda-evaluation

# create logs directory
mkdir -p logs

# create plots directory
mkdir -p plots
