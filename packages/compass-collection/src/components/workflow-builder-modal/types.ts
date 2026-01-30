import type { Document } from 'mongodb';

export enum WorkflowBuilderStep {
  PROMPT_CONFIGURATION = 'prompt-configuration',
  OUTPUT_CONFIGURATION = 'output-configuration',
  MODEL_CONFIGURATION = 'model-configuration',
  PREVIEW_EXPORT = 'preview-export',
}

export type OutputMode = 'overwrite' | 'append' | 'new-field';

export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'azure-openai';

export interface WorkflowConfiguration {
  mongo: {
    uri: string;
    database: string;
    collection: string;
  };
  input_fields: string[];
  output: {
    field: string;
    mode: OutputMode;
  };
  prompt: string;
  model: {
    provider: ModelProvider;
    name: string;
    temperature: number;
  };
  execution: {
    limit?: number;
  };
}

export interface TestResult {
  sampleDocument: Document | null;
  builtPrompt: string;
  modelOutput: string;
}

export interface WorkflowBuilderState {
  isOpen: boolean;
  currentStep: WorkflowBuilderStep;
  namespace: string;
  sampleDocument: Document | null;
  prompt: string;
  outputField: string;
  outputMode: OutputMode;
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  executionLimit: number;
  mongoUri: string;
  maskedUri: string;
  // Test state
  isTestLoading: boolean;
  testResult: TestResult | null;
  testError: string | null;
}

export const INITIAL_WORKFLOW_STATE: Omit<
  WorkflowBuilderState,
  'isOpen' | 'namespace' | 'sampleDocument' | 'mongoUri' | 'maskedUri'
> = {
  currentStep: WorkflowBuilderStep.PROMPT_CONFIGURATION,
  prompt: '',
  outputField: '',
  outputMode: 'new-field',
  modelProvider: 'gemini',
  modelName: 'gemini-2.0-flash',
  temperature: 0.0,
  executionLimit: 5,
  isTestLoading: false,
  testResult: null,
  testError: null,
};

export const MODEL_OPTIONS: Record<
  ModelProvider,
  { label: string; models: string[] }
> = {
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-sonnet'],
  },
  'azure-openai': {
    label: 'Azure OpenAI',
    models: ['gpt-4', 'gpt-35-turbo'],
  },
};

// Helper to extract field names from prompt using @fieldname syntax
export function extractFieldsFromPrompt(prompt: string): string[] {
  const regex = /@([\w.]+)/g;
  const fields: string[] = [];
  let match;
  while ((match = regex.exec(prompt)) !== null) {
    if (!fields.includes(match[1])) {
      fields.push(match[1]);
    }
  }
  return fields;
}

// Convert @fieldname to {{fieldname}} for config
export function convertPromptToConfig(prompt: string): string {
  return prompt.replace(/@([\w.]+)/g, '{{$1}}');
}

// Mask sensitive parts of MongoDB URI
export function maskMongoUri(uri: string): string {
  try {
    // Handle mongodb+srv:// and mongodb://
    const regex = /^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/;
    const match = uri.match(regex);
    if (match) {
      const [, protocol, username, , rest] = match;
      return `${protocol}${username}:****@${rest}`;
    }
    return uri;
  } catch {
    return uri;
  }
}
