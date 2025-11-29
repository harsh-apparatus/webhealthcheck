"use client";

import { SignUp } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SignUpPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/signupSuccess");
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/"
        afterSignUpUrl="/signupSuccess"
      />
    </div>
  );
};

export default SignUpPage;

