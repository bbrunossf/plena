// app/utils/auth.server.ts
import { redirect } from "@remix-run/node";
import { getSession } from "~/session.server"; // Substitua pelo correto
import { getUserById } from "~/user.server";

export async function requireAdmin(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");

  // if (!userId) {
  //   throw redirect("/login");
  // }
  
  if (!userId) {
    throw new Response("Access denied", { status: 403 });
  }

  const user = await getUserById(userId);

  // if (!user || user.role !== "admin") {
  //   throw redirect("/login"); // Redireciona se não for admin
  // }

  if (!user || user.role !== "admin") {
    throw redirect("/denied", {
      status: 403,
      statusText: "Access Denied"
    });
}
}
