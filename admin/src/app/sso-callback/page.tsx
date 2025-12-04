"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const SSOCallbackPage = () => {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect_url");

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="card-highlight max-w-md w-full mx-4 p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-error"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="h2 mb-4">Account Not Registered</h1>
        <p className="mb-6">
          You have not registered this account yet. First do the signup then try to login.
        </p>
        <div className="flex flex-col gap-4">
          <Link href="/sign-up" className="btn-primary text-center">
            Go to Sign Up
          </Link>
          <Link
            href="/"
            className="hover:text-white transition-colors underline"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SSOCallbackPage;

