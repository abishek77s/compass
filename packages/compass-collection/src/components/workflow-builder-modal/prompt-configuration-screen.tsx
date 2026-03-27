import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  Description,
  Label,
  spacing,
  css,
  Banner,
  KeylineCard,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import { EJSON } from 'bson';

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
  maxHeight: '300px',
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
});

const textAreaContainerStyles = css({
  position: 'relative',
});

const textAreaStyles = css({
  width: '100%',
  minHeight: '250px',
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
  listStyle: 'none',
  margin: 0,
  padding: 0,
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
  onPromptChange: (prompt: string) => void;
}

const PromptConfigurationScreen: React.FC<PromptConfigurationScreenProps> = ({
  prompt,
  sampleDocument,
  onPromptChange,
}) => {
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const availableFields = useMemo(() => {
    if (!sampleDocument) return [];
    return extractFieldPaths(sampleDocument).filter(
      (field) => !field.startsWith('_id')
    );
  }, [sampleDocument]);

  const filteredSuggestions = useMemo(() => {
    if (!suggestionFilter) return availableFields;
    const lower = suggestionFilter.toLowerCase();
    return availableFields.filter((f) => f.toLowerCase().includes(lower));
  }, [availableFields, suggestionFilter]);

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
    </div>
  );
};

export default PromptConfigurationScreen;
