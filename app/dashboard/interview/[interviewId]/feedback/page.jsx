"use client";
import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Feedback = ({ params }) => {
  const [interviewData, setInterviewData] = useState();
  const [userAnswers, setUserAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();

  const calculateOverallRating = (answers) => {
    const answeredQuestions = answers.filter(qa => qa.rating);
    if (answeredQuestions.length === 0) return null;
    
    const sum = answeredQuestions.reduce((acc, qa) => acc + parseInt(qa.rating), 0);
    return (sum / answeredQuestions.length).toFixed(1);
  };

  const getPerformanceLevel = (rating) => {
    if (!rating) return null;
    const numRating = parseFloat(rating);
    if (numRating >= 9) return { level: "Excellent", color: "text-green-600" };
    if (numRating >= 7) return { level: "Good", color: "text-blue-600" };
    if (numRating >= 5) return { level: "Average", color: "text-yellow-600" };
    return { level: "Needs Improvement", color: "text-red-600" };
  };

  useEffect(() => {
    getInterviewDetails();
  }, []);

  const getInterviewDetails = async () => {
    try {
      // Get interview details
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getInterviewDetails',
          data: { interviewId: params.interviewId }
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch interview details');
      }

      if (data.data && data.data.length > 0) {
        setInterviewData(data.data[0]);
        const jsonMockResp = JSON.parse(data.data[0].jsonMockResp);
        setUserAnswers(jsonMockResp);

        // Fetch user's answers
        const answersResponse = await fetch('/api/db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getUserAnswers',
            data: { 
              mockId: params.interviewId,
              userEmail: user?.primaryEmailAddress?.emailAddress
            }
          }),
        });

        const answersData = await answersResponse.json();
        if (answersData.success && answersData.data) {
          // Update userAnswers with the actual user responses
          const answersMap = new Map(answersData.data.map(answer => [answer.question, answer]));
          const updatedAnswers = jsonMockResp.map(qa => ({
            ...qa,
            userAnswer: answersMap.get(qa.Question)?.userAns || null,
            feedback: answersMap.get(qa.Question)?.feedback || null,
            rating: answersMap.get(qa.Question)?.rating || null
          }));
          setUserAnswers(updatedAnswers);
        }
      } else {
        setError("Interview not found");
      }
    } catch (error) {
      console.error('Error fetching interview details:', error);
      setError(error.message || "Failed to load interview details");
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

  const overallRating = calculateOverallRating(userAnswers);
  const performance = getPerformanceLevel(overallRating);
  const answeredCount = userAnswers.filter(qa => qa.userAnswer).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Interview Feedback</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your interview performance and feedback
          </p>
        </div>

        {/* Overall Performance Section */}
        {overallRating && (
          <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">Overall Rating</h3>
                <p className="text-3xl font-bold mt-2 text-blue-600">{overallRating}/10</p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">Performance Level</h3>
                <p className={`text-xl font-semibold mt-2 ${performance.color}`}>
                  {performance.level}
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700">Questions Answered</h3>
                <p className="text-3xl font-bold mt-2 text-gray-600">
                  {answeredCount}/{userAnswers.length}
                </p>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800">Performance Summary</h3>
              <p className="mt-2 text-gray-700">
                {overallRating >= 9 ? 
                  "Outstanding performance! You demonstrated excellent knowledge and communication skills." :
                  overallRating >= 7 ?
                  "Good job! You showed solid understanding of the concepts with some room for improvement." :
                  overallRating >= 5 ?
                  "Fair performance. Focus on strengthening your knowledge and improving your answers." :
                  "Keep practicing! Focus on understanding core concepts and structuring your answers better."}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Interview Details</h3>
            <p><strong>Position:</strong> {interviewData?.jobPosition}</p>
            <p><strong>Experience Level:</strong> {interviewData?.jobExperience} years</p>
            <p><strong>Tech Stack:</strong> {interviewData?.jobDesc}</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Questions and Answers</h3>
            {userAnswers.map((qa, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-4">
                  <p className="font-medium text-gray-900">Q{index + 1}: {qa.Question}</p>
                </div>

                {qa.userAnswer ? (
                  <>
                    <div className="mt-4 pl-4 border-l-4 border-blue-500">
                      <p className="text-gray-700">
                        <strong>Your Answer:</strong>
                      </p>
                      <p className="mt-1 text-gray-600">{qa.userAnswer}</p>
                    </div>

                    <div className="mt-4 pl-4 border-l-4 border-green-500">
                      <p className="text-gray-700">
                        <strong>Model Answer:</strong>
                      </p>
                      <p className="mt-1 text-gray-600">{qa.Answer}</p>
                    </div>

                    {qa.rating && (
                      <div className="mt-4 bg-blue-50 p-3 rounded">
                        <p className="text-blue-800">
                          <strong>Rating:</strong> {qa.rating}/10
                        </p>
                      </div>
                    )}

                    {qa.feedback && (
                      <div className="mt-4 bg-yellow-50 p-3 rounded">
                        <p className="text-gray-800">
                          <strong>Feedback:</strong>
                        </p>
                        <p className="mt-1 text-gray-700">{qa.feedback}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4 text-gray-500 italic">
                    No answer provided for this question
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
