"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Column } from "../tables/tabletype";
import { Withoutbtn } from "../tables/Withoutbtn";
import { toast } from "react-toastify";
import Loader from "@/common/Loader";

// Base interface with all fields from tbl_voters_search
interface BaseVoterData {
  id: number;
  Voter_Id: string;
  full_name: string;
  ENG_Full_name: string;
  Age: string;
  Gender: string;
  House_Number: string;
  Updated_colony: string;
  updated_mobile_no: string;
  Updated_photo: string;
  user_id: number;
  updated_house_number: string;
  family_member: string;
  status: string;
  created_at: string;
  updated_at: string;
  volunteer_name: string;
  volunteer_mobile: string;
  volunteer_status: string;
  assigned_colony_name: string;
  assigned_colony_id: string;
  assigned_volunteer_id: number;
  inst_1_paid: string;
  inst_2_paid: string;
  inst_3_paid: string;
  voting_paid: string;
  Booth_Number: string;
  Booth_Name: string;
  Booth_Address: string;
  voting_in_transit: string;
  voting_status: string;
  colony_name: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiResponse {
  data: BaseVoterData[];
  pagination: PaginationInfo;
}

type CorporationListData = BaseVoterData;

const CorporationList: React.FC = () => {
  const [corporationListData, setCorporationListData] = useState<CorporationListData[]>([]);
  const [corporationListLoading, setCorporationListLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooth, setSelectedBooth] = useState('');

  // Fetch Corporation List data with pagination
  const fetchCorporationList = useCallback(async (page: number = 1, limit: number = 50) => {
    setCorporationListLoading(true);
    try {
      const response = await fetch(`/api/voterstatus/corporation?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch corporation list');
      const result: ApiResponse = await response.json();
      setCorporationListData(result.data || []);
      setPagination(result.pagination);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching corporation list:', error);
      toast.error('Failed to load corporation list');
      setCorporationListData([]);
      setPagination(null);
    } finally {
      setCorporationListLoading(false);
    }
  }, []);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchCorporationList(page);
  }, [fetchCorporationList]);

  // Load data on component mount
  useEffect(() => {
    fetchCorporationList();
  }, []);

  // Get unique booth numbers for filter options
  const boothFilterOptions = useMemo(() => {
    const uniqueBooths = Array.from(new Set(
      corporationListData
        .map(item => item.Booth_Number)
        .filter(booth => booth && booth.trim() !== '')
    ));

    return [
      { value: '', label: 'All Booths' },
      ...uniqueBooths.map(booth => ({
        value: booth,
        label: `Booth ${booth}`
      })).sort((a, b) => parseInt(a.value) - parseInt(b.value))
    ];
  }, [corporationListData]);

  // Apply booth filter to data
  const filteredData = useMemo(() => {
    if (!selectedBooth) return corporationListData;
    return corporationListData.filter(item =>
      item.Booth_Number === selectedBooth
    );
  }, [corporationListData, selectedBooth]);

  // Columns for Corporation List
  const corporationListColumns: Column<CorporationListData>[] = useMemo(() => [
    {
      key: 'serial_number',
      label: 'Sr. No.',
      accessor: 'Voter_Id',
      render: (data, index = 0) => (
        <span className="font-mono text-sm font-medium text-blue-600">
          {(currentPage - 1) * 50 + index + 1}
        </span>
      ),
    },
    {
      key: 'Voter_Id',
      label: 'Voter ID',
      accessor: 'Voter_Id',
      render: (data) => (
        <span className="font-mono text-sm font-medium text-blue-600">{data.Voter_Id || 'N/A'}</span>
      ),
    },
    {
      key: 'full_name',
      label: 'Full Name',
      accessor: 'full_name',
      render: (data) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black">{data.full_name || 'N/A'}</span>
          {data.ENG_Full_name && <span className="text-xs text-black">({data.ENG_Full_name})</span>}
        </div>
      ),
    },
    {
      key: 'Booth_Number',
      label: 'Booth Number',
      accessor: 'full_name',
      render: (data) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black text-bold">{data.Booth_Number || 'N/A'}</span>
        
        </div>
      ),
    },
    {
      key: 'Booth_Name',
      label: 'Booth Name',
      accessor: 'full_name',
      render: (data) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-black">{data.Booth_Name || 'N/A'}</span>

        </div>
      ),
    },
    {
      key: 'Booth_Address',
      label: 'Booth Address',
      accessor: 'full_name',
      render: (data) => (
        <div className="flex flex-col">
          <span className="text-black">{data.Booth_Address || 'N/A'}</span>

        </div>
      ),
    },
  
   
  ], []);

  return (
    <div className="space-y-4">
      {corporationListLoading && <Loader />}
      <Withoutbtn
        data={filteredData}
        columns={corporationListColumns}
        title="Corporation List - All Voters"
        filterOptions={boothFilterOptions}
        searchKeys={['Voter_Id', 'full_name', 'ENG_Full_name', 'Booth_Number', 'Booth_Name', 'Booth_Address', 'House_Number', 'updated_mobile_no', 'colony_name', 'assigned_colony_name']}
        pagination={pagination || undefined}
        onPageChange={handlePageChange}
        filterValue={selectedBooth}
        onFilterChange={setSelectedBooth}
        inputfiled={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchCorporationList(currentPage)}
              disabled={corporationListLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {corporationListLoading ? 'Loading...' : 'Refresh'}
            </button>
            <span className="text-sm text-gray-600">
              Total Records: <span className="font-semibold text-cyan-600">{selectedBooth ? filteredData.length : (pagination?.totalRecords || 0)}</span>
            </span>
          </div>
        }
      />
    </div>
  );
};

export default CorporationList;
