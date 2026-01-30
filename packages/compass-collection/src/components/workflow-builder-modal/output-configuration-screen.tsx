import React, { useCallback } from 'react';
import {
  Description,
  Label,
  spacing,
  css,
  TextInput,
  RadioBox,
  RadioBoxGroup,
  Banner,
} from '@mongodb-js/compass-components';
import type { OutputMode } from './types';
import { OUTPUT_MODE_OPTIONS } from './constants';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const radioGroupStyles = css({
  display: 'flex',
  flexDirection: 'row',
  gap: spacing[200],
  marginTop: spacing[200],
});

const exampleBoxStyles = css({
  marginTop: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
});

interface OutputConfigurationScreenProps {
  outputField: string;
  outputMode: OutputMode;
  onOutputFieldChange: (field: string) => void;
  onOutputModeChange: (mode: OutputMode) => void;
}

const OutputConfigurationScreen: React.FC<OutputConfigurationScreenProps> = ({
  outputField,
  outputMode,
  onOutputFieldChange,
  onOutputModeChange,
}) => {
  const handleFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onOutputFieldChange(event.target.value);
    },
    [onOutputFieldChange]
  );

  const handleModeChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onOutputModeChange(event.target.value as OutputMode);
    },
    [onOutputModeChange]
  );

  const getExampleOutput = () => {
    const field = outputField || 'summary';
    const response = '"AI generated response..."';
    switch (outputMode) {
      case 'overwrite':
        return `{ "${field}": ${response} }`;
      case 'append':
        return `{ "${field}": ["existing", ${response}] }`;
      case 'new-field':
        return `{ "${field}": ${response} }`;
    }
  };

  return (
    <div className={containerStyles}>
      <div>
        <Label htmlFor="output-field">Output Field Name</Label>
        <Description className={descriptionStyles}>
          The field where AI responses will be stored in each document.
        </Description>
        <TextInput
          id="output-field"
          value={outputField}
          onChange={handleFieldChange}
          placeholder="e.g., summary, analysis"
          aria-label="Output field name"
        />
      </div>

      <div>
        <Label htmlFor="output-mode-new-field">Output Mode</Label>
        <Description className={descriptionStyles}>
          How the AI response should be stored.
        </Description>
        <RadioBoxGroup className={radioGroupStyles}>
          {OUTPUT_MODE_OPTIONS.map((option) => (
            <RadioBox
              key={option.value}
              id={`output-mode-${option.value}`}
              value={option.value}
              checked={outputMode === option.value}
              onChange={handleModeChange}
            >
              {option.label}
            </RadioBox>
          ))}
        </RadioBoxGroup>
      </div>

      {outputField && (
        <Banner variant="info">
          <strong>Preview:</strong>
          <div className={exampleBoxStyles}>{getExampleOutput()}</div>
        </Banner>
      )}
    </div>
  );
};

export default OutputConfigurationScreen;
