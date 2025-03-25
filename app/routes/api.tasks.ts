import { getTasks } from "~/utils/tasks";

export const loader = async () => {
  const tasks = await getTasks();
  return { tasks };
};
