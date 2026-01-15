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
  const [allCorporationData, setAllCorporationData] = useState<CorporationListData[]>([]);
  const [corporationListLoading, setCorporationListLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBooth, setSelectedBooth] = useState('');
  const [votingFilter, setVotingFilter] = useState('');
  const [surveyFilter, setSurveyFilter] = useState('');

  // Fetch all Corporation data for summary calculations
  const fetchAllCorporationData = useCallback(async () => {
    try {
      const response = await fetch('/api/voterstatus/corporation?page=1&limit=100000'); // Large limit to get all data
      if (!response.ok) throw new Error('Failed to fetch all corporation data');
      const result: ApiResponse = await response.json();
      setAllCorporationData(result.data || []);
    } catch (error) {
      console.error('Error fetching all corporation data:', error);
      setAllCorporationData([]);
    }
  }, []);

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

  // Handle page change (frontend pagination)
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchCorporationList();
    fetchAllCorporationData();
  }, []);

  // Get unique booth numbers for filter options
  const boothFilterOptions = useMemo(() => {
    const uniqueBooths = Array.from(new Set(
      allCorporationData
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
  }, [allCorporationData]);

  // Voting filter options
  const votingFilterOptions = [
    { value: '', label: 'All Voting Status' },
    { value: 'done', label: 'Voting Done' },
    { value: 'not_done', label: 'Not Done' },
  ];

  // Survey filter options
  const surveyFilterOptions = [
    { value: '', label: 'All Survey Status' },
    { value: 'done', label: 'Survey Done' },
    { value: 'not_done', label: 'Not Done' },
  ];

  // Apply all filters to all data (not paginated)
  const allFilteredData = useMemo(() => {
    let filtered = allCorporationData;

    // Apply booth filter
    if (selectedBooth) {
      filtered = filtered.filter(item => item.Booth_Number === selectedBooth);
    }

    // Apply voting filter
    if (votingFilter) {
      if (votingFilter === 'done') {
        filtered = filtered.filter(item =>
          item.voting_status === 'Completed' || item.voting_status === 'Direct'
        );
      } else if (votingFilter === 'not_done') {
        filtered = filtered.filter(item =>
          item.voting_status !== 'Completed' && item.voting_status !== 'Direct'
        );
      }
    }

    // Apply survey filter
    if (surveyFilter) {
      if (surveyFilter === 'done') {
        filtered = filtered.filter(item => item.updated_at);
      } else if (surveyFilter === 'not_done') {
        filtered = filtered.filter(item => !item.updated_at);
      }
    }

    return filtered;
  }, [allCorporationData, selectedBooth, votingFilter, surveyFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBooth, votingFilter, surveyFilter]);

  // Apply pagination to filtered data for display
  const filteredData = useMemo(() => {
    const startIndex = (currentPage - 1) * 50;
    const endIndex = startIndex + 50;
    return allFilteredData.slice(startIndex, endIndex);
  }, [allFilteredData, currentPage]);

  // Calculate pagination info for filtered data
  const filteredPagination = useMemo(() => {
    const totalFilteredRecords = allFilteredData.length;
    const totalPages = Math.ceil(totalFilteredRecords / 50);

    return {
      currentPage,
      totalPages,
      totalRecords: totalFilteredRecords,
      limit: 50,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [allFilteredData.length, currentPage]);

  // Calculate summary statistics (using all data, not paginated)
  const summaryStats = useMemo(() => {
    const dataToUse = selectedBooth ? allFilteredData : allCorporationData;
    // Total surveys are those with updated_at IS NOT NULL (completed surveys)
    const totalSurveyCount = dataToUse.filter(item => item.updated_at).length;
    // Voting done are those with voting_status = 'Completed' or 'Direct'
    const votingDoneCount = dataToUse.filter(item =>
      item.voting_status === 'Completed' || item.voting_status === 'Direct'
    ).length;
    const votingDonePercentage = totalSurveyCount > 0
      ? Math.round((votingDoneCount / totalSurveyCount) * 100)
      : 0;

    return {
      totalSurveyCount,
      votingDoneCount,
      votingDonePercentage
    };
  }, [allCorporationData, allFilteredData, selectedBooth]);

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
      key: 'survey_status',
      label: 'Survey Status',
      accessor: 'updated_at',
      render: (data) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          data.updated_at ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {data.updated_at ? 'YES' : 'NO'}
        </span>
      ),
    },
    {
      key: 'colony_name',
      label: 'Colony Name',
      accessor: 'colony_name',
      render: (data) => (
        <span className="text-sm font-medium text-black">{data.colony_name || 'N/A'}</span>
      ),
    },
    {
      key: 'voting_status',
      label: 'Voting Status',
      accessor: 'voting_status',
      render: (data) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          (data.voting_status === 'Completed' || data.voting_status === 'Direct')
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {(data.voting_status === 'Completed' || data.voting_status === 'Direct')
            ? 'Voting Done'
            : (data.voting_status || 'Pending')}
        </span>
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

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Survey & Voting Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{summaryStats.totalSurveyCount}</div>
            <div className="text-sm text-blue-800">Survey Completed</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summaryStats.votingDoneCount}</div>
            <div className="text-sm text-green-800">Voting Completed</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{summaryStats.votingDonePercentage}%</div>
            <div className="text-sm text-purple-800">Voting Rate</div>
          </div>
        </div>
      </div>

      <Withoutbtn
        data={filteredData}
        columns={corporationListColumns}
        title="Corporation List - All Voters"
        filterOptions={boothFilterOptions}
        searchKeys={['Voter_Id', 'full_name', 'ENG_Full_name', 'Booth_Number', 'Booth_Name', 'Booth_Address', 'House_Number', 'updated_mobile_no', 'colony_name', 'assigned_colony_name', 'voting_status']}
        pagination={filteredPagination}
        onPageChange={handlePageChange}
        filterValue={selectedBooth}
        onFilterChange={setSelectedBooth}
        inputfiled={
          <div className="flex items-center gap-4">
            {/* Voting Status Filter */}
            <select
              value={votingFilter}
              onChange={(e) => setVotingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            >
              {votingFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Survey Status Filter */}
            <select
              value={surveyFilter}
              onChange={(e) => setSurveyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            >
              {surveyFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                fetchCorporationList(currentPage);
                fetchAllCorporationData();
              }}
              disabled={corporationListLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 border border-cyan-600 rounded-lg hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {corporationListLoading ? 'Loading...' : 'Refresh'}
            </button>
            <span className="text-sm text-gray-600">
              Total Records: <span className="font-semibold text-cyan-600">{allFilteredData.length}</span>
            </span>
          </div>
        }
      />
    </div>
  );
};

export default CorporationList;
