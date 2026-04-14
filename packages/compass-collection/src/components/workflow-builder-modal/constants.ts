import { WorkflowBuilderStep } from './types';

export const WORKFLOW_BUILDER_STEP_LABELS: Record<WorkflowBuilderStep, string> =
  {
    [WorkflowBuilderStep.PROMPT_CONFIGURATION]: 'Write Prompt',
    [WorkflowBuilderStep.OUTPUT_CONFIGURATION]: 'Configure Output',
    [WorkflowBuilderStep.FILTER_CONFIGURATION]: 'Define Filters',
    [WorkflowBuilderStep.TEST_PROMPT]: 'Test Prompt',
    [WorkflowBuilderStep.MODEL_CONFIGURATION]: 'Configure Model',
    [WorkflowBuilderStep.PREVIEW_EXPORT]: 'Preview & Deploy',
  };

export const WORKFLOW_BUILDER_STEP_ORDER: WorkflowBuilderStep[] = [
  WorkflowBuilderStep.PROMPT_CONFIGURATION,
  WorkflowBuilderStep.OUTPUT_CONFIGURATION,
  WorkflowBuilderStep.FILTER_CONFIGURATION,
  WorkflowBuilderStep.TEST_PROMPT,
  WorkflowBuilderStep.MODEL_CONFIGURATION,
  WorkflowBuilderStep.PREVIEW_EXPORT,
];

export const NEXT_BUTTON_TEXT: Record<WorkflowBuilderStep, string> = {
  [WorkflowBuilderStep.PROMPT_CONFIGURATION]: 'Next: Configure Output',
  [WorkflowBuilderStep.OUTPUT_CONFIGURATION]: 'Next: Define Filters',
  [WorkflowBuilderStep.FILTER_CONFIGURATION]: 'Next: Test Prompt',
  [WorkflowBuilderStep.TEST_PROMPT]: 'Next: Configure Model',
  [WorkflowBuilderStep.MODEL_CONFIGURATION]: 'Next: Preview',
  [WorkflowBuilderStep.PREVIEW_EXPORT]: 'Close',
};

export const OUTPUT_MODE_OPTIONS = [
  { value: 'new-field' as const, label: 'Create new field' },
  { value: 'overwrite' as const, label: 'Overwrite existing field' },
  { value: 'append' as const, label: 'Append to existing field' },
];

export const TEMPERATURE_MARKS = [
  { value: 0, label: '0 (Deterministic)' },
  { value: 0.5, label: '0.5 (Balanced)' },
  { value: 1, label: '1 (Creative)' },
  { value: 2, label: '2 (Very Creative)' },
];

export const MITTAI_SERVER_URL = 'http://localhost:8787';

export const SAVED_WORKFLOWS_STORAGE_KEY = 'compass-workflow-builder-saved';

export const SCHEDULE_PRESETS = [
  { value: '', label: 'No Schedule (run manually)' },
  { value: '@every 15m', label: 'Every 15 minutes' },
  { value: '@every 1h', label: 'Every hour' },
  { value: '@every 2h', label: 'Every 2 hours' },
  { value: '@every 6h', label: 'Every 6 hours' },
  { value: '@every 12h', label: 'Every 12 hours' },
  { value: '@every 24h', label: 'Every day' },
  { value: '@every 7d', label: 'Every week' },
  { value: 'custom', label: 'Custom cron expression...' },
];
