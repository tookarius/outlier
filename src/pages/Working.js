// src/pages/Working.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import confetti from 'canvas-confetti';
import { Clock, Upload, CheckCircle, ArrowLeft, Play, Pause, ChevronRight, AlertCircle, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import availableTasks from '../data/availableTasks';

const Working = () => {
  const { taskId } = useParams(); // Get base task ID from URL
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Find the task by ID
  const task = availableTasks.find(t => t.id === taskId);

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myTaskInstance, setMyTaskInstance] = useState(null);
  const fileInputRef = useRef(null);

  // Use task.questions directly
  const questions = task?.questions || [];

  useEffect(() => {
    if (!taskId) {
      toast.error('No task ID provided');
      navigate('/dashboard');
      return;
    }

    if (!task) {
      toast.error('Task not found');
      navigate('/dashboard');
      return;
    }

    if (!currentUser) {
      toast.error('Please log in to continue');
      navigate('/login');
      return;
    }

    // Load the user's specific instance of this task from localStorage
    const savedTasks = JSON.parse(localStorage.getItem(`myTasks_${currentUser.uid}`) || '[]');
    const taskInstance = savedTasks.find(t => t.id.startsWith(taskId) && t.status === 'in-progress');
    
    if (taskInstance) {
      setMyTaskInstance(taskInstance);
      // Calculate elapsed time if task was started before
      const elapsed = Math.floor((new Date() - new Date(taskInstance.startedAt)) / 1000);
      setSeconds(elapsed);
    }

    setLoading(false);
  }, [taskId, task, currentUser, navigate]);

  // Timer
  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const handleFileUpload = (e, questionId) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    setUploadedFiles(prev => ({ ...prev, [questionId]: file }));
    setAnswers(prev => ({ ...prev, [questionId]: file.name }));
    toast.success('File uploaded!');
  };

  const handleDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = e => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e, qid) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e, qid); };

  const handleTextAnswer = (id, val) => setAnswers(prev => ({ ...prev, [id]: val }));
  const handleOptionSelect = (id, opt) => setAnswers(prev => ({ ...prev, [id]: opt }));

  const isQuestionAnswered = (q) => {
    if (!q.required) return true;
    if (q.type === 'file') return !!uploadedFiles[q.id];
    return answers[q.id]?.toString().trim().length > 0;
  };

  const getProgress = () => {
    const answered = questions.filter(isQuestionAnswered).length;
    return Math.round((answered / questions.length) * 100);
  };

  const canProceedToNext = () => isQuestionAnswered(questions[currentQuestion]);

  const handleNext = () => {
    if (canProceedToNext()) {
      setCurrentQuestion(p => p + 1);
      if (getProgress() === 100) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
      }
    } else {
      toast.error('This question is required!');
    }
  };

  const handlePrevious = () => setCurrentQuestion(p => Math.max(0, p - 1));

  const handleSubmit = async () => {
    const missing = questions.filter(q => q.required && !isQuestionAnswered(q));
    if (missing.length > 0) {
      toast.error(`Please answer ${missing.length} required question(s)`);
      return;
    }

    setUploading(true);
    try {
      // Load existing tasks from localStorage
      const savedTasks = JSON.parse(localStorage.getItem(`myTasks_${currentUser.uid}`) || '[]');
      
      // Find the specific task instance (the one with full ID like "task1_timestamp")
      const taskInstanceId = myTaskInstance?.id || `${taskId}_${Date.now()}`;
      
      // Update or create the task
      const taskIndex = savedTasks.findIndex(t => t.id === taskInstanceId);
      
      const completedTask = {
        id: taskInstanceId,
        ...task,
        status: 'completed',
        startedAt: myTaskInstance?.startedAt || new Date(Date.now() - seconds * 1000),
        completedAt: new Date(),
        completedQuestions: questions.length,
        totalQuestions: questions.length,
        approvalScheduled: Date.now() + (Math.random() * 240000 + 60000), // 1-5 minutes
        answers: answers, // Save answers for reference
      };

      if (taskIndex >= 0) {
        // Update existing task
        savedTasks[taskIndex] = completedTask;
      } else {
        // Add new completed task
        savedTasks.push(completedTask);
      }

      // Save back to localStorage
      localStorage.setItem(`myTasks_${currentUser.uid}`, JSON.stringify(savedTasks));

      confetti({ particleCount: 500, spread: 100, origin: { y: 0.6 } });
      toast.success('Task submitted for review!', { icon: <Send className="w-6 h-6 text-blue-400" />, autoClose: 5000 });
      toast.info('You will be paid automatically in 1-5 minutes after approval', { autoClose: 7000 });

      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      console.error(err);
      toast.error('Submission failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    toast.info(isActive ? 'Timer paused' : 'Timer resumed');
  };

  const handleLeaveTask = () => {
    if (window.confirm('Leave task? Your progress has been saved and you can continue later.')) {
      // Save current progress to localStorage before leaving
      if (myTaskInstance && currentUser) {
        const savedTasks = JSON.parse(localStorage.getItem(`myTasks_${currentUser.uid}`) || '[]');
        const taskIndex = savedTasks.findIndex(t => t.id === myTaskInstance.id);
        
        if (taskIndex >= 0) {
          // Update the task with current progress
          savedTasks[taskIndex] = {
            ...savedTasks[taskIndex],
            completedQuestions: questions.filter(isQuestionAnswered).length,
            lastUpdated: new Date(),
          };
          localStorage.setItem(`myTasks_${currentUser.uid}`, JSON.stringify(savedTasks));
        }
      }
      navigate('/dashboard');
    }
  };

  if (loading || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-t-amber-400 rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-white">Loading task...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* === HEADER === */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <button
            onClick={handleLeaveTask}
            className="flex items-center gap-2 text-white hover:bg-white/10 px-4 py-2 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </button>
          <div className="flex items-center gap-3 bg-white/10 px-5 py-2 rounded-xl border border-white/20">
            <Clock className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-white">{formatTime(seconds)}</span>
            <button onClick={toggleTimer} className="text-amber-400">
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-amber-400/30 p-8 mb-8 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex gap-3 mb-4">
                <span className="px-4 py-1 bg-amber-400/20 text-amber-300 rounded-full text-sm font-bold border border-amber-400/40">
                  {task.category}
                </span>
                <span className="px-4 py-1 bg-green-400/20 text-green-300 rounded-full text-sm font-bold">
                  {getProgress()}% Complete
                </span>
              </div>
              <h1 className="text-3xl font-black text-white mb-2">{task.title}</h1>
              <p className="text-blue-200">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
            <div className="text-center bg-gradient-to-br from-amber-400/20 to-orange-600/20 px-8 py-6 rounded-3xl border-2 border-amber-400/50">
              <span className="text-4xl font-black text-amber-400">${task.paymentAmount}</span>
              <p className="text-sm text-amber-200 mt-1">After Approval</p>
            </div>
          </div>
          <div className="h-4 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* === QUESTION NAV === */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-amber-400/20 p-6 space-y-3">
            <h3 className="font-bold text-amber-300 mb-4">Questions</h3>
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                  i === currentQuestion
                    ? 'bg-amber-400 text-black shadow-xl'
                    : isQuestionAnswered(q)
                    ? 'bg-green-500/20 text-green-300 border border-green-400/40'
                    : 'bg-white/5 text-blue-200 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>Q{i + 1}</span>
                  {isQuestionAnswered(q) && <CheckCircle className="w-5 h-5" />}
                </div>
              </button>
            ))}
          </div>

          {/* === QUESTION CONTENT === */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-amber-400/20 p-10">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <div className="flex gap-3 mb-4">
                    <span className={`px-4 py-1 rounded-full text-sm font-bold border ${
                      currentQ.type === 'text' ? 'bg-purple-400/20 text-purple-300 border-purple-400/40' :
                      currentQ.type === 'opinion' ? 'bg-blue-400/20 text-blue-300 border-blue-400/40' :
                      'bg-orange-400/20 text-orange-300 border-orange-400/40'
                    }`}>
                      {currentQ.type === 'text' ? 'Write Answer' : currentQ.type === 'opinion' ? 'Choose One' : 'Upload File'}
                    </span>
                    {currentQ.required && (
                      <span className="px-4 py-1 bg-red-400/20 text-red-300 rounded-full text-sm font-bold border border-red-400/40">
                        Required
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-relaxed">{currentQ.question}</h2>
                </div>
              </div>

              <div className="mt-8">
                {currentQ.type === 'text' && (
                  <textarea
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-5 rounded-2xl bg-white/5 border-2 border-white/20 text-white placeholder-blue-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 transition-all resize-none"
                    rows={8}
                  />
                )}

                {currentQ.type === 'opinion' && (
                  <div className="space-y-4">
                    {currentQ.options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(currentQ.id, opt)}
                        className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                          answers[currentQ.id] === opt
                            ? 'border-amber-400 bg-amber-400/20 shadow-xl'
                            : 'border-white/20 bg-white/5 hover:border-amber-400/50'
                        }`}
                      >
                        <span className="font-semibold text-white">{opt}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'file' && (
                  <div>
                    {uploadedFiles[currentQ.id] ? (
                      <div className="bg-green-500/10 border-2 border-green-400/40 rounded-2xl p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                        <p className="text-xl font-bold text-white">{uploadedFiles[currentQ.id].name}</p>
                        <p className="text-sm text-green-300">Ready!</p>
                        <button onClick={() => {
                          setUploadedFiles(p => { const x = { ...p }; delete x[currentQ.id]; return x; });
                          setAnswers(p => { const x = { ...p }; delete x[currentQ.id]; return x; });
                        }} className="mt-4 text-red-400 hover:text-red-300">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, currentQ.id)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-4 border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all ${
                          isDragging ? 'border-amber-400 bg-amber-400/10' : 'border-white/30 hover:border-amber-400'
                        }`}
                      >
                        <Upload className="w-20 h-20 text-amber-400 mx-auto mb-6" />
                        <p className="text-2xl font-bold text-white mb-2">Drop file or click</p>
                        <p className="text-blue-300">Max 10MB • {currentQ.acceptedFormats || 'Any'}</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept={currentQ.acceptedFormats || '*'} onChange={e => handleFileUpload(e, currentQ.id)} className="hidden" />
                  </div>
                )}
              </div>

              {currentQ.required && !isQuestionAnswered(currentQ) && (
                <div className="mt-6 p-4 bg-amber-900/30 border border-amber-400/50 rounded-2xl flex gap-3">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                  <p className="text-amber-200">This question is required.</p>
                </div>
              )}
            </div>

            {/* === NAV BUTTONS === */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-white disabled:opacity-50 transition"
              >
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={uploading || getProgress() < 100}
                  className="px-10 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-black rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {uploading ? 'Submitting...' : <>Submit for Review <Send className="w-6 h-6" /></>}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="px-10 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  Next <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" theme="dark" />
    </div>
  );
};

export default Working;