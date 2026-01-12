"use client";

import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-lg font-medium text-gray-700">Loading...</div>
      </div>
    </div>
  );
};

export default Loader;
