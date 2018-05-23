# retro-λ: Shopping Cart Service Evaluation

[![DOI](https://img.shields.io/badge/doi-10.1145/3210284.3210285-blue.svg)](https://doi.org/10.1145/3210284.3210285) [![GitHub license](https://img.shields.io/github/license/vs-uulm/debs2018-rl-evaluation.svg)](https://github.com/vs-uulm/debs2018-rl-evaluation/blob/master/LICENSE)

Dominik Meißner, Benjamin Erb, Frank Kargl, and Matthias Tichy. 2018. RETRO-λ: An Event-sourced Platform for Serverless Applications with Retroactive Computing Support. In DEBS '18: The 12th ACM International Conference on Distributed and Event-based Systems, June 25-29, 2018, Hamilton, New Zealand. ACM, New York, NY, USA, 12 pages. https://doi.org/10.1145/3210284.3210285

This repository contains source code artifacts and workloads to reproduce evaluation results of [retro-λ](https://github.com/vs-uulm/retro-lambda).
The included workloads were generated using the [workload generator](https://github.com/vs-uulm/debs2018-rl-workload-generator).

## Getting Started
The experiments in this repository follow the Popper convention.
The only dependencies that are necessary to replicate results or re-generate the graphics are the [Popper CLI tool](http://popper.readthedocs.io/en/latest/protocol/getting_started.html#quickstart-guide) and [Docker](https://www.docker.com/community-edition).
Assuming both Docker and the Popper CLI tool are installed, it is sufficient to execute the following command in the subdirectories of the `pipelines/` directory:
```sh
popper run
```

In case the Popper CLI tool is not available, the individual experiment stages can be executed manually:
```sh
./setup.sh
./run.sh
./post-run.sh
./validate.sh
./teardown.sh
```

Quick description of the individual stages:

 * `setup.sh`. Generates the workloads for the 2nd stage.
 * `run.sh`. Invokes all log pruning approaches and prepares data for the analysis step.
 * `post-run.sh`. Executes the analysis and generates the graphics.
 * `validate.sh`. Validates that the pipeline was executed correctly.
 * `teardown.sh`. Removes workloads and intermediate data.
