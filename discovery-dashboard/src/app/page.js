"use client";

import { useState, useEffect } from "react";
import {
  DataTableSkeleton,
  DataTable,
  Link,
  Checkbox,
  CheckboxGroup,
  Grid,
  Column,
} from "@carbon/react";
const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } =
  DataTable;

export default function Home() {
  const [data, setData] = useState({});
  const [labels, setLabels] = useState({});

  const [onlyUserTasks, setOnlyUserTasks] = useState(true);
  const [onlyDecisions, setOnlyDecisions] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      let response = await fetch("/list");
      response = await response.json();
      setData(response.data);
      setLabels(response.labels);
      setIsLoading(false);
    })();
  }, []);

  const rows = Object.entries(data)
    .flatMap(([processKey, activities]) =>
      Object.entries(activities).map(([taskId, taskData]) => [
        processKey,
        taskId,
        taskData,
      ])
    )
    .filter((row) => {
      if (onlyUserTasks && !row[2][2]) return false;
      if (onlyDecisions && row[2][1] !== 2) return false;

      return true;
    });

  rows.sort((a, b) => {
    if (a[2][1] !== b[2][1]) {
      return b[2][1] - a[2][1];
    }
    return b[2][0] - a[2][0];
  });

  return (
    <Grid>
      <Column lg={16} md={8} sm={4} className="list_header">
        <h1>AI Decision Gateway</h1>
        <h2>Discovery Dashboard</h2>
      </Column>
      <Column lg={16} md={8} sm={4} className="list_filters">
        <h3>Filters</h3>
        <CheckboxGroup orientation="horizontal">
          <Checkbox
            labelText="Only UserTasks"
            checked={onlyUserTasks}
            id="usertask-checkbox"
            onChange={(_, { checked }) => setOnlyUserTasks(checked)}
          />
          <Checkbox
            labelText="Only Decisions"
            checked={onlyDecisions}
            id="decisions-checkbox"
            onChange={(_, { checked }) => setOnlyDecisions(checked)}
          />
        </CheckboxGroup>
      </Column>
      <Column lg={16} md={8} sm={4}>
        {isLoading ? (
          <DataTableSkeleton
            showHeader={false}
            showToolbar={false}
            columnCount={4}
            headers={[
              { header: "Process Name" },
              { header: "Task Name" },
              { header: "# Datapoints" },
              { header: "Actions" },
            ]}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Process Name</TableHeader>
                <TableHeader>Task Name</TableHeader>
                <TableHeader># Datapoints</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(([processKey, taskId, taskData]) => (
                <TableRow
                  key={`${processKey}-${taskId}`}
                  className={
                    taskData[1] === 0
                      ? "disabled"
                      : taskData[1] === 2
                      ? "important"
                      : ""
                  }
                >
                  <TableCell>
                    {labels[processKey].name} (v{labels[processKey].version})
                  </TableCell>
                  <TableCell>{labels[processKey].tasks[taskId]}</TableCell>
                  <TableCell>{taskData[0]}</TableCell>
                  <TableCell>
                    <Link
                      href={`/export/${processKey}/${taskId}.csv`}
                      download={`${taskId}.csv`}
                    >
                      Download Dataset
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Column>
    </Grid>
  );
}
