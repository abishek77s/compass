import React, { useCallback, useMemo } from 'react';
import {
  Body,
  Checkbox,
  Description,
  KeylineCard,
  Label,
  spacing,
  css,
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

const documentCardStyles = css({
  padding: spacing[400],
  maxHeight: '400px',
  overflow: 'auto',
  fontFamily: 'monospace',
  fontSize: '13px',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
});

const fieldListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  maxHeight: '300px',
  overflow: 'auto',
  padding: spacing[200],
  border: '1px solid var(--border-color)',
  borderRadius: spacing[100],
});

const fieldItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  padding: spacing[100],
  '&:hover': {
    backgroundColor: 'var(--palette-gray-light3)',
  },
});

const sectionStyles = css({
  marginTop: spacing[400],
});

interface SampleDocumentScreenProps {
  sampleDocument: Document | null;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
}

// Recursively extract all field paths from a document
function extractFieldPaths(
  obj: Document | Record<string, unknown> | null,
  prefix = '',
  paths: string[] = []
): string[] {
  if (!obj || typeof obj !== 'object') {
    return paths;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      paths.push(fieldPath);

      const value = obj[key] as unknown;
      // Recursively process nested objects
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        Object.keys(value as Record<string, unknown>).length > 0
      ) {
        extractFieldPaths(value as Record<string, unknown>, fieldPath, paths);
      }
    }
  }

  return paths;
}

const SampleDocumentScreen: React.FC<SampleDocumentScreenProps> = ({
  sampleDocument,
  selectedFields,
  onFieldsChange,
}) => {
  const fieldPaths = useMemo(() => {
    if (!sampleDocument) return [];
    return extractFieldPaths(sampleDocument);
  }, [sampleDocument]);

  const handleFieldToggle = useCallback(
    (fieldPath: string) => {
      if (selectedFields.includes(fieldPath)) {
        onFieldsChange(selectedFields.filter((f) => f !== fieldPath));
      } else {
        onFieldsChange([...selectedFields, fieldPath]);
      }
    },
    [selectedFields, onFieldsChange]
  );

  const handleSelectAll = useCallback(() => {
    if (selectedFields.length === fieldPaths.length) {
      onFieldsChange([]);
    } else {
      onFieldsChange(fieldPaths);
    }
  }, [selectedFields, fieldPaths, onFieldsChange]);

  const formattedDocument = useMemo(() => {
    if (!sampleDocument) return 'No sample document available';
    try {
      return EJSON.stringify(sampleDocument, undefined, 2);
    } catch {
      return 'Error formatting document';
    }
  }, [sampleDocument]);

  if (!sampleDocument) {
    return (
      <div className={containerStyles}>
        <Body>
          No sample document available. Please ensure the collection has at
          least one document.
        </Body>
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <div>
        <Label htmlFor="sample-document">Sample Document</Label>
        <Description className={descriptionStyles}>
          This is a sample document from your collection. Select the fields you
          want to use as input for your workflow.
        </Description>
        <KeylineCard id="sample-document" className={documentCardStyles}>
          {formattedDocument}
        </KeylineCard>
      </div>

      <div className={sectionStyles}>
        <Label htmlFor="field-list">Select Input Fields</Label>
        <Description className={descriptionStyles}>
          Choose which fields from the document should be passed to the AI
          model. You can reference these fields in your prompt using{' '}
          <code>
            {'{{'} fieldName {'}}'}
          </code>
          .
        </Description>

        <div>
          <Checkbox
            onChange={handleSelectAll}
            label={`Select All (${selectedFields.length}/${fieldPaths.length})`}
            checked={selectedFields.length === fieldPaths.length}
            indeterminate={
              selectedFields.length > 0 &&
              selectedFields.length < fieldPaths.length
            }
            bold
          />
        </div>

        <div id="field-list" className={fieldListStyles}>
          {fieldPaths.map((fieldPath) => (
            <div key={fieldPath} className={fieldItemStyles}>
              <Checkbox
                onChange={() => handleFieldToggle(fieldPath)}
                label={fieldPath}
                checked={selectedFields.includes(fieldPath)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SampleDocumentScreen;
