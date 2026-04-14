import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  css,
  spacing,
  palette,
  Button,
  Icon,
  Banner,
  TextInput,
  TextArea,
  ConfirmationModal,
  openToast,
  Subtitle,
  Body,
  Badge,
  Label,
  Select,
  Option,
} from '@mongodb-js/compass-components';

// ─── Auth types ──────────────────────────────────────────────────────────────

interface AuthUser {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface AuthState {
  token: string;
  user: AuthUser;
}

const AUTH_STORAGE_KEY = 'mittai_auth';

function loadAuthFromStorage(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

function saveAuthToStorage(auth: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  } catch {
    // ignore
  }
}

function clearAuthFromStorage(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

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

type OutputMode = 'new-field' | 'overwrite' | 'append';
type ModelProvider = 'gemini' | 'openai' | 'anthropic' | 'azure-openai';

interface EditDraft {
  name: string;
  description: string;
  prompt: string;
  outputField: string;
  outputMode: OutputMode;
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  executionLimit: string;
}

const MODEL_OPTIONS: Record<
  ModelProvider,
  { label: string; models: string[] }
> = {
  gemini: {
    label: 'Google Gemini',
    models: ['gemini-3-flash-preview', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  },
  openai: {
    label: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    label: 'Anthropic Claude',
    models: ['claude-3-5-sonnet', 'claude-3-opus', 'claude-3-sonnet'],
  },
  'azure-openai': {
    label: 'Azure OpenAI',
    models: ['gpt-4', 'gpt-35-turbo'],
  },
};

const OUTPUT_MODE_OPTIONS: { value: OutputMode; label: string }[] = [
  { value: 'new-field', label: 'Create new field' },
  { value: 'overwrite', label: 'Overwrite existing field' },
  { value: 'append', label: 'Append to existing field' },
];

interface ManageWorkflowsScreenProps {
  namespace?: string;
  mittaiServerUrl?: string;
  onSelectWorkflow?: (workflow: Workflow) => void;
  onClose?: () => void;
}

// ─── Auth screen styles ───────────────────────────────────────────────────────

const authWrapperStyles = css({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: spacing[600],
  gap: spacing[400],
});

const authCardStyles = css({
  width: '100%',
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  padding: spacing[500],
  backgroundColor: 'var(--palette-gray-light3)',
  border: '1px solid var(--palette-gray-light2)',
  borderRadius: spacing[200],
});

const authTitleRowStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  marginBottom: spacing[100],
});

const authTabRowStyles = css({
  display: 'flex',
  borderBottom: '2px solid var(--palette-gray-light2)',
  marginBottom: spacing[200],
});

const authTabStyles = css({
  flex: 1,
  padding: `${spacing[200]}px ${spacing[300]}px`,
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--palette-gray-dark1)',
  borderBottom: '2px solid transparent',
  marginBottom: '-2px',
  transition: 'color 0.15s ease, border-color 0.15s ease',
  '&:hover': {
    color: palette.green.dark1,
  },
});

const authTabActiveStyles = css({
  color: palette.green.dark1,
  borderBottomColor: palette.green.dark1,
  fontWeight: 700,
});

const authFieldStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const authFooterStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[200],
  paddingTop: spacing[200],
});

const authUserBannerStyles = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: `${spacing[200]}px ${spacing[300]}px`,
  backgroundColor: 'var(--palette-gray-light3)',
  border: '1px solid var(--palette-gray-light2)',
  borderRadius: spacing[100],
  flexShrink: 0,
});

const authUserInfoStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '13px',
  color: 'var(--palette-gray-dark1)',
});

// ─── Styles ────────────────────────────────────────────────────────────────

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
  padding: spacing[400],
  height: '100%',
  overflowY: 'auto',
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
  gap: spacing[300],
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
  transition: 'border-color 0.15s ease',
  '&:hover': {
    borderColor: palette.green.base,
  },
});

const workflowCardEditingStyles = css({
  borderColor: palette.green.dark1,
  boxShadow: `0 0 0 2px ${palette.green.light2}`,
});

const workflowHeaderStyles = css({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  cursor: 'pointer',
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
  flexShrink: 0,
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
  whiteSpace: 'pre-wrap',
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
  flexShrink: 0,
});

// ─── Edit panel styles ──────────────────────────────────────────────────────

const editPanelStyles = css({
  marginTop: spacing[300],
  paddingTop: spacing[300],
  borderTop: `2px solid ${palette.green.light2}`,
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[300],
});

const editPanelTitleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[200],
  fontSize: '13px',
  fontWeight: 600,
  color: palette.green.dark1,
});

const editFieldRowStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[100],
});

const editFieldLabelStyles = css({
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--palette-gray-dark2)',
});

const editTwoColumnStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: spacing[200],
});

const editThreeColumnStyles = css({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: spacing[200],
});

const editActionsStyles = css({
  display: 'flex',
  gap: spacing[200],
  justifyContent: 'flex-end',
  paddingTop: spacing[200],
  borderTop: '1px solid var(--palette-gray-light2)',
});

const editSavingOverlayStyles = css({
  opacity: 0.6,
  pointerEvents: 'none',
});

const DEFAULT_MITTAI_URL = 'http://localhost:8787';

// ─── AuthScreen ───────────────────────────────────────────────────────────────

type AuthTab = 'login' | 'signup';

interface AuthScreenProps {
  mittaiServerUrl: string;
  onAuthSuccess: (auth: AuthState) => void;
}

function AuthScreen({ mittaiServerUrl, onAuthSuccess }: AuthScreenProps) {
  const [tab, setTab] = useState<AuthTab>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm] = useState('');

  const handleTabChange = useCallback((next: AuthTab) => {
    setTab(next);
    setAuthError(null);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!loginEmail.trim() || !loginPassword) {
      setAuthError('Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${mittaiServerUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });
      const data = (await response.json()) as {
        token?: string;
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? response.statusText);
      }
      if (!data.token || !data.user)
        throw new Error('Invalid server response.');
      onAuthSuccess({ token: data.token, user: data.user });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setIsLoading(false);
    }
  }, [mittaiServerUrl, loginEmail, loginPassword, onAuthSuccess]);

  const handleSignup = useCallback(async () => {
    if (!signupUsername.trim() || !signupEmail.trim() || !signupPassword) {
      setAuthError('All fields are required.');
      return;
    }
    if (signupPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (signupPassword !== signupConfirm) {
      setAuthError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${mittaiServerUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: signupUsername.trim(),
          email: signupEmail.trim(),
          password: signupPassword,
        }),
      });
      const data = (await response.json()) as {
        token?: string;
        user?: AuthUser;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? response.statusText);
      }
      if (!data.token || !data.user)
        throw new Error('Invalid server response.');
      onAuthSuccess({ token: data.token, user: data.user });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign up failed.');
    } finally {
      setIsLoading(false);
    }
  }, [
    mittaiServerUrl,
    signupUsername,
    signupEmail,
    signupPassword,
    signupConfirm,
    onAuthSuccess,
  ]);

  return (
    <div className={authWrapperStyles}>
      <div className={authCardStyles}>
        <div className={authTitleRowStyles}>
          <Icon glyph="Sparkle" size="large" />
          <Subtitle>Mittai Workflows</Subtitle>
        </div>

        <Body>Sign in to view and manage your saved AI workflows.</Body>

        {/* Tab toggle */}
        <div className={authTabRowStyles} role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'login'}
            className={`${authTabStyles} ${
              tab === 'login' ? authTabActiveStyles : ''
            }`}
            onClick={() => handleTabChange('login')}
          >
            Log In
          </button>
          <button
            role="tab"
            aria-selected={tab === 'signup'}
            className={`${authTabStyles} ${
              tab === 'signup' ? authTabActiveStyles : ''
            }`}
            onClick={() => handleTabChange('signup')}
          >
            Sign Up
          </button>
        </div>

        {/* Error banner */}
        {authError && <Banner variant="warning">{authError}</Banner>}

        {tab === 'login' ? (
          <>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-login-email">Email</Label>
              <TextInput
                id="mittai-login-email"
                aria-label="Email"
                type="email"
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLogin();
                }}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-login-password">Password</Label>
              <TextInput
                id="mittai-login-password"
                aria-label="Password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLogin();
                }}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFooterStyles}>
              <Button
                variant="primary"
                onClick={() => void handleLogin()}
                disabled={isLoading}
                leftGlyph={
                  isLoading ? <Icon glyph="Refresh" /> : <Icon glyph="LogIn" />
                }
              >
                {isLoading ? 'Logging in…' : 'Log In'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-signup-username">Username</Label>
              <TextInput
                id="mittai-signup-username"
                aria-label="Username"
                placeholder="your_username"
                value={signupUsername}
                onChange={(e) => setSignupUsername(e.target.value)}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-signup-email">Email</Label>
              <TextInput
                id="mittai-signup-email"
                aria-label="Email"
                type="email"
                placeholder="you@example.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-signup-password">Password</Label>
              <TextInput
                id="mittai-signup-password"
                aria-label="Password"
                type="password"
                placeholder="min. 8 characters"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFieldStyles}>
              <Label htmlFor="mittai-signup-confirm">Confirm Password</Label>
              <TextInput
                id="mittai-signup-confirm"
                aria-label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={signupConfirm}
                onChange={(e) => setSignupConfirm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSignup();
                }}
                disabled={isLoading}
                sizeVariant="small"
              />
            </div>
            <div className={authFooterStyles}>
              <Button
                variant="primary"
                onClick={() => void handleSignup()}
                disabled={isLoading}
                leftGlyph={
                  isLoading ? (
                    <Icon glyph="Refresh" />
                  ) : (
                    <Icon glyph="PlusWithCircle" />
                  )
                }
              >
                {isLoading ? 'Creating account…' : 'Create Account'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── WorkflowCard ────────────────────────────────────────────────────────────

interface WorkflowCardProps {
  workflow: Workflow;
  mittaiServerUrl: string;
  onSelectWorkflow?: (workflow: Workflow) => void;
  onDeleted: (id: string) => void;
  onUpdated: (updated: Workflow) => void;
}

function makeDraftFromWorkflow(workflow: Workflow): EditDraft {
  // Convert {{fieldname}} → @fieldname for the editable prompt
  const editorPrompt = workflow.config.prompt.replace(
    /\{\{([\w.]+)\}\}/g,
    '@$1'
  );
  return {
    name: workflow.name,
    description: workflow.description ?? '',
    prompt: editorPrompt,
    outputField: workflow.config.output.field,
    outputMode: (workflow.config.output.mode as OutputMode) ?? 'new-field',
    modelProvider:
      (workflow.config.model.provider as ModelProvider) ?? 'gemini',
    modelName: workflow.config.model.name,
    temperature: workflow.config.model.temperature,
    executionLimit:
      workflow.config.execution.limit !== null &&
      workflow.config.execution.limit !== undefined
        ? String(workflow.config.execution.limit)
        : '',
  };
}

function WorkflowCard({
  workflow,
  mittaiServerUrl,
  onSelectWorkflow,
  onDeleted,
  onUpdated,
}: WorkflowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(() =>
    makeDraftFromWorkflow(workflow)
  );
  const [draftErrors, setDraftErrors] = useState<
    Partial<Record<keyof EditDraft, string>>
  >({});

  const handleCardClick = useCallback(() => {
    if (!isEditing) {
      setIsExpanded((prev) => !prev);
    }
  }, [isEditing]);

  const handleStartEdit = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      setDraft(makeDraftFromWorkflow(workflow));
      setDraftErrors({});
      setIsEditing(true);
      setIsExpanded(false);
    },
    [workflow]
  );

  const handleCancelEdit = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsEditing(false);
    setDraftErrors({});
  }, []);

  const validateDraft = useCallback((d: EditDraft) => {
    const errors: Partial<Record<keyof EditDraft, string>> = {};
    if (!d.name.trim()) errors.name = 'Name is required';
    if (!d.prompt.trim()) errors.prompt = 'Prompt is required';
    if (!d.outputField.trim()) errors.outputField = 'Output field is required';
    if (!d.modelName.trim()) errors.modelName = 'Model name is required';
    const limit = Number(d.executionLimit);
    if (d.executionLimit !== '' && (isNaN(limit) || limit < 0)) {
      errors.executionLimit = 'Must be a non-negative number';
    }
    return errors;
  }, []);

  const handleSaveEdit = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      const errors = validateDraft(draft);
      if (Object.keys(errors).length > 0) {
        setDraftErrors(errors);
        return;
      }

      setIsSaving(true);
      try {
        // Convert @fieldname → {{fieldname}} for the config
        const configPrompt = draft.prompt.replace(/@([\w.]+)/g, '{{$1}}');
        // Re-extract input_fields from the prompt
        const inputFieldMatches = [...draft.prompt.matchAll(/@([\w.]+)/g)];
        const inputFields = [...new Set(inputFieldMatches.map((m) => m[1]))];

        const executionLimit =
          draft.executionLimit !== ''
            ? Number(draft.executionLimit)
            : undefined;

        const body = {
          name: draft.name.trim(),
          description: draft.description.trim(),
          config: {
            ...workflow.config,
            input_fields: inputFields,
            output: {
              field: draft.outputField.trim(),
              mode: draft.outputMode,
            },
            prompt: configPrompt,
            model: {
              provider: draft.modelProvider,
              name: draft.modelName,
              temperature: draft.temperature,
            },
            execution: {
              limit: executionLimit,
            },
          },
        };

        const response = await fetch(
          `${mittaiServerUrl}/workflows/${workflow.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || response.statusText);
        }

        const updated = (await response.json()) as Workflow;
        onUpdated(updated);
        setIsEditing(false);

        openToast('manage-workflows-updated', {
          variant: 'success',
          title: 'Workflow updated',
          description: `"${updated.name}" has been saved.`,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        openToast('manage-workflows-update-error', {
          variant: 'warning',
          title: 'Failed to update workflow',
          description: message,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [draft, workflow, mittaiServerUrl, onUpdated, validateDraft]
  );

  const handleCopyConfig = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation();
      void navigator.clipboard
        .writeText(JSON.stringify(workflow.config, null, 2))
        .then(() => {
          openToast('manage-workflows-copied', {
            variant: 'success',
            title: 'Copied',
            description: 'Workflow configuration copied to clipboard.',
          });
        })
        .catch(() => {
          openToast('manage-workflows-copy-error', {
            variant: 'warning',
            title: 'Copy failed',
            description: 'Failed to copy to clipboard.',
          });
        });
    },
    [workflow.config]
  );

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

  const modelModels = MODEL_OPTIONS[draft.modelProvider]?.models ?? [];

  return (
    <div
      className={`${workflowCardStyles} ${
        isEditing ? workflowCardEditingStyles : ''
      }`}
    >
      {/* ── Card header (always visible) ── */}
      <div
        className={workflowHeaderStyles}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isEditing) {
            setIsExpanded((prev) => !prev);
          }
        }}
      >
        <div className={workflowTitleStyles}>
          <Icon glyph="Diagram" />
          <span className={workflowNameStyles}>{workflow.name}</span>
          <Badge variant="lightgray">{workflow.config.model.provider}</Badge>
          {isEditing && <Badge variant="yellow">Editing</Badge>}
        </div>

        <div
          className={workflowActionsStyles}
          role="toolbar"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {!isEditing && (
            <>
              <Button
                variant="default"
                size="xsmall"
                leftGlyph={<Icon glyph="Copy" />}
                onClick={handleCopyConfig}
                aria-label="Copy configuration"
              />
              <Button
                variant="default"
                size="xsmall"
                leftGlyph={<Icon glyph="Edit" />}
                onClick={handleStartEdit}
                aria-label="Edit workflow"
              >
                Edit
              </Button>
              {onSelectWorkflow && (
                <Button
                  variant="primary"
                  size="xsmall"
                  leftGlyph={<Icon glyph="Play" />}
                  onClick={(e: React.MouseEvent<HTMLElement>) => {
                    e.stopPropagation();
                    onSelectWorkflow(workflow);
                  }}
                >
                  Use
                </Button>
              )}
              <Button
                variant="dangerOutline"
                size="xsmall"
                leftGlyph={<Icon glyph="Trash" />}
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.stopPropagation();
                  setIsDeleting(true);
                }}
                aria-label="Delete workflow"
              />
            </>
          )}
        </div>
      </div>

      {/* ── Description + meta (when not editing) ── */}
      {!isEditing && (
        <>
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
              <span>
                Output: {workflow.config.output.field} (
                {workflow.config.output.mode})
              </span>
            </div>
            <div className={workflowMetaItemStyles}>
              <Icon glyph="Clock" size="small" />
              <span>Updated: {formatDate(workflow.updated_at)}</span>
            </div>
            {workflow.config.execution.limit !== null &&
              workflow.config.execution.limit !== undefined && (
                <div className={workflowMetaItemStyles}>
                  <Icon glyph="CurlyBraces" size="small" />
                  <span>Limit: {workflow.config.execution.limit}</span>
                </div>
              )}
          </div>

          {isExpanded && (
            <div className={expandedConfigStyles}>
              <strong>Prompt:</strong>
              {'\n'}
              {workflow.config.prompt}
            </div>
          )}
        </>
      )}

      {/* ── Inline edit panel ── */}
      {isEditing && (
        <div
          className={`${editPanelStyles} ${
            isSaving ? editSavingOverlayStyles : ''
          }`}
          role="form"
          aria-label="Edit workflow"
        >
          <div className={editPanelTitleStyles}>
            <Icon glyph="Edit" size="small" />
            Edit Workflow
          </div>

          {/* Name + Description */}
          <div className={editTwoColumnStyles}>
            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-name-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Name *
              </Label>
              <TextInput
                id={`edit-name-${workflow.id}`}
                aria-label="Workflow name"
                value={draft.name}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, name: e.target.value }));
                  if (draftErrors.name)
                    setDraftErrors((err) => ({ ...err, name: undefined }));
                }}
                state={draftErrors.name ? 'error' : 'none'}
                errorMessage={draftErrors.name}
                sizeVariant="small"
              />
            </div>

            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-desc-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Description
              </Label>
              <TextInput
                id={`edit-desc-${workflow.id}`}
                aria-label="Workflow description"
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                sizeVariant="small"
              />
            </div>
          </div>

          {/* Prompt */}
          <div className={editFieldRowStyles}>
            <Label
              htmlFor={`edit-prompt-${workflow.id}`}
              className={editFieldLabelStyles}
            >
              Prompt * (use @fieldname to reference document fields)
            </Label>
            <TextArea
              id={`edit-prompt-${workflow.id}`}
              aria-labelledby={`edit-prompt-${workflow.id}`}
              value={draft.prompt}
              onChange={(e) => {
                setDraft((d) => ({ ...d, prompt: e.target.value }));
                if (draftErrors.prompt)
                  setDraftErrors((err) => ({ ...err, prompt: undefined }));
              }}
              state={draftErrors.prompt ? 'error' : 'none'}
              errorMessage={draftErrors.prompt}
              rows={4}
            />
          </div>

          {/* Output field + mode */}
          <div className={editTwoColumnStyles}>
            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-outfield-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Output Field *
              </Label>
              <TextInput
                id={`edit-outfield-${workflow.id}`}
                aria-label="Output field name"
                value={draft.outputField}
                onChange={(e) => {
                  setDraft((d) => ({ ...d, outputField: e.target.value }));
                  if (draftErrors.outputField)
                    setDraftErrors((err) => ({
                      ...err,
                      outputField: undefined,
                    }));
                }}
                state={draftErrors.outputField ? 'error' : 'none'}
                errorMessage={draftErrors.outputField}
                sizeVariant="small"
              />
            </div>

            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-outmode-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Output Mode
              </Label>
              <Select
                id={`edit-outmode-${workflow.id}`}
                aria-labelledby={`edit-outmode-${workflow.id}`}
                value={draft.outputMode}
                onChange={(val) =>
                  setDraft((d) => ({ ...d, outputMode: val as OutputMode }))
                }
                size="small"
              >
                {OUTPUT_MODE_OPTIONS.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* Provider + Model + Temperature + Limit */}
          <div className={editThreeColumnStyles}>
            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-provider-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Provider
              </Label>
              <Select
                id={`edit-provider-${workflow.id}`}
                aria-labelledby={`edit-provider-${workflow.id}`}
                value={draft.modelProvider}
                onChange={(val) => {
                  const provider = val as ModelProvider;
                  const firstModel = MODEL_OPTIONS[provider]?.models[0] ?? '';
                  setDraft((d) => ({
                    ...d,
                    modelProvider: provider,
                    modelName: firstModel,
                  }));
                }}
                size="small"
              >
                {(Object.keys(MODEL_OPTIONS) as ModelProvider[]).map((p) => (
                  <Option key={p} value={p}>
                    {MODEL_OPTIONS[p].label}
                  </Option>
                ))}
              </Select>
            </div>

            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-model-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Model *
              </Label>
              <Select
                id={`edit-model-${workflow.id}`}
                aria-labelledby={`edit-model-${workflow.id}`}
                value={draft.modelName}
                onChange={(val) => setDraft((d) => ({ ...d, modelName: val }))}
                size="small"
              >
                {modelModels.map((m) => (
                  <Option key={m} value={m}>
                    {m}
                  </Option>
                ))}
              </Select>
            </div>

            <div className={editFieldRowStyles}>
              <Label
                htmlFor={`edit-temp-${workflow.id}`}
                className={editFieldLabelStyles}
              >
                Temperature
              </Label>
              <TextInput
                id={`edit-temp-${workflow.id}`}
                aria-label="Temperature"
                type="number"
                value={String(draft.temperature)}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    temperature: Math.min(
                      2,
                      Math.max(0, Number(e.target.value))
                    ),
                  }))
                }
                sizeVariant="small"
              />
            </div>
          </div>

          <div className={editFieldRowStyles} style={{ maxWidth: '200px' }}>
            <Label
              htmlFor={`edit-limit-${workflow.id}`}
              className={editFieldLabelStyles}
            >
              Execution Limit (blank = no limit)
            </Label>
            <TextInput
              id={`edit-limit-${workflow.id}`}
              aria-label="Execution limit"
              type="number"
              value={draft.executionLimit}
              onChange={(e) => {
                setDraft((d) => ({ ...d, executionLimit: e.target.value }));
                if (draftErrors.executionLimit)
                  setDraftErrors((err) => ({
                    ...err,
                    executionLimit: undefined,
                  }));
              }}
              state={draftErrors.executionLimit ? 'error' : 'none'}
              errorMessage={draftErrors.executionLimit}
              sizeVariant="small"
            />
          </div>

          <div className={editActionsStyles}>
            <Button
              variant="default"
              size="small"
              onClick={handleCancelEdit}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="small"
              leftGlyph={
                isSaving ? <Icon glyph="Refresh" /> : <Icon glyph="Save" />
              }
              onClick={(e: React.MouseEvent<HTMLElement>) =>
                void handleSaveEdit(e)
              }
              disabled={isSaving}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmationModal
        open={isDeleting}
        title="Delete Workflow"
        variant="danger"
        confirmButtonProps={{ children: 'Delete' }}
        onConfirm={() => {
          void (async () => {
            try {
              const response = await fetch(
                `${mittaiServerUrl}/workflows/${workflow.id}`,
                { method: 'DELETE' }
              );
              if (!response.ok) {
                throw new Error(`Failed to delete: ${response.statusText}`);
              }
              onDeleted(workflow.id);
              openToast('manage-workflows-deleted', {
                variant: 'success',
                title: 'Workflow deleted',
                description: `"${workflow.name}" has been deleted.`,
              });
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Unknown error';
              openToast('manage-workflows-delete-error', {
                variant: 'warning',
                title: 'Failed to delete workflow',
                description: message,
              });
            } finally {
              setIsDeleting(false);
            }
          })();
        }}
        onCancel={() => setIsDeleting(false)}
      >
        <Body>
          Are you sure you want to delete{' '}
          <strong>&quot;{workflow.name}&quot;</strong>? This action cannot be
          undone.
        </Body>
      </ConfirmationModal>
    </div>
  );
}

// ─── ManageWorkflowsScreen ──────────────────────────────────────────────────

const ManageWorkflowsScreen: React.FC<ManageWorkflowsScreenProps> = ({
  namespace,
  mittaiServerUrl = DEFAULT_MITTAI_URL,
  onSelectWorkflow,
  onClose,
}) => {
  // ── Auth state ─────────────────────────────────────────────────────────────
  const [auth, setAuth] = useState<AuthState | null>(() =>
    loadAuthFromStorage()
  );

  const handleAuthSuccess = useCallback((newAuth: AuthState) => {
    saveAuthToStorage(newAuth);
    setAuth(newAuth);
    openToast('mittai-auth-success', {
      variant: 'success',
      title: `Welcome, ${newAuth.user.username}!`,
      description: 'You are now logged in to Mittai.',
    });
  }, []);

  const handleLogout = useCallback(() => {
    clearAuthFromStorage();
    setAuth(null);
  }, []);

  // ── Workflow state ──────────────────────────────────────────────────────────
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWorkflows = useCallback(async () => {
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = new URL(`${mittaiServerUrl}/workflows`);
      if (namespace) url.searchParams.set('namespace', namespace);

      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      // Token expired or invalid — log out
      if (response.status === 401) {
        clearAuthFromStorage();
        setAuth(null);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch workflows: ${response.statusText}`);
      }
      const data = (await response.json()) as { workflows?: Workflow[] };
      setWorkflows(data.workflows ?? []);
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
  }, [auth, mittaiServerUrl, namespace]);

  useEffect(() => {
    if (auth) {
      void fetchWorkflows();
    }
  }, [auth, fetchWorkflows]);

  const handleDeleted = useCallback((id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleUpdated = useCallback((updated: Workflow) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  }, []);

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const q = searchQuery.toLowerCase();
    return workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.namespace.toLowerCase().includes(q)
    );
  }, [workflows, searchQuery]);

  // ── Not logged in: show auth screen ────────────────────────────────────────
  if (!auth) {
    return (
      <AuthScreen
        mittaiServerUrl={mittaiServerUrl}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // ── Logged in: show workflow list ───────────────────────────────────────────
  return (
    <div className={containerStyles}>
      {/* Logged-in user banner */}
      <div className={authUserBannerStyles}>
        <div className={authUserInfoStyles}>
          <Icon glyph="Person" size="small" />
          <span>
            Signed in as <strong>{auth.user.username}</strong>
            <span style={{ color: 'var(--palette-gray-base)', marginLeft: 6 }}>
              ({auth.user.email})
            </span>
          </span>
        </div>
        <Button
          variant="default"
          size="xsmall"
          leftGlyph={<Icon glyph="LogOut" />}
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>

      {/* Header */}
      <div className={headerStyles}>
        <div className={titleStyles}>
          <Icon glyph="Sparkle" size="large" />
          <Subtitle>Manage Workflows</Subtitle>
          <Badge variant="blue">{filteredWorkflows.length}</Badge>
        </div>

        <div className={searchContainerStyles}>
          <TextInput
            aria-label="Search workflows"
            placeholder="Search workflows…"
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
          <Body>Loading workflows…</Body>
        </div>
      ) : filteredWorkflows.length === 0 ? (
        <div className={emptyStateStyles}>
          <Icon glyph="Folder" size="xlarge" />
          <Subtitle>No workflows found</Subtitle>
          <Body>
            {searchQuery
              ? 'No workflows match your search. Try a different query.'
              : 'Create your first workflow using the AI Workflow Builder in any collection.'}
          </Body>
        </div>
      ) : (
        <div className={workflowListStyles}>
          {filteredWorkflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              mittaiServerUrl={mittaiServerUrl}
              onSelectWorkflow={onSelectWorkflow}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
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
    </div>
  );
};

export default ManageWorkflowsScreen;
