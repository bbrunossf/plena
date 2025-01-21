// app/utils/auth.server.ts
import { redirect } from "@remix-run/node";
import { getSession } from "~/session.server"; // Substitua pelo correto
import { getUserById } from "~/user.server";

export async function requireAdmin(request: Request) {
  const session = await getSession(request);
  const userId = session.get("userId");

  if (!userId) {
    throw redirect("/denied");
  }

  const user = await getUserById(userId);

  if (!user || user.role !== "admin") {
    throw redirect("/denied");
  }
}