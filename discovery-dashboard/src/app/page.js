"use client";

import { useState, useEffect } from "react";
import { DataTable, Link } from "@carbon/react";
const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } =
  DataTable;

export default function Home() {
  const [data, setData] = useState({});
  const [labels, setLabels] = useState({});

  useEffect(() => {
    (async () => {
      let response = await fetch("/list");
      response = await response.json();
      setData(response.data);
      setLabels(response.labels);
    })();
  }, []);

  const rows = Object.entries(data).flatMap(([processKey, activities]) =>
    Object.entries(activities).map(([taskId, taskData]) => [
      processKey,
      taskId,
      taskData,
    ])
  );

  rows.sort((a, b) => {
    if (a[2][1] !== b[2][1]) {
      return b[2][1] - a[2][1];
    }
    return b[2][0] - a[2][0];
  });

  return (
    <main>
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
    </main>
  );
}
