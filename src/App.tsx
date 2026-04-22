import { useEffect, useState } from "react";
import {
  FluentProvider,
  webLightTheme,
  Tab,
  TabList,
  Badge,
  Text,
  makeStyles,
  tokens,
  Toaster,
  useToastController,
  useId,
  Toast,
  ToastBody,
  ToastTitle,
} from "@fluentui/react-components";
import {
  ClipboardTask24Regular,
  CheckmarkCircle24Regular,
  DocumentBulletList24Regular,
  Table24Regular,
} from "@fluentui/react-icons";
import type { ApprovalRequest } from "./types";
import ApprovalCard from "./components/ApprovalCard";
import NewRequestButton from "./components/NewRequestButton";
import EditableTable from "./components/EditableTable";
import type { ColumnDef } from "./components/EditableTable";
import {
  createApproval,
  fetchApprovals,
  getBackendDisplayName,
  triggerApprovalFlow,
  updateApproval,
} from "./services/flowService";

const useStyles = makeStyles({
  root: {
    minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  header: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: "20px 24px 12px",
  },
  headerTitle: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  content: {
    padding: "20px 24px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  statCard: {
    flex: 1,
    minWidth: "140px",
    backgroundColor: "#fff",
    borderRadius: tokens.borderRadiusMedium,
    padding: "16px",
    boxShadow: tokens.shadow2,
    textAlign: "center" as const,
  },
  statNumber: {
    fontSize: "28px",
    fontWeight: 700,
    display: "block",
  },
  emptyState: {
    textAlign: "center" as const,
    padding: "60px 20px",
    color: tokens.colorNeutralForeground3,
  },
  envPanel: {
    backgroundColor: "#fff7e6",
    border: "1px solid #f7d9a7",
    borderRadius: tokens.borderRadiusMedium,
    padding: "10px 12px",
    marginBottom: "14px",
  },
  envRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "4px",
  },
  envTag: {
    backgroundColor: "#fff",
    border: "1px solid #e5e5e5",
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: "12px",
  },
});

type TabValue = "pending" | "my-requests" | "history" | "data-table";
type FetchCheck = "checking" | "ok" | "blocked";

type EnvHealth = {
  url: string;
  host: string;
  isProxyHost: boolean;
  hasBridge: boolean;
  fetchCheck: FetchCheck;
};

const demoColumns: ColumnDef[] = [
  { key: "name", label: "品項名稱", width: "30%" },
  { key: "qty", label: "數量", width: "15%", type: "number" },
  { key: "price", label: "單價", width: "15%", type: "number" },
  { key: "note", label: "備註" },
];

function AppContent() {
  const styles = useStyles();
  const backendName = getBackendDisplayName();
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [tab, setTab] = useState<TabValue>("pending");
  const [envHealth, setEnvHealth] = useState<EnvHealth>({
    url: window.location.href,
    host: window.location.host,
    isProxyHost:
      window.location.host.includes("powerplatformusercontent") ||
      window.location.href.includes("/proxy/"),
    hasBridge: !!(window as any).powerAppsBridge,
    fetchCheck: "checking",
  });

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  useEffect(() => {
    const load = async () => {
      const data = await fetchApprovals();
      setRequests(data);
    };
    void load();
  }, []);

  useEffect(() => {
    const checkEnvironment = async () => {
      let fetchCheck: FetchCheck = "checking";
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        await fetch(window.location.origin, {
          method: "HEAD",
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timer);
        fetchCheck = "ok";
      } catch {
        fetchCheck = "blocked";
      }

      setEnvHealth({
        url: window.location.href,
        host: window.location.host,
        isProxyHost:
          window.location.host.includes("powerplatformusercontent") ||
          window.location.href.includes("/proxy/"),
        hasBridge: !!(window as any).powerAppsBridge,
        fetchCheck,
      });
    };

    void checkEnvironment();
  }, []);

  const myEmail = "B11410001@pershing.com.tw";

  const pendingForMe = requests.filter(
    (r) =>
      r.status === "pending" &&
      r.approvers.some((a) => a.status === "pending" && a.name === "林廷軒")
  );

  const myRequests = requests.filter((r) => r.applicantEmail === myEmail);

  const history = requests.filter(
    (r) => r.status === "approved" || r.status === "rejected"
  );

  const handleApprove = async (id: string, comment: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      const ok = await triggerApprovalFlow({
        requestId: id,
        title: request.title,
        action: "approve",
        approver: myEmail,
        comment: comment || "同意",
      });
      if (!ok) {
        dispatchToast(
          <Toast>
            <ToastTitle>Flow 呼叫失敗</ToastTitle>
            <ToastBody>無法觸發 Power Automate，但簽核狀態已更新</ToastBody>
          </Toast>,
          { intent: "warning" }
        );
      }
    }
    let updatedRequest: ApprovalRequest | null = null;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updatedApprovers = r.approvers.map((a) => {
          if (a.status === "pending" && a.name === "林廷軒") {
            return {
              ...a,
              status: "approved" as const,
              comment: comment || "同意",
              actionDate: new Date().toISOString().slice(0, 10),
            };
          }
          return a;
        });
        const allApproved = updatedApprovers.every(
          (a) => a.status === "approved"
        );
        const nextPending = updatedApprovers.find(
          (a) => a.status === "pending"
        );
        updatedRequest = {
          ...r,
          approvers: updatedApprovers,
          status: allApproved ? ("approved" as const) : ("pending" as const),
          currentApprover: nextPending?.name ?? "",
        };
        return updatedRequest;
      })
    );

    if (updatedRequest) {
      const saved = await updateApproval(id, updatedRequest);
      if (!saved) {
        dispatchToast(
          <Toast>
            <ToastTitle>{backendName} 更新失敗</ToastTitle>
            <ToastBody>簽核狀態已更新於畫面，但未成功寫回 {backendName}</ToastBody>
          </Toast>,
          { intent: "warning" }
        );
      }
    }
    dispatchToast(
      <Toast>
        <ToastTitle>已核准</ToastTitle>
        <ToastBody>簽核單 {id} 已核准</ToastBody>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleReject = async (id: string, comment: string) => {
    const request = requests.find((r) => r.id === id);
    if (request) {
      const ok = await triggerApprovalFlow({
        requestId: id,
        title: request.title,
        action: "reject",
        approver: myEmail,
        comment: comment || "不同意",
      });
      if (!ok) {
        dispatchToast(
          <Toast>
            <ToastTitle>Flow 呼叫失敗</ToastTitle>
            <ToastBody>無法觸發 Power Automate，但簽核狀態已更新</ToastBody>
          </Toast>,
          { intent: "warning" }
        );
      }
    }
    let updatedRequest: ApprovalRequest | null = null;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updatedApprovers = r.approvers.map((a) => {
          if (a.status === "pending" && a.name === "林廷軒") {
            return {
              ...a,
              status: "rejected" as const,
              comment: comment || "不同意",
              actionDate: new Date().toISOString().slice(0, 10),
            };
          }
          return a;
        });
        updatedRequest = {
          ...r,
          approvers: updatedApprovers,
          status: "rejected" as const,
          currentApprover: "",
        };
        return updatedRequest;
      })
    );

    if (updatedRequest) {
      const saved = await updateApproval(id, updatedRequest);
      if (!saved) {
        dispatchToast(
          <Toast>
            <ToastTitle>{backendName} 更新失敗</ToastTitle>
            <ToastBody>簽核狀態已更新於畫面，但未成功寫回 {backendName}</ToastBody>
          </Toast>,
          { intent: "warning" }
        );
      }
    }
    dispatchToast(
      <Toast>
        <ToastTitle>已駁回</ToastTitle>
        <ToastBody>簽核單 {id} 已駁回</ToastBody>
      </Toast>,
      { intent: "error" }
    );
  };

  const handleNewRequest = async (request: ApprovalRequest) => {
    const ok = await createApproval(request);
    if (!ok) {
      dispatchToast(
        <Toast>
          <ToastTitle>{backendName} 新增失敗</ToastTitle>
          <ToastBody>未能寫入 {backendName}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    // 從資料來源重新載入，確保顯示最新資料
    const refreshed = await fetchApprovals();
    setRequests(refreshed);
    dispatchToast(
      <Toast>
        <ToastTitle>已送出</ToastTitle>
        <ToastBody>簽核單已送出，共 {refreshed.length} 筆資料</ToastBody>
      </Toast>,
      { intent: "success" }
    );
  };

  const currentList =
    tab === "pending"
      ? pendingForMe
      : tab === "my-requests"
        ? myRequests
        : history;

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} position="top-end" />

      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <Text size={600} weight="bold" style={{ color: "#fff" }}>
            簽核系統
          </Text>
          <NewRequestButton onSubmit={handleNewRequest} />
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.envPanel}>
          <Text size={300} weight="semibold">
            執行環境檢查
          </Text>
          <div className={styles.envRow}>
            <span className={styles.envTag}>Host: {envHealth.host}</span>
            <span className={styles.envTag}>
              Bridge: {envHealth.hasBridge ? "available" : "missing"}
            </span>
            <span className={styles.envTag}>
              Fetch: {envHealth.fetchCheck === "ok" ? "allowed" : envHealth.fetchCheck === "blocked" ? "blocked" : "checking"}
            </span>
            <span className={styles.envTag}>
              Proxy Host: {envHealth.isProxyHost ? "yes" : "no"}
            </span>
          </div>
          {!envHealth.hasBridge && envHealth.isProxyHost && (
            <Text size={200} style={{ color: "#8a5b00", display: "block", marginTop: 6 }}>
              目前在受限 proxy 宿主中，Dataverse SDK 通常不可用；請改用 Power Automate API 或由 apps.powerapps.com 正式 player 開啟。
            </Text>
          )}
          <Text size={100} style={{ color: "#666", display: "block", marginTop: 4 }}>
            URL: {envHealth.url}
          </Text>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber} style={{ color: "#c48600" }}>
              {pendingForMe.length}
            </span>
            <Text size={200}>待我簽核</Text>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber} style={{ color: "#0078d4" }}>
              {myRequests.filter((r) => r.status === "pending").length}
            </span>
            <Text size={200}>我的待處理</Text>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber} style={{ color: "#0f7b0f" }}>
              {requests.filter((r) => r.status === "approved").length}
            </span>
            <Text size={200}>已核准</Text>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber} style={{ color: "#c50f1f" }}>
              {requests.filter((r) => r.status === "rejected").length}
            </span>
            <Text size={200}>已駁回</Text>
          </div>
        </div>

        <TabList
          selectedValue={tab}
          onTabSelect={(_, data) => setTab(data.value as TabValue)}
          style={{ marginBottom: 16 }}
        >
          <Tab value="pending" icon={<ClipboardTask24Regular />}>
            待簽核
            {pendingForMe.length > 0 && (
              <Badge
                size="small"
                appearance="filled"
                color="danger"
                style={{ marginLeft: 6 }}
              >
                {pendingForMe.length}
              </Badge>
            )}
          </Tab>
          <Tab value="my-requests" icon={<DocumentBulletList24Regular />}>
            我的申請
          </Tab>
          <Tab value="history" icon={<CheckmarkCircle24Regular />}>
            歷史紀錄
          </Tab>
          <Tab value="data-table" icon={<Table24Regular />}>
            資料管理
          </Tab>
        </TabList>

        {tab === "data-table" ? (
          <EditableTable columns={demoColumns} />
        ) : currentList.length === 0 ? (
          <div className={styles.emptyState}>
            <Text size={400}>
              {tab === "pending"
                ? "目前沒有待簽核的單據 🎉"
                : tab === "my-requests"
                  ? "你還沒有提出任何申請"
                  : "目前沒有歷史紀錄"}
            </Text>
          </div>
        ) : (
          currentList.map((r) => (
            <ApprovalCard
              key={r.id}
              request={r}
              showActions={tab === "pending"}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <AppContent />
    </FluentProvider>
  );
}
