import React, { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableSectionProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  colSpan?: number;
  className?: string;
}

const Table: React.FC<TableProps> = ({ children, className = "" }) => (
  <table className={`min-w-full ${className}`}>{children}</table>
);

const TableHeader: React.FC<TableSectionProps> = ({
  children,
  className = "",
}) => <thead className={className}>{children}</thead>;

const TableBody: React.FC<TableSectionProps> = ({
  children,
  className = "",
}) => <tbody className={className}>{children}</tbody>;

const TableRow: React.FC<TableSectionProps> = ({ children, className = "" }) => (
  <tr className={className}>{children}</tr>
);

const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  colSpan,
  className = "",
}) => {
  const CellTag = isHeader ? "th" : "td";
  return (
    <CellTag colSpan={colSpan} className={className}>
      {children}
    </CellTag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };
