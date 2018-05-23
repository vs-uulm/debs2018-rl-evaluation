#!/usr/bin/env bash

NUM_REPEATS=30
declare -a WORKLOADS
declare -a RETROACTIONS
declare -a RETROPARAMS
RETROACTIONS[0]='modifyTaxRate'
RETROPARAMS[0]='0.2'

RETROACTIONS[1]='injectUser'
RETROPARAMS[1]='1234, 1'

# prepare container
git clone https://github.com/vs-uulm/retro-lambda.git
cd retro-lambda
git checkout tags/debs2018
JOBS=8 npm install
for workload in /workloads/*.tar.gz; do
    tar -xf $workload
    WORKLOADS+=("$(basename $workload .tar.gz | sed 's/db-//')")
done

function measure {
    date
    if [ "$#" -eq 2 ]; then
        echo -n "$1,baseline," >> $2
        node src/index.js "{ \"master\": \"$1\", \"external\": \"() => {}\", \"functions\": [], \"forceReExecution\": true }" > /dev/null 2>> $2
    else
        echo -n "$1,$3," >> $2
        node src/index.js "{ \"master\": \"$1\", \"external\": \"() => {}\", \"functions\": [[\"$5\", $4, $6]] }" > /dev/null 2>> $2
    fi
    date
}

for i in $(seq 0 $(( ${#RETROACTIONS[@]} - 1 ))); do
    output="/out/results-${i}.csv"

    echo "Retroaction: ${RETROACTIONS[$i]} ${RETROPARAMS[$i]}"
    echo "workload,targetClock,workerClock,executionTime,skippedFunctions,reExecutedFunctions,finishedFunctions,appliedCommands,reExecutedCommands" >> $output

    for workload in "${WORKLOADS[@]}"; do
        echo "Workload: ${workload}"
        echo "Measuring baseline:"
        for k in $(seq 1 ${NUM_REPEATS}); do
            echo "${k}..."
            measure "${workload}" "${output}"
        done

        workerClock=$(tail -n 1 $output | sed -r 's/[^,]*,[^,]*,([^,]*).*/\1/')
        echo $workerClock

        declare -a clocks
        declare -a percs

        percs[0]='10%'
        clocks[0]=$(echo $workerClock | awk '{ printf "%d\n", $0 * .1 }')

        percs[1]='50%'
        clocks[1]=$(echo $workerClock | awk '{ printf "%d\n", $0 * .5 }')

        percs[2]='90%'
        clocks[2]=$(echo $workerClock | awk '{ printf "%d\n", $0 * .9 }')

        for j in $(seq 0 2); do
            echo "Measuring retroaction at ${percs[$j]}:"

            for k in $(seq 1 ${NUM_REPEATS}); do
                echo "${k}..."
                measure "${workload}" "${output}" "${percs[$j]}" "${clocks[$j]}" "${RETROACTIONS[$i]}" "${RETROPARAMS[$i]}"
            done
        done
    done
done
