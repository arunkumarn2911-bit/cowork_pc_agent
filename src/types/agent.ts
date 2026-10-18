export type RiskLevel = "SAFE" | "CONSEQUENTIAL";

export type SubAgentType = "browser_agent" | "data_agent" | "filesystem_agent" | "system_agent";

export interface PlanStep {
  id: string;
  agent: SubAgentType | string;
  function: string;
  arguments: Record<string, any>;
  description: string;
  risk: RiskLevel;
  status?: "pending" | "running" | "success" | "error" | "blocked_approval";
  output?: any;
  duration_ms?: number;
  error_message?: string;
  visionVerified?: boolean;
}

export interface VisionVerificationResult {
  verified: boolean;
  confidence: number;
  visual_evidence: string;
  visible_elements: string[];
  extracted_data?: Record<string, any>;
  visual_quality?: "sharp" | "blurred" | "partial";
  reasoning: string;
  model_used: string;
  timestamp: number;
}

export interface WeatherData {
  location: string;
  temperature: string;
  temperature_c: number;
  condition: string;
  precipitation: string;
  humidity: string;
  wind: string;
  hourly: Array<{ time: string; temp: string; condition: string; pop: string }>;
  forecast: Array<{ day: string; high: string; low: string; condition: string }>;
  source_url: string;
  verified_by_vision: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "agent" | "system";
  stage?: number;
  stageName?: string;
  text?: string;
  timestamp: number;
  clarification?: {
    id: string;
    question: string;
    options: string[];
    allowCustom?: boolean;
    modelUsed?: { provider: string; model: string };
    answered?: string | null;
  };
  actionPlan?: {
    summary: string;
    targetEnvironment?: string;
    steps: PlanStep[];
    modelUsed?: { provider: string; model: string };
    isApproved: boolean;
    chatGptPrompt?: string;
    weatherQuery?: string;
  };
  weatherResult?: WeatherData;
  visionInspection?: {
    screenshotFilename: string;
    screenshotUrl?: string;
    result: VisionVerificationResult;
  };
  errorRemediation?: {
    stepId: string;
    functionName: string;
    errorMessage: string;
    domSnapshot?: string;
    modelUsed?: { provider: string; model: string };
  };
  continuity?: {
    summary: string;
    artifacts: Array<{ filename: string; size_bytes?: number; verified?: boolean; vision_verified?: boolean }>;
    targetEnvironment?: string;
    weatherData?: WeatherData;
  };
  mediaResults?: {
    query: string;
    items: Array<{
      id: string;
      title: string;
      channel: string;
      views: string;
      duration: string;
      videoId: string;
    }>;
    activeVideoId?: string;
    activeTitle?: string;
    autoPlay?: boolean;
  };
  chatGptResult?: {
    prompt: string;
    code: string;
    explanation?: string;
    savedFile?: string;
  };
  portalConfirmation?: {
    portal: string;
    url: string;
    question: string;
    options: string[];
    confirmed?: boolean;
  };
  continuityOptions?: string[];
  modelUsed?: { provider: string; model: string };
}
