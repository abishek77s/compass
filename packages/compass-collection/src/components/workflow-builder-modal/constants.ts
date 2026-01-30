import { WorkflowBuilderStep } from './types';

export const WORKFLOW_BUILDER_STEP_LABELS: Record<WorkflowBuilderStep, string> =
  {
    [WorkflowBuilderStep.SAMPLE_DOCUMENT]: 'Select Fields',
    [WorkflowBuilderStep.PROMPT_CONFIGURATION]: 'Configure Prompt',
    [WorkflowBuilderStep.OUTPUT_CONFIGURATION]: 'Configure Output',
    [WorkflowBuilderStep.MODEL_CONFIGURATION]: 'Configure Model',
    [WorkflowBuilderStep.EXECUTION_SETTINGS]: 'Execution Settings',
    [WorkflowBuilderStep.PREVIEW_EXPORT]: 'Preview & Export',
  };

export const WORKFLOW_BUILDER_STEP_ORDER: WorkflowBuilderStep[] = [
  WorkflowBuilderStep.SAMPLE_DOCUMENT,
  WorkflowBuilderStep.PROMPT_CONFIGURATION,
  WorkflowBuilderStep.OUTPUT_CONFIGURATION,
  WorkflowBuilderStep.MODEL_CONFIGURATION,
  WorkflowBuilderStep.EXECUTION_SETTINGS,
  WorkflowBuilderStep.PREVIEW_EXPORT,
];

export const NEXT_BUTTON_TEXT: Record<WorkflowBuilderStep, string> = {
  [WorkflowBuilderStep.SAMPLE_DOCUMENT]: 'Next: Configure Prompt',
  [WorkflowBuilderStep.PROMPT_CONFIGURATION]: 'Next: Configure Output',
  [WorkflowBuilderStep.OUTPUT_CONFIGURATION]: 'Next: Configure Model',
  [WorkflowBuilderStep.MODEL_CONFIGURATION]: 'Next: Execution Settings',
  [WorkflowBuilderStep.EXECUTION_SETTINGS]: 'Next: Preview',
  [WorkflowBuilderStep.PREVIEW_EXPORT]: 'Close',
};

export const OUTPUT_MODE_OPTIONS = [
  { value: 'overwrite' as const, label: 'Overwrite existing field' },
  { value: 'append' as const, label: 'Append to existing field' },
  { value: 'new-field' as const, label: 'Create new field' },
];

export const TEMPERATURE_MARKS = [
  { value: 0, label: '0 (Deterministic)' },
  { value: 0.5, label: '0.5 (Balanced)' },
  { value: 1, label: '1 (Creative)' },
  { value: 2, label: '2 (Very Creative)' },
];
