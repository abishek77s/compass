import React, { useCallback, useMemo, useState } from 'react';
import {
  Description,
  Label,
  spacing,
  css,
  Button,
  Icon,
  Banner,
} from '@mongodb-js/compass-components';
import type { WorkflowConfiguration } from './types';
import { convertPromptToConfig, extractFieldsFromPrompt } from './types';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const jsonContainerStyles = css({
  position: 'relative',
  marginTop: spacing[200],
});

const jsonBoxStyles = css({
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  maxHeight: '300px',
  overflow: 'auto',
  border: '1px solid var(--palette-gray-light2)',
});

const summaryBoxStyles = css({
  display: 'grid',
  gridTemplateColumns: '140px 1fr',
  gap: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
  fontSize: '13px',
});

const summaryLabelStyles = css({
  fontWeight: 'bold',
  color: 'var(--palette-gray-dark2)',
});

const summaryValueStyles = css({
  color: 'var(--palette-gray-dark1)',
  fontFamily: 'monospace',
});

const buttonRowStyles = css({
  display: 'flex',
  gap: spacing[200],
  marginTop: spacing[200],
});

interface PreviewExportScreenProps {
  prompt: string;
  outputField: string;
  outputMode: 'overwrite' | 'append' | 'new-field';
  modelProvider: string;
  modelName: string;
  temperature: number;
  executionLimit: number;
  mongoUri: string;
  maskedUri: string;
  namespace: string;
}

const PreviewExportScreen: React.FC<PreviewExportScreenProps> = ({
  prompt,
  outputField,
  outputMode,
  modelProvider,
  modelName,
  temperature,
  executionLimit,
  mongoUri,
  maskedUri,
  namespace,
}) => {
  const [copied, setCopied] = useState(false);

  const [database, collection] = namespace.split('.');
  const inputFields = extractFieldsFromPrompt(prompt);
  const configPrompt = convertPromptToConfig(prompt);

  const configuration: WorkflowConfiguration = useMemo(
    () => ({
      mongo: {
        uri: mongoUri,
        database: database || '',
        collection: collection || '',
      },
      input_fields: inputFields,
      output: {
        field: outputField,
        mode: outputMode,
      },
      prompt: configPrompt,
      model: {
        provider: modelProvider as WorkflowConfiguration['model']['provider'],
        name: modelName,
        temperature: temperature,
      },
      execution: {
        limit: executionLimit > 0 ? executionLimit : undefined,
      },
    }),
    [
      mongoUri,
      database,
      collection,
      inputFields,
      outputField,
      outputMode,
      configPrompt,
      modelProvider,
      modelName,
      temperature,
      executionLimit,
    ]
  );

  // For display, use masked URI
  const displayConfiguration = useMemo(() => {
    return {
      ...configuration,
      mongo: {
        ...configuration.mongo,
        uri: maskedUri,
      },
    };
  }, [configuration, maskedUri]);

  const formattedJson = useMemo(() => {
    return JSON.stringify(displayConfiguration, null, 2);
  }, [displayConfiguration]);

  const handleCopyConfig = useCallback(() => {
    // Copy with real URI
    const fullConfig = JSON.stringify(configuration, null, 2);
    void navigator.clipboard.writeText(fullConfig).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }, [configuration]);

  const handleDeploy = useCallback(() => {
    // TODO: Implement deploy functionality
    // eslint-disable-next-line no-console
    console.log('Deploy clicked - TODO');
  }, []);

  return (
    <div className={containerStyles}>
      <Banner variant="success">
        <strong>Workflow Configuration Complete!</strong> Review your
        configuration below, then copy or deploy it.
      </Banner>

      <div>
        <Label htmlFor="config-summary">Configuration Summary</Label>
        <Description className={descriptionStyles}>
          Review your workflow configuration:
        </Description>
        <div className={summaryBoxStyles}>
          <div className={summaryLabelStyles}>Collection:</div>
          <div className={summaryValueStyles}>
            {database}.{collection}
          </div>

          <div className={summaryLabelStyles}>Input Fields:</div>
          <div className={summaryValueStyles}>
            {inputFields.length > 0 ? inputFields.join(', ') : '(none)'}
          </div>

          <div className={summaryLabelStyles}>Output Field:</div>
          <div className={summaryValueStyles}>
            {outputField} ({outputMode})
          </div>

          <div className={summaryLabelStyles}>Model:</div>
          <div className={summaryValueStyles}>
            {modelProvider} / {modelName}
          </div>

          <div className={summaryLabelStyles}>Temperature:</div>
          <div className={summaryValueStyles}>{temperature}</div>

          <div className={summaryLabelStyles}>Execution Limit:</div>
          <div className={summaryValueStyles}>
            {executionLimit > 0 ? executionLimit : 'No limit'}
          </div>

          <div className={summaryLabelStyles}>MongoDB URI:</div>
          <div className={summaryValueStyles}>{maskedUri}</div>
        </div>
      </div>

      <div>
        <Label htmlFor="workflow-json">Workflow JSON</Label>
        <Description className={descriptionStyles}>
          This configuration can be used with mittai to process your documents.
        </Description>
        <div className={jsonContainerStyles}>
          <div id="workflow-json" className={jsonBoxStyles}>
            {formattedJson}
          </div>
        </div>
      </div>

      <div className={buttonRowStyles}>
        <Button
          variant="primary"
          leftGlyph={<Icon glyph={copied ? 'Checkmark' : 'Copy'} />}
          onClick={handleCopyConfig}
        >
          {copied ? 'Copied!' : 'Copy Config'}
        </Button>
        <Button
          variant="primaryOutline"
          leftGlyph={<Icon glyph="Cloud" />}
          onClick={handleDeploy}
        >
          Deploy (TODO)
        </Button>
      </div>

      {copied && (
        <Banner variant="success">
          Configuration copied to clipboard! (with full MongoDB URI)
        </Banner>
      )}

      <Banner variant="warning">
        <strong>Note:</strong> The copied configuration contains your full
        MongoDB URI. Keep it secure and avoid committing it to public
        repositories.
      </Banner>
    </div>
  );
};

export default PreviewExportScreen;
