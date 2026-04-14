import React, { useCallback, useMemo, useState } from 'react';
import {
  Description,
  Label,
  spacing,
  css,
  Button,
  Icon,
  Banner,
  TextInput,
  TextArea,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { useOpenWorkspace } from '@mongodb-js/compass-workspaces/provider';
import type {
  WorkflowConfiguration,
  FilterCondition,
  SavedWorkflow,
} from './types';
import {
  convertPromptToConfig,
  extractFieldsFromPrompt,
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

const saveFormStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[200],
  marginTop: spacing[200],
});

const saveFormRowStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'flex-end',
});

const savedWorkflowsListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
  marginTop: spacing[200],
  maxHeight: '150px',
  overflow: 'auto',
});

const savedWorkflowItemStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: spacing[200],
  backgroundColor: 'var(--palette-white)',
  border: '1px solid var(--palette-gray-light2)',
  borderRadius: spacing[100],
  fontSize: '12px',
});

const savedWorkflowNameStyles = css({
  fontWeight: 600,
});

const savedWorkflowDateStyles = css({
  color: 'var(--palette-gray-base)',
  fontSize: '11px',
});

interface PreviewExportScreenProps {
  prompt: string;
  outputField: string;
  outputMode: 'overwrite' | 'append' | 'new-field';
  schedule: string;
  statusField: string;
  statusValue: string;
  modelProvider: string;
  modelName: string;
  temperature: number;
  executionLimit: number;
  mongoUri: string;
  maskedUri: string;
  namespace: string;
  filterConditions: FilterCondition[];
  onSaveWorkflow: (name: string, description: string) => void;
  onDeployWorkflow: (name: string, description: string) => Promise<void>;
  savedWorkflows: SavedWorkflow[];
}

function parseJsonValue(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

const PreviewExportScreen: React.FC<PreviewExportScreenProps> = ({
  prompt,
  outputField,
  outputMode,
  schedule,
  statusField,
  statusValue,
  modelProvider,
  modelName,
  temperature,
  executionLimit,
  mongoUri,
  maskedUri,
  namespace,
  filterConditions,
  onSaveWorkflow,
  onDeployWorkflow,
  savedWorkflows,
}) => {
  const [copied, setCopied] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  // 'save' = save as draft, 'deploy' = save + activate
  const [formMode, setFormMode] = useState<'save' | 'deploy'>('save');
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const { openManageWorkflowsWorkspace } = useOpenWorkspace();

  const [database, collection] = namespace.split('.');
  const inputFields = extractFieldsFromPrompt(prompt);
  const configPrompt = convertPromptToConfig(prompt);
  const mongoFilter = buildMongoFilter(filterConditions);

  const configuration: WorkflowConfiguration = useMemo(
    () => ({
      mongo: {
        uri: mongoUri,
        database: database || '',
        collection: collection || '',
        filter: Object.keys(mongoFilter).length > 0 ? mongoFilter : undefined,
      },
      input_fields: inputFields,
      output: {
        field: outputField,
        mode: outputMode,
        ...(statusField.trim() ? { status_field: statusField.trim() } : {}),
        ...(statusField.trim()
          ? { status_value: parseJsonValue(statusValue) }
          : {}),
      },
      prompt: configPrompt,
      model: {
        provider: modelProvider as WorkflowConfiguration['model']['provider'],
        name: modelName,
        temperature: temperature,
      },
      schedule: schedule || undefined,
      execution: {
        limit: executionLimit > 0 ? executionLimit : undefined,
      },
    }),
    [
      mongoUri,
      database,
      collection,
      mongoFilter,
      inputFields,
      outputField,
      outputMode,
      statusField,
      statusValue,
      schedule,
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

  const filterSummary = useMemo(() => {
    const enabledFilters = filterConditions.filter((c) => c.enabled);
    if (enabledFilters.length === 0) return 'No filter (all documents)';
    return JSON.stringify(mongoFilter);
  }, [filterConditions, mongoFilter]);

  const handleCopyConfig = useCallback(() => {
    // Copy with real URI
    const fullConfig = JSON.stringify(configuration, null, 2);
    void navigator.clipboard.writeText(fullConfig).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }, [configuration]);

  const openForm = useCallback((mode: 'save' | 'deploy') => {
    setFormMode(mode);
    setDeployError(null);
    setShowSaveForm(true);
  }, []);

  const handleSaveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) return;

    const trimmedName = workflowName.trim();
    const trimmedDesc = workflowDescription.trim();

    if (formMode === 'deploy') {
      setIsDeploying(true);
      setDeployError(null);
      try {
        await onDeployWorkflow(trimmedName, trimmedDesc);
        setDeployed(true);
        setShowSaveForm(false);
        setWorkflowName('');
        setWorkflowDescription('');
        setTimeout(() => setDeployed(false), 5000);
      } catch (err) {
        setDeployError(
          err instanceof Error
            ? err.message
            : 'Deploy failed. Please try again.'
        );
      } finally {
        setIsDeploying(false);
      }
    } else {
      onSaveWorkflow(trimmedName, trimmedDesc);
      setSaved(true);
      setShowSaveForm(false);
      setWorkflowName('');
      setWorkflowDescription('');
      setTimeout(() => setSaved(false), 3000);
    }
  }, [
    workflowName,
    workflowDescription,
    formMode,
    onSaveWorkflow,
    onDeployWorkflow,
  ]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={containerStyles}>
      <Banner variant="success">
        <strong>Workflow Configuration Complete!</strong> Review your
        configuration below, then save, copy, or deploy it.
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

          <div className={summaryLabelStyles}>Filter:</div>
          <div className={summaryValueStyles}>{filterSummary}</div>

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

          <div className={summaryLabelStyles}>Schedule:</div>
          <div className={summaryValueStyles}>
            {schedule || 'No schedule (run manually)'}
          </div>

          {statusField.trim() && (
            <>
              <div className={summaryLabelStyles}>Status Field:</div>
              <div className={summaryValueStyles}>{statusField.trim()}</div>

              <div className={summaryLabelStyles}>Status Value:</div>
              <div className={summaryValueStyles}>
                {statusValue || '(empty)'}
              </div>
            </>
          )}

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
          leftGlyph={<Icon glyph="Save" />}
          onClick={() => openForm('save')}
        >
          Save Draft
        </Button>
        <Button
          variant="primary"
          leftGlyph={<Icon glyph="Cloud" />}
          onClick={() => openForm('deploy')}
        >
          Deploy &amp; Activate
        </Button>
        <Button
          variant="primaryOutline"
          leftGlyph={<Icon glyph="Diagram" />}
          onClick={() => openManageWorkflowsWorkspace()}
        >
          Manage Workflows
        </Button>
      </div>

      {showSaveForm && (
        <div className={saveFormStyles}>
          <Label htmlFor="workflow-name">
            {formMode === 'deploy'
              ? 'Deploy & Activate Workflow'
              : 'Save Workflow as Draft'}
          </Label>
          <TextInput
            id="workflow-name"
            aria-label="Workflow name"
            placeholder="My Workflow"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            sizeVariant="small"
          />
          <TextArea
            id="workflow-description"
            aria-labelledby="workflow-name"
            placeholder="Optional description..."
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
          />
          {deployError && <Banner variant="warning">{deployError}</Banner>}
          <div className={saveFormRowStyles}>
            <Button
              variant="primary"
              size="small"
              leftGlyph={
                isDeploying ? (
                  <SpinLoader />
                ) : formMode === 'deploy' ? (
                  <Icon glyph="Cloud" />
                ) : (
                  <Icon glyph="Save" />
                )
              }
              onClick={() => void handleSaveWorkflow()}
              disabled={!workflowName.trim() || isDeploying}
            >
              {isDeploying
                ? 'Deploying…'
                : formMode === 'deploy'
                ? 'Deploy & Activate'
                : 'Save Draft'}
            </Button>
            <Button
              variant="default"
              size="small"
              onClick={() => setShowSaveForm(false)}
              disabled={isDeploying}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {saved && (
        <Banner variant="success">
          Workflow saved as draft. You can activate it anytime from Manage
          Workflows.
        </Banner>
      )}
      {deployed && (
        <Banner variant="success">
          <strong>Workflow deployed!</strong> It is now active and will run on
          its schedule.
        </Banner>
      )}

      {copied && (
        <Banner variant="success">
          Configuration copied to clipboard! (with full MongoDB URI)
        </Banner>
      )}

      {savedWorkflows.length > 0 && (
        <div>
          <Label htmlFor="saved-workflows-list">Saved Workflows</Label>
          <Description className={descriptionStyles}>
            Previously saved workflows for this collection.
          </Description>
          <div id="saved-workflows-list" className={savedWorkflowsListStyles}>
            {savedWorkflows.map((workflow) => (
              <div key={workflow.id} className={savedWorkflowItemStyles}>
                <div>
                  <div className={savedWorkflowNameStyles}>{workflow.name}</div>
                  {workflow.description && (
                    <div style={{ color: 'var(--palette-gray-dark1)' }}>
                      {workflow.description}
                    </div>
                  )}
                  <div className={savedWorkflowDateStyles}>
                    {workflow.is_active ? '● Active' : '○ Inactive'} · Saved:{' '}
                    {formatDate(workflow.updated_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
