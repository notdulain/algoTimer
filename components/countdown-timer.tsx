"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
const COUNTDOWN_MINUTES = 7 * 60; // 7 hours in minutes
const COUNTDOWN_SECONDS = 0;

interface CountdownTimerProps {
  className?: string;
}

export default function CountdownTimer({ className }: CountdownTimerProps) {
  const totalTime = COUNTDOWN_MINUTES * 60 + COUNTDOWN_SECONDS;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add this useEffect to load saved state on component mount
  useEffect(() => {
    const savedState = localStorage.getItem("timerState");
    if (savedState) {
      const { savedTimeLeft, savedIsActive, savedEndTime, savedTotalTime } =
        JSON.parse(savedState);

      // Use the saved total time if available, otherwise use the default
      const effectiveTotalTime = savedTotalTime || totalTime;

      // If timer was active, calculate remaining time based on end timestamp
      if (savedIsActive && savedEndTime) {
        const currentTime = Date.now();
        const remainingTime = Math.max(
          0,
          Math.floor((savedEndTime - currentTime) / 1000)
        );

        if (remainingTime > 0) {
          setTimeLeft(remainingTime);
          setIsActive(true);
        } else {
          // Timer completed while page was closed
          setTimeLeft(0);
          setIsActive(false);
          setIsFinished(true);
          localStorage.removeItem("timerState");
        }
      } else if (savedTimeLeft !== undefined) {
        // For paused timers, use the saved time left but ensure it doesn't exceed total time
        setTimeLeft(Math.min(savedTimeLeft, effectiveTotalTime));
        setIsActive(savedIsActive);
      }
    }
  }, [totalTime]);

  // Modify your existing useEffect to save state changes
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      // Calculate end timestamp for accurate time tracking across refreshes
      const endTime = Date.now() + timeLeft * 1000;

      // Save current state to localStorage
      localStorage.setItem(
        "timerState",
        JSON.stringify({
          savedTimeLeft: timeLeft,
          savedIsActive: isActive,
          savedEndTime: endTime,
          savedTotalTime: totalTime, // Save the total time for reference
        })
      );

      intervalRef.current = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            setIsFinished(true);
            localStorage.removeItem("timerState"); // Clear saved state when done
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Save state even when not active (paused state)
      if (timeLeft > 0) {
        localStorage.setItem(
          "timerState",
          JSON.stringify({
            savedTimeLeft: timeLeft,
            savedIsActive: isActive,
            savedEndTime: null, // No end time when paused
            savedTotalTime: totalTime,
          })
        );
      } else {
        localStorage.removeItem("timerState");
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timeLeft, totalTime]);

  // Modify startTimer to save initial state
  const startTimer = () => {
    setIsActive(true);

    // Immediately save state when starting
    const endTime = Date.now() + timeLeft * 1000;
    localStorage.setItem(
      "timerState",
      JSON.stringify({
        savedTimeLeft: timeLeft,
        savedIsActive: true,
        savedEndTime: endTime,
        savedTotalTime: totalTime,
      })
    );
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch(() => {
          console.log("Fullscreen not supported");
        });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    setTimeLeft(totalTime);
    localStorage.removeItem("timerState");
  };

  const progress = (timeLeft / totalTime) * 100;
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div
      className={`min-h-screen bg-background flex flex-col items-center justify-center p-8 relative ${className}`}
    >
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors z-10"
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      <div className="mb-4 flex items-center gap-8">
        <img
          src="/codefest-logo.png"
          alt="Hackathon Logo"
          className="h-24 w-auto"
        />
        <img src="/algothon-logo.png" alt="Sponsor 1" className="h-64 w-auto" />
        <img src="/gtn-logo.png" alt="GTN Logo" className="h-32 w-auto" />
      </div>

      <div className="relative mb-8">
        <svg className="w-96 h-96 transform -rotate-90" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r="110"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-secondary opacity-20"
          />
          <circle
            cx="120"
            cy="120"
            r="110"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-accent transition-all duration-1000 ease-linear"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {isFinished ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-accent mb-2">
                Time's up!
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-6xl font-bold text-foreground font-mono tracking-wider">
                {formatTime(timeLeft)}
              </div>
              <div className="text-lg text-muted-foreground mt-2">
                {isActive ? "Running..." : "Ready to start"}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isActive && !isFinished && (
        <Button
          onClick={startTimer}
          size="lg"
          className="bg-accent text-accent-foreground hover:bg-accent/90 text-xl px-12 py-6 rounded-full font-semibold transition-all duration-200 hover:scale-105"
        >
          Start Countdown
        </Button>
      )}

      {/* Show Stop button when timer is running */}
      {isActive && !isFinished && (
        <Button
          onClick={stopTimer}
          size="lg"
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xl px-12 py-6 rounded-full font-semibold transition-all duration-200 hover:scale-105 mt-4"
        >
          Stop
        </Button>
      )}

      <div className="mt-8">
        <img
          src="/cssc-logo.png"
          alt="Sponsor 2"
          className="h-16 w-auto opacity-80"
        />
      </div>

      <div className="absolute bottom-8 flex items-center gap-8">
        {/* <img src="/generic-sponsor-logo-1.png" alt="Sponsor 1" className="h-10 w-auto opacity-60" />
        <img src="/generic-sponsor-logo-2.png" alt="Sponsor 2" className="h-10 w-auto opacity-60" /> */}
      </div>
    </div>
  );
}
