export enum AppScreen {
  SPLASH = 'SPLASH',
  ERA_SELECTION = 'ERA_SELECTION',
  CAMERA = 'CAMERA',
  PREVIEW = 'PREVIEW',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT',
}

export enum EraId {
  CAREERS = 'careers',
  SNAP_A_MEMORY = 'snap_a_memory'
}

export interface EraData {
  id: EraId;
  name: string;
  description: string;
  promptInstructions: string;
  isAiGenerated?: boolean;
}

export interface FaceDetectionResult {
  maleCount: number;
  femaleCount: number;
  childCount: number;
  totalPeople: number;
}