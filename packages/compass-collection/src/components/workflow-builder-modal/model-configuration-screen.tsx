import React, { useCallback, useMemo } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  Select,
  Option,
  Banner,
  TextInput,
  Checkbox,
} from '@mongodb-js/compass-components';
import type { ModelProvider } from './types';
import { MODEL_OPTIONS } from './types';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const sliderContainerStyles = css({
  marginTop: spacing[200],
});

const sliderStyles = css({
  width: '100%',
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const temperatureValueStyles = css({
  fontWeight: 'bold',
  color: 'var(--palette-blue-base)',
});

const infoBannerStyles = css({
  marginTop: spacing[300],
});

const configSummaryStyles = css({
  marginTop: spacing[300],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
});

const inputWithHintStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const hintTextStyles = css({
  fontSize: '12px',
  color: 'var(--palette-gray-dark1)',
});

interface ModelConfigurationScreenProps {
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  executionLimit: number;
  onProviderChange: (provider: ModelProvider) => void;
  onModelNameChange: (name: string) => void;
  onTemperatureChange: (temp: number) => void;
  onExecutionLimitChange: (limit: number) => void;
}

const ModelConfigurationScreen: React.FC<ModelConfigurationScreenProps> = ({
  modelProvider,
  modelName,
  temperature,
  executionLimit,
  onProviderChange,
  onModelNameChange,
  onTemperatureChange,
  onExecutionLimitChange,
}) => {
  const [enableLimit, setEnableLimit] = React.useState(executionLimit > 0);

  const handleProviderChange = useCallback(
    (value: string) => {
      onProviderChange(value as ModelProvider);
      // Set first available model for the new provider
      const firstModel = MODEL_OPTIONS[value as ModelProvider].models[0];
      onModelNameChange(firstModel);
    },
    [onProviderChange, onModelNameChange]
  );

  const handleModelChange = useCallback(
    (value: string) => {
      onModelNameChange(value);
    },
    [onModelNameChange]
  );

  const handleTemperatureChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onTemperatureChange(parseFloat(event.target.value));
    },
    [onTemperatureChange]
  );

  const handleEnableLimitChange = useCallback(() => {
    const newEnableLimit = !enableLimit;
    setEnableLimit(newEnableLimit);
    if (!newEnableLimit) {
      onExecutionLimitChange(0);
    } else {
      onExecutionLimitChange(5);
    }
  }, [enableLimit, onExecutionLimitChange]);

  const handleLimitChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value) && value >= 0) {
        onExecutionLimitChange(value);
      }
    },
    [onExecutionLimitChange]
  );

  const availableModels = useMemo(() => {
    return MODEL_OPTIONS[modelProvider].models;
  }, [modelProvider]);

  const getTemperatureDescription = () => {
    if (temperature === 0) {
      return 'Deterministic: The model will produce consistent, predictable outputs.';
    } else if (temperature <= 0.5) {
      return 'Low creativity: Responses will be focused and conservative.';
    } else if (temperature <= 1.0) {
      return 'Balanced: A good mix of consistency and creativity.';
    } else if (temperature <= 1.5) {
      return 'Creative: More varied and imaginative responses.';
    } else {
      return 'Very creative: Highly varied outputs, may be less coherent.';
    }
  };

  return (
    <div className={containerStyles}>
      <div>
        <Label htmlFor="model-provider">Model Provider</Label>
        <Description className={descriptionStyles}>
          Choose the AI service provider for your workflow.
        </Description>
        <Select
          id="model-provider"
          value={modelProvider}
          onChange={handleProviderChange}
          aria-label="Model provider"
        >
          {Object.entries(MODEL_OPTIONS).map(([key, value]) => (
            <Option key={key} value={key}>
              {value.label}
            </Option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="model-name">Model Name</Label>
        <Description className={descriptionStyles}>
          Select the specific model to use.
        </Description>
        <Select
          id="model-name"
          value={modelName}
          onChange={handleModelChange}
          aria-label="Model name"
        >
          {availableModels.map((model) => (
            <Option key={model} value={model}>
              {model}
            </Option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="temperature">
          Temperature:{' '}
          <span className={temperatureValueStyles}>
            {temperature.toFixed(1)}
          </span>
        </Label>
        <Description className={descriptionStyles}>
          Controls randomness in the model&apos;s responses.
        </Description>
        <div className={sliderContainerStyles}>
          <input
            type="range"
            id="temperature"
            className={sliderStyles}
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            aria-label="Temperature"
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: 'var(--palette-gray-base)',
            }}
          >
            <span>0 (Deterministic)</span>
            <span>1 (Balanced)</span>
            <span>2 (Creative)</span>
          </div>
        </div>
        <Banner variant="info" className={infoBannerStyles}>
          {getTemperatureDescription()}
        </Banner>
      </div>

      <div>
        <Checkbox
          onChange={handleEnableLimitChange}
          label="Limit number of documents to process"
          checked={enableLimit}
          bold
        />
        <Description
          className={descriptionStyles}
          style={{ marginTop: spacing[200] }}
        >
          Restrict the workflow to process only a specific number of documents.
          Useful for testing or controlling costs.
        </Description>

        {enableLimit && (
          <div
            className={inputWithHintStyles}
            style={{ marginTop: spacing[200] }}
          >
            <TextInput
              id="execution-limit"
              type="number"
              value={executionLimit.toString()}
              onChange={handleLimitChange}
              placeholder="5"
              aria-label="Execution limit"
              min="1"
            />
            <div className={hintTextStyles}>
              Number of documents to process (0 = all documents)
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="config-summary-box">Configuration Summary</Label>
        <div id="config-summary-box" className={configSummaryStyles}>
          <Body>Provider: {MODEL_OPTIONS[modelProvider].label}</Body>
          <Body>Model: {modelName}</Body>
          <Body>Temperature: {temperature.toFixed(1)}</Body>
          <Body>
            Limit:{' '}
            {enableLimit && executionLimit > 0
              ? `${executionLimit} documents`
              : 'All documents'}
          </Body>
        </div>
      </div>
    </div>
  );
};

export default ModelConfigurationScreen;
