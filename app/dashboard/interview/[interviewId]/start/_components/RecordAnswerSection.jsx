"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { WebCamContext } from "@/app/dashboard/layout";
import { GoogleGenerativeAI } from "@google/generative-ai";

const RecordAnswerSection = ({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) => {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { webCamEnabled, setWebCamEnabled } = useContext(WebCamContext);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      updateUserAnswer();
    }
  }, [userAnswer]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast(
        "Error starting recording. Please check your microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      setLoading(true);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(",")[1];

        let result;
        let attempts = 0;
        while (attempts < 3) {
          // Retry up to 3 times
          try {
            result = await model.generateContent([
              "Transcribe the following audio:",
              { inlineData: { data: base64Audio, mimeType: "audio/webm" } },
            ]);
            break; // Exit loop on success
          } catch (err) {
            attempts++;
            console.error(`Attempt ${attempts} failed:`, err);
            await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 sec delay before retry
          }
        }

        if (!result) throw new Error("Failed after retries");

        const transcription = result.response.text();
        setUserAnswer((prevAnswer) => prevAnswer + " " + transcription);
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast("Error transcribing audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateUserAnswer = async () => {
    try {
      setLoading(true);

      if (!mockInterviewQuestion[activeQuestionIndex]) {
        throw new Error("No question found for the current index.");
      }

      if (!userAnswer.trim()) {
        toast("Answer cannot be empty.");
        return;
      }

      const feedbackPrompt = `Question: ${mockInterviewQuestion[activeQuestionIndex]?.Question}, 
        User Answer: ${userAnswer}. 
        Please provide a rating and improvement feedback in JSON format like {"rating": X, "feedback": "text"}.`;

      const result = await chatSession.sendMessage(feedbackPrompt);
      let MockJsonResp = result.response.text();
      MockJsonResp = MockJsonResp.replace("```json", "").replace("```", "");

      let jsonFeedbackResp;
      try {
        jsonFeedbackResp = JSON.parse(MockJsonResp);
      } catch (e) {
        console.error("JSON Parsing Error:", MockJsonResp);
        throw new Error("Invalid AI response format.");
      }

      console.log("User Answer:", userAnswer);
      console.log("Feedback Response:", jsonFeedbackResp);

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId || "N/A",
        question:
          mockInterviewQuestion[activeQuestionIndex]?.Question || "Unknown",
        correctAns:
          mockInterviewQuestion[activeQuestionIndex]?.Answer || "Unknown",
        userAns: userAnswer,
        feedback: jsonFeedbackResp?.feedback || "No feedback",
        rating: jsonFeedbackResp?.rating || 0,
        userEmail: user?.primaryEmailAddress?.emailAddress || "No email",
        createdAt: moment().format("YYYY-MM-DD"),
      });

      if (resp) {
        toast("User Answer recorded successfully");
        setUserAnswer("");
      }
    } catch (error) {
      console.error("Error recording answer:", error);
      toast("An error occurred while recording the user answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center overflow-hidden">
      <div className="flex flex-col justify-center items-center rounded-lg p-5 bg-black mt-4 w-[30rem] ">
        {webCamEnabled ? (
          <Webcam
            mirrored={true}
            style={{ height: 250, width: "100%", zIndex: 10 }}
          />
        ) : (
          <Image
            src={"/camera.jpg"}
            width={200}
            height={200}
            alt="Camera placeholder"
          />
        )}
      </div>
      <div className="md:flex mt-4 md:mt-8 md:gap-5">
        <div className="my-4 md:my-0">
          <Button onClick={() => setWebCamEnabled((prev) => !prev)}>
            {webCamEnabled ? "Close WebCam" : "Enable WebCam"}
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          {isRecording ? (
            <h2 className="text-red-400 flex gap-2 ">
              <Mic /> Stop Recording...
            </h2>
          ) : (
            " Record Answer"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RecordAnswerSection;
