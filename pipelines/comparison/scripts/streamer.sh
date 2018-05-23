#!/bin/sh
tar -xzf /workload.tar.gz
for workload in */*.sh; do
    sh $workload &
done

# wait until all requests were streamed
wait

# shut down platform
curl -s "${API_ENDPOINT}/exit"
