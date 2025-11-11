// src/data/availableTasks.js

const availableTasks = [
  {
    id: 'task1',
    title: 'Rate Text and Image Responses from AI Chatbots',
    category: 'AI Evaluation',
    paymentAmount: 20,
    duration: '45 mins',
    difficulty: 'Intermediate',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Which AI response sounds more natural?', options: ['Response A', 'Response B', 'Both Equal'], required: true },
      { id: 'q2', type: 'text', question: 'Describe one thing that makes an AI response feel human-like.', required: true },
      { id: 'q3', type: 'opinion', question: 'Which response better follows the user’s tone?', options: ['A', 'B', 'Neither'], required: true },
      { id: 'q4', type: 'text', question: 'Write a short improved version of a chatbot reply to “How’s your day?”', required: true },
      { id: 'q5', type: 'file', question: 'Upload your evaluation notes (PDF or DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task2',
    title: 'Annotate Emotions in Voice Recordings',
    category: 'Audio Labeling',
    paymentAmount: 25,
    duration: '1h',
    difficulty: 'Advanced',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Which emotion best fits this description: calm tone, steady pace?', options: ['Happy', 'Sad', 'Neutral', 'Angry'], required: true },
      { id: 'q2', type: 'text', question: 'Explain how emotion labeling improves AI assistants.', required: true },
      { id: 'q3', type: 'opinion', question: 'How confident are you in your labeling decisions?', options: ['Very confident', 'Somewhat confident', 'Unsure'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your annotation notes (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task3',
    title: 'Classify News Articles by Topic and Sentiment',
    category: 'Content Categorization',
    paymentAmount: 18,
    duration: '40 mins',
    difficulty: 'Beginner',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Classify this news headline: “Stocks soar after major AI breakthrough.”', options: ['Technology', 'Finance', 'Politics', 'Other'], required: true },
      { id: 'q2', type: 'opinion', question: 'What is the sentiment of the article?', options: ['Positive', 'Negative', 'Neutral'], required: true },
      { id: 'q3', type: 'text', question: 'In one sentence, explain how you identified the sentiment.', required: true },
      { id: 'q4', type: 'file', question: 'Upload your labeled summary (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task4',
    title: 'Tag Medical Equipment in Hospital Photos',
    category: 'Data Labeling',
    paymentAmount: 30,
    duration: '1h 15m',
    difficulty: 'Expert',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Which of the following is a medical device?', options: ['Stethoscope', 'Laptop', 'Desk Fan'], required: true },
      { id: 'q2', type: 'text', question: 'List 3 examples of common hospital equipment.', required: true },
      { id: 'q3', type: 'opinion', question: 'How important is accuracy in labeling for medical AI?', options: ['Extremely Important', 'Somewhat Important', 'Not Important'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your tagging notes (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task5',
    title: 'Evaluate AI-Generated Email Subject Lines',
    category: 'Marketing Evaluation',
    paymentAmount: 22,
    duration: '50 mins',
    difficulty: 'Intermediate',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Which subject line is more engaging?', options: ['Subject A', 'Subject B', 'Both'], required: true },
      { id: 'q2', type: 'text', question: 'Write a better version of: “Big Sale – Don’t Miss Out!”', required: true },
      { id: 'q3', type: 'opinion', question: 'What emotion does this subject line evoke: “Your AI partner is ready”?', options: ['Excitement', 'Curiosity', 'Confusion'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your evaluation summary (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task6',
    title: 'Transcribe Short Voice Clips Accurately',
    category: 'Transcription',
    paymentAmount: 15,
    duration: '30 mins',
    difficulty: 'Beginner',
    questions: [
      { id: 'q1', type: 'text', question: 'Describe the difference between verbatim and clean transcription.', required: true },
      { id: 'q2', type: 'opinion', question: 'Which tool is best for transcription speed?', options: ['Auto-generated', 'Manual typing', 'Mixed approach'], required: true },
      { id: 'q3', type: 'text', question: 'Transcribe this short line: “AI will change the world.”', required: true },
      { id: 'q4', type: 'file', question: 'Upload your transcription file (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task7',
    title: 'Translate Chat Messages from English to French',
    category: 'Translation',
    paymentAmount: 24,
    duration: '1h',
    difficulty: 'Intermediate',
    questions: [
      { id: 'q1', type: 'text', question: 'Translate: “Good morning! How can I assist you today?”', required: true },
      { id: 'q2', type: 'text', question: 'Translate: “Your payment has been processed successfully.”', required: true },
      { id: 'q3', type: 'opinion', question: 'Which translation sounds more natural?', options: ['Formal tone', 'Casual tone', 'Both'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your translated text (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task8',
    title: 'Write Prompts to Test Image Generation Models',
    category: 'Prompt Writing',
    paymentAmount: 35,
    duration: '1h 30m',
    difficulty: 'Advanced',
    questions: [
      { id: 'q1', type: 'text', question: 'Write a detailed prompt for generating a “sunset over futuristic Nairobi skyline.”', required: true },
      { id: 'q2', type: 'text', question: 'Write another prompt describing a “robot teacher in a classroom.”', required: true },
      { id: 'q3', type: 'opinion', question: 'Which prompt would create more realistic images?', options: ['Prompt 1', 'Prompt 2', 'Both'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your final prompt set (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task9',
    title: 'Label Unsafe Content in Social Media Screenshots',
    category: 'Content Moderation',
    paymentAmount: 26,
    duration: '1h',
    difficulty: 'Intermediate',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Which category best fits: “Offensive language in a post”?', options: ['Hate Speech', 'Spam', 'Harassment'], required: true },
      { id: 'q2', type: 'text', question: 'Define “harmful content” in your own words.', required: true },
      { id: 'q3', type: 'opinion', question: 'What’s the correct action for mild spam?', options: ['Delete', 'Ignore', 'Report'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your labeling summary (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task10',
    title: 'Rate AI Voice Clarity and Accent Naturalness',
    category: 'Audio Evaluation',
    paymentAmount: 20,
    duration: '40 mins',
    difficulty: 'Beginner',
    questions: [
      { id: 'q1', type: 'opinion', question: 'How natural does this AI voice sound?', options: ['Very Natural', 'Somewhat Natural', 'Robotic'], required: true },
      { id: 'q2', type: 'text', question: 'List two factors that affect voice clarity in AI systems.', required: true },
      { id: 'q3', type: 'opinion', question: 'Which accent sounds more neutral for global audiences?', options: ['US', 'British', 'African'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your evaluation notes (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },

  // ------------------- TASKS 11–30 -------------------
  {
    id: 'task11',
    title: 'Annotate Landmarks in Aerial Drone Images',
    category: 'Image Tagging',
    paymentAmount: 32,
    duration: '1h 20m',
    difficulty: 'Advanced',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Identify the main landmark in the drone image.', options: ['Building', 'River', 'Bridge', 'Park'], required: true },
      { id: 'q2', type: 'text', question: 'Describe how landmarks can help in AI navigation systems.', required: true },
      { id: 'q3', type: 'text', question: 'List 2 potential labeling challenges for aerial images.', required: true },
      { id: 'q4', type: 'file', question: 'Upload annotated image (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task12',
    title: 'Summarize Long-form Research Articles',
    category: 'Content Summarization',
    paymentAmount: 40,
    duration: '2h',
    difficulty: 'Expert',
    questions: [
      { id: 'q1', type: 'text', question: 'Write a 100-word summary of the article’s key points.', required: true },
      { id: 'q2', type: 'opinion', question: 'Does the article’s argument seem well-supported?', options: ['Yes', 'No', 'Partially'], required: true },
      { id: 'q3', type: 'text', question: 'List 2 takeaways that could improve AI content understanding.', required: true },
      { id: 'q4', type: 'file', question: 'Upload your summary document (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task13',
    title: 'Detect Spam Messages in Customer Chats',
    category: 'Data Cleaning',
    paymentAmount: 18,
    duration: '45 mins',
    difficulty: 'Beginner',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Classify this message as spam or not.', options: ['Spam', 'Not Spam'], required: true },
      { id: 'q2', type: 'text', question: 'Explain why a message might be flagged as spam.', required: true },
      { id: 'q3', type: 'opinion', question: 'How critical is manual review for spam detection?', options: ['Essential', 'Optional', 'Not Needed'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your classification notes (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },
  {
    id: 'task14',
    title: 'Rate Product Review Helpfulness',
    category: 'User Experience Evaluation',
    paymentAmount: 16,
    duration: '30 mins',
    difficulty: 'Beginner',
    questions: [
      { id: 'q1', type: 'opinion', question: 'Rate this review’s usefulness.', options: ['Very Useful', 'Somewhat Useful', 'Not Useful'], required: true },
      { id: 'q2', type: 'text', question: 'Explain why you rated it this way.', required: true },
      { id: 'q3', type: 'opinion', question: 'Which factors improve review usefulness?', options: ['Detail', 'Length', 'Tone'], required: true },
      { id: 'q4', type: 'file', question: 'Upload your evaluation notes (PDF/DOCX)', acceptedFormats: '.pdf,.docx', required: true },
    ]
  },

  // ... continue same structure for tasks 15–30 ...
];

export default availableTasks;
