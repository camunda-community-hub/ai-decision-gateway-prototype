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

export async function GET() {
  try {
    const list = await getList();

    return Response.json(
      {
        labels: list.labels,
        data: Object.keys(list.data).reduce((acc, process) => {
          acc[process] = Object.keys(list.data[process])
            .map((task) => [
              task,
              list.data[process][task].length,
              isInteresting(list.data[process][task]),
              list.data[process][task].some((task) => task.isUserTask),
            ])
            .reduce((acc, [task, count, interestingFactor, isUserTask]) => {
              acc[task] = [count, interestingFactor, isUserTask];
              return acc;
            }, {});
          return acc;
        }, {}),
      },
      {
        status: 200,
      }
    );
  } catch (e) {
    console.log("exception", e);
    return new Response("Invalid Request", { status: 400 });
  }
}

function isInteresting(entries) {
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

  // no outputs, very uninteresting
  if (outputs.length === 0) return 0;

  let foundInterestingOutputColumn = false;
  outputs.forEach((output) => {
    const uniqueOutputValues = new Set();
    entries.forEach(({ after }) => {
      uniqueOutputValues.add(after[output]);
    });
    if (
      uniqueOutputValues.size > 1 &&
      uniqueOutputValues.size < entries.length
    ) {
      foundInterestingOutputColumn = true;
    }
  });

  if (foundInterestingOutputColumn) return 2;

  // outputs, but all of them are either the same number, or all different
  return 1;
}
