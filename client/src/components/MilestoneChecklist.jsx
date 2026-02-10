import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import API_URL from '../config';

const MilestoneChecklist = ({ projectId, milestoneId }) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChecklist();
  }, [milestoneId]);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/api/milestones/${milestoneId}/checklist`,
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );
      setChecklist(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching checklist:', err);
      setError('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  };

  const markTaskComplete = async (taskId) => {
    try {
      await axios.put(
        `${API_URL}/api/tasks/${taskId}`,
        { status: 'Completed' },
        {
          headers: { 'x-auth-token': localStorage.getItem('token') }
        }
      );
      
      // Refresh checklist
      await fetchChecklist();
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const getStatusIcon = (isComplete) => {
    return isComplete ? (
      <CheckCircle2 size={18} className="text-green-500" />
    ) : (
      <Circle size={18} className="text-slate-400" />
    );
  };

  if (loading) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-600">
        <div className="text-center text-slate-400 text-sm">Loading checklist...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-slate-800/50 border-slate-600">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      </Card>
    );
  }

  if (!checklist) {
    return null;
  }

  const { milestone, tasks, completedTasks, totalTasks, completionPercentage, isComplete } = checklist;

  return (
    <Card className="p-4 bg-slate-800/50 border-slate-600 space-y-4">
      {/* Header with progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Milestone Checklist</h3>
          <span className={`text-xs px-2 py-1 rounded ${
            isComplete 
              ? 'bg-green-900/50 text-green-300' 
              : 'bg-blue-900/50 text-blue-300'
          }`}>
            {completedTasks}/{totalTasks} Complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-green-600'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${completionPercentage}%` }}
          />
        </div>

        <div className="text-xs text-slate-400">
          {completionPercentage}% Complete
          {isComplete && ' - Milestone Complete! ✨'}
        </div>
      </div>

      {/* Tasks list */}
      {totalTasks > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-300 uppercase">Tasks</h4>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="flex items-center gap-2 p-2 rounded bg-slate-700/50 hover:bg-slate-700 transition text-xs text-slate-300"
              >
                <button
                  onClick={() => markTaskComplete(task._id)}
                  className="flex-shrink-0 hover:scale-110 transition"
                >
                  {getStatusIcon(task.status === 'Completed')}
                </button>
                <span className={task.status === 'Completed' ? 'line-through text-slate-500' : ''}>
                  {task.title}
                </span>
                <span className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                  task.status === 'Completed'
                    ? 'bg-green-900/50 text-green-300'
                    : task.status === 'In Progress'
                    ? 'bg-blue-900/50 text-blue-300'
                    : 'bg-slate-600 text-slate-300'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-xs text-slate-400 text-center py-4">
          No tasks assigned to this milestone yet
        </div>
      )}

      {/* Status badge */}
      {isComplete && (
        <div className="p-2 bg-green-900/20 border border-green-800 rounded flex items-center gap-2 text-xs text-green-300">
          <CheckCircle2 size={14} />
          <span>This milestone is complete! Ready for review.</span>
        </div>
      )}
    </Card>
  );
};

export default MilestoneChecklist;
