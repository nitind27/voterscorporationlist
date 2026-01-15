"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Column } from "../tables/tabletype";
import { Withoutbtn } from "../tables/Withoutbtn";
import { toast } from "react-toastify";
import Loader from "@/common/Loader";

// Animated Card Component
const AnimatedCard: React.FC<{
  children: React.ReactNode;
  value: number;
  className?: string;
}> = ({ children, value, className = "" }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setIsUpdating(true);
      prevValueRef.current = value;
      setTimeout(() => setIsUpdating(false), 600); // Match animation duration
    }
  }, [value]);

  return (
    <div className={`${className} transition-all duration-300 ${
      isUpdating ? 'ring-2 ring-green-400 ring-opacity-50 bg-green-50 shadow-lg' : ''
    }`}>
      {children}
    </div>
  );
};

// Animated Counter Component with Slide Effect
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 600 }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);

  useEffect(() => {
    // Always set initial value on mount
    setDisplayValue(value);
    prevValueRef.current = value;
  }, []);

  useEffect(() => {
    if (prevValueRef.current === value) return; // No change, skip animation

    setIsAnimating(true);

    setTimeout(() => {
      setDisplayValue(value);
      setIsAnimating(false);
      prevValueRef.current = value;
    }, duration);

  }, [value, duration]);

  return (
    <div className="relative inline-block overflow-hidden h-8 flex items-center justify-center">
      <span
        className={`inline-block transition-all duration-600 ease-in-out ${
          isAnimating ? 'text-green-600 font-bold scale-105' : 'text-current'
        }`}
        style={{ width: '100%', textAlign: 'center' }}
      >
        {displayValue.toLocaleString()}
      </span>
    </div>
  );
};

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
  const [celebrationPercentage, setCelebrationPercentage] = useState<number | null>(null);
  const [showCardCelebration, setShowCardCelebration] = useState(false);
  const [votingFilter, setVotingFilter] = useState('');
  const [surveyFilter, setSurveyFilter] = useState('');
  const [transferFilter, setTransferFilter] = useState('');
  const [votersNotYetFilter, setVotersNotYetFilter] = useState('');
  const prevPercentageRef = useRef(0);

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

  // Auto-refresh summary data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllCorporationData();
    }, 5000); // 5 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchAllCorporationData]);

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

  // Transfer filter options
  const transferFilterOptions = [
    { value: '', label: 'All Transfer Status' },
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  // Voters not yet filter options
  const votersNotYetFilterOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Voters not yet' },
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

    // Apply transfer filter
    if (transferFilter) {
      if (transferFilter === 'yes') {
        filtered = filtered.filter(item => String(item.inst_1_paid) === '1');
      } else if (transferFilter === 'no') {
        filtered = filtered.filter(item => String(item.inst_1_paid) !== '1');
      }
    }

    // Apply voters not yet filter
    // Shows records where inst_1_paid = 1 AND (voting_status = 'Pending' OR voting_status = 'In Transit')
    if (votersNotYetFilter === 'pending') {
      filtered = filtered.filter(item => 
        String(item.inst_1_paid) === '1' &&
        (item.voting_status === 'Pending' || item.voting_status === 'In Transit')
      );
    }

    return filtered;
  }, [allCorporationData, selectedBooth, votingFilter, surveyFilter, transferFilter, votersNotYetFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBooth, votingFilter, surveyFilter, transferFilter, votersNotYetFilter]);

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
    // Total records
    const totalRecords = dataToUse.length;
    // Total surveys are those with updated_at IS NOT NULL (completed surveys)
    const totalSurveyCount = dataToUse.filter(item => item.updated_at).length;
    // Voting done are those with voting_status = 'Completed' or 'Direct'
    const votingDoneCount = dataToUse.filter(item =>
      item.voting_status === 'Completed' || item.voting_status === 'Direct'
    ).length;
    const votingDonePercentage = totalRecords > 0
      ? Math.round((votingDoneCount / totalRecords) * 100)
      : 0;

    // Check for percentage milestones
    const prevPercentage = prevPercentageRef.current;
    if (votingDonePercentage > prevPercentage && votingDonePercentage > 0) {
      // Check if we've reached a milestone (10%, 20%, 30%, etc.)
      const milestones = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const reachedMilestone = milestones.find(milestone =>
        prevPercentage < milestone && votingDonePercentage >= milestone
      );

      if (reachedMilestone && !showCardCelebration) {
        setCelebrationPercentage(reachedMilestone);
        setShowCardCelebration(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShowCardCelebration(false);
          setCelebrationPercentage(null);
        }, 5000);
      }
    }
    prevPercentageRef.current = votingDonePercentage;

    return {
      totalRecords,
      totalSurveyCount,
      votingDoneCount,
      votingDonePercentage
    };
  }, [allCorporationData, allFilteredData, selectedBooth, showCardCelebration]);

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

      {/* Summary Card with Celebration */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 relative overflow-hidden transition-all duration-500">

        <div className="flex items-center justify-between mb-4 relative z-10">
          <h3 className="text-lg font-semibold text-gray-800">Survey & Voting Summary</h3>
          <div className="flex items-center text-xs text-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            Auto-refresh: 5s
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard value={summaryStats.totalRecords} className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl font-bold text-gray-600">
              <AnimatedCounter value={summaryStats.totalRecords} duration={600} />
            </div>
            <div className="text-sm text-gray-800">Total Records</div>
          </AnimatedCard>
          <AnimatedCard value={summaryStats.totalSurveyCount} className="bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl font-bold text-blue-600">
              <AnimatedCounter value={summaryStats.totalSurveyCount} duration={600} />
            </div>
            <div className="text-sm text-blue-800">Survey Completed</div>
          </AnimatedCard>
          <AnimatedCard value={summaryStats.votingDoneCount} className="bg-green-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl font-bold text-green-600">
              <AnimatedCounter value={summaryStats.votingDoneCount} duration={600} />
            </div>
            <div className="text-sm text-green-800">Voting Completed</div>
          </AnimatedCard>
          <AnimatedCard value={summaryStats.votingDonePercentage} className="bg-purple-50 rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
            <div className="text-2xl font-bold text-purple-600">
              <AnimatedCounter value={summaryStats.votingDonePercentage} duration={600} />%
            </div>
            <div className="text-sm text-purple-800">Voting Rate</div>
          </AnimatedCard>
        </div>
      </div>

      {/* Full Screen Celebration Overlay */}
      {showCardCelebration && celebrationPercentage && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center animate-celebration-fade-in">
          {/* Background Flowers */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={`bg-flower-${i}`}
                className="absolute animate-celebration-float text-4xl opacity-20"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${4 + Math.random() * 3}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              >
                {['🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '✨', '⭐'][i % 8]}
              </div>
            ))}
          </div>

          {/* Main Celebration Content */}
          <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
            {/* Large Celebration Emoji */}
            <div className="text-8xl mb-6 animate-celebration-bounce">🎉</div>

            {/* Congratulations Title */}
            <h1 className="text-5xl font-bold text-white mb-4 animate-celebration-slide-up drop-shadow-2xl">
              Congratulations!
            </h1>

            {/* Achievement Message */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 mb-6 animate-celebration-scale shadow-2xl">
              <p className="text-2xl text-gray-800 mb-2 font-semibold">
                Amazing Achievement!
              </p>
              <div className="text-6xl font-bold text-green-600 animate-celebration-bounce">
                {celebrationPercentage}%
              </div>
              <p className="text-lg text-gray-600 mt-2">
                Voting completion milestone achieved!
              </p>
            </div>

            {/* Trophy and Emojis */}
            <div className="flex justify-center items-center space-x-4 mb-8">
              <div className="text-6xl animate-celebration-scale">🏆</div>
              <div className="text-4xl animate-celebration-bounce" style={{ animationDelay: '0.2s' }}>🎊</div>
              <div className="text-4xl animate-celebration-bounce" style={{ animationDelay: '0.4s' }}>🎈</div>
              <div className="text-4xl animate-celebration-bounce" style={{ animationDelay: '0.6s' }}>🎂</div>
              <div className="text-4xl animate-celebration-bounce" style={{ animationDelay: '0.8s' }}>🎁</div>
            </div>

            {/* Encouragement Message */}
            <p className="text-xl text-white font-medium animate-celebration-slide-up-delayed drop-shadow-lg">
              Keep up the excellent work! 🚀
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setShowCardCelebration(false);
              setCelebrationPercentage(null);
            }}
            className="absolute top-6 right-6 text-white hover:text-yellow-300 transition-colors text-3xl bg-black/20 rounded-full w-12 h-12 flex items-center justify-center"
          >
            ×
          </button>
        </div>
      )}

      {/* CSS Animations for Celebration */}
      <style jsx>{`
        /* Celebration Card Animations */
        @keyframes celebration-float {
          0% {
            transform: translateY(0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          80% {
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(1.2) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes celebration-pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes celebration-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes celebration-bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
        @keyframes celebration-slide-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes celebration-slide-up-delayed {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes celebration-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-celebration-float { animation: celebration-float 3s ease-out forwards; }
        .animate-celebration-pulse { animation: celebration-pulse 2s ease-in-out infinite; }
        .animate-celebration-fade-in { animation: celebration-fade-in 0.5s ease-out; }
        .animate-celebration-bounce { animation: celebration-bounce 1s ease-in-out; }
        .animate-celebration-slide-up { animation: celebration-slide-up 0.6s ease-out 0.2s both; }
        .animate-celebration-slide-up-delayed { animation: celebration-slide-up-delayed 0.6s ease-out 0.4s both; }
        .animate-celebration-scale { animation: celebration-scale 0.5s ease-out 0.6s both; }
      `}</style>

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
        rowClassName={(item) => {
          const isTransferred = String(item.inst_1_paid) === '1';
          return isTransferred ? 'bg-green-100' : '';
        }}
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

            {/* Transfer Filter */}
            <select
              value={transferFilter}
              onChange={(e) => setTransferFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            >
              {transferFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Voters not yet Filter */}
            <select
              value={votersNotYetFilter}
              onChange={(e) => setVotersNotYetFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
            >
              {votersNotYetFilterOptions.map((option) => (
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
              {corporationListLoading ? 'Loading...' : 'Manual Refresh'}
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
