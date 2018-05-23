#!/usr/bin/env bash
# [wf] execute run.sh stage

mkdir -p logs

docker run --rm \
    -v "$(realpath ../../workloads/retroaction):/workloads:ro" \
    -v "$(realpath ./scripts/experiment.sh):/experiment.sh:ro" \
    -v "$(realpath ./logs):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -w "/tmp" \
    -it node:9.5.0 \
    /bin/bash /experiment.sh
