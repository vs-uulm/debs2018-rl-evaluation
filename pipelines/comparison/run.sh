#!/usr/bin/env bash
# [wf] execute run.sh stage

APIS=("memory" "postgres" "retro-lambda")

for workload in ../../workloads/comparison/*.tar.gz; do
    echo "Using workload $(basename $workload .tar.gz)..."

    for api in ${APIS[@]}; do
        echo "Using ${api} API..."

        if [ "$api" = "postgres" ]; then
            SCHEMA=$(realpath $(dirname ${BASH_SOURCE[0]})/schema.sql)
            echo "Starting database..."
            docker run -d --name database \
                --network retrolambda-comparison \
                -v "$(realpath ../../sample-applications/api/postgres/schema.sql):/docker-entrypoint-initdb.d/schema.sql" \
                -e "POSTGRES_PASSWORD=db" \
                -e "POSTGRES_USER=db" \
                postgres:alpine
            sleep 5
        fi

        echo "Starting server..."
        docker run -d --name server \
            --network retrolambda-comparison \
            -v "$(realpath ./logs):/tmp/logs:rw" \
            -u "$(id -u):$(id -g)" \
            -e "WORKLOAD=$(basename $workload .tar.gz)" \
            -e "API=${api}" \
            -e "PORT=8080" \
            -w "/tmp" \
            retrolambda-evaluation

        # give the server a head start
        sleep 5

        echo "Starting streamer..."
        docker run --rm --name streamer \
            --network retrolambda-comparison \
            -v "$(realpath ./scripts/streamer.sh):/streamer.sh:ro" \
            -v "$(realpath $workload):/workload.tar.gz:ro" \
            -e "API_ENDPOINT=http://server:8080/shop" \
            -u "$(id -u):$(id -g)" \
            -w "/tmp" \
            -i node:9.5.0-slim \
            /bin/sh "/streamer.sh"

        docker wait server

        if [ "$api" = "postgres" ]; then
            sleep 5
            echo "Stopping database..."
            docker stop database
            docker rm database
        fi

        docker logs server
        docker rm server
    done
done
