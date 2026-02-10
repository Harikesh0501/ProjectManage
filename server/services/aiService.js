const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getChatResponse = async (history, message) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const chat = model.startChat({
      history: history.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Chat Error:", error);
    throw new Error(`AI Error: ${error.message}`);
  }
};



const analyzeLogs = async (logs) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      You are an expert System Administrator and DevOps Engineer.
      Analyze the following server logs and system metrics.
      Identify potential issues, performance bottlenecks, or security risks.
      
      Logs:
      ${logs}

      Return a JSON object ONLY:
      {
        "status": "Healthy" | "Degraded" | "Critical",
        "issues": ["List of identified issues"],
        "recommendations": ["Actionable steps to fix"]
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Log Analysis Error:", error);
    return { status: "Unknown", issues: ["AI Analysis Failed"], recommendations: [] };
  }
};

const generateProjectPlan = async (title, description) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Project Manager and Tech Lead.
      I need a detailed project plan for a student hackathon project.
      
      Project Title: "${title}"
      Basic Description: "${description || title}"

      Please generate a response in valid JSON format ONLY, without any markdown formatting. The JSON should have this structure:
      {
        "detailedDescription": "A professional, technical description of the project, expanding on the basic one (about 2-3 sentences)",
        "techStack": ["Technology 1", "Technology 2", "Technology 3"],
        "sprints": [
          {
            "name": "Sprint Name (e.g., Sprint 1: Foundation)",
            "goal": "Brief goal for this sprint",
            "durationDays": 7 (number of days for this sprint)
          }
        ],
        "tasks": [
          { 
            "title": "Task Title", 
            "description": "Brief task description", 
            "priority": "High" | "Medium" | "Low",
            "estimatedHours": number,
            "sprintIndex": 0 (index of the sprint this task belongs to, 0-based)
          }
        ],
        "milestones": [
          {
            "title": "Milestone Title",
            "description": "Milestone goal",
            "deadlineOffsetDays": number (e.g. 2 for 2 days after start)
          }
        ],
        "rubric": {
          "name": "Performance Rubric for ${title}",
          "criteria": [
            {
              "name": "Criterion Name (e.g., Code Quality)",
              "description": "What this criterion measures",
              "weight": 1 (multiplier, 1-3),
              "maxScore": 10
            }
          ]
        }
      }

      IMPORTANT: 
      - Create 2-3 sprints (each 7-14 days).
      - Create 5-8 core tasks and assign each task to a sprint using sprintIndex (0 for first sprint, 1 for second, etc.).
      - Distribute tasks logically: Setup tasks in Sprint 0, Core features in Sprint 1, Polish/Testing in Sprint 2.
      - Create 3-4 key milestones.
      - Create 4-6 evaluation criteria in the rubric covering: Code Quality, Functionality, Documentation, Teamwork, Innovation.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if present (Gemini sometimes adds ```json ... ```)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate project plan");
  }
};

/**
 * AI Milestone Code Reviewer
 * Analyzes code against milestone requirements
 */
const reviewMilestoneCode = async (milestoneTitle, milestoneDescription, codeContent, filesAnalyzed) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Code Reviewer and Technical Evaluator for student hackathon projects.
      
      A student has submitted their work for a milestone. Analyze their code and determine if
      it meets the milestone requirements.

      === MILESTONE REQUIREMENTS ===
      Title: "${milestoneTitle}"
      Description/Goal: "${milestoneDescription}"

      === SUBMITTED CODE (from GitHub) ===
      Files Analyzed: ${filesAnalyzed.join(', ')}
      
      ${codeContent}

      === YOUR TASK ===
      Evaluate the submitted code against the milestone requirements.
      
      Return ONLY a valid JSON object with this exact structure:
      {
        "overallScore": number (0-100),
        "verdict": "Pass" | "Needs Work" | "Fail",
        "completed": [
          "List of requirements that ARE properly implemented"
        ],
        "missing": [
          "List of requirements that are NOT implemented or incomplete"
        ],
        "suggestions": [
          "Specific actionable improvements the student should make"
        ],
        "codeQuality": {
          "score": number (0-10),
          "notes": "Brief assessment of code quality, structure, and best practices"
        },
        "summary": "2-3 sentence overall summary of the submission"
      }

      Be constructive but honest. Focus on whether the code actually implements what the milestone asks for.
      If files are truncated, evaluate based on what you can see.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown if present
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Review Error:", error);
    return {
      overallScore: 0,
      verdict: "Error",
      completed: [],
      missing: ["AI analysis failed"],
      suggestions: ["Please try again or review manually"],
      codeQuality: { score: 0, notes: "Analysis failed" },
      summary: `AI review failed: ${error.message}`
    };
  }
};

/**
 * AI Project Report Generator
 * Generates comprehensive project report for PDF export
 */
const generateProjectReport = async (projectData) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an expert Technical Documentation Writer.
      Generate a comprehensive project completion report based on the following data.

      === PROJECT DATA ===
      Title: "${projectData.title}"
      Description: "${projectData.description}"
      Status: "${projectData.status}"
      Start Date: "${projectData.startDate || 'N/A'}"
      End Date: "${projectData.endDate || 'N/A'}"
      
      Team Members: ${projectData.teamMembers?.map(m => m.name).join(', ') || 'N/A'}
      Mentor: ${projectData.mentor?.name || 'N/A'}
      
      Milestones Completed: ${projectData.milestones?.filter(m => m.status === 'Approved').length || 0} / ${projectData.milestones?.length || 0}
      Milestone Details: ${JSON.stringify(projectData.milestones?.map(m => ({ title: m.title, status: m.status })) || [])}
      
      Tasks Summary: ${projectData.tasks?.length || 0} total tasks
      
      GitHub Repository: ${projectData.githubRepo || 'N/A'}

      === GENERATE REPORT ===
      Return ONLY a valid JSON object with this exact structure:
      {
        "executiveSummary": "3-4 sentence professional summary of what was built and achieved",
        "projectOverview": "Detailed paragraph about the project goals and outcomes",
        "technologiesUsed": {
          "frontend": ["List frontend technologies likely used"],
          "backend": ["List backend technologies likely used"],
          "database": ["Database technologies"],
          "other": ["Other tools, APIs, services"]
        },
        "featuresImplemented": [
          {
            "name": "Feature name",
            "description": "Brief description of the feature"
          }
        ],
        "challengesAndSolutions": [
          {
            "challenge": "Challenge faced",
            "solution": "How it was solved"
          }
        ],
        "futureScope": [
          "Future enhancement 1",
          "Future enhancement 2",
          "Future enhancement 3"
        ],
        "lessonsLearned": [
          "Key learning 1",
          "Key learning 2"
        ],
        "conclusion": "2-3 sentence concluding remarks about the project success"
      }

      Be professional and insightful. Infer technologies and features based on the project description and milestone data.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Report Generation Error:", error);
    return {
      executiveSummary: "Project report generation failed. Please try again.",
      projectOverview: projectData.description || "N/A",
      technologiesUsed: { frontend: [], backend: [], database: [], other: [] },
      featuresImplemented: [],
      challengesAndSolutions: [],
      futureScope: ["Expand functionality", "Improve UI/UX", "Add more features"],
      lessonsLearned: ["Team collaboration", "Technical skills"],
      conclusion: "Project completed successfully."
    };
  }
};

module.exports = {
  generateProjectPlan,
  getChatResponse,
  analyzeLogs,
  reviewMilestoneCode,
  generateProjectReport
};
