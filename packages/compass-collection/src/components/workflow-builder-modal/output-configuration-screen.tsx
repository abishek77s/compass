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
  Select,
  Option,
} from '@mongodb-js/compass-components';
import type { OutputMode } from './types';
import { OUTPUT_MODE_OPTIONS, SCHEDULE_PRESETS } from './constants';

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

const sectionDividerStyles = css({
  borderTop: '1px solid var(--palette-gray-light2)',
  paddingTop: spacing[400],
});

const hintStyles = css({
  fontSize: '12px',
  color: 'var(--palette-gray-base)',
  marginTop: spacing[100],
});

const customCronInputStyles = css({
  marginTop: spacing[200],
});

interface OutputConfigurationScreenProps {
  outputField: string;
  outputMode: OutputMode;
  schedule: string;
  statusField: string;
  statusValue: string;
  onOutputFieldChange: (field: string) => void;
  onOutputModeChange: (mode: OutputMode) => void;
  onScheduleChange: (schedule: string) => void;
  onStatusFieldChange: (field: string) => void;
  onStatusValueChange: (value: string) => void;
}

const OutputConfigurationScreen: React.FC<OutputConfigurationScreenProps> = ({
  outputField,
  outputMode,
  schedule,
  statusField,
  statusValue,
  onOutputFieldChange,
  onOutputModeChange,
  onScheduleChange,
  onStatusFieldChange,
  onStatusValueChange,
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

  // Determine which preset is currently selected (or 'custom' if freeform)
  const schedulePresetValue = (() => {
    if (!schedule) return '';
    const match = SCHEDULE_PRESETS.find(
      (p) => p.value !== '' && p.value !== 'custom' && p.value === schedule
    );
    return match ? match.value : 'custom';
  })();

  const isCustomSchedule = schedulePresetValue === 'custom';

  const handleSchedulePresetChange = useCallback(
    (value: string) => {
      if (value === 'custom') {
        // Keep existing value but switch to custom input; if currently a preset, clear it
        const isCurrentPreset = SCHEDULE_PRESETS.some(
          (p) => p.value !== '' && p.value !== 'custom' && p.value === schedule
        );
        if (isCurrentPreset) {
          onScheduleChange('');
        }
        // else keep the current freeform text in place
      } else {
        onScheduleChange(value);
      }
    },
    [schedule, onScheduleChange]
  );

  const handleCustomScheduleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onScheduleChange(event.target.value);
    },
    [onScheduleChange]
  );

  const handleStatusFieldChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onStatusFieldChange(event.target.value);
    },
    [onStatusFieldChange]
  );

  const handleStatusValueChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onStatusValueChange(event.target.value);
    },
    [onStatusValueChange]
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
      {/* ── Output Field ── */}
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

      {/* ── Output Mode ── */}
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

      {/* ── Schedule ── */}
      <div className={sectionDividerStyles}>
        <Label htmlFor="schedule-preset">Schedule</Label>
        <Description className={descriptionStyles}>
          How often the workflow should run automatically. Leave unset to run
          manually.
        </Description>
        <Select
          id="schedule-preset"
          aria-labelledby="schedule-preset"
          value={schedulePresetValue}
          onChange={handleSchedulePresetChange}
          allowDeselect={false}
        >
          {SCHEDULE_PRESETS.map((preset) => (
            <Option key={preset.value} value={preset.value}>
              {preset.label}
            </Option>
          ))}
        </Select>

        {isCustomSchedule && (
          <div className={customCronInputStyles}>
            <TextInput
              id="schedule-custom"
              value={schedule}
              onChange={handleCustomScheduleChange}
              placeholder="e.g., 0 */2 * * * or @every 30m"
              aria-label="Custom cron expression"
            />
            <p className={hintStyles}>
              Supports standard cron expressions (<code>0 */2 * * *</code>) or
              Go-style intervals (<code>@every 30m</code>,{' '}
              <code>@every 1h</code>).
            </p>
          </div>
        )}

        {schedule && !isCustomSchedule && (
          <p className={hintStyles}>
            Workflow will run on schedule: <code>{schedule}</code>
          </p>
        )}
      </div>

      {/* ── Post-Processing Update ── */}
      <div className={sectionDividerStyles}>
        <Label htmlFor="status-field">Post-Processing Update (optional)</Label>
        <Description className={descriptionStyles}>
          After writing the AI output, optionally update another field to mark
          the document as processed (e.g., set <code>status</code> to{' '}
          <code>true</code>).
        </Description>

        <div>
          <Label htmlFor="status-field">Status Field</Label>
          <TextInput
            id="status-field"
            value={statusField}
            onChange={handleStatusFieldChange}
            placeholder="e.g., status, processed, ai_done"
            aria-label="Status field name"
          />
        </div>

        <div style={{ marginTop: spacing[200] }}>
          <Label htmlFor="status-value">Status Value</Label>
          <TextInput
            id="status-value"
            value={statusValue}
            onChange={handleStatusValueChange}
            placeholder='e.g., true, 1, "done"'
            aria-label="Status value"
            disabled={!statusField.trim()}
          />
          <p className={hintStyles}>
            Parsed as JSON — use <code>true</code> / <code>false</code> for
            booleans, a bare number for integers, or a quoted string like{' '}
            <code>&quot;done&quot;</code>.
          </p>
        </div>

        {statusField.trim() && (
          <Banner variant="info">
            After processing, each document will also receive:{' '}
            <code>
              {'{'} &quot;{statusField.trim()}&quot;: {statusValue || '…'} {'}'}
            </code>
          </Banner>
        )}
      </div>
    </div>
  );
};

export default OutputConfigurationScreen;
