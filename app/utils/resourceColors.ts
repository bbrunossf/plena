// app/utils/resourceColors.ts
//Usar com as modificações no _index.tsx, conforme chat
//<https://claude.ai/chat/b8de4fd7-81dd-4f4b-8414-df8695e38471>

// Interface para o recurso com suas cores associadas
export interface ResourceWithColors {
  ResourceId: number;
  ResourceName: string;
  taskbarColor: string;
  progressBarColor: string;
  backgroundColor: string;
  textColor: string;
}

// Lista de combinações de cores predefinidas que podem ser usadas
const colorPalettes = [
  { taskbar: '#DFECFF', progress: '#006AA6', background: '#DFECFF', text: '#006AA6' },
  { taskbar: '#E4E4E7', progress: '#766B7C', background: '#E4E4E7', text: '#766B7C' },
  { taskbar: '#DFFFE2', progress: '#00A653', background: '#DFFFE2', text: '#00A653' },
  { taskbar: '#FFEBE9', progress: '#FF3740', background: '#FFEBE9', text: '#FF3740' },
  { taskbar: '#FFF4D6', progress: '#FFA500', background: '#FFF4D6', text: '#FFA500' },
  { taskbar: '#E6E6FA', progress: '#8A2BE2', background: '#E6E6FA', text: '#8A2BE2' },
  { taskbar: '#F0FFF0', progress: '#2E8B57', background: '#F0FFF0', text: '#2E8B57' },
  { taskbar: '#F0F8FF', progress: '#4682B4', background: '#F0F8FF', text: '#4682B4' },
];

/**
 * Gera uma cor hexadecimal aleatória
 */
export function getRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

/**
 * Gera um conjunto de cores aleatórias para um recurso
 */
export function generateRandomResourceColors() {
  const taskbar = getRandomColor();
  const progress = getRandomColor();
  return {
    taskbar,
    progress,
    background: taskbar, // Pode usar a mesma cor ou uma versão mais clara
    text: progress
  };
}

/**
 * Enriquece uma lista de recursos com cores
 * @param resources Array de recursos originais
 * @param useRandomColors Se true, gera cores aleatórias; se false, usa a paleta predefinida
 */
export function enrichResourcesWithColors(
  resources: Array<{ ResourceId: number; ResourceName: string }>,
  useRandomColors = false
): ResourceWithColors[] {
  return resources.map((resource, index) => {
    let colors;
    
    if (useRandomColors) {
      colors = generateRandomResourceColors();
    } else {
      // Usa cores da paleta, com loop quando os recursos excederem a quantidade de paletas
      const paletteIndex = index % colorPalettes.length;
      colors = colorPalettes[paletteIndex];
    }
    
    return {
      ...resource,
      taskbarColor: colors.taskbar,
      progressBarColor: colors.progress,
      backgroundColor: colors.background,
      textColor: colors.text
    };
  });
}

/**
 * Encontra um recurso enriquecido pelo ID
 */
export function findResourceById(
  resources: ResourceWithColors[],
  resourceId: number
): ResourceWithColors | undefined {
  return resources.find(r => r.ResourceId === resourceId);
}

/**
 * Encontra um recurso enriquecido pelo nome
 */
export function findResourceByName(
  resources: ResourceWithColors[],
  resourceName: string
): ResourceWithColors | undefined {
  return resources.find(r => r.ResourceName === resourceName);
}
