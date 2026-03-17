"use client";

import { useEffect, useState } from "react";
import {
  ElementsType,
  FormElementInstance,
} from "../builder/components/FormElements";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { formatDistance } from "date-fns";

type Row = {
  [key: string]: string;
} & { submittedAt: Date };

type Column = {
  id: string;
  label: string;
  required: boolean;
  type: ElementsType;
};

type FormWithSubmissions = {
  content: string;
  submissions: Array<{
    content: string;
    createdAt: Date;
  }>;
};

export function SubmissionsTable({ form }: { form: FormWithSubmissions }) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!form) return;

    // Parse form elements and create columns
    const formElements = JSON.parse(form.content) as FormElementInstance[];
    const newColumns: Column[] = [];

    formElements.forEach((element) => {
      switch (element.type) {
        case "TextField":
          newColumns.push({
            id: element.id,
            label: element.extraAttributes?.label || "Untitled Field",
            required: element.extraAttributes?.required || false,
            type: element.type,
          });
          break;
        // Add other form element types as needed
        default:
          break;
      }
    });

    setColumns(newColumns);

    // Parse submissions and create rows
    const newRows: Row[] = form.submissions.map((submission) => {
      const content = JSON.parse(submission.content);
      return {
        ...content,
        submittedAt: submission.createdAt,
      };
    });

    setRows(newRows);
  }, [form]);

  const renderCell = (row: Row, columnKey: string) => {
    if (columnKey === "submittedAt") {
      return formatDistance(row.submittedAt, new Date(), { addSuffix: true });
    }

    const column = columns.find((col) => col.id === columnKey);
    const value = row[columnKey];

    // Handle different field types if needed
    switch (column?.type) {
      case "TextField":
        return value || "";
      // Add other cases for different element types
      default:
        return value || "";
    }
  };

  // Combine columns with submittedAt column for header
  const allColumns = [
    ...columns,
    {
      id: "submittedAt",
      label: "Submitted at",
      required: false,
      type: "DateTime" as ElementsType,
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold my-4">Submissions</h1>
      <div className="rounded-md border">
        <Table aria-label="Form submissions table">
          <TableHeader columns={allColumns}>
            {(column) => (
              <TableColumn
                key={column.id}
                className={
                  column.id === "submittedAt"
                    ? "text-gray-600 text-right uppercase"
                    : "uppercase"
                }
              >
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody emptyContent="No submissions found" items={rows}>
            {(item) => (
              <TableRow key={rows.indexOf(item)}>
                {(columnKey) => (
                  <TableCell
                    className={
                      columnKey === "submittedAt"
                        ? "text-gray-600 text-right"
                        : ""
                    }
                  >
                    {renderCell(item, String(columnKey))}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
