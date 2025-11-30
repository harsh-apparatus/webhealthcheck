"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ButtonPrimary from "@/components/button/ButtonPrimary";
import JSConfetti from "js-confetti";

const SignupSuccessPage = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const jsConfetti = new JSConfetti();

  jsConfetti.addConfetti({
    confettiRadius: 6,
    confettiNumber: 100,
  })

  useEffect(() => {
    // If not signed in, redirect to sign-in
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    // If user is signed in, check if this is a new signup or existing account
    if (isLoaded && isSignedIn && user?.createdAt) {
      const accountCreatedAt = user.createdAt.getTime();
      const now = Date.now();
      const accountAge = now - accountCreatedAt;

      // If account was created more than 2 minutes ago, it's an existing account
      // Redirect directly to dashboard (they tried to sign up with existing credentials)
      if (accountAge > 120000) {
        router.push("/dashboard");
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // If not signed in, don't render (will redirect)
  if (!isSignedIn) {
    return null;
  }

  const userName =
    user?.username ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress ||
    "there";

  return (
    <div className="flex items-center justify-center min-h-screen w-full p-4">
      <div className="flex flex-col items-center justify-center text-center max-w-md">
        <h1 className="text-4xl font-bold mb-4">Welcome, {userName}!</h1>

        <p className="text-xl mb-2 opacity-90">
          Your account has been successfully created.
        </p>

        <p className="text-base mb-8 opacity-75">
          You're all set! Start monitoring your websites and get real-time
          uptime insights.
        </p>

        <ButtonPrimary
          name="Continue to Dashboard"
          onclick={handleContinue}
          className="px-8 py-3 text-lg"
        />
      </div>
    </div>
  );
};

export default SignupSuccessPage;
