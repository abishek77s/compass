import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  css,
  spacing,
  palette,
  Button,
  Icon,
  Banner,
  TextInput,
  ConfirmationModal,
  openToast,
  Subtitle,
  Body,
  Badge,
} from '@mongodb-js/compass-components';

// Workflow type matching the backend
interface Workflow {
  id: string;
  name: string;
  description: string;
  namespace: string;
  created_at: string;
  updated_at: string;
  config: {
    mongo: {
      database: string;
      collection: string;
      filter?: Record<string, unknown>;
    };
    input_fields: string[];
    output: {
      field: string;
      mode: string;
    };
    prompt: string;
    model: {
      provider: string;
      name: string;
      temperature: number;
    };
    execution: {
      limit?: number;
    };
  };
}

interface ManageWorkflowsScreenProps {
  namespace?: string;
  mittaiServerUrl?: string;
  onSelectWorkflow?: (workflow: Workflow) => void;
  onClose?: () => void;
}

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  padding: spacing[400],
  height: '100%',
});

const headerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: spacing[200],
});

const titleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const searchContainerStyles = css({
  display: 'flex',
  gap: spacing[200],
  alignItems: 'center',
});

const workflowListStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  overflow: 'auto',
  flex: 1,
});

const workflowCardStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  border: '1px solid var(--palette-gray-light2)',
  borderRadius: spacing[200],
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  '&:hover': {
    borderColor: palette.green.base,
    boxShadow: `0 0 0 1px ${palette.green.light2}`,
  },
});

const workflowCardSelectedStyles = css({
  borderColor: palette.green.dark1,
  boxShadow: `0 0 0 2px ${palette.green.light2}`,
});

const workflowHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
});

const workflowTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
});

const workflowNameStyles = css({
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--palette-gray-dark3)',
});

const workflowDescriptionStyles = css({
  fontSize: '13px',
  color: 'var(--palette-gray-dark1)',
  lineHeight: 1.4,
});

const workflowMetaStyles = css({
  display: 'flex',
  gap: spacing[300],
  flexWrap: 'wrap',
  fontSize: '12px',
  color: 'var(--palette-gray-base)',
});

const workflowMetaItemStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

const workflowActionsStyles = css({
  display: 'flex',
  gap: spacing[100],
});

const emptyStateStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[600],
  textAlign: 'center',
  color: 'var(--palette-gray-dark1)',
  gap: spacing[200],
});

const loadingStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: spacing[600],
});

const footerStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: spacing[300],
  borderTop: '1px solid var(--palette-gray-light2)',
});

const expandedConfigStyles = css({
  marginTop: spacing[200],
  padding: spacing[200],
  backgroundColor: 'var(--palette-gray-light2)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '11px',
  maxHeight: '150px',
  overflow: 'auto',
});

const expandedPromptStyles = css({
  margin: `${spacing[100]}px 0`,
  whiteSpace: 'pre-wrap',
});

const DEFAULT_MITTAI_URL = 'http://localhost:8787';

const ManageWorkflowsScreen: React.FC<ManageWorkflowsScreenProps> = ({
  namespace,
  mittaiServerUrl = DEFAULT_MITTAI_URL,
  onSelectWorkflow,
  onClose,
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [workflowToDelete, setWorkflowToDelete] = useState<Workflow | null>(
    null
  );

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${mittaiServerUrl}/workflows`);
      if (namespace) {
        url.searchParams.set('namespace', namespace);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }

      const data = (await response.json()) as { workflows?: Workflow[] };
      setWorkflows(data.workflows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      openToast('manage-workflows-error', {
        variant: 'warning',
        title: 'Failed to load workflows',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [mittaiServerUrl, namespace]);

  useEffect(() => {
    void fetchWorkflows();
  }, [fetchWorkflows]);

  const handleDeleteWorkflow = useCallback(
    async (workflow: Workflow) => {
      try {
        const response = await fetch(
          `${mittaiServerUrl}/workflows/${workflow.id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to delete workflow: ${response.statusText}`);
        }

        setWorkflows((prev) => prev.filter((w) => w.id !== workflow.id));
        setWorkflowToDelete(null);

        openToast('manage-workflows-deleted', {
          variant: 'success',
          title: 'Workflow deleted',
          description: `"${workflow.name}" has been deleted.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        openToast('manage-workflows-delete-error', {
          variant: 'warning',
          title: 'Failed to delete workflow',
          description: message,
        });
      }
    },
    [mittaiServerUrl]
  );

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) {
      return workflows;
    }

    const query = searchQuery.toLowerCase();
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(query) ||
        w.description?.toLowerCase().includes(query) ||
        w.namespace.toLowerCase().includes(query)
    );
  }, [workflows, searchQuery]);

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

  const handleWorkflowClick = (workflow: Workflow) => {
    setSelectedWorkflowId(
      selectedWorkflowId === workflow.id ? null : workflow.id
    );
  };

  const handleUseWorkflow = (workflow: Workflow) => {
    if (onSelectWorkflow) {
      onSelectWorkflow(workflow);
    }
  };

  const handleCopyConfig = async (workflow: Workflow) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(workflow.config, null, 2)
      );
      openToast('manage-workflows-copied', {
        variant: 'success',
        title: 'Copied',
        description: 'Workflow configuration copied to clipboard.',
      });
    } catch {
      openToast('manage-workflows-copy-error', {
        variant: 'warning',
        title: 'Copy failed',
        description: 'Failed to copy to clipboard.',
      });
    }
  };

  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <div className={titleStyles}>
          <Icon glyph="Diagram" size="large" />
          <Subtitle>Manage Workflows</Subtitle>
          <Badge variant="blue">{filteredWorkflows.length}</Badge>
        </div>

        <div className={searchContainerStyles}>
          <TextInput
            aria-label="Search workflows"
            placeholder="Search workflows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sizeVariant="small"
          />
          <Button
            variant="default"
            size="small"
            leftGlyph={<Icon glyph="Refresh" />}
            onClick={() => void fetchWorkflows()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {namespace && (
        <Banner>
          Showing workflows for <strong>{namespace}</strong>
        </Banner>
      )}

      {error && (
        <Banner variant="warning">
          <strong>Error:</strong> {error}
        </Banner>
      )}

      {isLoading ? (
        <div className={loadingStyles}>
          <Body>Loading workflows...</Body>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className={emptyStateStyles}>
          <Icon glyph="Folder" size="xlarge" />
          <Subtitle>No workflows found</Subtitle>
          <Body>
            {searchQuery
              ? 'No workflows match your search. Try a different query.'
              : 'Create your first workflow using the AI Workflow Builder.'}
          </Body>
        </div>
      ) : (
        <div className={workflowListStyles}>
          {filteredWorkflows.map((workflow) => {
            const isSelected = selectedWorkflowId === workflow.id;

            return (
              <div
                key={workflow.id}
                className={`${workflowCardStyles} ${
                  isSelected ? workflowCardSelectedStyles : ''
                }`}
                onClick={() => handleWorkflowClick(workflow)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleWorkflowClick(workflow);
                  }
                }}
              >
                <div className={workflowHeaderStyles}>
                  <div className={workflowTitleStyles}>
                    <Icon glyph="Diagram" />
                    <span className={workflowNameStyles}>{workflow.name}</span>
                    <Badge variant="lightgray">
                      {workflow.config.model.provider}
                    </Badge>
                  </div>

                  <div
                    className={workflowActionsStyles}
                    role="toolbar"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="default"
                      size="xsmall"
                      leftGlyph={<Icon glyph="Copy" />}
                      onClick={() => void handleCopyConfig(workflow)}
                      aria-label="Copy configuration"
                    />
                    {onSelectWorkflow && (
                      <Button
                        variant="primary"
                        size="xsmall"
                        leftGlyph={<Icon glyph="Play" />}
                        onClick={() => handleUseWorkflow(workflow)}
                      >
                        Use
                      </Button>
                    )}
                    <Button
                      variant="dangerOutline"
                      size="xsmall"
                      leftGlyph={<Icon glyph="Trash" />}
                      onClick={() => setWorkflowToDelete(workflow)}
                      aria-label="Delete workflow"
                    />
                  </div>
                </div>

                {workflow.description && (
                  <div className={workflowDescriptionStyles}>
                    {workflow.description}
                  </div>
                )}

                <div className={workflowMetaStyles}>
                  <div className={workflowMetaItemStyles}>
                    <Icon glyph="Database" size="small" />
                    <span>{workflow.namespace}</span>
                  </div>
                  <div className={workflowMetaItemStyles}>
                    <Icon glyph="Edit" size="small" />
                    <span>Output: {workflow.config.output.field}</span>
                  </div>
                  <div className={workflowMetaItemStyles}>
                    <Icon glyph="Clock" size="small" />
                    <span>Updated: {formatDate(workflow.updated_at)}</span>
                  </div>
                  {workflow.config.execution.limit && (
                    <div className={workflowMetaItemStyles}>
                      <Icon glyph="CurlyBraces" size="small" />
                      <span>Limit: {workflow.config.execution.limit}</span>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <div className={expandedConfigStyles}>
                    <strong>Prompt:</strong>
                    <pre className={expandedPromptStyles}>
                      {workflow.config.prompt}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className={footerStyles}>
        <Body>
          {filteredWorkflows.length} workflow
          {filteredWorkflows.length !== 1 ? 's' : ''}
        </Body>
        {onClose && (
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <ConfirmationModal
        open={!!workflowToDelete}
        title="Delete Workflow"
        variant="danger"
        confirmButtonProps={{
          children: 'Delete',
        }}
        onConfirm={() => {
          if (workflowToDelete) {
            void handleDeleteWorkflow(workflowToDelete);
          }
        }}
        onCancel={() => setWorkflowToDelete(null)}
      >
        <Body>
          Are you sure you want to delete the workflow &quot;
          <strong>{workflowToDelete?.name}</strong>&quot;? This action cannot be
          undone.
        </Body>
      </ConfirmationModal>
    </div>
  );
};

export default ManageWorkflowsScreen;
