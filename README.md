This module connects to a Camunda Elasticsearch cluster and converts the historic executions of a particular task to a CSV

Pass the id of the process and the id of the activity. Output will be a CSV of the variables after this task was executed

Example:

`node index 2251799813883584 Activity_0isl62b > out.csv`
