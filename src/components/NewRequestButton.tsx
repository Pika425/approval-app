import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  Field,
  Input,
  Option,
  Textarea,
  makeStyles,
} from "@fluentui/react-components";
import { Add24Regular } from "@fluentui/react-icons";
import type { ApprovalRequest } from "../types";

const useStyles = makeStyles({
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
});

const requestTypes = ["出差申請", "採購申請", "請假申請", "加班申請", "費用報銷"];

type Props = {
  applicantName: string;
  applicantEmail: string;
  onSubmit: (request: ApprovalRequest) => void;
};

export default function NewRequestButton({ applicantName, applicantEmail, onSubmit }: Props) {
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("出差申請");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const firstApprover =
    (import.meta.env.VITE_DEFAULT_APPROVER_1 as string) || "李組長";
  const secondApprover =
    (import.meta.env.VITE_DEFAULT_APPROVER_2 as string) || "王經理";
  const defaultDepartment =
    (import.meta.env.VITE_DEFAULT_DEPARTMENT as string) || "未設定部門";

  const handleSubmit = () => {
    const now = new Date();
    const id = `REQ-${now.getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`;

    const newRequest: ApprovalRequest = {
      id,
      title: title || `${type}`,
      type,
      applicant: applicantName,
      applicantEmail,
      department: defaultDepartment,
      submitDate: now.toISOString().slice(0, 10),
      amount: amount ? Number(amount) : undefined,
      description,
      status: "pending",
      currentApprover: firstApprover,
      approvers: [
        { order: 1, name: firstApprover, role: "直屬主管", status: "pending" },
        { order: 2, name: secondApprover, role: "部門經理", status: "pending" },
      ],
    };

    onSubmit(newRequest);
    setTitle("");
    setType("出差申請");
    setAmount("");
    setDescription("");
    setOpen(false);
  };

  return (
    <>
      <Button appearance="primary" icon={<Add24Regular />} onClick={() => setOpen(true)}>
        新增簽核
      </Button>

      <Dialog open={open} onOpenChange={(_, data) => setOpen(data.open)}>
        <DialogSurface style={{ maxWidth: 520 }}>
          <DialogBody>
            <DialogTitle>新增簽核申請</DialogTitle>
            <DialogContent>
              <div className={styles.form}>
                <Field label="申請類型" required>
                  <Dropdown
                    value={type}
                    onOptionSelect={(_, data) => setType(data.optionValue ?? "出差申請")}
                  >
                    {requestTypes.map((t) => (
                      <Option key={t} value={t}>{t}</Option>
                    ))}
                  </Dropdown>
                </Field>
                <Field label="標題" required>
                  <Input
                    value={title}
                    onChange={(_, data) => setTitle(data.value)}
                    placeholder={`例：${type} - 簡短描述`}
                  />
                </Field>
                <Field label="金額（選填）">
                  <Input
                    type="number"
                    value={amount}
                    onChange={(_, data) => setAmount(data.value)}
                    contentBefore={<span>NT$</span>}
                  />
                </Field>
                <Field label="說明" required>
                  <Textarea
                    value={description}
                    onChange={(_, data) => setDescription(data.value)}
                    placeholder="請詳述申請原因及相關資訊"
                    style={{ minHeight: 100 }}
                  />
                </Field>
              </div>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">取消</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleSubmit}
                disabled={!title || !description}
              >
                送出申請
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
