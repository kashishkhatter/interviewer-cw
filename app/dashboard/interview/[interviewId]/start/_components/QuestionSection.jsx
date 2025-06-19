import { Lightbulb, Volume2, VolumeX } from "lucide-react";
import React, { useState } from "react";

const QuestionSection = ({ mockInterviewQuestion, activeQuestionIndex }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisInstance = window.speechSynthesis;

  const textToSpeech = (text) => {
    if (!("speechSynthesis" in window)) {
      alert("Sorry, your browser does not support text-to-speech.");
      return;
    }

    // Stop if already speaking
    if (isSpeaking) {
      speechSynthesisInstance.cancel();
      setIsSpeaking(false);
      return;
    }

    // Create and start speech
    const speech = new SpeechSynthesisUtterance(text);
    speech.onend = () => setIsSpeaking(false); // Reset state when done
    speechSynthesisInstance.speak(speech);
    setIsSpeaking(true);
  };

  return (
    mockInterviewQuestion && (
      <div className="flex flex-col justify-between p-6 border rounded-lg my-3 bg-secondary shadow-md">
        {/* Question Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mockInterviewQuestion.map((question, index) => (
            <h2
              key={index}
              className={`p-2 rounded-full text-center text-xs md:text-sm cursor-pointer transition-all ${
                activeQuestionIndex === index
                  ? "bg-black text-white"
                  : "bg-gray-200 hover:bg-gray-800 hover:text-white"
              }`}
            >
              Question #{index + 1}
            </h2>
          ))}
        </div>

        {/* Active Question */}
        <div className="flex items-center justify-between mt-5">
          <h2 className="text-md md:text-lg font-semibold">
            {mockInterviewQuestion[activeQuestionIndex]?.Question}
          </h2>
          <button
            onClick={() =>
              textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.Question)
            }
          >
            {isSpeaking ? (
              <VolumeX className="cursor-pointer text-red-600 hover:text-red-800 transition w-8 h-8" />
            ) : (
              <Volume2 className="cursor-pointer text-gray-600 hover:text-gray-900 transition w-8 h-8" />
            )}
          </button>
        </div>

        {/* Note Section */}
        <div className="border rounded-lg p-5 bg-blue-100 shadow-sm mt-6 hidden md:block">
          <h2 className="flex gap-2 items-center text-blue-800 font-semibold">
            <Lightbulb />
            <strong>Note:</strong>
          </h2>
          <h2 className="text-sm text-blue-600 my-2">
            {process.env.NEXT_PUBLIC_QUESTION_NOTE}
          </h2>
        </div>
      </div>
    )
  );
};

export default QuestionSection;
