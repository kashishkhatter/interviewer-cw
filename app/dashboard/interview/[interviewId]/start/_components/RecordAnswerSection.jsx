"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Webcam from "react-webcam";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAIModal";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { WebCamContext } from "@/app/dashboard/layout";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { saveUserAnswer } from "@/utils/server-actions";

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
      toast.error(
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
          try {
            result = await model.generateContent([
              "Transcribe the following audio:",
              { inlineData: { data: base64Audio, mimeType: "audio/webm" } },
            ]);
            break;
          } catch (err) {
            attempts++;
            console.error(`Transcription attempt ${attempts} failed:`, err);
            if (attempts < 3) {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }

        if (!result) {
          toast.error("Failed to transcribe audio after multiple attempts");
          return;
        }

        const transcription = result.response.text();
        setUserAnswer((prevAnswer) => prevAnswer + " " + transcription);
      };
    } catch (error) {
      console.error("Error transcribing audio:", error);
      toast.error("Error transcribing audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateUserAnswer = async () => {
    try {
      setLoading(true);

      if (!mockInterviewQuestion || !mockInterviewQuestion[activeQuestionIndex]) {
        console.error("Missing question data:", { mockInterviewQuestion, activeQuestionIndex });
        throw new Error("No question found for the current index.");
      }

      if (!userAnswer.trim()) {
        toast.error("Answer cannot be empty.");
        return;
      }

      const currentQuestion = mockInterviewQuestion[activeQuestionIndex].Question;
      console.log("Processing answer for question:", currentQuestion);

      const feedbackPrompt = `
        Question: ${currentQuestion}
        User Answer: ${userAnswer}
        Please analyze the answer and provide feedback in the following JSON format:
        {
          "rating": (number between 1-10),
          "feedback": "detailed feedback explaining the rating and suggestions for improvement"
        }
        Ensure the response is valid JSON.
      `;

      console.log("Requesting AI feedback...");
      const result = await chatSession.sendMessage(feedbackPrompt);
      let feedbackText = result.response.text();
      console.log("Raw AI feedback:", feedbackText);

      // Clean and parse the JSON response
      let jsonFeedbackResp;
      try {
        // Remove any markdown formatting or extra text
        const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("No valid JSON found in AI response");
        }
        jsonFeedbackResp = JSON.parse(jsonMatch[0]);
        
        if (!jsonFeedbackResp.rating || !jsonFeedbackResp.feedback) {
          throw new Error("Missing required fields in AI response");
        }
      } catch (e) {
        console.error("JSON Parsing Error:", e);
        console.log("Attempted to parse:", feedbackText);
        throw new Error("Failed to process AI feedback. Please try again.");
      }

      console.log("Processed feedback:", jsonFeedbackResp);

      const answerData = {
        mockId: interviewData?.mockId,
        question: currentQuestion,
        correctAns: mockInterviewQuestion[activeQuestionIndex].Answer,
        userAns: userAnswer.trim(),
        feedback: jsonFeedbackResp.feedback,
        rating: String(jsonFeedbackResp.rating),
        userEmail: user?.primaryEmailAddress?.emailAddress || "anonymous",
        createdAt: moment().format("YYYY-MM-DD")
      };

      // Validate required fields
      const requiredFields = ['mockId', 'question', 'correctAns', 'userAns', 'feedback', 'rating'];
      const missingFields = requiredFields.filter(field => !answerData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      console.log("Saving answer data:", answerData);
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveUserAnswer',
          data: answerData
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Save response error:", data);
        throw new Error(data.error || data.details || "Failed to save answer");
      }

      toast.success("Answer recorded successfully!");
      setUserAnswer("");
    } catch (error) {
      console.error("Error in updateUserAnswer:", error);
      toast.error(error.message || "An error occurred while recording your answer. Please try again.");
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
      {loading && (
        <div className="mt-4 text-sm text-gray-500">
          {isRecording ? "Processing recording..." : "Saving your answer..."}
        </div>
      )}
    </div>
  );
};

export default RecordAnswerSection;
