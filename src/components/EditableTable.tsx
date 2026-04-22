import { useState } from "react";
import {
  Button,
  Input,
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import {
  Add24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";

export interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  type?: "text" | "number";
}

export interface RowData {
  _id: string;
  [key: string]: string;
}

interface EditableTableProps {
  columns: ColumnDef[];
  initialRows?: RowData[];
  onChange?: (rows: RowData[]) => void;
}

let nextId = 1;
function genId() {
  return `row-${Date.now()}-${nextId++}`;
}

const useStyles = makeStyles({
  wrapper: {
    backgroundColor: "#fff",
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    overflow: "hidden",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    backgroundColor: tokens.colorNeutralBackground3,
    borderBottom: `2px solid ${tokens.colorNeutralStroke1}`,
    fontSize: "13px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground2,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "6px 8px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    verticalAlign: "middle",
  },
  deleteCol: {
    width: "44px",
    textAlign: "center",
    padding: "6px 4px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  emptyRow: {
    textAlign: "center" as const,
    padding: "32px 16px",
    color: tokens.colorNeutralForeground3,
  },
});

export default function EditableTable({
  columns,
  initialRows = [],
  onChange,
}: EditableTableProps) {
  const styles = useStyles();
  const [rows, setRows] = useState<RowData[]>(initialRows);

  const update = (newRows: RowData[]) => {
    setRows(newRows);
    onChange?.(newRows);
  };

  const addRow = () => {
    const emptyRow: RowData = { _id: genId() };
    columns.forEach((col) => {
      emptyRow[col.key] = "";
    });
    update([...rows, emptyRow]);
  };

  const deleteRow = (id: string) => {
    update(rows.filter((r) => r._id !== id));
  };

  const editCell = (id: string, key: string, value: string) => {
    update(
      rows.map((r) => (r._id === id ? { ...r, [key]: value } : r))
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        <Text weight="semibold" size={400}>
          資料表 ({rows.length} 筆)
        </Text>
        <Button
          appearance="primary"
          icon={<Add24Regular />}
          onClick={addRow}
          size="small"
        >
          新增一列
        </Button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={styles.th}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            <th className={styles.th} style={{ width: "44px" }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + 1}
                className={styles.emptyRow}
              >
                尚無資料，點擊「新增一列」開始輸入
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row._id}>
                {columns.map((col) => (
                  <td key={col.key} className={styles.td}>
                    <Input
                      size="small"
                      appearance="underline"
                      type={col.type === "number" ? "number" : "text"}
                      value={row[col.key] ?? ""}
                      onChange={(_, data) =>
                        editCell(row._id, col.key, data.value)
                      }
                      style={{ width: "100%" }}
                    />
                  </td>
                ))}
                <td className={styles.deleteCol}>
                  <Button
                    appearance="subtle"
                    icon={<Dismiss24Regular />}
                    size="small"
                    onClick={() => deleteRow(row._id)}
                    title="刪除此列"
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
