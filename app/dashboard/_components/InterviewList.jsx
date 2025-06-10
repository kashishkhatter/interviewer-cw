"use client";
import { useUser } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import InterviewItemCard from "./InterviewItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { getInterviewList } from "@/utils/server-actions";
import { toast } from "sonner";

const InterviewList = () => {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [interviewList, setInterviewList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authInfo, setAuthInfo] = useState({ 
    clerk: null, 
    jwt: null,
    isAuthenticated: false 
  });

  useEffect(() => {
    GetInterviewList();
  }, [user, isClerkLoaded]);

  const GetInterviewList = async () => {
    try {
      // Get JWT user data if available
      const token = sessionStorage.getItem('jwt_token');
      let jwtUserEmail = null;
      let isAuthenticated = false;
      
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
            isAuthenticated = true;
          }
        } catch (error) {
          console.error('Error verifying JWT token:', error);
        }
      }

      const clerkEmail = user?.primaryEmailAddress?.emailAddress;
      if (clerkEmail) {
        isAuthenticated = true;
      }

      setAuthInfo({
        clerk: clerkEmail,
        jwt: jwtUserEmail,
        isAuthenticated
      });

      const result = await getInterviewList(clerkEmail, jwtUserEmail);
      setInterviewList(result);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      toast.error('Failed to load interviews. Please try refreshing the page.');
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

  if (!authInfo.isAuthenticated) {
    return (
      <div className="my-10 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please log in to view your interviews.</p>
      </div>
    );
  }

  return (
    <div>
      {interviewList.length > 0 ? (
        <>
          <h2 className="font-medium text-xl">Previous Mock Interviews</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 my-3">
            {interviewList.map((interview, index) => (
              <InterviewItemCard key={index} interview={interview} />
            ))}
          </div>
        </>
      ) : (
        <div className="my-10 flex flex-col gap-5">
          <p>No interviews found. Create your first interview using the button above!</p>
        </div>
      )}
    </div>
  );
};

export default InterviewList;
