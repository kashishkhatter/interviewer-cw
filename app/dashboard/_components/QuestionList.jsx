"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import QuestionItemCard from "./QuestionItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterviewList } from "@/utils/actions";

const QuestionList = () => {
  const { user } = useUser();
  const [questionList, setQuestionList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    user && GetQuestionList();
  }, [user]);

  const GetQuestionList = async () => {
    try {
      const result = await getInterviewList(user?.primaryEmailAddress?.emailAddress);
      setQuestionList(result);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-10 flex flex-col gap-5">
        <Skeleton className="w-full sm:w-[20rem] h-10 rounded-full animate-pulse bg-gray-300" />
        <Skeleton className="w-full sm:w-[20rem] h-10 rounded-full animate-pulse bg-gray-300" />
      </div>
    );
  }

  return (
    <div>
      {questionList.length > 0 ? (
        <>
          <h2 className="font-medium text-xl">Previous Mock Interview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-3">
            {questionList.map((question, index) => (
              <QuestionItemCard key={index} question={question} />
            ))}
          </div>
        </>
      ) : (
        <div className="my-10 flex flex-col gap-5">
          <p>No questions found.</p>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
