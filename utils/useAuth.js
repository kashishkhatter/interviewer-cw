import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { verifyToken } from './jwt';

export function useAuth() {
  const { isLoaded: clerkLoaded, isSignedIn: clerkSignedIn, user: clerkUser } = useClerkAuth();
  const [jwtUser, setJwtUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkJwtAuth = async () => {
      try {
        console.log('Checking JWT authentication...');
        
        // First check URL for token
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get('token');
        
        // Then check cookies
        const cookies = document.cookie.split(';');
        const cookieToken = cookies.find(c => c.trim().startsWith('jwt_token='))?.split('=')[1];
        
        // Finally check sessionStorage
        const storedToken = sessionStorage.getItem('jwt_token');
        
        // Use the first valid token we find
        const token = urlToken || cookieToken || storedToken;
        
        if (token) {
          console.log('Found a token, verifying...');
          const { isValid, userData } = verifyToken(token);
          
          if (isValid) {
            console.log('Token is valid, setting user data:', userData);
            setJwtUser(userData);
            
            // Ensure token is stored in both places
            sessionStorage.setItem('jwt_token', token);
            if (!cookieToken) {
              document.cookie = `jwt_token=${token}; path=/; max-age=86400; samesite=lax`;
            }
            
            // If token was in URL, clean it up
            if (urlToken) {
              window.history.replaceState({}, '', '/');
            }
            
            return;
          } else {
            console.log('Token is invalid, clearing stored tokens');
            sessionStorage.removeItem('jwt_token');
            document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          }
        }
      } catch (error) {
        console.error('Error in JWT authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkJwtAuth();
  }, []); // Run immediately, don't wait for Clerk

  const isAuthenticated = Boolean(jwtUser) || clerkSignedIn;
  const user = jwtUser || clerkUser;

  const signOut = async () => {
    if (jwtUser) {
      console.log('Signing out JWT user');
      sessionStorage.removeItem('jwt_token');
      document.cookie = 'jwt_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      setJwtUser(null);
      router.push('/');
    } else if (clerkSignedIn) {
      console.log('Signing out Clerk user');
      await signOut();
    }
  };

  return {
    isLoading: isLoading || !clerkLoaded,
    isAuthenticated,
    user,
    signOut,
    isJwtUser: Boolean(jwtUser),
  };
} 