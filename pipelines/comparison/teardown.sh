#!/usr/bin/env bash
# [wf] execute teardown.sh stage

# remove the experiment network
docker network rm retrolambda-comparison 

# remove the docker image
docker rmi retrolambda-evaluation

# remove intermediate log files
rm -r logs
