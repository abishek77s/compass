import React, { useCallback, useMemo, useState } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  Banner,
  Button,
  SpinLoader,
  KeylineCard,
  palette,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import { EJSON } from 'bson';
import {
  extractFieldsFromPrompt,
  convertPromptToConfig,
  buildMongoFilter,
  type FilterCondition,
  type TestResult,
} from './types';
import { MITTAI_SERVER_URL } from './constants';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const summaryCardStyles = css({
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[200],
});

const summaryGridStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[300],
  marginTop: spacing[200],
});

const summaryItemStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const summaryLabelStyles = css({
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--palette-gray-dark1)',
  textTransform: 'uppercase',
});

const summaryValueStyles = css({
  fontSize: '13px',
  fontFamily: 'monospace',
  color: 'var(--palette-gray-dark2)',
  wordBreak: 'break-all',
});

const testButtonContainerStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const resultContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const builtPromptStyles = css({
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-dark3)',
  color: 'var(--palette-gray-light2)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  maxHeight: '150px',
  overflow: 'auto',
});

const modelOutputStyles = css({
  padding: spacing[300],
  backgroundColor: 'var(--palette-white)',
  border: `1px solid ${palette.green.base}`,
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  maxHeight: '200px',
  overflow: 'auto',
});

const diffContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[300],
});

const diffPanelStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const diffHeaderStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  borderRadius: `${spacing[100]}px ${spacing[100]}px 0 0`,
  fontSize: '12px',
  fontWeight: 600,
});

const diffHeaderBeforeStyles = css({
  backgroundColor: palette.red.light2,
  color: palette.red.dark2,
});

const diffHeaderAfterStyles = css({
  backgroundColor: palette.green.light2,
  color: palette.green.dark2,
});

const diffContentStyles = css({
  padding: spacing[200],
  fontFamily: 'monospace',
  fontSize: '11px',
  whiteSpace: 'pre',
  overflow: 'auto',
  maxHeight: '400px',
  borderRadius: `0 0 ${spacing[100]}px ${spacing[100]}px`,
  border: '1px solid var(--palette-gray-light1)',
  borderTop: 'none',
});

const diffLineStyles = css({
  display: 'block',
  padding: '1px 4px',
  margin: '0 -8px',
});

const diffLineAddedStyles = css({
  backgroundColor: palette.green.light3,
  color: palette.green.dark2,
});

const diffLineUnchangedStyles = css({
  color: 'var(--palette-gray-dark1)',
});

const errorStyles = css({
  padding: spacing[300],
  backgroundColor: palette.red.light3,
  color: palette.red.dark2,
  borderRadius: spacing[100],
  fontSize: '13px',
});

const conditionsPassedBadgeStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  borderRadius: spacing[200],
  fontSize: '13px',
  fontWeight: 600,
  backgroundColor: palette.green.light2,
  color: palette.green.dark2,
  border: `1px solid ${palette.green.base}`,
});

const conditionsFailedBadgeStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[100],
  padding: `${spacing[100]}px ${spacing[200]}px`,
  borderRadius: spacing[200],
  fontSize: '13px',
  fontWeight: 600,
  backgroundColor: palette.yellow.light2,
  color: palette.yellow.dark2,
  border: `1px solid ${palette.yellow.base}`,
});

interface TestPromptScreenProps {
  prompt: string;
  outputField: string;
  filterConditions: FilterCondition[];
  sampleDocument: Document | null;
  mongoUri: string;
  namespace: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
}

const TestPromptScreen: React.FC<TestPromptScreenProps> = ({
  prompt,
  outputField,
  filterConditions,
  // sampleDocument is available but not used directly in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sampleDocument: _sampleDocument,
  mongoUri,
  namespace,
  modelProvider,
  modelName,
  temperature,
}) => {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const extractedFields = useMemo(() => {
    return extractFieldsFromPrompt(prompt);
  }, [prompt]);

  const mongoFilter = useMemo(() => {
    return buildMongoFilter(filterConditions);
  }, [filterConditions]);

  const handleTestPrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsTestLoading(true);
    setTestError(null);
    setTestResult(null);

    const [database, collection] = namespace.split('.');
    const configPrompt = convertPromptToConfig(prompt);

    try {
      const requestBody = {
        mongo: {
          uri: mongoUri,
          database: database || '',
          collection: collection || '',
          filter: mongoFilter,
        },
        input_fields: extractedFields,
        prompt: configPrompt,
        model: {
          provider: modelProvider,
          name: modelName,
          temperature: temperature,
        },
      };

      // Read the stored mittai JWT so the protected endpoint accepts the request.
      let mittaiToken: string | null = null;
      try {
        const raw = localStorage.getItem('mittai_auth');
        if (raw) {
          const parsed = JSON.parse(raw) as { token?: string };
          mittaiToken = parsed.token ?? null;
        }
      } catch {
        // ignore — proceed without token (server will return 401 with a clear message)
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (mittaiToken) {
        headers['Authorization'] = `Bearer ${mittaiToken}`;
      }

      const response = await fetch(`${MITTAI_SERVER_URL}/workflow/test`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorData.error ?? 'Test request failed');
      }

      const result = await response.json();
      setTestResult({
        sampleDocument: result.sample_document,
        builtPrompt: result.built_prompt,
        modelOutput: result.model_output,
        conditionsPassed: result.conditions_passed,
      });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsTestLoading(false);
    }
  }, [
    prompt,
    mongoUri,
    namespace,
    extractedFields,
    mongoFilter,
    modelProvider,
    modelName,
    temperature,
  ]);

  // Generate the document lines for diff view
  const formatDocumentLines = useCallback((doc: Document | null): string[] => {
    if (!doc) return [];
    try {
      const formatted = EJSON.stringify(doc, undefined, 2);
      return formatted.split('\n');
    } catch {
      return ['Error formatting document'];
    }
  }, []);

  const beforeLines = useMemo(() => {
    if (!testResult?.sampleDocument) return [];
    return formatDocumentLines(testResult.sampleDocument);
  }, [testResult, formatDocumentLines]);

  const afterLines = useMemo(() => {
    if (!testResult?.sampleDocument || !testResult?.modelOutput || !outputField)
      return [];

    // Clone the document and add the output field
    const docWithOutput = { ...testResult.sampleDocument };
    docWithOutput[outputField] = testResult.modelOutput;

    return formatDocumentLines(docWithOutput);
  }, [testResult, outputField, formatDocumentLines]);

  // Find which lines are added (the new output field)
  const getLineStatus = useCallback(
    (line: string, isAfter: boolean): 'added' | 'removed' | 'unchanged' => {
      if (!isAfter) return 'unchanged';

      // Check if this line contains the output field
      const trimmed = line.trim();
      if (
        trimmed.startsWith(`"${outputField}"`) ||
        (trimmed.includes(outputField) && !beforeLines.includes(line))
      ) {
        return 'added';
      }

      return 'unchanged';
    },
    [outputField, beforeLines]
  );

  return (
    <div className={containerStyles}>
      <Banner variant="info">
        Test your workflow configuration with a sample document from your
        collection. This will send a request to the AI model and show you the
        expected result.
      </Banner>

      {/* Configuration Summary */}
      <KeylineCard className={summaryCardStyles}>
        <Body weight="medium">Configuration Summary</Body>
        <div className={summaryGridStyles}>
          <div className={summaryItemStyles}>
            <span className={summaryLabelStyles}>Prompt Fields</span>
            <span className={summaryValueStyles}>
              {extractedFields.length > 0
                ? extractedFields.map((f) => `@${f}`).join(', ')
                : 'None'}
            </span>
          </div>
          <div className={summaryItemStyles}>
            <span className={summaryLabelStyles}>Output Field</span>
            <span className={summaryValueStyles}>
              {outputField || 'Not set'}
            </span>
          </div>
          <div className={summaryItemStyles}>
            <span className={summaryLabelStyles}>Filter</span>
            <span className={summaryValueStyles}>
              {Object.keys(mongoFilter).length > 0
                ? JSON.stringify(mongoFilter)
                : 'No filter (all documents)'}
            </span>
          </div>
          <div className={summaryItemStyles}>
            <span className={summaryLabelStyles}>Model</span>
            <span className={summaryValueStyles}>
              {modelProvider} / {modelName}
            </span>
          </div>
        </div>
      </KeylineCard>

      {/* Test Button */}
      <div>
        <Label htmlFor="test-button">Run Test</Label>
        <Description className={descriptionStyles}>
          Fetch a sample document matching your filter and process it with the
          AI model.
        </Description>
        <div className={testButtonContainerStyles}>
          <Button
            id="test-button"
            variant="primary"
            onClick={() => void handleTestPrompt()}
            disabled={!prompt.trim() || !outputField.trim() || isTestLoading}
          >
            {isTestLoading ? (
              <>
                <SpinLoader /> Running Test...
              </>
            ) : (
              'Test Workflow'
            )}
          </Button>
          {!prompt.trim() && (
            <Body style={{ color: palette.yellow.dark2, fontSize: '12px' }}>
              Please configure a prompt first
            </Body>
          )}
          {!outputField.trim() && prompt.trim() && (
            <Body style={{ color: palette.yellow.dark2, fontSize: '12px' }}>
              Please configure an output field first
            </Body>
          )}
        </div>
      </div>

      {/* Error Display */}
      {testError && <div className={errorStyles}>Error: {testError}</div>}

      {/* Test Results */}
      {testResult && (
        <div className={resultContainerStyles}>
          {/* Conditions Badge */}
          {testResult.conditionsPassed !== undefined && (
            <div>
              {testResult.conditionsPassed ? (
                <span className={conditionsPassedBadgeStyles}>
                  Conditions Passed ✓
                </span>
              ) : (
                <span className={conditionsFailedBadgeStyles}>
                  Conditions Failed ✗
                </span>
              )}
            </div>
          )}

          {/* Built Prompt */}
          <div>
            <Label htmlFor="built-prompt">Built Prompt</Label>
            <Description className={descriptionStyles}>
              The prompt after replacing field placeholders with actual values.
            </Description>
            <pre id="built-prompt" className={builtPromptStyles}>
              {testResult.builtPrompt}
            </pre>
          </div>

          {/* Model Output */}
          <div>
            <Label htmlFor="model-output">Model Output</Label>
            <Description className={descriptionStyles}>
              The response from the AI model that will be stored in the output
              field.
            </Description>
            <div id="model-output" className={modelOutputStyles}>
              {testResult.modelOutput}
            </div>
          </div>

          {/* Git-like Diff View */}
          <div>
            <Label htmlFor="document-diff">Document Diff</Label>
            <Description className={descriptionStyles}>
              Before and after comparison showing how the document will be
              modified.
            </Description>
            <div id="document-diff" className={diffContainerStyles}>
              {/* Before Panel */}
              <div className={diffPanelStyles}>
                <div
                  className={`${diffHeaderStyles} ${diffHeaderBeforeStyles}`}
                >
                  <span>−</span>
                  <span>Before (Original Document)</span>
                </div>
                <div className={diffContentStyles}>
                  {beforeLines.map((line, index) => (
                    <span
                      key={index}
                      className={`${diffLineStyles} ${diffLineUnchangedStyles}`}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>

              {/* After Panel */}
              <div className={diffPanelStyles}>
                <div className={`${diffHeaderStyles} ${diffHeaderAfterStyles}`}>
                  <span>+</span>
                  <span>After (With {outputField})</span>
                </div>
                <div className={diffContentStyles}>
                  {afterLines.map((line, index) => {
                    const status = getLineStatus(line, true);
                    const lineClass =
                      status === 'added'
                        ? diffLineAddedStyles
                        : diffLineUnchangedStyles;
                    return (
                      <span
                        key={index}
                        className={`${diffLineStyles} ${lineClass}`}
                      >
                        {status === 'added' ? '+ ' : '  '}
                        {line}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPromptScreen;
