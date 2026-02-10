import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, ExternalLink, AlertCircle, Send, Sparkles, Zap, Target, Lightbulb, Code } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import API_URL from '../config';

const MilestoneReview = ({ projectId }) => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionType, setActionType] = useState(null);

  // AI Review State
  const [aiReviewLoading, setAiReviewLoading] = useState(null); // milestoneId being reviewed
  const [aiReviews, setAiReviews] = useState({}); // { milestoneId: reviewData }

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/milestones/submissions/${projectId}`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );
      setSubmissions(response.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleApprove = async (milestoneId) => {
    try {
      setReviewingId(milestoneId);
      setActionType('approve');

      const response = await axios.put(
        `${API_URL}/api/milestones/${milestoneId}`,
        {
          action: 'approve',
          approvalNotes: approvalNotes
        },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      // Remove from pending submissions
      setSubmissions(submissions.filter(s => s._id !== milestoneId));
      setApprovalNotes('');
      alert('Milestone approved successfully! ✓');
    } catch (err) {
      console.error('Error approving milestone:', err);
      alert(err.response?.data?.msg || 'Error approving milestone');
    } finally {
      setReviewingId(null);
      setActionType(null);
    }
  };

  const handleReject = async (milestoneId) => {
    try {
      setReviewingId(milestoneId);
      setActionType('reject');

      if (!approvalNotes) {
        alert('Please provide feedback for rejection');
        setReviewingId(null);
        setActionType(null);
        return;
      }

      await axios.put(
        `${API_URL}/api/milestones/${milestoneId}`,
        {
          action: 'reject',
          approvalNotes: approvalNotes
        },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      setSubmissions(submissions.filter(s => s._id !== milestoneId));
      setApprovalNotes('');
      alert('Milestone returned for revision');
    } catch (err) {
      console.error('Error rejecting milestone:', err);
      alert(err.response?.data?.msg || 'Error processing request');
    } finally {
      setReviewingId(null);
      setActionType(null);
    }
  };

  // AI Review Handler
  const handleAIReview = async (submission) => {
    try {
      setAiReviewLoading(submission._id);

      const response = await axios.post(
        `${API_URL}/api/ai/review-milestone`,
        {
          milestoneId: submission._id,
          githubLink: submission.submissionGithubLink
        },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );

      setAiReviews(prev => ({
        ...prev,
        [submission._id]: response.data
      }));

    } catch (err) {
      console.error('AI Review Error:', err);
      alert(err.response?.data?.msg || 'AI Review failed. Please try again.');
    } finally {
      setAiReviewLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-slate-300">Loading submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Milestone Reviews
        </h2>
        <p className="text-slate-300 mt-2">
          {submissions.length === 0
            ? 'No pending submissions'
            : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''} awaiting review`}
        </p>
      </div>

      {/* Empty State */}
      {submissions.length === 0 ? (
        <Card className="p-12 text-center dark:bg-gradient-to-br dark:from-slate-800/50 dark:to-slate-700/30 bg-white border dark:border-slate-700 border-slate-200 shadow-sm">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <p className="dark:text-white text-slate-900 text-lg font-semibold">All caught up!</p>
          <p className="dark:text-slate-300 text-slate-500 mt-2">No pending submissions to review</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission._id} className="border-2 border-yellow-600/50 dark:bg-slate-800/40 bg-white hover:border-yellow-500 transition-all shadow-sm">
              <div className="p-6">
                {/* Submission Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle size={24} className="text-yellow-400" />
                      <h3 className="text-xl font-bold dark:text-white text-slate-900">{submission.title}</h3>
                    </div>
                    <p className="dark:text-slate-300 text-slate-600 ml-9">{submission.description}</p>
                  </div>
                  <span className="px-4 py-2 rounded-full bg-yellow-200 text-yellow-800 text-sm font-semibold">
                    Pending Review
                  </span>
                </div>

                {/* Student Info */}
                <div className="dark:bg-slate-700/50 bg-slate-50 rounded-lg p-4 mb-4 border dark:border-slate-600 border-slate-200">
                  <p className="text-sm dark:text-slate-300 text-slate-600">
                    <strong>Submitted by:</strong> {submission.submittedBy?.name}
                  </p>
                  <p className="text-sm dark:text-slate-300 text-slate-600 mt-1">
                    <strong>Email:</strong> <a href={`mailto:${submission.submittedBy?.email}`} className="text-blue-400 hover:text-blue-300 underline">{submission.submittedBy?.email}</a>
                  </p>
                  <p className="text-sm dark:text-slate-300 text-slate-600 mt-1">
                    <strong>Submitted on:</strong> {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                </div>

                {/* Submission Details */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">Student's Description</label>
                    <div className="dark:bg-slate-700/50 bg-slate-50 rounded-lg p-4 border dark:border-slate-600 border-slate-200">
                      <p className="dark:text-slate-300 text-slate-700 whitespace-pre-wrap">{submission.submissionDescription}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">GitHub Repository</label>
                    <a
                      href={submission.submissionGithubLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium"
                    >
                      <ExternalLink size={18} />
                      {submission.submissionGithubLink}
                    </a>

                    {/* AI Review Button */}
                    <Button
                      onClick={() => handleAIReview(submission)}
                      disabled={aiReviewLoading === submission._id}
                      className="ml-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      <Sparkles size={18} className="mr-2" />
                      {aiReviewLoading === submission._id ? 'Analyzing...' : 'AI Review'}
                    </Button>
                  </div>
                </div>

                {/* AI Review Report */}
                {aiReviews[submission._id] && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="text-cyan-400" size={24} />
                      <h4 className="text-lg font-bold text-cyan-300">AI Code Review Report</h4>
                      <span className={`ml-auto px-3 py-1 rounded-full text-sm font-bold ${aiReviews[submission._id].review.verdict === 'Pass' ? 'bg-green-500/20 text-green-400' :
                        aiReviews[submission._id].review.verdict === 'Needs Work' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                        {aiReviews[submission._id].review.verdict} • {aiReviews[submission._id].review.overallScore}/100
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="dark:text-slate-300 text-slate-700 mb-4 italic">"{aiReviews[submission._id].review.summary}"</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Completed */}
                      <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle size={18} className="dark:text-green-400 text-green-600" />
                          <span className="font-semibold dark:text-green-400 text-green-700">Completed</span>
                        </div>
                        <ul className="space-y-1 text-sm dark:text-slate-300 text-slate-700">
                          {aiReviews[submission._id].review.completed?.map((item, i) => (
                            <li key={i}>✓ {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Missing */}
                      <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={18} className="dark:text-yellow-400 text-yellow-600" />
                          <span className="font-semibold dark:text-yellow-400 text-yellow-700">Missing</span>
                        </div>
                        <ul className="space-y-1 text-sm dark:text-slate-300 text-slate-700">
                          {aiReviews[submission._id].review.missing?.map((item, i) => (
                            <li key={i}>⚠ {item}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Suggestions */}
                      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb size={18} className="dark:text-blue-400 text-blue-600" />
                          <span className="font-semibold dark:text-blue-400 text-blue-700">Suggestions</span>
                        </div>
                        <ul className="space-y-1 text-sm dark:text-slate-300 text-slate-700">
                          {aiReviews[submission._id].review.suggestions?.map((item, i) => (
                            <li key={i}>💡 {item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Code Quality */}
                    <div className="mt-4 flex items-center gap-3 dark:bg-slate-800/50 bg-slate-100 rounded-lg p-3">
                      <Code size={18} className="dark:text-purple-400 text-purple-600" />
                      <span className="dark:text-slate-400 text-slate-600">Code Quality:</span>
                      <span className="font-bold dark:text-purple-400 text-purple-700">{aiReviews[submission._id].review.codeQuality?.score}/10</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm dark:text-slate-400 text-slate-700">{aiReviews[submission._id].review.codeQuality?.notes}</span>
                    </div>

                    {/* Files Analyzed */}
                    <p className="mt-3 text-xs text-slate-500">
                      📁 Files analyzed: {aiReviews[submission._id].github?.filesAnalyzed?.join(', ')}
                    </p>
                  </div>
                )}

                {/* Review Form */}
                {reviewingId === submission._id ? (
                  <div className="dark:bg-slate-700/50 bg-slate-50 rounded-lg p-4 border dark:border-slate-600 border-slate-200 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold dark:text-slate-300 text-slate-700 mb-2">
                        {actionType === 'approve' ? 'Approval Notes (Optional)' : 'Feedback for Revision (Required)'}
                      </label>
                      <textarea
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder={actionType === 'approve'
                          ? 'Add congratulations or any final notes...'
                          : 'Explain what needs to be improved or changed...'}
                        rows="4"
                        required={actionType === 'reject'}
                        className="w-full px-3 py-2 border-2 dark:border-slate-600 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none dark:bg-slate-800 bg-white dark:text-white text-slate-900"
                      />
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button
                        onClick={() => {
                          setReviewingId(null);
                          setActionType(null);
                          setApprovalNotes('');
                        }}
                        className="bg-slate-600 text-white hover:bg-slate-700"
                        disabled={actionType}
                      >
                        Cancel
                      </Button>
                      {actionType === 'approve' && (
                        <Button
                          onClick={() => handleApprove(submission._id)}
                          className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                        >
                          <CheckCircle size={18} />
                          Approve
                        </Button>
                      )}
                      {actionType === 'reject' && (
                        <Button
                          onClick={() => handleReject(submission._id)}
                          className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                        >
                          <XCircle size={18} />
                          Return for Revision
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 justify-end">
                    <Button
                      onClick={() => {
                        setReviewingId(submission._id);
                        setActionType('reject');
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                    >
                      <XCircle size={18} />
                      Return for Revision
                    </Button>
                    <Button
                      onClick={() => {
                        setReviewingId(submission._id);
                        setActionType('approve');
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MilestoneReview;
