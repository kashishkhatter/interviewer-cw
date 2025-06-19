"use client";
import { getInterviewDetails } from '@/utils/server-actions';
import React, { useState } from "react";
import { useEffect } from "react";
import QuestionSection from "./_components/QuestionSection";
import RecordAnswerSection from "./_components/RecordAnswerSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const StartInterview = ({ params }) => {
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    try {
      const result = await getInterviewDetails(params.interviewId);
      if (result && result.length > 0) {
        setInterviewData(result[0]);
        const jsonMockResp = JSON.parse(result[0].jsonMockResp);
        setMockInterviewQuestion(jsonMockResp);
      } else {
        setError("Interview not found");
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setError("Failed to load interview details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 my-10">
        {/* Question Section */}
        <QuestionSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
        />

        {/* Video/audio Recording */}
        <RecordAnswerSection
          mockInterviewQuestion={mockInterviewQuestion}
          activeQuestionIndex={activeQuestionIndex}
          interviewData={interviewData}
        />
      </div>

      <div className="flex gap-3 my-5 md:my-0 md:justify-end md:gap-6">
        {activeQuestionIndex > 0 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex - 1)}
          >
            Previous Question
          </Button>
        )}
        {activeQuestionIndex != mockInterviewQuestion?.length - 1 && (
          <Button
            onClick={() => setActiveQuestionIndex(activeQuestionIndex + 1)}
          >
            Next Question
          </Button>
        )}
        {activeQuestionIndex == mockInterviewQuestion?.length - 1 && (
          <Link
            href={"/dashboard/interview/" + interviewData?.mockId + "/feedback"}
          >
            <Button>End Interview</Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default StartInterview;
