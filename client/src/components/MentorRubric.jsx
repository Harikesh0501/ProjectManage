import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ClipboardCheck, Plus, Trash2, Award, History, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_URL from '../config';

const MentorRubric = ({ projectId, user }) => {
    const [rubrics, setRubrics] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    // Evaluation State
    const [activeRubric, setActiveRubric] = useState(null);
    const [evalScores, setEvalScores] = useState({});
    const [comment, setComment] = useState('');

    // History State
    const [evalHistory, setEvalHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(true);

    // Creation State
    const [newRubricName, setNewRubricName] = useState('');
    const [criteria, setCriteria] = useState([{ name: '', weight: 1, maxScore: 10 }]);

    useEffect(() => {
        fetchRubrics();
        fetchHistory();
    }, [projectId]);

    const fetchRubrics = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/evaluations/rubrics/project/${projectId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRubrics(res.data);
            if (res.data.length > 0) setActiveRubric(res.data[0]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await axios.get(`${API_URL}/api/evaluations/project/${projectId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setEvalHistory(res.data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleAddCriteria = () => {
        setCriteria([...criteria, { name: '', weight: 1, maxScore: 10 }]);
    };

    const handleCriteriaChange = (index, field, value) => {
        const updated = [...criteria];
        updated[index][field] = value;
        setCriteria(updated);
    };

    const createRubric = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/api/evaluations/rubrics`, {
                name: newRubricName,
                criteria,
                projectId,
                isGlobal: false
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIsCreating(false);
            fetchRubrics();
            setNewRubricName('');
            setCriteria([{ name: '', weight: 1, maxScore: 10 }]);
        } catch (err) {
            alert('Error creating rubric');
        }
    };

    const submitEvaluation = async () => {
        if (!activeRubric) return;
        try {
            await axios.post(`${API_URL}/api/evaluations`, {
                projectId,
                rubricId: activeRubric._id,
                scores: evalScores,
                comments: comment
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            alert('Evaluation submitted successfully!');
            setEvalScores({});
            setComment('');
            fetchHistory(); // Refresh history
        } catch (err) {
            alert('Error submitting evaluation');
        }
    };

    if (loading) return <div className="text-white">Loading Rubrics...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    {user?.role === 'Student' ? 'My Performance Report' : 'Mentor Evaluation'}
                </h2>
                {(user?.role === 'Mentor' || user?.role === 'Admin') && (
                    !isCreating ? (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Create Rubric
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsCreating(false)}
                            className="text-slate-400 hover:text-white px-4 py-2"
                        >
                            Cancel Creation
                        </button>
                    )
                )}
            </div>

            {/* CREATION FORM (Mentors/Admins Only) */}
            {isCreating && (user?.role === 'Mentor' || user?.role === 'Admin') && (
                <div className="dark:bg-slate-800/50 bg-white p-6 rounded-xl border dark:border-slate-700 border-slate-200">
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-4">New Evaluation Rubric</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block dark:text-slate-400 text-slate-600 text-sm mb-1">Rubric Name</label>
                            <input
                                className="w-full dark:bg-slate-700 bg-slate-50 dark:text-white text-slate-900 rounded p-2 border dark:border-slate-600 border-slate-200 outline-none"
                                value={newRubricName}
                                onChange={e => setNewRubricName(e.target.value)}
                                placeholder="e.g., Code Quality Review"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block dark:text-slate-400 text-slate-600 text-sm">Criteria List</label>
                            {criteria.map((c, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                                    <input
                                        className="w-full sm:flex-1 dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 rounded p-2 border dark:border-slate-700 border-slate-200 text-sm"
                                        placeholder="Criteria Name"
                                        value={c.name}
                                        onChange={e => handleCriteriaChange(idx, 'name', e.target.value)}
                                    />
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <input
                                            className="w-full sm:w-20 dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 rounded p-2 border dark:border-slate-700 border-slate-200 text-sm"
                                            type="number"
                                            placeholder="Weight"
                                            value={c.weight}
                                            onChange={e => handleCriteriaChange(idx, 'weight', parseFloat(e.target.value))}
                                        />
                                        <input
                                            className="w-full sm:w-20 dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 rounded p-2 border dark:border-slate-700 border-slate-200 text-sm"
                                            type="number"
                                            placeholder="Max"
                                            value={c.maxScore}
                                            onChange={e => handleCriteriaChange(idx, 'maxScore', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <button onClick={() => {
                                        const newCriteria = criteria.filter((_, i) => i !== idx);
                                        setCriteria(newCriteria);
                                    }} className="p-2 text-red-400 hover:text-red-300 self-end sm:self-center">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={handleAddCriteria}
                                className="text-blue-400 text-sm hover:text-blue-300 flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Criteria
                            </button>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={createRubric}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                            >
                                Save Rubric
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* EVALUATION FORM (Mentors/Admins Only) */}
            {!isCreating && (user?.role === 'Mentor' || user?.role === 'Admin') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Rubric Selector */}
                    <div className="dark:bg-slate-800/50 bg-white p-4 rounded-xl border dark:border-slate-700 border-slate-200 h-fit">
                        <h3 className="dark:text-white text-slate-900 font-semibold mb-3">Select Rubric</h3>
                        <div className="space-y-2">
                            {rubrics.map(r => (
                                <button
                                    key={r._id}
                                    onClick={() => setActiveRubric(r)}
                                    className={`w-full text-left p-3 rounded-lg transition-colors ${activeRubric?._id === r._id ? 'dark:bg-indigo-600/30 bg-indigo-50 border border-indigo-500 dark:text-white text-indigo-700' : 'dark:bg-slate-700/20 bg-slate-50 dark:text-slate-300 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/40'}`}
                                >
                                    {r.name}
                                </button>
                            ))}
                            {rubrics.length === 0 && <p className="text-slate-500 text-sm">No rubrics available.</p>}
                        </div>
                    </div>

                    {/* Evaluation Input */}
                    {activeRubric && (
                        <div className="md:col-span-2 dark:bg-slate-800/50 bg-white p-6 rounded-xl border dark:border-slate-700 border-slate-200">
                            <h3 className="text-xl font-bold dark:text-white text-slate-900 mb-6">Evaluate {activeRubric.name}</h3>
                            <div className="space-y-6">
                                {activeRubric.criteria.map((c, idx) => (
                                    <div key={idx} className="dark:bg-slate-900/40 bg-slate-50 p-4 rounded-lg border dark:border-white/5 border-slate-100">
                                        <div className="flex justify-between mb-2">
                                            <span className="dark:text-slate-200 text-slate-700 font-medium">{c.name}</span>
                                            <span className="text-slate-500 text-xs">Weight: {c.weight}x | Max: {c.maxScore}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max={c.maxScore}
                                            step="1"
                                            value={evalScores[c.name] || 0}
                                            onChange={e => setEvalScores({ ...evalScores, [c.name]: parseInt(e.target.value) })}
                                            className="w-full h-2 dark:bg-slate-700 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                        <div className="text-right text-indigo-400 font-bold mt-1">
                                            {evalScores[c.name] || 0} / {c.maxScore}
                                        </div>
                                    </div>
                                ))}

                                <div>
                                    <label className="block dark:text-slate-400 text-slate-600 text-sm mb-2">Mentor Comments</label>
                                    <textarea
                                        className="w-full dark:bg-slate-900 bg-slate-50 dark:text-white text-slate-900 rounded-lg p-3 border dark:border-slate-700 border-slate-200 focus:border-indigo-500 outline-none"
                                        rows={4}
                                        value={comment}
                                        onChange={e => setComment(e.target.value)}
                                        placeholder="Provide detailed feedback..."
                                    />
                                </div>

                                <button
                                    onClick={submitEvaluation}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-all hover:scale-[1.02]"
                                >
                                    Submit Evaluation
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PERFORMANCE HISTORY (Visible to ALL roles, including Students) */}
            <div className="border-t border-slate-700 pt-8">
                <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setShowHistory(!showHistory)}
                >
                    <h3 className="text-xl font-bold dark:text-white text-slate-900 flex items-center gap-2">
                        <History className="w-5 h-5 text-indigo-400" />
                        Performance History
                        <span className="text-sm font-normal dark:text-slate-500 text-slate-400 ml-2">({evalHistory.length} Reports)</span>
                    </h3>
                    <div className="p-2 rounded-full bg-slate-800 group-hover:bg-slate-700 transition-colors">
                        {showHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                </div>

                <AnimatePresence>
                    {showHistory && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-6 space-y-4 overflow-hidden"
                        >
                            {historyLoading ? (
                                <p className="text-slate-500">Loading history...</p>
                            ) : evalHistory.length === 0 ? (
                                <div className="p-8 text-center dark:bg-slate-800/30 bg-slate-50 rounded-xl border dark:border-slate-700 border-slate-200 border-dashed">
                                    <p className="dark:text-slate-400 text-slate-500">No evaluations recorded yet.</p>
                                </div>
                            ) : (
                                evalHistory.map((evalItem, index) => (
                                    <motion.div
                                        key={evalItem._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative group overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none group-hover:bg-indigo-500/20 transition-all"></div>

                                        <div className="relative dark:bg-slate-900/60 bg-white backdrop-blur-xl border dark:border-slate-700/50 border-slate-200 hover:border-indigo-500/30 p-6 rounded-2xl shadow-xl transition-all">

                                            {/* Header */}
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b dark:border-white/5 border-slate-100 pb-4">
                                                <div>
                                                    <h4 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r dark:from-white dark:to-slate-400 from-slate-900 to-slate-600">
                                                        {evalItem.rubric?.name || 'Unknown Protocol'}
                                                    </h4>
                                                    <div className="flex items-center gap-3 mt-2 text-xs font-mono tracking-wide dark:text-slate-400 text-slate-500">
                                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded dark:bg-slate-800/50 bg-slate-100 border dark:border-slate-700 border-slate-200">
                                                            <Award className="w-3 h-3 text-indigo-400" />
                                                            OFFICER: {evalItem.evaluator?.name || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 px-2 py-1 rounded dark:bg-slate-800/50 bg-slate-100 border dark:border-slate-700 border-slate-200">
                                                            <History className="w-3 h-3 text-cyan-400" />
                                                            {new Date(evalItem.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 dark:bg-black/40 bg-slate-50 px-4 py-2 rounded-xl border dark:border-white/5 border-slate-100">
                                                    <div className="text-right">
                                                        <div className="text-[10px] dark:text-slate-500 text-slate-400 uppercase tracking-widest font-bold">Total Score</div>
                                                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                                                            {evalItem.totalScore}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Scores Grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                                                {Object.entries(evalItem.scores).map(([key, score]) => (
                                                    <div key={key} className="dark:bg-slate-800/30 bg-slate-50 p-3 rounded-lg border dark:border-white/5 border-slate-200 relative overflow-hidden group/score">
                                                        <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover/score:translate-y-0 transition-transform"></div>
                                                        <div className="relative text-center">
                                                            <div className="text-[10px] dark:text-slate-400 text-slate-500 uppercase tracking-wider truncate mb-1" title={key}>
                                                                {key}
                                                            </div>
                                                            <div className="text-lg font-bold dark:text-white text-slate-900 group-hover/score:text-indigo-500 dark:group-hover/score:text-indigo-300 transition-colors">
                                                                {score}
                                                                <span className="text-[10px] text-slate-400 dark:text-slate-600 ml-1">PTS</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Comments */}
                                            {evalItem.comments && (
                                                <div className="relative dark:bg-black/20 bg-slate-50 rounded-xl p-4 border dark:border-white/5 border-slate-200">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-xl opacity-70"></div>
                                                    <p className="text-xs text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                        Evaluator Comments
                                                    </p>
                                                    <p className="dark:text-slate-300 text-slate-600 text-sm italic leading-relaxed pl-2">
                                                        "{evalItem.comments}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MentorRubric;
