"use client";
import React from "react";
import AddNewInterview from "./_components/AddNewInterview";
import InterviewList from "./_components/InterviewList";
import Header from "../_components/Header";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showNavLinks={false} />
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-500">Create and start your AI Mockup Interview</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <AddNewInterview />
          </div>

          <div className="mt-6">
            <InterviewList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
