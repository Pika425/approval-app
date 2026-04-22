import {
  Badge,
  Card,
  CardHeader,
  Text,
  Caption1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Filled,
  DismissCircle24Filled,
  Clock24Filled,
  ArrowRight16Filled,
} from "@fluentui/react-icons";
import type { ApprovalStatus, ApproverStep } from "../types";
import type { ReactNode } from "react";

const useStyles = makeStyles({
  timeline: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    flexWrap: "wrap",
    padding: "8px 0",
  },
  step: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  arrow: {
    color: tokens.colorNeutralForeground4,
  },
});

const statusIcon: Record<ApprovalStatus, ReactNode> = {
  approved: <CheckmarkCircle24Filled style={{ color: "#0f7b0f" }} />,
  rejected: <DismissCircle24Filled style={{ color: "#c50f1f" }} />,
  pending: <Clock24Filled style={{ color: "#c48600" }} />,
  cancelled: <DismissCircle24Filled style={{ color: "#8a8886" }} />,
};

const statusAppearance: Record<ApprovalStatus, "success" | "danger" | "warning" | "informative"> = {
  approved: "success",
  rejected: "danger",
  pending: "warning",
  cancelled: "informative",
};

const statusLabel: Record<ApprovalStatus, string> = {
  approved: "已核准",
  rejected: "已駁回",
  pending: "待簽核",
  cancelled: "已取消",
};

type Props = { steps: ApproverStep[] };

export default function ApprovalTimeline({ steps }: Props) {
  const styles = useStyles();

  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <div key={step.order} className={styles.step}>
          {i > 0 && <ArrowRight16Filled className={styles.arrow} />}
          <Card size="small" style={{ minWidth: 140 }}>
            <CardHeader
              image={<span>{statusIcon[step.status]}</span>}
              header={<Text weight="semibold">{step.name}</Text>}
              description={
                <div>
                  <Caption1>{step.role}</Caption1>
                  <br />
                  <Badge size="small" appearance="filled" color={statusAppearance[step.status]}>
                    {statusLabel[step.status]}
                  </Badge>
                  {step.comment && (
                    <Caption1 style={{ display: "block", marginTop: 4 }}>
                      「{step.comment}」
                    </Caption1>
                  )}
                </div>
              }
            />
          </Card>
        </div>
      ))}
    </div>
  );
}
