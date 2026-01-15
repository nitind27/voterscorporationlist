"use client";

import React, { useState, useMemo } from 'react';
import { Column } from './tabletype';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface WithoutbtnProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  filterOptions?: Array<{ value: string; label: string }>;
  searchKeys?: (keyof T)[]; // Multiple search keys instead of single
  searchKey?: keyof T; // Keep for backward compatibility
  inputfiled?: React.ReactNode;
  pagination?: PaginationInfo;
  onPageChange?: (page: number) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
}

export function Withoutbtn<T>({
  data,
  columns,
  title,
  filterOptions = [],
  searchKeys,
  searchKey, // Keep for backward compatibility
  inputfiled,
  pagination,
  onPageChange,
  filterValue: externalFilterValue,
  onFilterChange,
}: WithoutbtnProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Use external filter value if provided, otherwise use internal state
  const currentFilterValue = externalFilterValue !== undefined ? externalFilterValue : filterValue;
  const handleFilterChange = onFilterChange || setFilterValue;

  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search filter - search across multiple fields
    if (searchTerm) {
      const keysToSearch = searchKeys || (searchKey ? [searchKey] : []);
      filtered = filtered.filter((item) =>
        keysToSearch.some((key) =>
          String(item[key] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply additional filter if provided (only if using internal filter)
    if (currentFilterValue && filterOptions.length > 0 && !onFilterChange) {
      // You can customize this based on your filter logic
      filtered = filtered.filter((item) =>
        String(item[currentFilterValue as keyof T] || '').toLowerCase().includes(currentFilterValue.toLowerCase())
      );
    }

    return filtered;
  }, [data, searchTerm, filterValue, searchKey, filterOptions]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">{title}</h2>
          {inputfiled && <div className="flex items-center gap-4">{inputfiled}</div>}
        </div>

        {/* Search and Filter */}
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search across all fields...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
          {filterOptions.length > 0 && (
            <select
              value={currentFilterValue}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-black"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-4 text-center text-sm text-black"
                >
                  No data found
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap">
                      {column.render(item, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-black">
            {pagination ? (
              <>
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.limit, pagination.totalRecords)} of{' '}
                {pagination.totalRecords} entries
              </>
            ) : (
              <>Showing {filteredData.length} of {data.length} entries</>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange?.(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-1">
                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, pagination.currentPage - Math.floor(maxPagesToShow / 2));
                  let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

                  // Adjust start page if we're near the end
                  if (endPage - startPage + 1 < maxPagesToShow) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  for (let page = startPage; page <= endPage; page++) {
                    pages.push(
                      <button
                        key={page}
                        onClick={() => onPageChange?.(page)}
                        className={`px-3 py-1 text-sm font-medium rounded-md ${
                          page === pagination.currentPage
                            ? 'text-white bg-blue-600 border border-blue-600'
                            : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  }

                  return pages;
                })()}
              </div>

              <button
                onClick={() => onPageChange?.(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
