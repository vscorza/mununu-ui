export interface TutorialStep {
  target: string | (() => HTMLElement | null);
  content: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  title?: string;
}

export interface TutorialState {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
}
