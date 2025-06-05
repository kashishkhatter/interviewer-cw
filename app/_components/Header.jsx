"use client";
import React, { useEffect, useState } from 'react';
import { UserButton, useAuth as useClerkAuth } from "@clerk/nextjs";
import { FaGithub, FaUser } from "react-icons/fa";
import Link from 'next/link';

const Header = ({ showNavLinks = true }) => {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn } = useClerkAuth();
  const [jwtUser, setJwtUser] = useState(null);

  useEffect(() => {
    // Check for JWT token in session storage
    const verifyToken = async () => {
      const token = sessionStorage.getItem('jwt_token');
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
            setJwtUser(data.userData);
          }
        } catch (error) {
          console.error('Error verifying token:', error);
        }
      }
    };

    verifyToken();
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">AI Mock Interview</span>
          </Link>
          
          <nav className="flex items-center space-x-4">
            {showNavLinks && (
              <div className="hidden md:flex space-x-4">
                <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Testimonials</a>
                <a href="#contact" className="text-gray-600 hover:text-gray-900">Contact</a>
              </div>
            )}

            {/* GitHub Link */}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://github.com/kashishkhatter/AI-MockInterviewer"
              className="text-gray-600 hover:text-gray-900"
            >
              <FaGithub className="w-6 h-6" />
            </a>

            {/* User Authentication Display */}
            {clerkLoaded && clerkSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : jwtUser ? (
              <div className="flex items-center space-x-3 border-l pl-4 ml-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <FaUser className="text-white w-4 h-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{jwtUser.username}</p>
                  <p className="text-xs text-gray-500">{jwtUser.email}</p>
                </div>
              </div>
            ) : null}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 