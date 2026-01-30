import type { Document } from 'mongodb';

export enum WorkflowBuilderStep {
  SAMPLE_DOCUMENT = 'sample-document',
  PROMPT_CONFIGURATION = 'prompt-configuration',
  OUTPUT_CONFIGURATION = 'output-configuration',
  MODEL_CONFIGURATION = 'model-configuration',
  EXECUTION_SETTINGS = 'execution-settings',
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

export interface WorkflowBuilderState {
  isOpen: boolean;
  currentStep: WorkflowBuilderStep;
  namespace: string;
  sampleDocument: Document | null;
  selectedFields: string[];
  prompt: string;
  outputField: string;
  outputMode: OutputMode;
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  executionLimit: number;
  mongoUri: string;
}

export const INITIAL_WORKFLOW_STATE: Omit<
  WorkflowBuilderState,
  'isOpen' | 'namespace' | 'sampleDocument'
> = {
  currentStep: WorkflowBuilderStep.SAMPLE_DOCUMENT,
  selectedFields: [],
  prompt: '',
  outputField: '',
  outputMode: 'overwrite',
  modelProvider: 'gemini',
  modelName: 'gemini-3-flash-preview',
  temperature: 0.0,
  executionLimit: 5,
  mongoUri: 'mongodb://localhost:27017',
};

export const MODEL_OPTIONS: Record<
  ModelProvider,
  { label: string; models: string[] }
> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      'gemini-3-flash-preview',
      'gemini-2.0-flash',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
    ],
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
