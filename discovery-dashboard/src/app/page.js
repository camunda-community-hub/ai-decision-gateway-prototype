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

  rows.sort((a, b) => b[2] - a[2]);

  return (
    <main>
      <Table useZebraStyles>
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
            <TableRow key={`${processKey}-${taskId}`}>
              <TableCell>
                {labels[processKey].name} (v{labels[processKey].version})
              </TableCell>
              <TableCell>{labels[processKey].tasks[taskId]}</TableCell>
              <TableCell>{taskData}</TableCell>
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
