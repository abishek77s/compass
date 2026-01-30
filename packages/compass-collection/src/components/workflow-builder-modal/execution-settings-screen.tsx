import React, { useCallback } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  TextInput,
  Banner,
  Checkbox,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
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

interface ExecutionSettingsScreenProps {
  executionLimit: number;
  mongoUri: string;
  onExecutionLimitChange: (limit: number) => void;
  onMongoUriChange: (uri: string) => void;
}

const ExecutionSettingsScreen: React.FC<ExecutionSettingsScreenProps> = ({
  executionLimit,
  mongoUri,
  onExecutionLimitChange,
  onMongoUriChange,
}) => {
  const handleLimitChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (!isNaN(value) && value >= 0) {
        onExecutionLimitChange(value);
      }
    },
    [onExecutionLimitChange]
  );

  const handleUriChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onMongoUriChange(event.target.value);
    },
    [onMongoUriChange]
  );

  const [enableLimit, setEnableLimit] = React.useState(executionLimit > 0);

  const handleEnableLimitChange = useCallback(() => {
    const newEnableLimit = !enableLimit;
    setEnableLimit(newEnableLimit);
    if (!newEnableLimit) {
      onExecutionLimitChange(0);
    } else {
      onExecutionLimitChange(5);
    }
  }, [enableLimit, onExecutionLimitChange]);

  return (
    <div className={containerStyles}>
      <Banner variant="info">
        These settings control how the workflow will execute against your
        MongoDB collection. Configure resource limits and connection details.
      </Banner>

      <div>
        <Label htmlFor="mongo-uri">MongoDB Connection URI</Label>
        <Description className={descriptionStyles}>
          The connection string for your MongoDB instance. This will be used to
          connect to the database and collection specified in the workflow.
        </Description>
        <TextInput
          id="mongo-uri"
          value={mongoUri}
          onChange={handleUriChange}
          placeholder="mongodb://localhost:27017"
          aria-label="MongoDB URI"
        />
        <div className={hintTextStyles} style={{ marginTop: spacing[100] }}>
          Example: mongodb://localhost:27017 or
          mongodb+srv://cluster.mongodb.net
        </div>
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
              Leave at 0 or uncheck to process all documents in the collection
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="execution-behavior-box">Execution Behavior</Label>
        <div className={exampleBoxStyles}>
          <Body>
            {enableLimit && executionLimit > 0 ? (
              <>
                ✓ Process up to <strong>{executionLimit}</strong> document
                {executionLimit === 1 ? '' : 's'}
              </>
            ) : (
              <>
                ✓ Process <strong>all documents</strong> in the collection
              </>
            )}
          </Body>
          <Body style={{ marginTop: spacing[200] }}>
            ✓ Documents will be processed sequentially
          </Body>
          <Body style={{ marginTop: spacing[200] }}>
            ✓ Results will be written back to the collection as they complete
          </Body>
        </div>
      </div>

      <Banner variant="warning" className={infoBannerStyles}>
        <strong>Important:</strong> Running this workflow will modify documents
        in your collection. Make sure you have backups and have tested your
        configuration thoroughly before processing large numbers of documents.
      </Banner>

      {!enableLimit && (
        <Banner variant="warning" className={infoBannerStyles}>
          No execution limit is set. This workflow will process{' '}
          <strong>all documents</strong> in your collection, which could be
          expensive and time-consuming for large collections.
        </Banner>
      )}
    </div>
  );
};

export default ExecutionSettingsScreen;
