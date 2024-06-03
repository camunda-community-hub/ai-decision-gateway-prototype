import { getList } from "@/app/utils";

export async function GET() {
  try {
    const list = await getList();
    Object.keys(list.data).forEach((process) => {
      Object.keys(list.data[process]).forEach((task) => {
        list.data[process][task] = list.data[process][task].length;
      });
    });

    return Response.json(list, {
      status: 200,
    });
  } catch (e) {
    return new Response("Invalid Request", { status: 400 });
  }
}
