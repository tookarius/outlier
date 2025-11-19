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
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

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

  const questions = task?.questions || [];

  useEffect(() => {
    if (!taskId || !task || !currentUser) {
      toast.error('Invalid task or not logged in');
      navigate('/dashboard');
      return;
    }

    const savedTasks = JSON.parse(localStorage.getItem(`myTasks_${currentUser.uid}`) || '[]');
    const taskInstance = savedTasks.find(t => t.id.startsWith(taskId) && t.status === 'in-progress');

    if (taskInstance) {
      setMyTaskInstance(taskInstance);
      const elapsed = Math.floor((new Date() - new Date(taskInstance.startedAt)) / 1000);
      setSeconds(elapsed);
    }
    setLoading(false);
  }, [taskId, task, currentUser, navigate]);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (s) => {
    const m = String(Math.floor(s / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${m}:${sec}`;
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
    toast.success('File uploaded');
  };

  const handleDragOver = e => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
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
      if (getProgress() === 100) confetti({ particleCount: 80, spread: 70, origin: { y: 0.8 } });
    } else {
      toast.error('Please complete this question');
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
      const savedTasks = JSON.parse(localStorage.getItem(`myTasks_${currentUser.uid}`) || '[]');
      const taskInstanceId = myTaskInstance?.id || `${taskId}_${Date.now()}`;

      const completedTask = {
        id: taskInstanceId,
        ...task,
        status: 'completed',
        startedAt: myTaskInstance?.startedAt || new Date(Date.now() - seconds * 1000),
        completedAt: new Date(),
        completedQuestions: questions.length,
        totalQuestions: questions.length,
        approvalScheduled: Date.now() + (Math.random() * 240000 + 60000),
        answers,
      };

      const index = savedTasks.findIndex(t => t.id === taskInstanceId);
      if (index >= 0) savedTasks[index] = completedTask;
      else savedTasks.push(completedTask);

      localStorage.setItem(`myTasks_${currentUser.uid}`, JSON.stringify(savedTasks));

      confetti({ particleCount: 200, spread: 80, origin: { y: 0.6 } });
      toast.success('Task submitted successfully!');
      toast.info('Payment will be processed in 1–5 minutes', { autoClose: 6000 });

      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (err) {
      toast.error('Submission failed');
    } finally {
      setUploading(false);
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    toast.info(isActive ? 'Timer paused' : 'Timer resumed', { autoClose: 1500 });
  };

  const handleLeaveTask = () => {
    if (window.confirm('Leave task? Your progress is saved automatically.')) {
      navigate('/dashboard');
    }
  };

  if (loading || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-3 border-t-amber-400 rounded-full mx-auto mb-4"></div>
          <p className="text-white/80">Loading task...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 py-4 flex justify-between items-center">
          <button onClick={handleLeaveTask} className="flex items-center gap-2 text-white/80 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-white">{formatTime(seconds)}</span>
            <button onClick={toggleTimer} className="text-amber-400 hover:text-amber-300">
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-5 py-8">
        {/* Task Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex gap-3 mb-3">
                <span className="px-3 py-1 bg-amber-400/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-400/30">
                  {task.category}
                </span>
                <span className="px-3 py-1 bg-emerald-400/20 text-emerald-300 text-xs font-semibold rounded-full">
                  {getProgress()}% Complete
                </span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{task.title}</h1>
              <p className="text-sm text-blue-300">Question {currentQuestion + 1} of {questions.length}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-amber-400">${task.paymentAmount}</div>
              <p className="text-xs text-amber-200">Paid after approval</p>
            </div>
          </div>
          <div className="mt-5 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Question Sidebar */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-amber-300 mb-3">Questions</h3>
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(i)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex justify-between items-center ${
                  i === currentQuestion
                    ? 'bg-amber-400 text-black'
                    : isQuestionAnswered(q)
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'text-blue-200 hover:bg-white/10'
                }`}
              >
                <span>Q{i + 1}</span>
                {isQuestionAnswered(q) && <CheckCircle className="w-4 h-4" />}
              </button>
            ))}
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                      currentQ.type === 'text' ? 'bg-purple-400/20 text-purple-300 border-purple-400/30' :
                      currentQ.type === 'opinion' ? 'bg-blue-400/20 text-blue-300 border-blue-400/30' :
                      'bg-orange-400/20 text-orange-300 border-orange-400/30'
                    }`}>
                      {currentQ.type === 'text' ? 'Text' : currentQ.type === 'opinion' ? 'Multiple Choice' : 'File Upload'}
                    </span>
                    {currentQ.required && (
                      <span className="px-3 py-1 text-xs font-semibold bg-red-400/20 text-red-300 rounded-full border border-red-400/30">
                        Required
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-white leading-relaxed">{currentQ.question}</h2>
                </div>
              </div>

              {/* Answer Input */}
              <div className="mt-6">
                {currentQ.type === 'text' && (
                  <textarea
                    value={answers[currentQ.id] || ''}
                    onChange={e => handleTextAnswer(currentQ.id, e.target.value)}
                    placeholder="Enter your response..."
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/20 text-white placeholder-blue-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition resize-none"
                    rows={6}
                  />
                )}

                {currentQ.type === 'opinion' && (
                  <div className="space-y-3">
                    {currentQ.options?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionSelect(currentQ.id, opt)}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm font-medium ${
                          answers[currentQ.id] === opt
                            ? 'border-amber-400 bg-amber-400/10 text-white shadow-lg'
                            : 'border-white/20 bg-white/5 hover:border-white/40 text-blue-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {currentQ.type === 'file' && (
                  <div>
                    {uploadedFiles[currentQ.id] ? (
                      <div className="bg-emerald-500/10 border border-emerald-400/30 rounded-xl p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                        <p className="font-medium text-white">{uploadedFiles[currentQ.id].name}</p>
                        <button
                          onClick={() => {
                            setUploadedFiles(p => { const x = { ...p }; delete x[currentQ.id]; return x; });
                            setAnswers(p => { const x = { ...p }; delete x[currentQ.id]; return x; });
                          }}
                          className="mt-3 text-sm text-red-400 hover:text-red-300"
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={e => handleDrop(e, currentQ.id)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                          isDragging ? 'border-amber-400 bg-amber-400/5' : 'border-white/30 hover:border-amber-400'
                        }`}
                      >
                        <Upload className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                        <p className="font-medium text-white">Drop file here or click to upload</p>
                        <p className="text-xs text-blue-300 mt-1">Max 10MB • {currentQ.acceptedFormats || 'Any format'}</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" onChange={e => handleFileUpload(e, currentQ.id)} className="hidden" />
                  </div>
                )}
              </div>

              {currentQ.required && !isQuestionAnswered(currentQ) && (
                <div className="mt-5 p-4 bg-amber-900/30 border border-amber-400/40 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <p className="text-sm text-amber-200">This question is required to proceed.</p>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium text-white disabled:opacity-50 transition"
              >
                Previous
              </button>

              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={uploading || getProgress() < 100}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:shadow-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? 'Submitting...' : <>Submit Task <Send className="w-5 h-5" /></>}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="px-8 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold rounded-xl hover:shadow-xl transition disabled:opacity-50 flex items-center gap-2"
                >
                  Next Question <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ToastContainer position="top-right" theme="dark" newestOnTop closeOnClick />
    </div>
  );
};

export default Working;