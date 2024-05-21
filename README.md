This module connects to a Camunda Elasticsearch cluster and converts the historic executions of a particular task to a CSV

Pass the id of the process and the id of the activity. Output will be a CSV of the variables after this task was executed

Example:

`node index 2251799813883584 Activity_0isl62b > out.csv`

Full Demo Runthrough:

Stop all running docker containers (e.g. from previous demos)
`docker stop $(docker ps -aq)`

Navigate to the camunda-platform directory:
`cd ../camunda-platform/`

Start Camunda:
`docker compose --profile kibana up -d`

Back to the Elasticsearch Project:
`cd ../elasticsearch/`

Run with process definition key and activity name (you can retrieve the process definition key from inspecting operate network payload):
`node index 2251799813883584 Activity_0isl62b > out.csv`
