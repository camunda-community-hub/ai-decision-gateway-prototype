import { getList } from "./utils";

export default async function Home() {
  const { data, labels } = await getList();

  const rows = Object.entries(data).flatMap(([processKey, activities]) =>
    Object.entries(activities).map(([taskId, taskData]) => [
      processKey,
      taskId,
      taskData.length,
    ])
  );

  rows.sort((a, b) => b[2] - a[2]);

  return (
    <main>
      <table>
        <thead>
          <tr>
            <th>Process Name</th>
            <th>Task Name</th>
            <th># Datapoints</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([processKey, taskId, taskData]) => (
            <tr key={`${processKey}-${taskId}`}>
              <th>
                {labels[processKey].name} (v{labels[processKey].version})
              </th>
              <th>{labels[processKey].tasks[taskId]}</th>
              <td>{taskData}</td>
              <td>
                <a
                  href={`/export/${processKey}/${taskId}.csv`}
                  download={`${taskId}.csv`}
                >
                  Download Dataset
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
