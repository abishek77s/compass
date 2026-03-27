import React, { useCallback, useMemo } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  Banner,
  Button,
  Select,
  Option,
  TextInput,
  Checkbox,
  IconButton,
  Icon,
} from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import {
  type FilterCondition,
  type FilterOperator,
  FILTER_OPERATOR_OPTIONS,
  generateFilterId,
  buildMongoFilter,
} from './types';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const filtersListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
});

const filterRowStyles = css({
  display: 'grid',
  gridTemplateColumns: '32px 1fr 1fr 1fr 32px',
  gap: spacing[200],
  alignItems: 'center',
  padding: spacing[200],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
});

const addButtonStyles = css({
  marginTop: spacing[200],
});

const previewContainerStyles = css({
  marginTop: spacing[300],
});

const previewCodeStyles = css({
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

const emptyStateStyles = css({
  padding: spacing[400],
  textAlign: 'center',
  color: 'var(--palette-gray-base)',
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[200],
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
      // Skip _id fields
      if (!fieldPath.startsWith('_id')) {
        paths.push(fieldPath);
      }

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

interface FilterConfigurationScreenProps {
  filterConditions: FilterCondition[];
  sampleDocument: Document | null;
  onFilterConditionsChange: (conditions: FilterCondition[]) => void;
}

const FilterConfigurationScreen: React.FC<FilterConfigurationScreenProps> = ({
  filterConditions,
  sampleDocument,
  onFilterConditionsChange,
}) => {
  const availableFields = useMemo(() => {
    if (!sampleDocument) return [];
    return extractFieldPaths(sampleDocument);
  }, [sampleDocument]);

  const filterPreview = useMemo(() => {
    const filter = buildMongoFilter(filterConditions);
    if (Object.keys(filter).length === 0) {
      return '{}';
    }
    return JSON.stringify(filter, null, 2);
  }, [filterConditions]);

  const handleAddFilter = useCallback(() => {
    const newCondition: FilterCondition = {
      id: generateFilterId(),
      field: availableFields[0] || '',
      operator: 'equals',
      value: '',
      enabled: true,
    };
    onFilterConditionsChange([...filterConditions, newCondition]);
  }, [filterConditions, availableFields, onFilterConditionsChange]);

  const handleRemoveFilter = useCallback(
    (id: string) => {
      onFilterConditionsChange(filterConditions.filter((c) => c.id !== id));
    },
    [filterConditions, onFilterConditionsChange]
  );

  const handleUpdateFilter = useCallback(
    (id: string, updates: Partial<FilterCondition>) => {
      onFilterConditionsChange(
        filterConditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [filterConditions, onFilterConditionsChange]
  );

  const handleToggleFilter = useCallback(
    (id: string, enabled: boolean) => {
      handleUpdateFilter(id, { enabled });
    },
    [handleUpdateFilter]
  );

  const handleFieldChange = useCallback(
    (id: string, field: string) => {
      handleUpdateFilter(id, { field });
    },
    [handleUpdateFilter]
  );

  const handleOperatorChange = useCallback(
    (id: string, operator: FilterOperator) => {
      handleUpdateFilter(id, { operator });
    },
    [handleUpdateFilter]
  );

  const handleValueChange = useCallback(
    (id: string, value: string) => {
      // Try to parse as number or boolean
      let parsedValue: string | number | boolean = value;
      if (value === 'true') parsedValue = true;
      else if (value === 'false') parsedValue = false;
      else if (!isNaN(Number(value)) && value.trim() !== '') {
        parsedValue = Number(value);
      }
      handleUpdateFilter(id, { value: parsedValue });
    },
    [handleUpdateFilter]
  );

  const needsValue = (operator: FilterOperator): boolean => {
    return !['exists', 'not_exists'].includes(operator);
  };

  return (
    <div className={containerStyles}>
      <Banner variant="info">
        Define filters to select which documents to process. Filters are
        optional - leave empty to process all documents.
      </Banner>

      <div>
        <Label htmlFor="filter-list">Filter Conditions</Label>
        <Description className={descriptionStyles}>
          Add conditions to filter documents. Only documents matching all
          conditions will be processed.
        </Description>

        <div id="filter-list" className={filtersListStyles}>
          {filterConditions.length === 0 ? (
            <div className={emptyStateStyles}>
              <Body>No filters defined. All documents will be processed.</Body>
            </div>
          ) : (
            filterConditions.map((condition) => (
              <div key={condition.id} className={filterRowStyles}>
                <Checkbox
                  checked={condition.enabled}
                  onChange={(e) =>
                    handleToggleFilter(
                      condition.id,
                      (e.target as HTMLInputElement).checked
                    )
                  }
                  aria-label="Enable filter"
                />

                <Select
                  aria-label="Select field"
                  value={condition.field}
                  onChange={(value) => handleFieldChange(condition.id, value)}
                  allowDeselect={false}
                  size="small"
                >
                  {availableFields.map((field) => (
                    <Option key={field} value={field}>
                      {field}
                    </Option>
                  ))}
                </Select>

                <Select
                  aria-label="Select operator"
                  value={condition.operator}
                  onChange={(value) =>
                    handleOperatorChange(condition.id, value as FilterOperator)
                  }
                  allowDeselect={false}
                  size="small"
                >
                  {FILTER_OPERATOR_OPTIONS.map((op) => (
                    <Option key={op.value} value={op.value}>
                      {op.label}
                    </Option>
                  ))}
                </Select>

                {needsValue(condition.operator) ? (
                  <TextInput
                    aria-label="Filter value"
                    value={String(condition.value)}
                    onChange={(e) =>
                      handleValueChange(condition.id, e.target.value)
                    }
                    placeholder="Value"
                    sizeVariant="small"
                  />
                ) : (
                  <div />
                )}

                <IconButton
                  aria-label="Remove filter"
                  onClick={() => handleRemoveFilter(condition.id)}
                >
                  <Icon glyph="X" />
                </IconButton>
              </div>
            ))
          )}
        </div>

        <Button
          variant="default"
          size="small"
          className={addButtonStyles}
          onClick={handleAddFilter}
          leftGlyph={<Icon glyph="Plus" />}
        >
          Add Filter
        </Button>
      </div>

      <div className={previewContainerStyles}>
        <Label htmlFor="filter-preview">Filter Preview (MongoDB Query)</Label>
        <Description className={descriptionStyles}>
          This is the MongoDB filter that will be used to select documents.
        </Description>
        <pre id="filter-preview" className={previewCodeStyles}>
          {filterPreview}
        </pre>
      </div>
    </div>
  );
};

export default FilterConfigurationScreen;
