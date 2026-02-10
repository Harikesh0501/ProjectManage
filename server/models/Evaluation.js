const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    evaluator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Mentor or Judge
    rubric: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: true },
    scores: {
        type: Map, // Key: criteria name or ID, Value: Score given
        of: Number
    },
    comments: String,
    totalScore: Number, // Calculated weighted score
    feedback: String
}, { timestamps: true });

module.exports = mongoose.model('Evaluation', EvaluationSchema);
