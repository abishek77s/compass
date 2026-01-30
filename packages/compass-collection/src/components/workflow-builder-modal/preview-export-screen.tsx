import React, { useCallback, useMemo, useState } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  Button,
  Icon,
  Banner,
} from '@mongodb-js/compass-components';
import type { WorkflowConfiguration } from './types';

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
  maxHeight: '400px',
  overflow: 'auto',
  border: '1px solid var(--palette-gray-light2)',
});

const copyButtonStyles = css({
  position: 'absolute',
  top: spacing[200],
  right: spacing[200],
});

const successBannerStyles = css({
  marginTop: spacing[300],
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

interface PreviewExportScreenProps {
  configuration: WorkflowConfiguration;
}

const PreviewExportScreen: React.FC<PreviewExportScreenProps> = ({
  configuration,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedJson = useMemo(() => {
    return JSON.stringify(configuration, null, 2);
  }, [configuration]);

  const handleCopyToClipboard = useCallback(() => {
    void navigator.clipboard.writeText(formattedJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }, [formattedJson]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([formattedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-${
      configuration.mongo.collection
    }-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [formattedJson, configuration.mongo.collection]);

  return (
    <div className={containerStyles}>
      <Banner variant="success">
        <strong>Workflow Configuration Complete!</strong> Your workflow is ready
        to use. Copy the JSON below and use it with your workflow execution
        tool.
      </Banner>

      <div>
        <Label htmlFor="config-summary">Configuration Summary</Label>
        <Description className={descriptionStyles}>
          Review your workflow configuration before exporting:
        </Description>
        <div className={summaryBoxStyles}>
          <div className={summaryLabelStyles}>Collection:</div>
          <div className={summaryValueStyles}>
            {configuration.mongo.database}.{configuration.mongo.collection}
          </div>

          <div className={summaryLabelStyles}>Input Fields:</div>
          <div className={summaryValueStyles}>
            {configuration.input_fields.length} field
            {configuration.input_fields.length === 1 ? '' : 's'} (
            {configuration.input_fields.join(', ')})
          </div>

          <div className={summaryLabelStyles}>Output Field:</div>
          <div className={summaryValueStyles}>
            {configuration.output.field} ({configuration.output.mode})
          </div>

          <div className={summaryLabelStyles}>Model:</div>
          <div className={summaryValueStyles}>
            {configuration.model.provider} / {configuration.model.name}
          </div>

          <div className={summaryLabelStyles}>Temperature:</div>
          <div className={summaryValueStyles}>
            {configuration.model.temperature}
          </div>

          <div className={summaryLabelStyles}>Execution Limit:</div>
          <div className={summaryValueStyles}>
            {configuration.execution.limit || 'No limit (all documents)'}
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="workflow-json-box">Workflow JSON</Label>
        <Description className={descriptionStyles}>
          This JSON configuration can be used with your workflow execution tool
          or stored for later use.
        </Description>
        <div className={jsonContainerStyles}>
          <Button
            className={copyButtonStyles}
            variant="primary"
            size="small"
            leftGlyph={<Icon glyph={copied ? 'Checkmark' : 'Copy'} />}
            onClick={() => handleCopyToClipboard()}
            data-testid="copy-json-button"
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
          <div id="workflow-json" className={jsonBoxStyles}>
            {formattedJson}
          </div>
        </div>
      </div>

      {copied && (
        <Banner variant="success" className={successBannerStyles}>
          Workflow JSON copied to clipboard!
        </Banner>
      )}

      <div style={{ display: 'flex', gap: spacing[200] }}>
        <Button
          variant="primaryOutline"
          leftGlyph={<Icon glyph="Download" />}
          onClick={handleDownload}
          data-testid="download-json-button"
        >
          Download JSON
        </Button>
      </div>

      <Banner variant="info">
        <strong>Next Steps:</strong>
        <Body style={{ marginTop: spacing[200] }}>
          1. Save this JSON configuration to a file
        </Body>
        <Body>2. Set up your AI provider API credentials</Body>
        <Body>
          3. Use a workflow execution tool (e.g., Python script, Node.js app) to
          run this workflow
        </Body>
        <Body>4. Monitor execution and verify results in your collection</Body>
      </Banner>

      <Banner variant="warning">
        <strong>Security Note:</strong> This configuration contains your MongoDB
        connection URI. Make sure to store it securely and never commit it to
        public repositories. Consider using environment variables for sensitive
        information.
      </Banner>
    </div>
  );
};

export default PreviewExportScreen;
