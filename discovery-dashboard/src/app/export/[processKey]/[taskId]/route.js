import { getList } from "@/app/utils";

export async function GET(request, { params }) {
  const { processKey, taskId } = params;

  if (!processKey || !taskId.endsWith(".csv")) {
    return new Response("Invalid Request", { status: 400 });
  }

  const list = await getList();
  try {
    return new Response(getCSV(list[processKey][taskId.slice(0, -4)]), {
      status: 200,
    });
  } catch (e) {
    return new Response("Invalid Request", { status: 400 });
  }
}

function getCSV(entries) {
  let inputs = new Set();
  let outputs = new Set();

  entries.forEach(({ before, after }) => {
    const inKeys = Object.keys(before);
    inKeys.forEach((inkey) => {
      inputs.add(inkey);
    });
    const outkeys = Object.keys(after);
    outkeys.forEach((outkey) => {
      if (before[outkey] !== after[outkey]) {
        outputs.add(outkey);
      }
    });
  });

  inputs = Array.from(inputs);
  outputs = Array.from(outputs);

  const keys = [
    "Process Instance Key",
    "StartTime",
    "EndTime",
    ...inputs.map((key) => "Input: " + key),
    ...outputs.map((key) => "Output: " + key),
  ];
  const values = entries.map(
    ({ before, after, processInstanceId, start, end }) => [
      processInstanceId,
      new Date(start).toISOString(),
      new Date(end).toISOString(),
      ...inputs.map((key) => before[key]),
      ...outputs.map((key) => after[key]),
    ]
  );

  return (
    keys.join(",") + "\n" + values.map((value) => value.join(",")).join("\n")
  );
}
