/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getList } from "@/app/utils";

export async function GET(request, { params }) {
  const { processKey, taskId } = params;

  if (!processKey || !taskId.endsWith(".csv")) {
    return new Response("Invalid Request", { status: 400 });
  }

  const { data, labels } = await getList();

  const list = data;
  try {
    return new Response(getCSV(list[processKey][taskId.slice(0, -13)]), {
      status: 200,
    });
  } catch (e) {
    console.log(e);
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
  const values = entries
    .filter((_, idx) => idx % 5 !== 0)
    .map(({ before, after, processInstanceId, start, end }) => [
      processInstanceId,
      new Date(start).toISOString(),
      new Date(end).toISOString(),
      ...inputs.map((key) => {
        if (!before[key]) return before[key];
        const parsed = JSON.parse(before[key]);
        if (typeof parsed === "string") {
          return `"${parsed.replaceAll(`"`, `\"`)}"`;
        }
        if (typeof parsed === "object") {
          return `"${JSON.stringify(parsed).replaceAll(`"`, `""`)}"`;
        }
        return parsed.toString();
      }),
      ...outputs.map((key) => {
        if (!after[key]) return after[key];
        const parsed = JSON.parse(after[key]);
        if (typeof parsed === "string") {
          return `"${parsed.replaceAll(`"`, `\"`)}"`;
        }
        if (typeof parsed === "object") {
          return `"${JSON.stringify(parsed).replaceAll(`"`, `""`)}"`;
        }
        return parsed.toString();
      }),
    ]);

  return (
    keys.join(",") + "\n" + values.map((value) => value.join(",")).join("\n")
  );
}
