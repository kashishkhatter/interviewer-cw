"use client";
import React, { useState, useEffect } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { chatSession } from "@/utils/GeminiAIModal";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { Question } from "@/utils/schema";
import { useRouter } from "next/navigation";

const AddQuestions = () => {
  const [openDailog, setOpenDialog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setJobExperience] = useState("");
  const [typeQuestion, setTypeQuestion] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jwtUserEmail, setJwtUserEmail] = useState(null);

  const router = useRouter();
  const { user } = useUser();

  // Check for JWT token and get user email
  useEffect(() => {
    const verifyJwtToken = async () => {
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
            setJwtUserEmail(data.userData.email);
          }
        } catch (error) {
          console.error('Error verifying JWT token:', error);
        }
      }
    };

    verifyJwtToken();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const mockId = uuidv4();

    const InputPrompt = `
      Job Positions: ${jobPosition}, 
      Job Description: ${jobDesc}, 
      Years of Experience: ${jobExperience},
      Question Type: ${typeQuestion},
      Company: ${company}. 
      Based on this information, please provide 5 interview questions with answers in JSON format, ensuring "Question" and "Answer" are fields in the JSON.
    `;

    try {
      console.log('Generating questions...');
      const result = await chatSession.sendMessage(InputPrompt);

      const MockQuestionJsonResp = result.response
        .text()
        .replace("```json", "")
        .replace("```", "")
        .trim();

      console.log('Generated questions:', MockQuestionJsonResp);

      // Validate JSON response
      const parsedJson = JSON.parse(MockQuestionJsonResp);
      if (!Array.isArray(parsedJson) || !parsedJson.length) {
        throw new Error('Invalid response format from AI');
      }

      // Determine user email - prefer Clerk over JWT
      const userEmail = user?.primaryEmailAddress?.emailAddress || jwtUserEmail;
      if (!userEmail) {
        throw new Error('No authenticated user found');
      }

      console.log('Creating questions...');
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createQuestion',
          data: {
            mockId,
            MockQuestionJsonResp,
            jobPosition,
            jobDesc,
            jobExperience,
            typeQuestion,
            company,
            createdBy: userEmail,
            createdAt: moment().format("DD-MM-YYYY")
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log('Questions created successfully:', data);
        setOpenDialog(false);
        router.push(`/dashboard/pyq/${mockId}`);
      } else {
        throw new Error(data.error || 'Failed to create questions');
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      setError(error.message || "Failed to create questions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 rounded-lg border bg-secondary hover:scale-105 hover:shadow-sm transition-all cursor-pointer"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="text-lg text-center">+ Add Questions</h2>
      </div>

      <Dialog open={openDailog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Interview Questions</DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div className="my-3">
                  <h2>
                    Add Details about the job position, description, and
                    experience level
                  </h2>

                  <div className="mt-7 my-3">
                    <label className="text-black">Job Role/Position</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. Full Stack Developer"
                      required
                      value={jobPosition}
                      onChange={(e) => setJobPosition(e.target.value)}
                    />
                  </div>

                  <div className="my-5">
                    <label className="text-black">
                      Job Description/Tech Stack (In Short)
                    </label>
                    <Textarea
                      className="placeholder-opacity-50"
                      placeholder="Ex. React, Angular, Node.js, MySQL, NoSQL, Python"
                      required
                      value={jobDesc}
                      onChange={(e) => setJobDesc(e.target.value)}
                    />
                  </div>

                  <div className="my-5">
                    <label className="text-black">Years of Experience</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. 5"
                      max="50"
                      type="number"
                      required
                      value={jobExperience}
                      onChange={(e) => setJobExperience(e.target.value)}
                    />
                  </div>

                  <div className="my-5">
                    <label className="text-black">Question Type</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. Technical, Behavioral, System Design"
                      required
                      value={typeQuestion}
                      onChange={(e) => setTypeQuestion(e.target.value)}
                    />
                  </div>

                  <div className="my-5">
                    <label className="text-black">Company</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. Google, Amazon, Microsoft"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="my-3 p-3 text-sm text-red-600 bg-red-50 rounded">
                    {error}
                  </div>
                )}

                <div className="flex gap-5 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpenDialog(false);
                      setError("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin mr-2" />
                        Generating Questions
                      </>
                    ) : (
                      "Add Questions"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddQuestions;
