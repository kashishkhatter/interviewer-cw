"use client";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Contect from "./_components/Contect";
import { useRouter } from "next/navigation";
import Header from "./_components/Header";
import { useAuth as useClerkAuth } from "@clerk/nextjs";

const HomePage = () => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  // Check for JWT token when component mounts
  useEffect(() => {
    const verifyTokenAndStore = async () => {
      // First check sessionStorage
      const storedToken = sessionStorage.getItem('jwt_token');
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const token = storedToken || urlToken;
      
      if (token) {
        setIsVerifying(true);
        console.log('Found token, verifying...');
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
            console.log('Token is valid, storing...');
            sessionStorage.setItem('jwt_token', token);
            // Clean URL if token was in URL
            if (urlToken) {
              window.history.replaceState({}, '', '/');
              // Redirect to dashboard since we have a valid token from URL
              router.push('/dashboard');
            }
          }
        } catch (error) {
          console.error('Error verifying token:', error);
        } finally {
          setIsVerifying(false);
        }
      }
    };

    verifyTokenAndStore();
  }, [router]);

  const handleGetStarted = async (e) => {
    e.preventDefault();
    console.log('Get Started clicked');

    // Don't proceed if we're still verifying a token
    if (isVerifying) {
      console.log('Still verifying token, please wait...');
      return;
    }

    // First check if user is signed in with Clerk
    if (clerkSignedIn) {
      console.log('User is signed in with Clerk, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }

    // Then check for JWT token in session storage
    const token = sessionStorage.getItem('jwt_token');
    if (token) {
      console.log('Found JWT token in session, verifying...');
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
          console.log('JWT token is valid, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error verifying token:', error);
      }
    }

    // If no valid authentication, redirect to sign-in
    console.log('No valid authentication found, redirecting to sign-in');
    router.push('/sign-in');
  };

  return (
    <div>
      <Head>
        <title>AI Mock Interview</title>
        <meta name="description" content="Ace your next interview with AI-powered mock interviews" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header showNavLinks={true} />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 bg-gradient-to-r from-gray-900 to-gray-400 px-6 md:px-0">
        <h2 className="text-4xl md:text-5xl font-bold text-white">Ace Your Next Interview</h2>
        <p className="mt-4 text-lg md:text-xl text-white">Practice with AI-powered mock interviews and get personalized feedback</p>
        <div className="mt-6 flex flex-col md:flex-row">
          <button
            onClick={handleGetStarted}
            className="px-6 py-3 mb-4 md:mb-0 md:mr-4 text-lg font-semibold bg-white text-primary-600 rounded-lg shadow-lg hover:bg-gray-100"
          >
            Get Started
          </button>
          <a href="#features" className="px-6 py-3 text-lg font-semibold border border-white rounded-lg hover:bg-white hover:text-black-600">
            Learn More
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white px-6 md:px-0">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800">Features</h2>
          <p className="mt-4 text-lg text-gray-800">
            Our AI Mock Interview platform offers a range of powerful features:
          </p>
          <div className="flex flex-wrap justify-center mt-8">
            <div className="w-full md:w-1/3 px-4 py-8">
              <div className="bg-blue-100 rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-semibold text-black-600">AI Mock Interviews</h3>
                <p className="mt-2 text-gray-600">Experience realistic interview scenarios with our advanced AI.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 px-4 py-8">
              <div className="bg-blue-100 rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-semibold text-black-600">Instant Feedback</h3>
                <p className="mt-2 text-gray-600">Get instant, personalized feedback to improve your performance.</p>
              </div>
            </div>
            <div className="w-full md:w-1/3 px-4 py-8">
              <div className="bg-blue-100 rounded-lg p-6 shadow-md">
                <h3 className="text-2xl font-semibold text-black-600">Comprehensive Reports</h3>
                <p className="mt-2 text-gray-600">Receive detailed reports highlighting your strengths and weaknesses.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-gray-50 px-6 md:px-0">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-800">What Our Users Say</h2>
          <div className="flex flex-wrap justify-center mt-8">
            <div className="w-full md:w-1/2 px-4 py-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <p className="text-gray-600">
                  "The AI mock interviews were incredibly helpful. I felt much more confident going into my real interview."
                </p>
                <h4 className="mt-4 text-lg font-semibold text-blue-600">John Doe</h4>
              </div>
            </div>
            <div className="w-full md:w-1/2 px-4 py-8">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <p className="text-gray-600">
                  "This platform helped me practice and improve my interview skills. Highly recommended!"
                </p>
                <h4 className="mt-4 text-lg font-semibold text-blue-600">Jane Smith</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white px-6 md:px-0">
        <Contect />
      </section>
    </div>
  );
};

export default HomePage;
