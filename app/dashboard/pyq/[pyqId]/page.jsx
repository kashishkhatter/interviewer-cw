"use client";
import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const page = ({ params }) => {
  const [questionData, setQuestionData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getQuestionDetails();
  }, []);

  const getQuestionDetails = async () => {
    try {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getInterviewDetails',
          data: { interviewId: params.pyqId }
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch question details');
      }

      if (data.data && data.data.length > 0) {
        const questionData = JSON.parse(data.data[0].jsonMockResp);
        setQuestionData(questionData);
      } else {
        setError("Questions not found");
      }
    } catch (error) {
      console.error('Error fetching question details:', error);
      setError(error.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    questionData && (
      <div className="p-10 my-5">
        <Accordion type="single" collapsible>
          {questionData &&
            questionData.map((item, index) => (
              <AccordionItem value={`item-${index + 1}`} key={index} className="mb-5">
                <AccordionTrigger>{item?.Question}</AccordionTrigger>
                <AccordionContent>{item?.Answer}</AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      </div>
    )
  );
};

export default page;
