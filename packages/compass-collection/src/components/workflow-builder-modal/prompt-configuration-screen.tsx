import React, { useCallback, useMemo } from 'react';
import {
  Body,
  Description,
  Label,
  spacing,
  css,
  TextArea,
  Banner,
  InlineCode,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const descriptionStyles = css({
  marginBottom: spacing[200],
});

const textAreaStyles = css({
  minHeight: '200px',
  fontFamily: 'monospace',
  fontSize: '13px',
});

const exampleBoxStyles = css({
  marginTop: spacing[300],
  padding: spacing[300],
  backgroundColor: 'var(--palette-gray-light3)',
  borderRadius: spacing[100],
  fontFamily: 'monospace',
  fontSize: '12px',
  whiteSpace: 'pre-wrap',
});

const fieldTagsContainerStyles = css({
  display: 'flex',
  flexWrap: 'wrap',
  gap: spacing[200],
  marginTop: spacing[200],
  marginBottom: spacing[200],
});

const fieldTagStyles = css({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${spacing[100]}px ${spacing[200]}px`,
  backgroundColor: 'var(--palette-blue-light3)',
  color: 'var(--palette-blue-dark2)',
  borderRadius: spacing[100],
  fontSize: '12px',
  fontFamily: 'monospace',
  cursor: 'pointer',
  border: '1px solid var(--palette-blue-light2)',
  '&:hover': {
    backgroundColor: 'var(--palette-blue-light2)',
  },
});

const warningBannerStyles = css({
  marginTop: spacing[300],
});

interface PromptConfigurationScreenProps {
  prompt: string;
  selectedFields: string[];
  onPromptChange: (prompt: string) => void;
}

const PromptConfigurationScreen: React.FC<PromptConfigurationScreenProps> = ({
  prompt,
  selectedFields,
  onPromptChange,
}) => {
  const handlePromptChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onPromptChange(event.target.value);
    },
    [onPromptChange]
  );

  const handleFieldTagClick = useCallback(
    (fieldName: string) => {
      const placeholder = `{{${fieldName}}}`;
      onPromptChange(prompt + (prompt ? ' ' : '') + placeholder);
    },
    [prompt, onPromptChange]
  );

  const examplePrompt = useMemo(() => {
    if (selectedFields.length === 0) {
      return 'Select input fields in the previous step to see an example.';
    }
    const firstField = selectedFields[0];
    return `You are a system that processes data.\n\nInput: {{${firstField}}}\n\nProvide a concise summary or analysis.`;
  }, [selectedFields]);

  const usedFields = useMemo(() => {
    const matches = prompt.match(/\{\{(\w+(?:\.\w+)*)\}\}/g);
    if (!matches) return [];
    return matches.map((m) => m.replace(/\{\{|\}\}/g, ''));
  }, [prompt]);

  const unusedFields = useMemo(() => {
    return selectedFields.filter((f) => !usedFields.includes(f));
  }, [selectedFields, usedFields]);

  return (
    <div className={containerStyles}>
      <div>
        <Label id="prompt-input-label" htmlFor="prompt-input">
          Prompt Template
        </Label>
        <Description className={descriptionStyles}>
          Write a prompt that will be sent to the AI model. Use{' '}
          <InlineCode>
            {'{{'} fieldName {'}}'}
          </InlineCode>{' '}
          syntax to reference fields from your selected input fields.
        </Description>

        {selectedFields.length > 0 && (
          <div>
            <Body weight="medium">Available Fields (click to insert):</Body>
            <div className={fieldTagsContainerStyles}>
              {selectedFields.map((field) => (
                <button
                  key={field}
                  className={fieldTagStyles}
                  onClick={() => handleFieldTagClick(field)}
                  type="button"
                >
                  {'{{'} {field} {'}}'}
                </button>
              ))}
            </div>
          </div>
        )}

        <TextArea
          id="prompt-input"
          className={textAreaStyles}
          value={prompt}
          onChange={handlePromptChange}
          placeholder="Enter your prompt template here..."
          aria-labelledby="prompt-input-label"
        />
      </div>

      {unusedFields.length > 0 && (
        <Banner variant="warning" className={warningBannerStyles}>
          You have selected {unusedFields.length} field
          {unusedFields.length === 1 ? '' : 's'} that{' '}
          {unusedFields.length === 1 ? 'is' : 'are'} not used in your prompt:{' '}
          {unusedFields.join(', ')}
        </Banner>
      )}

      <div>
        <Label htmlFor="example-prompt-box">Example Prompt</Label>
        <Description className={descriptionStyles}>
          Here&apos;s an example of how you might structure your prompt:
        </Description>
        <div className={exampleBoxStyles}>{examplePrompt}</div>
      </div>
    </div>
  );
};

export default PromptConfigurationScreen;
