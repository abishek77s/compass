import React, { useCallback, useMemo } from 'react';
import {
  css,
  Button,
  ModalBody,
  ModalHeader,
  Modal,
  ModalFooter,
  spacing,
  palette,
} from '@mongodb-js/compass-components';

import type {
  WorkflowBuilderState,
  OutputMode,
  ModelProvider,
  FilterCondition,
} from './types';
import { WorkflowBuilderStep } from './types';
import {
  WORKFLOW_BUILDER_STEP_LABELS,
  WORKFLOW_BUILDER_STEP_ORDER,
  NEXT_BUTTON_TEXT,
} from './constants';

import PromptConfigurationScreen from './prompt-configuration-screen';
import OutputConfigurationScreen from './output-configuration-screen';
import FilterConfigurationScreen from './filter-configuration-screen';
import TestPromptScreen from './test-prompt-screen';
import ModelConfigurationScreen from './model-configuration-screen';
import PreviewExportScreen from './preview-export-screen';

const footerStyles = css({
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: spacing[200],
});

const rightButtonsStyles = css({
  display: 'flex',
  gap: spacing[200],
  flexDirection: 'row',
});

const stepperContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[200],
  marginBottom: spacing[400],
  flexWrap: 'wrap',
});

const stepItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

const stepNumberStyles = css({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 600,
});

const stepNumberCurrentStyles = css({
  backgroundColor: palette.green.dark1,
  color: palette.white,
});

const stepNumberCompletedStyles = css({
  backgroundColor: palette.green.light2,
  color: palette.green.dark2,
});

const stepNumberPendingStyles = css({
  backgroundColor: palette.gray.light2,
  color: palette.gray.dark1,
});

const stepLabelStyles = css({
  fontSize: '13px',
  whiteSpace: 'nowrap',
});

const stepLabelCurrentStyles = css({
  fontWeight: 600,
  color: palette.green.dark1,
});

const stepLabelCompletedStyles = css({
  color: palette.gray.dark1,
});

const stepLabelPendingStyles = css({
  color: palette.gray.base,
});

const stepConnectorStyles = css({
  width: '20px',
  height: '2px',
  backgroundColor: palette.gray.light2,
  margin: `0 ${spacing[100]}px`,
});

const stepConnectorCompletedStyles = css({
  backgroundColor: palette.green.light2,
});

interface StepIndicatorProps {
  steps: WorkflowBuilderStep[];
  currentStepIndex: number;
  labels: Record<WorkflowBuilderStep, string>;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStepIndex,
  labels,
}) => {
  return (
    <div className={stepperContainerStyles} aria-label="Workflow builder steps">
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isPending = index > currentStepIndex;

        const numberStyles = [
          stepNumberStyles,
          isCompleted && stepNumberCompletedStyles,
          isCurrent && stepNumberCurrentStyles,
          isPending && stepNumberPendingStyles,
        ]
          .filter(Boolean)
          .join(' ');

        const labelStyles = [
          stepLabelStyles,
          isCompleted && stepLabelCompletedStyles,
          isCurrent && stepLabelCurrentStyles,
          isPending && stepLabelPendingStyles,
        ]
          .filter(Boolean)
          .join(' ');

        const connectorStyles = [
          stepConnectorStyles,
          isCompleted && stepConnectorCompletedStyles,
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <React.Fragment key={step}>
            <div className={stepItemStyles}>
              <div className={numberStyles}>
                {isCompleted ? '✓' : index + 1}
              </div>
              <span className={labelStyles}>{labels[step]}</span>
            </div>
            {index < steps.length - 1 && <div className={connectorStyles} />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export interface WorkflowBuilderModalProps {
  state: WorkflowBuilderState;
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

const WorkflowBuilderModal: React.FC<WorkflowBuilderModalProps> = ({
  state,
  onClose,
  onNextStep,
  onPreviousStep,
  onPromptChange,
  onOutputFieldChange,
  onOutputModeChange,
  onModelProviderChange,
  onModelNameChange,
  onTemperatureChange,
  onExecutionLimitChange,
  onFilterConditionsChange,
  onSaveWorkflow,
}) => {
  const currentStepIndex = WORKFLOW_BUILDER_STEP_ORDER.indexOf(
    state.currentStep
  );

  const modalBodyContent = useMemo(() => {
    switch (state.currentStep) {
      case WorkflowBuilderStep.PROMPT_CONFIGURATION:
        return (
          <PromptConfigurationScreen
            prompt={state.prompt}
            sampleDocument={state.sampleDocument}
            onPromptChange={onPromptChange}
          />
        );
      case WorkflowBuilderStep.OUTPUT_CONFIGURATION:
        return (
          <OutputConfigurationScreen
            outputField={state.outputField}
            outputMode={state.outputMode}
            onOutputFieldChange={onOutputFieldChange}
            onOutputModeChange={onOutputModeChange}
          />
        );
      case WorkflowBuilderStep.FILTER_CONFIGURATION:
        return (
          <FilterConfigurationScreen
            filterConditions={state.filterConditions}
            sampleDocument={state.sampleDocument}
            onFilterConditionsChange={onFilterConditionsChange}
          />
        );
      case WorkflowBuilderStep.TEST_PROMPT:
        return (
          <TestPromptScreen
            prompt={state.prompt}
            outputField={state.outputField}
            filterConditions={state.filterConditions}
            sampleDocument={state.sampleDocument}
            mongoUri={state.mongoUri}
            namespace={state.namespace}
            modelProvider={state.modelProvider}
            modelName={state.modelName}
            temperature={state.temperature}
          />
        );
      case WorkflowBuilderStep.MODEL_CONFIGURATION:
        return (
          <ModelConfigurationScreen
            modelProvider={state.modelProvider}
            modelName={state.modelName}
            temperature={state.temperature}
            executionLimit={state.executionLimit}
            onProviderChange={onModelProviderChange}
            onModelNameChange={onModelNameChange}
            onTemperatureChange={onTemperatureChange}
            onExecutionLimitChange={onExecutionLimitChange}
          />
        );
      case WorkflowBuilderStep.PREVIEW_EXPORT:
        return (
          <PreviewExportScreen
            prompt={state.prompt}
            outputField={state.outputField}
            outputMode={state.outputMode}
            modelProvider={state.modelProvider}
            modelName={state.modelName}
            temperature={state.temperature}
            executionLimit={state.executionLimit}
            mongoUri={state.mongoUri}
            maskedUri={state.maskedUri}
            namespace={state.namespace}
            filterConditions={state.filterConditions}
            onSaveWorkflow={onSaveWorkflow}
            savedWorkflows={state.savedWorkflows}
          />
        );
    }
  }, [
    state,
    onPromptChange,
    onOutputFieldChange,
    onOutputModeChange,
    onModelProviderChange,
    onModelNameChange,
    onTemperatureChange,
    onExecutionLimitChange,
    onFilterConditionsChange,
    onSaveWorkflow,
  ]);

  const isNextButtonDisabled = useMemo(() => {
    switch (state.currentStep) {
      case WorkflowBuilderStep.PROMPT_CONFIGURATION:
        return !state.prompt.trim();
      case WorkflowBuilderStep.OUTPUT_CONFIGURATION:
        return !state.outputField.trim();
      case WorkflowBuilderStep.FILTER_CONFIGURATION:
        return false; // Filters are optional
      case WorkflowBuilderStep.TEST_PROMPT:
        return false; // Testing is optional
      case WorkflowBuilderStep.MODEL_CONFIGURATION:
        return !state.modelProvider || !state.modelName;
      case WorkflowBuilderStep.PREVIEW_EXPORT:
        return false;
      default:
        return false;
    }
  }, [state]);

  const handleNextClick = useCallback(() => {
    if (state.currentStep === WorkflowBuilderStep.PREVIEW_EXPORT) {
      onClose();
    } else {
      onNextStep();
    }
  }, [state.currentStep, onNextStep, onClose]);

  const isFirstStep = currentStepIndex === 0;

  return (
    <Modal
      setOpen={onClose}
      open={state.isOpen}
      data-testid="workflow-builder-modal"
      size="large"
    >
      <ModalHeader title="AI Workflow Builder" subtitle={state.namespace} />
      <ModalBody>
        <StepIndicator
          steps={WORKFLOW_BUILDER_STEP_ORDER}
          currentStepIndex={currentStepIndex}
          labels={WORKFLOW_BUILDER_STEP_LABELS}
        />

        {modalBodyContent}
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="default"
          onClick={onPreviousStep}
          disabled={isFirstStep}
          data-testid="previous-button"
        >
          Previous
        </Button>
        <div className={rightButtonsStyles}>
          <Button
            variant="default"
            onClick={onClose}
            data-testid="cancel-button"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleNextClick}
            disabled={isNextButtonDisabled}
            data-testid="next-button"
          >
            {NEXT_BUTTON_TEXT[state.currentStep]}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

export default WorkflowBuilderModal;
