import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Divider,
  Text,
  Caption1,
  Textarea,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Money24Regular,
  CalendarClock24Regular,
} from "@fluentui/react-icons";
import type { ApprovalRequest, ApprovalStatus } from "../types";
import ApprovalTimeline from "./ApprovalTimeline";

const useStyles = makeStyles({
  card: {
    marginBottom: "12px",
    cursor: "pointer",
    transitionDuration: "0.2s",
    ":hover": {
      boxShadow: tokens.shadow8,
    },
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%",
  },
  meta: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    padding: "0 16px 12px",
  },
  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    color: tokens.colorNeutralForeground3,
  },
  actions: {
    display: "flex",
    gap: "8px",
    padding: "0 16px 16px",
  },
  detailSection: {
    marginBottom: "16px",
  },
  detailLabel: {
    color: tokens.colorNeutralForeground3,
    display: "block",
    marginBottom: "4px",
  },
});

const statusConfig: Record<ApprovalStatus, { label: string; color: "warning" | "success" | "danger" | "informative" }> = {
  pending: { label: "待簽核", color: "warning" },
  approved: { label: "已核准", color: "success" },
  rejected: { label: "已駁回", color: "danger" },
  cancelled: { label: "已取消", color: "informative" },
};

type Props = {
  request: ApprovalRequest;
  showActions: boolean;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
};

export default function ApprovalCard({ request, showActions, onApprove, onReject }: Props) {
  const styles = useStyles();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");
  const [comment, setComment] = useState("");

  const { label, color } = statusConfig[request.status];

  const handleAction = () => {
    if (actionType === "approve") {
      onApprove(request.id, comment);
    } else {
      onReject(request.id, comment);
    }
    setComment("");
    setActionDialogOpen(false);
  };

  return (
    <>
      <Card className={styles.card} onClick={() => setDialogOpen(true)}>
        <CardHeader
          header={
            <div className={styles.header}>
              <div>
                <Text weight="semibold" size={400}>{request.title}</Text>
                <br />
                <Caption1>{request.id} · {request.type}</Caption1>
              </div>
              <Badge appearance="filled" color={color} size="medium">
                {label}
              </Badge>
            </div>
          }
        />
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <CalendarClock24Regular />
            <Caption1>{request.submitDate}</Caption1>
          </span>
          <span className={styles.metaItem}>
            <Caption1>申請人：{request.applicant}（{request.department}）</Caption1>
          </span>
          {request.amount != null && (
            <span className={styles.metaItem}>
              <Money24Regular />
              <Caption1>NT${request.amount.toLocaleString()}</Caption1>
            </span>
          )}
          {request.status === "pending" && (
            <span className={styles.metaItem}>
              <Caption1>待簽：{request.currentApprover}</Caption1>
            </span>
          )}
        </div>
        {showActions && request.status === "pending" && (
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            <Button
              appearance="primary"
              icon={<Checkmark24Regular />}
              onClick={() => { setActionType("approve"); setActionDialogOpen(true); }}
            >
              核准
            </Button>
            <Button
              appearance="secondary"
              icon={<Dismiss24Regular />}
              onClick={() => { setActionType("reject"); setActionDialogOpen(true); }}
            >
              駁回
            </Button>
          </div>
        )}
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
        <DialogSurface style={{ maxWidth: 640 }}>
          <DialogBody>
            <DialogTitle>{request.title}</DialogTitle>
            <DialogContent>
              <div className={styles.detailSection}>
                <Caption1 className={styles.detailLabel}>申請編號</Caption1>
                <Text>{request.id}</Text>
              </div>
              <div className={styles.detailSection}>
                <Caption1 className={styles.detailLabel}>類型</Caption1>
                <Text>{request.type}</Text>
              </div>
              <div className={styles.detailSection}>
                <Caption1 className={styles.detailLabel}>申請人</Caption1>
                <Text>{request.applicant}（{request.department}）</Text>
              </div>
              <div className={styles.detailSection}>
                <Caption1 className={styles.detailLabel}>申請日期</Caption1>
                <Text>{request.submitDate}</Text>
              </div>
              {request.amount != null && (
                <div className={styles.detailSection}>
                  <Caption1 className={styles.detailLabel}>金額</Caption1>
                  <Text weight="semibold">NT${request.amount.toLocaleString()}</Text>
                </div>
              )}
              <div className={styles.detailSection}>
                <Caption1 className={styles.detailLabel}>說明</Caption1>
                <Text>{request.description}</Text>
              </div>
              <Divider style={{ margin: "16px 0" }} />
              <Caption1 className={styles.detailLabel}>簽核流程</Caption1>
              <ApprovalTimeline steps={request.approvers} />
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">關閉</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={(_, data) => setActionDialogOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {actionType === "approve" ? "核准" : "駁回"} - {request.title}
            </DialogTitle>
            <DialogContent>
              <Textarea
                placeholder="輸入簽核意見（選填）"
                value={comment}
                onChange={(_, data) => setComment(data.value)}
                style={{ width: "100%", minHeight: 80 }}
              />
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">取消</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleAction}
                style={actionType === "reject" ? { backgroundColor: tokens.colorPaletteRedBackground3 } : {}}
              >
                確認{actionType === "approve" ? "核准" : "駁回"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
