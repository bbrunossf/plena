import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";

// Cria uma instância do Prisma Client
const prisma = new PrismaClient();

// Aplica o Zenstack ao Prisma Client para adicionar políticas de acesso e validações
const enhancedPrisma = enhance(prisma);

// Funções CRUD para tarefas
const taskService = {
  // Cria uma nova tarefa
  async createTask(taskData: {
    taskName: string;
    startDate: Date;
    endDate: Date;
    duration?: number;
    progress?: number;
    parentId?: number;
    isRecurring?: boolean;
    recurrenceId?: number;
    predecessorId?: number;
    dependencyType?: string;
    notes?: string;
  }) {
    return enhancedPrisma.task.create({
      data: taskData,
    });
  },

  // Busca uma tarefa por ID, incluindo relações
  async getTaskById(taskId: number) {
    return enhancedPrisma.task.findUnique({
      where: { id: taskId },
      include: {
        parent: true,
        subtasks: true,
        recurrence: true,
        predecessor: true,
        successors: true,
        resources: true,
        updates: true,
      },
    });
  },

  // Atualiza uma tarefa existente
  async updateTask(taskId: number, taskData: {
    taskName?: string;
    startDate?: Date;
    endDate?: Date;
    duration?: number;
    progress?: number;
    parentId?: number;
    isRecurring?: boolean;
    recurrenceId?: number;
    predecessorId?: number;
    dependencyType?: string;
    notes?: string;
  }) {
    return enhancedPrisma.task.update({
      where: { id: taskId },
      data: taskData,
    });
  },

  // Exclui uma tarefa por ID
  async deleteTask(taskId: number) {
    return enhancedPrisma.task.delete({
      where: { id: taskId },
    });
  },

  // // Lista todas as tarefas (com paginação opcional)
  // async listTasks(skip: number = 0, take: number = 10) {
  //   return enhancedPrisma.task.findMany({
  //     skip,
  //     take,
  //     include: {
  //       parent: true,
  //       subtasks: true,
  //       recurrence: true,
  //       predecessor: true,
  //       successors: true,
  //     },
  //   });
  // },
  // Lista todas as tarefas (com paginação opcional)
  async listTasks() {
    const tasks = enhancedPrisma.task.findMany({      
    });
    return tasks;
    console.log("tarefas encontradass", tasks);
  },

  // Cria um padrão de recorrência
  async createRecurrencePattern(recurrenceData: {
    recurrenceType: string;
    interval?: number;
    daysOfWeek?: string;
    dayOfMonth?: number;
    weekOfMonth?: number;
    month?: number;
    occurrenceCount?: number;
    endDate?: Date;
    excludeDates?: string;
  }) {
    return enhancedPrisma.recurrencePattern.create({
      data: recurrenceData,
    });
  },

  // Atualiza um padrão de recorrência
  async updateRecurrencePattern(patternId: number, recurrenceData: {
    recurrenceType?: string;
    interval?: number;
    daysOfWeek?: string;
    dayOfMonth?: number;
    weekOfMonth?: number;
    month?: number;
    occurrenceCount?: number;
    endDate?: Date;
    excludeDates?: string;
  }) {
    return enhancedPrisma.recurrencePattern.update({
      where: { id: patternId },
      data: recurrenceData,
    });
  },

  // Exclui um padrão de recorrência
  async deleteRecurrencePattern(patternId: number) {
    return enhancedPrisma.recurrencePattern.delete({
      where: { id: patternId },
    });
  },
};

export default taskService;