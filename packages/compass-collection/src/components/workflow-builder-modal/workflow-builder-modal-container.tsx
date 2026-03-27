import { connect } from 'react-redux';
import type { CollectionState } from '../../modules/collection-tab';
import {
  closeWorkflowBuilderModal,
  workflowBuilderNextStep,
  workflowBuilderPreviousStep,
  workflowBuilderPromptChanged,
  workflowBuilderOutputFieldChanged,
  workflowBuilderOutputModeChanged,
  workflowBuilderModelProviderChanged,
  workflowBuilderModelNameChanged,
  workflowBuilderTemperatureChanged,
  workflowBuilderExecutionLimitChanged,
  workflowBuilderFilterConditionsChanged,
  workflowBuilderSaveWorkflow,
} from '../../modules/collection-tab';
import WorkflowBuilderModal from './workflow-builder-modal';
import type {
  WorkflowBuilderState,
  OutputMode,
  ModelProvider,
  FilterCondition,
} from './types';
import {
  WorkflowBuilderStep,
  INITIAL_WORKFLOW_STATE,
  maskMongoUri,
} from './types';

interface StateProps {
  state: WorkflowBuilderState;
}

interface DispatchProps {
  onClose: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onPromptChange: (prompt: string) => void;
  onOutputFieldChange: (field: string) => void;
  onOutputModeChange: (mode: OutputMode) => void;
  onModelProviderChange: (provider: ModelProvider) => void;
  onModelNameChange: (name: string) => void;
  onTemperatureChange: (temp: number) => void;
  onExecutionLimitChange: (limit: number) => void;
  onFilterConditionsChange: (conditions: FilterCondition[]) => void;
  onSaveWorkflow: (name: string, description: string) => void;
}

// Define a more flexible type for the workflow builder state from Redux
interface WorkflowBuilderReduxState {
  isModalOpen?: boolean;
  currentStep?: string;
  prompt?: string;
  outputField?: string;
  outputMode?: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  executionLimit?: number;
  mongoUri?: string;
  sampleDocument?: Document | null;
  filterConditions?: FilterCondition[];
  savedWorkflows?: WorkflowBuilderState['savedWorkflows'];
  selectedWorkflowId?: string | null;
}

const mapStateToProps = (state: CollectionState): StateProps => {
  const wb = state.workflowBuilder as WorkflowBuilderReduxState | undefined;
  const mongoUri = wb?.mongoUri ?? 'mongodb://localhost:27017';

  return {
    state: {
      isOpen: wb?.isModalOpen ?? false,
      currentStep:
        (wb?.currentStep as WorkflowBuilderStep) ??
        WorkflowBuilderStep.PROMPT_CONFIGURATION,
      namespace: state.namespace,
      sampleDocument: wb?.sampleDocument ?? null,
      prompt: wb?.prompt ?? INITIAL_WORKFLOW_STATE.prompt,
      outputField: wb?.outputField ?? INITIAL_WORKFLOW_STATE.outputField,
      outputMode:
        (wb?.outputMode as OutputMode) ?? INITIAL_WORKFLOW_STATE.outputMode,
      modelProvider:
        (wb?.modelProvider as ModelProvider) ??
        INITIAL_WORKFLOW_STATE.modelProvider,
      modelName: wb?.modelName ?? INITIAL_WORKFLOW_STATE.modelName,
      temperature: wb?.temperature ?? INITIAL_WORKFLOW_STATE.temperature,
      executionLimit:
        wb?.executionLimit ?? INITIAL_WORKFLOW_STATE.executionLimit,
      mongoUri: mongoUri,
      maskedUri: maskMongoUri(mongoUri),
      filterConditions:
        wb?.filterConditions ?? INITIAL_WORKFLOW_STATE.filterConditions,
      isTestLoading: INITIAL_WORKFLOW_STATE.isTestLoading,
      testResult: INITIAL_WORKFLOW_STATE.testResult,
      testError: INITIAL_WORKFLOW_STATE.testError,
      savedWorkflows:
        wb?.savedWorkflows ?? INITIAL_WORKFLOW_STATE.savedWorkflows,
      selectedWorkflowId:
        wb?.selectedWorkflowId ?? INITIAL_WORKFLOW_STATE.selectedWorkflowId,
    },
  };
};

const mapDispatchToProps: DispatchProps = {
  onClose: closeWorkflowBuilderModal,
  onNextStep: workflowBuilderNextStep,
  onPreviousStep: workflowBuilderPreviousStep,
  onPromptChange: workflowBuilderPromptChanged,
  onOutputFieldChange: workflowBuilderOutputFieldChanged,
  onOutputModeChange: workflowBuilderOutputModeChanged,
  onModelProviderChange: workflowBuilderModelProviderChanged,
  onModelNameChange: workflowBuilderModelNameChanged,
  onTemperatureChange: workflowBuilderTemperatureChanged,
  onExecutionLimitChange: workflowBuilderExecutionLimitChanged,
  onFilterConditionsChange: workflowBuilderFilterConditionsChanged,
  onSaveWorkflow: workflowBuilderSaveWorkflow,
};

export default connect<
  StateProps,
  DispatchProps,
  Record<string, never>,
  CollectionState
>(
  mapStateToProps,
  mapDispatchToProps
)(WorkflowBuilderModal);
