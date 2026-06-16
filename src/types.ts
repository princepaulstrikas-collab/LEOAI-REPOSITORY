export interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  attachment?: {
    data: string; // Base64 or DataURL
    mimeType: string;
    name: string;
  };
}

export interface Persona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  instruction: string;
  placeholder: string;
  suggestedPrompts: string[];
}

export type AspectRatioType = "1:1" | "16:9" | "9:16" | "4:3";

export interface BlueprintTask {
  name: string;
  actionableInstruction: string;
  estimatedDuration: string;
  milestoneImportance: "Critical" | "Recommended" | "Sandbox";
  completed?: boolean;
}

export interface BlueprintPhase {
  phaseNumber: number;
  title: string;
  description: string;
  tasks: BlueprintTask[];
}

export interface Blueprint {
  title: string;
  summary: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Specialist";
  estimatedTotalTime: string;
  tips: string[];
  phases: BlueprintPhase[];
}

export interface ProceduralMusic {
  tempo: number;
  key: string;
  notes: number[];
  chords: Array<{ chord: string; notes: number[] }>;
  visualizerStyle: "ambient" | "techno" | "retro" | "cosmic";
  description: string;
  lyrics: string;
}

export interface UserSession {
  username: string;
  isPremium: boolean;
  email?: string;
  premiumExpires?: string;
  dailyFreeVideoCount: number;
  lastVideoDate?: string;
}

export interface EncryptedMessage {
  id: string;
  sender: string;
  encryptedText: string;
  publicKeyFingerprint: string;
  timestamp: string;
  vibeStatus: string;
}

