import { getList } from "@/app/utils";

export async function GET() {
  try {
    const list = await getList();

    return Response.json(
      {
        labels: list.labels,
        data: Object.keys(list.data).reduce((acc, process) => {
          acc[process] = Object.keys(list.data[process])
            .map((task) => [task, list.data[process][task].length])
            .reduce((acc, [task, count]) => {
              acc[task] = count;
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
