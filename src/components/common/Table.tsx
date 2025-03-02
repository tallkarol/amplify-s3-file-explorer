// src/components/common/Table.tsx
import React from 'react';

interface TableColumn<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string | number;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyState?: React.ReactNode;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyState,
  rowClassName,
  onRowClick,
  className = ''
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="text-center p-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading data...</p>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="table-responsive">
      <table className={`table table-hover ${className}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                style={column.width ? { width: column.width } : undefined}
                className={column.sortable ? 'cursor-pointer' : ''}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr 
              key={keyExtractor(item, index)}
              className={rowClassName ? rowClassName(item, index) : ''}
              onClick={() => onRowClick && onRowClick(item)}
              style={onRowClick ? { cursor: 'pointer' } : undefined}
            >
              {columns.map((column) => (
                <td key={`${keyExtractor(item, index)}-${column.key}`}>
                  {column.render 
                    ? column.render(item, index)
                    // @ts-ignore - Safely access dynamic property
                    : item[column.key]
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;