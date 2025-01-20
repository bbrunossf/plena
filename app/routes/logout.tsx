import type { ActionFunctionArgs } from "@remix-run/node";
import { logout } from "~/session.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  return logout(request);
};
