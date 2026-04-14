import type { Document } from 'mongodb';

export enum WorkflowBuilderStep {
  PROMPT_CONFIGURATION = 'prompt-configuration',
  OUTPUT_CONFIGURATION = 'output-configuration',
  FILTER_CONFIGURATION = 'filter-configuration',
  TEST_PROMPT = 'test-prompt',
  MODEL_CONFIGURATION = 'model-configuration',
  PREVIEW_EXPORT = 'preview-export',
}

export type OutputMode = 'overwrite' | 'append' | 'new-field';

export type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'azure-openai';

// Filter condition types
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'exists'
  | 'not_exists'
  | 'array_size_gte'
  | 'array_size_lte'
  | 'array_size_eq'
  | 'regex'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte';

export interface FilterCondition {
  id: string;
  field: string;
  operator: FilterOperator;
  value: string | number | boolean;
  enabled: boolean;
}

export type Condition =
  | { type: 'regex'; field: string; pattern: string }
  | {
      type: 'array_length';
      field: string;
      operator: '>' | '>=' | '<' | '<=' | '==';
      value: number;
    }
  | { type: 'exists'; field: string }
  | { type: 'not_empty'; field: string };

export interface WorkflowConfiguration {
  mongo: {
    uri: string;
    database: string;
    collection: string;
    filter?: Record<string, unknown>;
  };
  input_fields: string[];
  output: {
    field: string;
    mode: OutputMode;
    status_field?: string;
    status_value?: unknown;
  };
  prompt: string;
  model: {
    provider: ModelProvider;
    name: string;
    temperature: number;
    api_key?: string;
  };
  conditions?: Condition[];
  schedule?: string;
  execution: {
    limit?: number;
  };
}

export interface TestResult {
  sampleDocument: Document | null;
  builtPrompt: string;
  modelOutput: string;
  conditionsPassed?: boolean;
}

export interface SavedWorkflow {
  id: string;
  user_id?: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  config: WorkflowConfiguration & {
    mongo: {
      uri?: string;
      database: string;
      collection: string;
      filter?: Record<string, unknown>;
    };
  };
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
  // Filter state
  filterConditions: FilterCondition[];
  // Test state
  isTestLoading: boolean;
  testResult: TestResult | null;
  testError: string | null;
  // Saved workflows
  savedWorkflows: SavedWorkflow[];
  selectedWorkflowId: string | null;
  // Schedule & post-processing
  schedule: string;
  statusField: string;
  statusValue: string;
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
  modelName: 'gemini-3.1-flash-lite-preview',
  temperature: 0.0,
  executionLimit: 5,
  filterConditions: [],
  isTestLoading: false,
  testResult: null,
  testError: null,
  savedWorkflows: [],
  selectedWorkflowId: null,
  schedule: '',
  statusField: '',
  statusValue: '',
};

export const MODEL_OPTIONS: Record<
  ModelProvider,
  { label: string; models: string[] }
> = {
  gemini: {
    label: 'Google Gemini',
    models: [
      'gemini-3.1-flash-lite-preview',
      'gemini-2.5-flash-preview-05-20',
      'gemini-2.5-pro-preview-06-05',
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

export const FILTER_OPERATOR_OPTIONS: {
  value: FilterOperator;
  label: string;
  description: string;
}[] = [
  { value: 'equals', label: 'Equals', description: 'Field equals value' },
  {
    value: 'not_equals',
    label: 'Not Equals',
    description: 'Field does not equal value',
  },
  { value: 'exists', label: 'Exists', description: 'Field exists' },
  {
    value: 'not_exists',
    label: 'Does Not Exist',
    description: 'Field does not exist',
  },
  {
    value: 'array_size_gte',
    label: 'Array Size ≥',
    description: 'Array has at least N elements',
  },
  {
    value: 'array_size_lte',
    label: 'Array Size ≤',
    description: 'Array has at most N elements',
  },
  {
    value: 'array_size_eq',
    label: 'Array Size =',
    description: 'Array has exactly N elements',
  },
  {
    value: 'regex',
    label: 'Regex Match',
    description: 'Field matches regex pattern',
  },
  { value: 'gt', label: 'Greater Than', description: 'Field > value' },
  {
    value: 'gte',
    label: 'Greater Than or Equal',
    description: 'Field ≥ value',
  },
  { value: 'lt', label: 'Less Than', description: 'Field < value' },
  { value: 'lte', label: 'Less Than or Equal', description: 'Field ≤ value' },
];

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

// Convert filter conditions to MongoDB filter object
export function buildMongoFilter(
  conditions: FilterCondition[]
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};

  for (const condition of conditions) {
    if (!condition.enabled || !condition.field) continue;

    switch (condition.operator) {
      case 'equals':
        filter[condition.field] = condition.value;
        break;
      case 'not_equals':
        filter[condition.field] = { $ne: condition.value };
        break;
      case 'exists':
        filter[condition.field] = { $exists: true };
        break;
      case 'not_exists':
        filter[condition.field] = { $exists: false };
        break;
      case 'array_size_gte':
        filter[`${condition.field}.${Number(condition.value) - 1}`] = {
          $exists: true,
        };
        break;
      case 'array_size_lte':
        filter[`${condition.field}.${Number(condition.value)}`] = {
          $exists: false,
        };
        break;
      case 'array_size_eq':
        filter[condition.field] = { $size: Number(condition.value) };
        break;
      case 'regex':
        filter[condition.field] = {
          $regex: String(condition.value),
          $options: 'i',
        };
        break;
      case 'gt':
        filter[condition.field] = { $gt: Number(condition.value) };
        break;
      case 'gte':
        filter[condition.field] = { $gte: Number(condition.value) };
        break;
      case 'lt':
        filter[condition.field] = { $lt: Number(condition.value) };
        break;
      case 'lte':
        filter[condition.field] = { $lte: Number(condition.value) };
        break;
    }
  }

  return filter;
}

// Generate unique ID for filter conditions
export function generateFilterId(): string {
  return `filter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate unique ID for saved workflows
export function generateWorkflowId(): string {
  return `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
