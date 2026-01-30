import { connect } from 'react-redux';
import type { CollectionState } from '../../modules/collection-tab';
import {
  closeWorkflowBuilderModal,
  workflowBuilderNextStep,
  workflowBuilderPreviousStep,
  workflowBuilderFieldsChanged,
  workflowBuilderPromptChanged,
  workflowBuilderOutputFieldChanged,
  workflowBuilderOutputModeChanged,
  workflowBuilderModelProviderChanged,
  workflowBuilderModelNameChanged,
  workflowBuilderTemperatureChanged,
  workflowBuilderExecutionLimitChanged,
  workflowBuilderMongoUriChanged,
} from '../../modules/collection-tab';
import WorkflowBuilderModal from './workflow-builder-modal';
import type { WorkflowBuilderState, OutputMode, ModelProvider } from './types';
import { WorkflowBuilderStep, INITIAL_WORKFLOW_STATE } from './types';

interface StateProps {
  state: WorkflowBuilderState;
}

interface DispatchProps {
  onClose: () => void;
  onNextStep: () => void;
  onPreviousStep: () => void;
  onFieldsChange: (fields: string[]) => void;
  onPromptChange: (prompt: string) => void;
  onOutputFieldChange: (field: string) => void;
  onOutputModeChange: (mode: OutputMode) => void;
  onModelProviderChange: (provider: string) => void;
  onModelNameChange: (name: string) => void;
  onTemperatureChange: (temp: number) => void;
  onExecutionLimitChange: (limit: number) => void;
  onMongoUriChange: (uri: string) => void;
}

const mapStateToProps = (state: CollectionState): StateProps => {
  const wb = state.workflowBuilder;

  return {
    state: {
      isOpen: wb?.isModalOpen ?? false,
      currentStep:
        (wb?.currentStep as WorkflowBuilderStep) ??
        WorkflowBuilderStep.SAMPLE_DOCUMENT,
      namespace: state.namespace,
      sampleDocument: wb?.sampleDocument ?? null,
      selectedFields:
        wb?.selectedFields ?? INITIAL_WORKFLOW_STATE.selectedFields,
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
      mongoUri: wb?.mongoUri ?? INITIAL_WORKFLOW_STATE.mongoUri,
    },
  };
};

const mapDispatchToProps: DispatchProps = {
  onClose: closeWorkflowBuilderModal,
  onNextStep: workflowBuilderNextStep,
  onPreviousStep: workflowBuilderPreviousStep,
  onFieldsChange: workflowBuilderFieldsChanged,
  onPromptChange: workflowBuilderPromptChanged,
  onOutputFieldChange: workflowBuilderOutputFieldChanged,
  onOutputModeChange: workflowBuilderOutputModeChanged,
  onModelProviderChange: workflowBuilderModelProviderChanged,
  onModelNameChange: workflowBuilderModelNameChanged,
  onTemperatureChange: workflowBuilderTemperatureChanged,
  onExecutionLimitChange: workflowBuilderExecutionLimitChanged,
  onMongoUriChange: workflowBuilderMongoUriChanged,
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
