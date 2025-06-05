"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { desc, eq, or } from "drizzle-orm";
import InterviewItemCard from "./InterviewItemCard";
import { Skeleton } from "@/components/ui/skeleton";

const InterviewList = () => {
  const { user } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GetInterviewList();
  }, [user]);

  const GetInterviewList = async () => {
    try {
      setLoading(true);
      // Get JWT user data if available
      const token = sessionStorage.getItem('jwt_token');
      let jwtUserEmail = null;
      
      if (token) {
        try {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          });

          const data = await response.json();
          if (data.isValid) {
            jwtUserEmail = data.userData.email;
          }
        } catch (error) {
          console.error('Error verifying JWT token:', error);
        }
      }

      // Get Clerk user email
      const clerkEmail = user?.primaryEmailAddress?.emailAddress;

      console.log('Fetching interviews for:', { clerkEmail, jwtUserEmail });

      // Fetch interviews for either authentication method
      let query = db
        .select()
        .from(MockInterview)
        .orderBy(desc(MockInterview.id));

      if (clerkEmail || jwtUserEmail) {
        query = query.where(
          or(
            eq(MockInterview.createdBy, clerkEmail),
            eq(MockInterview.createdBy, jwtUserEmail)
          )
        );
      }

      const result = await query;
      console.log('Fetched interviews:', result);
      setInterviewList(result || []);
    } catch (error) {
      console.error('Error fetching interview list:', error);
      setInterviewList([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="font-medium text-xl mb-4">Previous Mock Interview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-medium text-xl mb-4">Previous Mock Interview</h2>

      {interviewList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {interviewList.map((interview) => (
            <InterviewItemCard key={interview.id} interview={interview} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No previous interviews found.</p>
          <p className="text-sm text-gray-500 mt-2">Create a new interview to get started!</p>
        </div>
      )}
    </div>
  );
};

export default InterviewList;
