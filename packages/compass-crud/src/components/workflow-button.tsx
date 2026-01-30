import React from 'react';
import {
  Icon,
  Button,
  Tooltip,
  WorkspaceContainer,
  css,
} from '@mongodb-js/compass-components';
import { DOCUMENT_NARROW_ICON_BREAKPOINT } from '../constants/document-narrow-icon-breakpoint';

type WorkflowButtonProps = {
  isWritable: boolean;
  onClick: () => void;
};

const hiddenOnNarrowStyles = css({
  [`@container ${WorkspaceContainer.toolbarContainerQueryName} (width < ${DOCUMENT_NARROW_ICON_BREAKPOINT})`]:
    {
      display: 'none',
    },
});

const WorkflowButtonComponent: React.FunctionComponent<WorkflowButtonProps> = ({
  isWritable,
  onClick,
}) => {
  return (
    <Button
      disabled={!isWritable}
      value={'Workflow'}
      size="xsmall"
      onClick={onClick}
      leftGlyph={<Icon glyph="Wizard"></Icon>}
      data-testid="crud-workflow-button"
      title="Create AI Workflow"
    >
      <span className={hiddenOnNarrowStyles}>Workflow</span>
    </Button>
  );
};

type WorkflowMenuProps = WorkflowButtonProps & {
  disabledTooltip: string;
};

const WorkflowButton: React.FunctionComponent<WorkflowMenuProps> = ({
  isWritable,
  onClick,
  disabledTooltip,
}) => {
  if (isWritable) {
    return (
      <WorkflowButtonComponent
        isWritable={true}
        onClick={onClick}
      ></WorkflowButtonComponent>
    );
  }

  return (
    <Tooltip
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLInputElement>) => (
        <div {...tooltipTriggerProps}>
          <WorkflowButtonComponent onClick={onClick} isWritable={false} />
          {tooltipChildren}
        </div>
      )}
      enabled={!isWritable}
      justify="middle"
    >
      {disabledTooltip}
    </Tooltip>
  );
};

export default WorkflowButton;
