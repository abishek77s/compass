import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  Banner,
  KeylineCard,
  Button,
  SpinLoader,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import { EJSON } from 'bson';
import { extractFieldsFromPrompt, convertPromptToConfig } from './types';
import { MITTAI_SERVER_URL } from './constants';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const twoColumnStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[400],
});

const documentCardStyles = css({
  padding: spacing[300],
  maxHeight: '250px',
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
});

const fieldTagsContainerStyles = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[100],
  marginTop: spacing[200],
});

const fieldTagStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${spacing[100]}px ${spacing[200]}px`,
  backgroundColor: 'var(--palette-blue-light3)',
  color: 'var(--palette-blue-dark2)',
  borderRadius: spacing[100],
  fontSize: '11px',
  fontFamily: 'monospace',
});

const testSectionStyles = css({
  marginTop: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[200],
});

const testResultStyles = css({
  marginTop: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-white)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  maxHeight: '150px',
  overflow: 'auto',
});

const testButtonRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const textAreaContainerStyles = css({
  position: 'relative',
});

const textAreaStyles = css({
  width: '100%',
  minHeight: '180px',
  fontFamily: 'monospace',
  fontSize: '13px',
  padding: spacing[200],
  border: '1px solid var(--palette-gray-light1)',
  borderRadius: spacing[100],
  resize: 'vertical',
  backgroundColor: 'var(--palette-gray-light3)',
  color: 'var(--palette-gray-dark2)',
  '&:focus': {
    outline: 'none',
    borderColor: 'var(--palette-blue-base)',
  },
});

const suggestionsDropdownStyles = css({
  position: 'absolute',
  backgroundColor: 'var(--palette-white)',
  border: '1px solid var(--palette-gray-light1)',
  borderRadius: spacing[100],
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  maxHeight: '150px',
  overflow: 'auto',
  zIndex: 1000,
  minWidth: '200px',
});

const suggestionItemStyles = css({
  padding: `${spacing[100]}px ${spacing[200]}px`,
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '12px',
  '&:hover': {
    backgroundColor: 'var(--palette-gray-light3)',
  },
});

const suggestionItemSelectedStyles = css({
  backgroundColor: 'var(--palette-blue-light3)',
});

const diffContainerStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[200],
  marginTop: spacing[200],
});

const diffBoxStyles = css({
  padding: spacing[200],
  backgroundColor: 'var(--palette-white)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '11px',
  whiteSpace: 'pre-wrap',
  maxHeight: '120px',
  overflow: 'auto',
});

const diffLabelStyles = css({
  fontSize: '11px',
  fontWeight: 600,
  marginBottom: spacing[100],
  color: 'var(--palette-gray-dark1)',
});

interface TestResult {
  sampleDocument: Document | null;
  builtPrompt: string;
  modelOutput: string;
}

// Extract all field paths from a document recursively
function extractFieldPaths(
  obj: Document | Record<string, unknown> | null,
  prefix = '',
  paths: string[] = []
): string[] {
  if (!obj || typeof obj !== 'object') return paths;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      paths.push(fieldPath);

      const value = obj[key] as unknown;
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        extractFieldPaths(value as Record<string, unknown>, fieldPath, paths);
      }
    }
  }
  return paths;
}

interface PromptConfigurationScreenProps {
  prompt: string;
  sampleDocument: Document | null;
  mongoUri: string;
  namespace: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  outputField: string;
  onPromptChange: (prompt: string) => void;
}

const PromptConfigurationScreen: React.FC<PromptConfigurationScreenProps> = ({
  prompt,
  sampleDocument,
  mongoUri,
  namespace,
  modelProvider,
  modelName,
  temperature,
  outputField,
  onPromptChange,
}) => {
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const availableFields = useMemo(() => {
    if (!sampleDocument) return [];
    return extractFieldPaths(sampleDocument);
  }, [sampleDocument]);

  const filteredSuggestions = useMemo(() => {
    if (!suggestionFilter) return availableFields;
    const lower = suggestionFilter.toLowerCase();
    return availableFields.filter((f) => f.toLowerCase().includes(lower));
  }, [availableFields, suggestionFilter]);

  const extractedFields = useMemo(() => {
    return extractFieldsFromPrompt(prompt);
  }, [prompt]);

  const formattedDocument = useMemo(() => {
    if (!sampleDocument) return 'No sample document available';
    try {
      return EJSON.stringify(sampleDocument, undefined, 2);
    } catch {
      return 'Error formatting document';
    }
  }, [sampleDocument]);

  const handleTextAreaChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      const pos = event.target.selectionStart;
      onPromptChange(value);
      setCursorPosition(pos);

      // Check if we should show suggestions (typing after @)
      const textBeforeCursor = value.substring(0, pos);
      const atMatch = textBeforeCursor.match(/@([\w.]*)$/);

      if (atMatch) {
        setSuggestionFilter(atMatch[1]);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(0);

        // Calculate dropdown position
        if (textAreaRef.current) {
          const lineHeight = 20;
          const lines = textBeforeCursor.split('\n');
          const currentLineIndex = lines.length - 1;
          const currentLineText = lines[currentLineIndex];

          setDropdownPosition({
            top: (currentLineIndex + 1) * lineHeight + 8,
            left: Math.min(currentLineText.length * 8, 300),
          });
        }
      } else {
        setShowSuggestions(false);
      }
    },
    [onPromptChange]
  );

  const insertSuggestion = useCallback(
    (field: string) => {
      const textBeforeCursor = prompt.substring(0, cursorPosition);
      const textAfterCursor = prompt.substring(cursorPosition);
      const atMatch = textBeforeCursor.match(/@([\w.]*)$/);

      if (atMatch) {
        const newTextBefore =
          textBeforeCursor.substring(0, atMatch.index) + '@' + field;
        const newPrompt = newTextBefore + textAfterCursor;
        onPromptChange(newPrompt);

        // Set cursor after inserted field
        setTimeout(() => {
          if (textAreaRef.current) {
            const newPos = newTextBefore.length;
            textAreaRef.current.selectionStart = newPos;
            textAreaRef.current.selectionEnd = newPos;
            textAreaRef.current.focus();
          }
        }, 0);
      }

      setShowSuggestions(false);
    },
    [prompt, cursorPosition, onPromptChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions || filteredSuggestions.length === 0) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, filteredSuggestions.length - 1)
        );
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertSuggestion(filteredSuggestions[selectedSuggestionIndex]);
      } else if (event.key === 'Escape') {
        setShowSuggestions(false);
      }
    },
    [
      showSuggestions,
      filteredSuggestions,
      selectedSuggestionIndex,
      insertSuggestion,
    ]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleTestPrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    setIsTestLoading(true);
    setTestError(null);
    setTestResult(null);

    const [database, collection] = namespace.split('.');
    const configPrompt = convertPromptToConfig(prompt);

    try {
      const response = await fetch(`${MITTAI_SERVER_URL}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mongo: {
            uri: mongoUri,
            database: database || '',
            collection: collection || '',
          },
          input_fields: extractedFields,
          prompt: configPrompt,
          model: {
            provider: modelProvider,
            name: modelName,
            temperature: temperature,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Test request failed');
      }

      const result = await response.json();
      setTestResult({
        sampleDocument: result.sample_document,
        builtPrompt: result.built_prompt,
        modelOutput: result.model_output,
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
    modelProvider,
    modelName,
    temperature,
  ]);

  // Generate before/after preview
  const beforeDoc = useMemo(() => {
    if (!testResult?.sampleDocument) return null;
    try {
      // Show only first few fields for brevity
      const doc = testResult.sampleDocument;
      const keys = Object.keys(doc).slice(0, 3);
      const preview: Record<string, unknown> = {};
      keys.forEach((k) => (preview[k] = doc[k]));
      if (Object.keys(doc).length > 3) preview['...'] = '...';
      return JSON.stringify(preview, null, 2);
    } catch {
      return null;
    }
  }, [testResult]);

  const afterDoc = useMemo(() => {
    if (!testResult?.sampleDocument || !testResult?.modelOutput || !outputField)
      return null;
    try {
      const doc = testResult.sampleDocument;
      const keys = Object.keys(doc).slice(0, 3);
      const preview: Record<string, unknown> = {};
      keys.forEach((k) => (preview[k] = doc[k]));
      if (Object.keys(doc).length > 3) preview['...'] = '...';
      // Add the new field with truncated output
      const output = testResult.modelOutput;
      preview[outputField] =
        output.length > 50 ? output.substring(0, 50) + '...' : output;
      return JSON.stringify(preview, null, 2);
    } catch {
      return null;
    }
  }, [testResult, outputField]);

  return (
    <div className={containerStyles}>
      <Banner variant="info">
        Type <strong>@</strong> to see available fields. Use dot notation for
        nested fields (e.g., @user.name).
      </Banner>

      <div className={twoColumnStyles}>
        <div>
          <Label id="prompt-input-label" htmlFor="prompt-input">
            Prompt Template
          </Label>
          <Description className={descriptionStyles}>
            Type @ to insert field values from documents.
          </Description>
          <div className={textAreaContainerStyles}>
            <textarea
              ref={textAreaRef}
              id="prompt-input"
              aria-labelledby="prompt-input-label"
              className={textAreaStyles}
              value={prompt}
              onChange={handleTextAreaChange}
              onKeyDown={handleKeyDown}
              placeholder="Summarize the following review:&#10;&#10;@reviews&#10;&#10;Provide a brief summary."
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <ul
                role="listbox"
                className={suggestionsDropdownStyles}
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                }}
              >
                {filteredSuggestions.map((field, index) => (
                  <li
                    key={field}
                    role="option"
                    tabIndex={-1}
                    aria-selected={index === selectedSuggestionIndex}
                    className={`${suggestionItemStyles} ${
                      index === selectedSuggestionIndex
                        ? suggestionItemSelectedStyles
                        : ''
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertSuggestion(field);
                    }}
                  >
                    @{field}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {extractedFields.length > 0 && (
            <div className={fieldTagsContainerStyles}>
              {extractedFields.map((field) => (
                <span key={field} className={fieldTagStyles}>
                  @{field}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="sample-document">Sample Document</Label>
          <Description className={descriptionStyles}>
            Available fields from your collection.
          </Description>
          <KeylineCard id="sample-document" className={documentCardStyles}>
            {formattedDocument}
          </KeylineCard>
        </div>
      </div>

      <div className={testSectionStyles}>
        <div className={testButtonRowStyles}>
          <Button
            id="test-button"
            variant="primary"
            size="small"
            onClick={() => void handleTestPrompt()}
            disabled={!prompt.trim() || isTestLoading}
          >
            {isTestLoading ? (
              <>
                <SpinLoader /> Testing...
              </>
            ) : (
              'Test Prompt'
            )}
          </Button>
          {testError && (
            <Body
              style={{ color: 'var(--palette-red-base)', fontSize: '12px' }}
            >
              {testError}
            </Body>
          )}
        </div>

        {testResult && (
          <>
            <Body
              weight="medium"
              style={{ marginTop: spacing[200], fontSize: '12px' }}
            >
              Model Output:
            </Body>
            <div className={testResultStyles}>{testResult.modelOutput}</div>

            {beforeDoc && afterDoc && outputField && (
              <div className={diffContainerStyles}>
                <div>
                  <div className={diffLabelStyles}>Before</div>
                  <div className={diffBoxStyles}>{beforeDoc}</div>
                </div>
                <div>
                  <div className={diffLabelStyles}>After (+ {outputField})</div>
                  <div className={diffBoxStyles}>{afterDoc}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PromptConfigurationScreen;
