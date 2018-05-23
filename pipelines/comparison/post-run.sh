#!/usr/bin/env bash
# [wf] execute post-run.sh stage

docker run --rm \
    -v "$(realpath scripts):/scripts:rw" \
    -v "$(realpath ./logs):/logs:ro" \
    -v "$(realpath ./plots):/out:rw" \
    -u "$(id -u):$(id -g)" \
    -w "/tmp" \
    -i rocker/tidyverse:3.5.0 \
    /bin/sh -c "Rscript /scripts/plot.R"
