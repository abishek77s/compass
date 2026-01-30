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
  flexDirection: 'column',
  gap: spacing[200],
  marginTop: spacing[200],
});

const infoBannerStyles = css({
  marginTop: spacing[300],
});

const exampleBoxStyles = css({
  marginTop: spacing[300],
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

  const getModeDescription = () => {
    switch (outputMode) {
      case 'overwrite':
        return "The AI response will replace any existing value in this field. If the field doesn't exist, it will be created.";
      case 'append':
        return 'The AI response will be appended to the existing value in this field. Useful for building arrays or concatenating text.';
      case 'new-field':
        return 'The AI response will always be stored in a new field, even if the field already exists with a value.';
    }
  };

  const getExampleOutput = () => {
    const exampleResponse = '"This is the AI-generated response"';
    switch (outputMode) {
      case 'overwrite':
        return `Before: { "${
          outputField || 'summary'
        }": "old value" }\nAfter:  { "${
          outputField || 'summary'
        }": ${exampleResponse} }`;
      case 'append':
        return `Before: { "${
          outputField || 'summary'
        }": ["item1", "item2"] }\nAfter:  { "${
          outputField || 'summary'
        }": ["item1", "item2", ${exampleResponse}] }`;
      case 'new-field':
        return `Before: { "${
          outputField || 'summary'
        }": "old value" }\nAfter:  { "${
          outputField || 'summary'
        }": "old value", "${
          outputField || 'summary'
        }_new": ${exampleResponse} }`;
    }
  };

  return (
    <div className={containerStyles}>
      <div>
        <Label htmlFor="output-field">Output Field Name</Label>
        <Description className={descriptionStyles}>
          Specify the field name where the AI model&apos;s response will be
          stored in each document.
        </Description>
        <TextInput
          id="output-field"
          value={outputField}
          onChange={handleFieldChange}
          placeholder="e.g., summary, analysis, enriched_data"
          aria-label="Output field name"
        />
      </div>

      <div>
        <Label htmlFor="output-mode-overwrite">Output Mode</Label>
        <Description className={descriptionStyles}>
          Choose how the AI response should be stored in the output field.
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

      <Banner variant="info" className={infoBannerStyles}>
        {getModeDescription()}
      </Banner>

      {outputField && (
        <div>
          <Label htmlFor="example-output-box">Example Output</Label>
          <Description className={descriptionStyles}>
            Here&apos;s how your document will be modified with the current
            settings:
          </Description>
          <div className={exampleBoxStyles}>{getExampleOutput()}</div>
        </div>
      )}
    </div>
  );
};

export default OutputConfigurationScreen;
