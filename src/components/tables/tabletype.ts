export interface Column<T> {
  key: keyof T | string;
  label: string;
  accessor: keyof T;
  render: (data: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
}
